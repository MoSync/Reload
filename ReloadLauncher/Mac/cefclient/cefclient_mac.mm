// Copyright (c) 2010 The Chromium Embedded Framework Authors.
// Portions copyright (c) 2010 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#import <Cocoa/Cocoa.h>
#include <sstream>
#include "cefclient/cefclient.h"
#include "include/cef_app.h"
#import "include/cef_application_mac.h"
#include "include/cef_browser.h"
#include "include/cef_frame.h"
#include "include/cef_runnable.h"
#include "cefclient/binding_test.h"
#include "cefclient/client_handler.h"
#include "cefclient/dom_test.h"
#include "cefclient/resource_util.h"
#include "cefclient/scheme_test.h"
#include "cefclient/string_util.h"

// The global ClientHandler reference.
extern CefRefPtr<ClientHandler> g_handler;

char szWorkingDir[512];   // The current working directory

// Sizes for URL bar layout
#define BUTTON_HEIGHT 22
#define BUTTON_WIDTH 72
#define BUTTON_MARGIN 8
#define URLBAR_HEIGHT  32

// Content area size for newly created windows.
const int kWindowWidth = 800;
const int kWindowHeight = 600;

// Memory AutoRelease pool.
static NSAutoreleasePool* g_autopool = nil;

// Provide the CefAppProtocol implementation required by CEF.
@interface ClientApplication : NSApplication<CefAppProtocol> {
@private
  BOOL handlingSendEvent_;
}
@end

@implementation ClientApplication
- (BOOL)isHandlingSendEvent {
  return handlingSendEvent_;
}

- (void)setHandlingSendEvent:(BOOL)handlingSendEvent {
  handlingSendEvent_ = handlingSendEvent;
}

- (void)sendEvent:(NSEvent*)event {
  CefScopedSendingEvent sendingEventScoper;
  [super sendEvent:event];
}
@end


// Receives notifications from controls and the browser window. Will delete
// itself when done.
@interface ClientWindowDelegate : NSObject <NSWindowDelegate>
//- (IBAction)goBack:(id)sender;
//- (IBAction)goForward:(id)sender;
    - (IBAction)reload:(id)sender;
//- (IBAction)stopLoading:(id)sender;
//- (IBAction)takeURLStringValueFrom:(NSTextField *)sender;
- (void)alert:(NSString*)title withMessage:(NSString*)message;
- (void)notifyConsoleMessage:(id)object;
- (void)notifyDownloadComplete:(id)object;
- (void)notifyDownloadError:(id)object;
@end

@implementation ClientWindowDelegate
/*
- (IBAction)goBack:(id)sender {
  if (g_handler.get() && g_handler->GetBrowserId())
    g_handler->GetBrowser()->GoBack();
}

- (IBAction)goForward:(id)sender {
  if (g_handler.get() && g_handler->GetBrowserId())
    g_handler->GetBrowser()->GoForward();
}
*/
- (IBAction)reload:(id)sender {
  if (g_handler.get() && g_handler->GetBrowserId())
    g_handler->GetBrowser()->Reload();
}
/*
- (IBAction)stopLoading:(id)sender {
  if (g_handler.get() && g_handler->GetBrowserId())
    g_handler->GetBrowser()->StopLoad();
}

- (IBAction)takeURLStringValueFrom:(NSTextField *)sender {
  if (!g_handler.get() || !g_handler->GetBrowserId())
    return;
  
  NSString *url = [sender stringValue];
  
  // if it doesn't already have a prefix, add http. If we can't parse it,
  // just don't bother rather than making things worse.
  NSURL* tempUrl = [NSURL URLWithString:url];
  if (tempUrl && ![tempUrl scheme])
    url = [@"http://" stringByAppendingString:url];
  
  std::string urlStr = [url UTF8String];
  g_handler->GetBrowser()->GetMainFrame()->LoadURL(urlStr);
}
*/
- (void)alert:(NSString*)title withMessage:(NSString*)message {
  NSAlert *alert = [NSAlert alertWithMessageText:title
                                   defaultButton:@"OK"
                                 alternateButton:nil
                                     otherButton:nil
                       informativeTextWithFormat:message];
  [alert runModal];
}

- (void)notifyConsoleMessage:(id)object {
 /* std::stringstream ss;
  ss << "Console messages will be written to " << g_handler->GetLogFile();
  NSString* str = [NSString stringWithUTF8String:(ss.str().c_str())];
  [self alert:@"Console Messages" withMessage:str];*/
}

- (void)notifyDownloadComplete:(id)object {
  std::stringstream ss;
  ss << "File \"" << g_handler->GetLastDownloadFile() <<
      "\" downloaded successfully.";
  NSString* str = [NSString stringWithUTF8String:(ss.str().c_str())];
  [self alert:@"File Download" withMessage:str];
}

- (void)notifyDownloadError:(id)object {
  std::stringstream ss;
  ss << "File \"" << g_handler->GetLastDownloadFile() <<
      "\" failed to download.";
  NSString* str = [NSString stringWithUTF8String:(ss.str().c_str())];
  [self alert:@"File Download" withMessage:str];
}

- (void)windowDidBecomeKey:(NSNotification*)notification {
  if (g_handler.get() && g_handler->GetBrowserId()) {
    // Give focus to the browser window.
    g_handler->GetBrowser()->GetHost()->SetFocus(true);
  }
}

// Called when the window is about to close. Perform the self-destruction
// sequence by getting rid of the window. By returning YES, we allow the window
// to be removed from the screen.
- (BOOL)windowShouldClose:(id)window {  
  // Try to make the window go away.
  [window autorelease];
  
  // Clean ourselves up after clearing the stack of anything that might have the
  // window on it.
  [self performSelectorOnMainThread:@selector(cleanup:)
                         withObject:window
                      waitUntilDone:NO];
  
  return YES;
}

// Deletes itself.
- (void)cleanup:(id)window {  
  [self release];
}

@end


NSButton* MakeButton(NSRect* rect, NSString* title, NSView* parent) {
  NSButton* button = [[[NSButton alloc] initWithFrame:*rect] autorelease];
  [button setTitle:title];
  [button setBezelStyle:NSSmallSquareBezelStyle];
  [button setAutoresizingMask:(NSViewMaxXMargin | NSViewMinYMargin)];
  [parent addSubview:button];
  rect->origin.x += BUTTON_WIDTH;
  return button;
}

// Receives notifications from the application. Will delete itself when done.
@interface ClientAppDelegate : NSObject {
    NSTask *task;
    NSTextView *theTextView;
}
- (void)createApp:(id)object;
- (IBAction)testGetSource:(id)sender;
- (IBAction)testGetText:(id)sender;
- (IBAction)testRequest:(id)sender;
- (IBAction)testLocalStorage:(id)sender;
- (IBAction)testXMLHttpRequest:(id)sender;
- (IBAction)testSchemeHandler:(id)sender;
- (IBAction)testBinding:(id)sender;
- (IBAction)testDialogs:(id)sender;
- (IBAction)testPluginInfo:(id)sender;
- (IBAction)testDOMAccess:(id)sender;
- (IBAction)testPopupWindow:(id)sender;
- (IBAction)testAccelerated2DCanvas:(id)sender;
- (IBAction)testAcceleratedLayers:(id)sender;
- (IBAction)testWebGL:(id)sender;
- (IBAction)testHTML5Video:(id)sender;
- (IBAction)testDragDrop:(id)sender;
- (IBAction)testZoomIn:(id)sender;
- (IBAction)testZoomOut:(id)sender;
- (IBAction)testZoomReset:(id)sender;
- (void)receivedData:(NSNotification *)notif;
- (void)startTheBackgroundJob;
@end

@implementation ClientAppDelegate
- (void)receivedData:(NSNotification *)notif {
    try {
        //get the data from notification
        NSData *data = [[notif userInfo] objectForKey: NSFileHandleNotificationDataItem];
        
        //make sure there's actual data
        if ([data length])
        {
            //    outputEmpty = NO;
            NSMutableString *str = [[NSMutableString alloc] initWithData:data encoding:NSASCIIStringEncoding];
            NSLog(@"logging........................%@", str);
            NSTextStorage *text = [theTextView textStorage];
            [text replaceCharactersInRange: NSMakeRange([text length], 0) withString: str];
            [theTextView scrollRangeToVisible: NSMakeRange([text length], 0)];
            //append the output to the text field
            //[theTextView insertText:str];

            // we schedule the file handle to go and read more data in the background again.
            [[notif object] readInBackgroundAndNotify];
        }
        else
        {
            NSLog(@"no data read---------------");
        }

    } catch (NSException *ex) {
        NSLog(@"failed log");
    }
  
  }


- (void)startTheBackgroundJob {
    try {
        NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
        NSRect windowRect = NSMakeRect(0.0f, 0.0f, 600.0f, 400.0f);
        
        NSWindow *window = [[NSWindow alloc] initWithContentRect:windowRect
                                                       styleMask:(NSTitledWindowMask | NSResizableWindowMask | NSClosableWindowMask)
                                                         backing:NSBackingStoreBuffered defer:NO];
        
        [window setBackgroundColor:[NSColor blackColor]];
        
        [window makeKeyAndOrderFront:nil];
        task = [[NSTask alloc] init];
        NSScrollView *scrollview = [[NSScrollView alloc]
                                    initWithFrame:[[window contentView] frame]];
        NSSize contentSize = [scrollview contentSize];
        
        [scrollview setBorderType:NSNoBorder];
        [scrollview setHasVerticalScroller:YES];
        [scrollview setHasHorizontalScroller:NO];
        [scrollview setAutoresizingMask:NSViewWidthSizable |
         NSViewHeightSizable];
        
        theTextView = [[NSTextView alloc] initWithFrame:NSMakeRect(0, 0,
                                                                   contentSize.width, contentSize.height)];
        [theTextView setMinSize:NSMakeSize(0.0, contentSize.height)];
        [theTextView setMaxSize:NSMakeSize(FLT_MAX, FLT_MAX)];
        [theTextView setVerticallyResizable:YES];
        [theTextView setHorizontallyResizable:NO];
        [theTextView setAutoresizingMask:NSViewWidthSizable];
        
        [[theTextView textContainer]
         setContainerSize:NSMakeSize(contentSize.width, FLT_MAX)];
        [[theTextView textContainer] setWidthTracksTextView:YES];
        [scrollview setDocumentView:theTextView];
        [window setContentView:scrollview];
        [window makeFirstResponder:theTextView];
        
        NSString* filePath = [[NSBundle mainBundle] pathForResource:@"reload" ofType:@"sh" inDirectory:@"ReloadServer"];
        NSLog (@"script path:\n%@", filePath);
        NSString *newString = [filePath substringToIndex:[filePath length]-9];
        
        [task setLaunchPath: @"/bin/sh"];
        
        NSArray *arguments;
        arguments = [NSArray arrayWithObjects: filePath, nil];
        [task setArguments: arguments];
        
        NSPipe *pipe;
        pipe = [NSPipe pipe];
        [task setStandardOutput: pipe];
        [task setCurrentDirectoryPath:newString];
        NSLog (@"directory path:\n%@", task.currentDirectoryPath);
        
        
        NSFileHandle *file;
        file = [pipe fileHandleForReading];
        //[file readToEndOfFileInBackgroundAndNotify];
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(receivedData:) name:NSFileHandleReadCompletionNotification object:file];
        [file readInBackgroundAndNotify];

        [task launch];
        [task waitUntilExit];
            
        
        [task release];
        [pool release];    

    } catch (NSException *ex) {
        
        NSAlert *alert = [NSAlert alertWithMessageText:@"Failed to Run the server" defaultButton:@"Ok" alternateButton:nil otherButton:nil informativeTextWithFormat:nil];
        [alert runModal];
        
    }
   }
// Create the application on the UI thread.
- (void)createApp:(id)object {
  [NSApplication sharedApplication];
  [NSBundle loadNibNamed:@"MainMenu" owner:NSApp];
  // Set the delegate for application events.
  [NSApp setDelegate:self];
  
  // Add the Tests menu.

  
  // Create the delegate for control and browser window events.
  ClientWindowDelegate* delegate = [[ClientWindowDelegate alloc] init];
    [NSThread detachNewThreadSelector:@selector(startTheBackgroundJob) toTarget:self withObject:nil];
    [NSThread sleepForTimeInterval:1];
  
  // Create the main application window.
  NSRect screen_rect = [[NSScreen mainScreen] visibleFrame];
 //  NSRect window_rect = { {0, screen_rect.size.height - kWindowHeight},{kWindowWidth, kWindowHeight} };
  NSWindow* mainWnd = [[UnderlayOpenGLHostingWindow alloc]
                       initWithContentRect:screen_rect
                       styleMask:(NSTitledWindowMask |
                                  NSClosableWindowMask |
                                  NSMiniaturizableWindowMask |
                                  NSResizableWindowMask )
                       backing:NSBackingStoreBuffered
                       defer:NO];
  [mainWnd setTitle:@"MoSync Reload"];
  [mainWnd setDelegate:delegate];

  // Rely on the window delegate to clean us up rather than immediately
  // releasing when the window gets closed. We use the delegate to do
  // everything from the autorelease pool so the window isn't on the stack
  // during cleanup (ie, a window close from javascript).
  [mainWnd setReleasedWhenClosed:NO];

  NSView* contentView = [mainWnd contentView];
/*
  // Create the buttons.
  NSRect button_rect = [contentView bounds];
  button_rect.origin.y = window_rect.size.height - URLBAR_HEIGHT +
      (URLBAR_HEIGHT - BUTTON_HEIGHT) / 2;
  button_rect.size.height = BUTTON_HEIGHT;
  button_rect.origin.x += BUTTON_MARGIN;
  button_rect.size.width = BUTTON_WIDTH;

  NSButton* button = MakeButton(&button_rect, @"Back", contentView);
  [button setTarget:delegate];
  [button setAction:@selector(goBack:)];

  button = MakeButton(&button_rect, @"Forward", contentView);
  [button setTarget:delegate];
  [button setAction:@selector(goForward:)];

  button = MakeButton(&button_rect, @"Reload", contentView);
  [button setTarget:delegate];
  [button setAction:@selector(reload:)];

  button = MakeButton(&button_rect, @"Stop", contentView);
  [button setTarget:delegate];
  [button setAction:@selector(stopLoading:)];

  // Create the URL text field.
  button_rect.origin.x += BUTTON_MARGIN;
  button_rect.size.width = [contentView bounds].size.width -
      button_rect.origin.x - BUTTON_MARGIN;
  NSTextField* editWnd = [[NSTextField alloc] initWithFrame:button_rect];
  [contentView addSubview:editWnd];
  [editWnd setAutoresizingMask:(NSViewWidthSizable | NSViewMinYMargin)];
  [editWnd setTarget:delegate];
  [editWnd setAction:@selector(takeURLStringValueFrom:)];
  [[editWnd cell] setWraps:NO];
  [[editWnd cell] setScrollable:YES];
*/
  // Create the handler.
  g_handler = new ClientHandler();
  g_handler->SetMainHwnd(contentView);
  //g_handler->SetEditHwnd(editWnd);

  // Create the browser view.
  CefWindowInfo window_info;
  CefBrowserSettings settings;

  // Populate the settings based on command line arguments.
  AppGetBrowserSettings(settings);

  window_info.SetAsChild(contentView, 0, 0, screen_rect.size.width, screen_rect.size.height - URLBAR_HEIGHT);
  CefBrowserHost::CreateBrowser(window_info, g_handler.get(),
                                g_handler->GetStartupURL(), settings);

  // Show the window.
  [mainWnd makeKeyAndOrderFront: nil];

  // Size the window.
  NSRect r = [mainWnd contentRectForFrameRect:[mainWnd frame]];
  r.size.width = screen_rect.size.width;
  r.size.height = screen_rect.size.height + URLBAR_HEIGHT;
  [mainWnd setFrame:[mainWnd frameRectForContentRect:r] display:YES];
}

- (IBAction)testGetSource:(id)sender {
  if (g_handler.get() && g_handler->GetBrowserId())
    RunGetSourceTest(g_handler->GetBrowser());
}

- (IBAction)testGetText:(id)sender {
  if (g_handler.get() && g_handler->GetBrowserId())
    RunGetTextTest(g_handler->GetBrowser());
}

- (IBAction)testRequest:(id)sender {
  if (g_handler.get() && g_handler->GetBrowserId())
    RunRequestTest(g_handler->GetBrowser());
}

- (IBAction)testLocalStorage:(id)sender {
  if (g_handler.get() && g_handler->GetBrowserId())
    RunLocalStorageTest(g_handler->GetBrowser());
}

- (IBAction)testXMLHttpRequest:(id)sender {
  if (g_handler.get() && g_handler->GetBrowserId())
    RunXMLHTTPRequestTest(g_handler->GetBrowser());
}

- (IBAction)testSchemeHandler:(id)sender {
  if (g_handler.get() && g_handler->GetBrowserId())
    scheme_test::RunTest(g_handler->GetBrowser());
}

- (IBAction)testBinding:(id)sender {
  if (g_handler.get() && g_handler->GetBrowserId())
    binding_test::RunTest(g_handler->GetBrowser());
}

- (IBAction)testDialogs:(id)sender {
  if (g_handler.get() && g_handler->GetBrowserId())
    RunDialogTest(g_handler->GetBrowser());
}

- (IBAction)testPluginInfo:(id)sender {
  if (g_handler.get() && g_handler->GetBrowserId())
    RunPluginInfoTest(g_handler->GetBrowser());
}

- (IBAction)testDOMAccess:(id)sender {
  if (g_handler.get() && g_handler->GetBrowserId())
    dom_test::RunTest(g_handler->GetBrowser());
}

- (IBAction)testPopupWindow:(id)sender {
  if (g_handler.get() && g_handler->GetBrowserId())
    RunPopupTest(g_handler->GetBrowser());
}

- (IBAction)testAccelerated2DCanvas:(id)sender {
  if (g_handler.get() && g_handler->GetBrowserId())
    RunAccelerated2DCanvasTest(g_handler->GetBrowser());
}

- (IBAction)testAcceleratedLayers:(id)sender {
  if (g_handler.get() && g_handler->GetBrowserId())
    RunAcceleratedLayersTest(g_handler->GetBrowser());
}

- (IBAction)testWebGL:(id)sender {
  if (g_handler.get() && g_handler->GetBrowserId())
    RunWebGLTest(g_handler->GetBrowser());
}

- (IBAction)testHTML5Video:(id)sender {
  if (g_handler.get() && g_handler->GetBrowserId())
    RunHTML5VideoTest(g_handler->GetBrowser());
}

- (IBAction)testDragDrop:(id)sender {
  if (g_handler.get() && g_handler->GetBrowserId())
    RunDragDropTest(g_handler->GetBrowser());
}

- (IBAction)testZoomIn:(id)sender {
  if (g_handler.get() && g_handler->GetBrowserId()) {
    CefRefPtr<CefBrowser> browser = g_handler->GetBrowser();
    browser->GetHost()->SetZoomLevel(browser->GetHost()->GetZoomLevel() + 0.5);
  }
}

- (IBAction)testZoomOut:(id)sender {
  if (g_handler.get() && g_handler->GetBrowserId()) {
    CefRefPtr<CefBrowser> browser = g_handler->GetBrowser();
    browser->GetHost()->SetZoomLevel(browser->GetHost()->GetZoomLevel() - 0.5);
  }
}

- (IBAction)testZoomReset:(id)sender {
  if (g_handler.get() && g_handler->GetBrowserId()) {
    CefRefPtr<CefBrowser> browser = g_handler->GetBrowser();
    browser->GetHost()->SetZoomLevel(0.0);
  }
}


// Sent by the default notification center immediately before the application
// terminates.
- (void)applicationWillTerminate:(NSNotification *)aNotification {
  // Shut down CEF.
  g_handler = NULL;
  CefShutdown();

  [self release];
    [task terminate];
  // Release the AutoRelease pool.
  [g_autopool release];
}

@end


int main(int argc, char* argv[]) {
  CefMainArgs main_args(argc, argv);
  CefRefPtr<ClientApp> app(new ClientApp);

  // Execute the secondary process, if any.
  int exit_code = CefExecuteProcess(main_args, app.get());
  if (exit_code >= 0)
    return exit_code;

  // Retrieve the current working directory.
  getcwd(szWorkingDir, sizeof(szWorkingDir));

  // Initialize the AutoRelease pool.
  g_autopool = [[NSAutoreleasePool alloc] init];

  // Initialize the ClientApplication instance.
  [ClientApplication sharedApplication];
  
  // Parse command line arguments.
  AppInitCommandLine(argc, argv);

  CefSettings settings;

  // Populate the settings based on command line arguments.
  AppGetSettings(settings, app);

  // Initialize CEF.
  CefInitialize(main_args, settings, app.get());

  // Register the scheme handler.
  scheme_test::InitTest();

  // Create the application delegate and window.
  NSObject* delegate = [[ClientAppDelegate alloc] init];
  [delegate performSelectorOnMainThread:@selector(createApp:) withObject:nil
                          waitUntilDone:NO];

  // Run the application message loop.
  CefRunMessageLoop();

  // Don't put anything below this line because it won't be executed.
  return 0;
}


// Global functions

std::string AppGetWorkingDirectory() {
  return szWorkingDir;
}
