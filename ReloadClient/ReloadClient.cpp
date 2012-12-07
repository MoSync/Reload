/*
Copyright (C) 2011 MoSync AB

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License,
version 2, as published by the Free Software Foundation.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
MA 02110-1301, USA.
*/

/**
 * @file ReloadClient.cpp
 *
 *  Created on: Feb 27, 2012
 *      Author: Ali Sarrafi, Iraklis Rossis
 */

#include "mastdlib.h"

#include <Wormhole/HighLevelHttpConnection.h>
#include <Wormhole/Encoder.h>

#include "ReloadClient.h"
#include "ReloadNativeUIMessageHandler.h"
#include "Convert.h"
#include "Log.h"

#define SERVER_TCP_PORT "7000"
#define SERVER_HTTP_PORT "8283"

// Namespaces we want to access.
using namespace MAUtil; // Class Moblet
using namespace NativeUI; // WebView widget.
using namespace Wormhole; // Wormhole library.

/**
 * Helper class for making a HTTP request for a remote log message.
 * This class is just used to send a request, it will not do anything
 * with the result sent back from the server.
 */
class RemoteLogConnection : public HighLevelHttpConnection
{
public:
	RemoteLogConnection()
		: HighLevelHttpConnection()
	{
	}

	void dataDownloaded(MAHandle data, int result)
	{
		// If we get data then delete it.
		if (NULL != data)
		{
			maDestroyPlaceholder(data);
		}

		// Delete this instance.
		delete this;
	}
};

ReloadClient::ReloadClient() :
	mSocket(this)
{
	// Initialize application.
	// Order of calls are important as data needed by
	// later calls are created in earlier calls.
	initializeWebView();
	initializeVariables();
	initializeFiles();
	createScreens();
	createMessageHandlers();
	createDownloader();

	// Show first screen.
	mLoginScreen->showNotConnectedScreen();
}

ReloadClient::~ReloadClient()
{
}

void ReloadClient::initializeWebView()
{
	// Create WebView widget and message handlers.
	// This code is from HybridMoblet::initialize().
	mInitialized = true;
	createUI();
	enableWebViewMessages();

	// Initialize the message handler.
	getMessageHandler()->initialize(this);
	//getMessageHandler()->nativeUIEventsOff();

	// Set the beep sound. This is defined in the
	// Resources/Resources.lst file. You can change
	// this by changing the sound file in that folder.
	setBeepSound(BEEP_WAV);

	// Show the WebView that contains the HTML/CSS UI
	// and the JavaScript code.
	getWebView()->setVisible(true);
}

void ReloadClient::initializeVariables()
{
	mHasPage = false;
	mPort = SERVER_TCP_PORT;
	mAppsFolder = "apps/";
	mServerCommand = 0;
	mRunningApp = false;

	// Get the OS we are on.
	char buffer[64];
	maGetSystemProperty(
		"mosync.device.OS",
		buffer,
		64);
	mOS = buffer;
}

void ReloadClient::initializeFiles()
{
	// Create folder where apps are unpacked.
	MAHandle appDirHandle = maFileOpen(
		(mFileUtil->getLocalPath() + mAppsFolder).c_str(),
		MA_ACCESS_READ_WRITE);
	if (!maFileExists(appDirHandle))
	{
		maFileCreate(appDirHandle);
	}
	maFileClose(appDirHandle);

	// Get the path of the last downloaded app.
	bool success = mFileUtil->readTextFromFile(
		mFileUtil->getLocalPath() + "LastAppDir.txt",
		mAppPath);
	if (!success)
	{
		mAppPath = "";
	}

	// TODO: What is this?
	int size = maGetDataSize(INFO_TEXT);
	if (size > 0)
	{
		char *info = new char[size + 1];
		maReadData(INFO_TEXT, (void*)info, 0, size);
		info[size] = '\0';
		mInfo = info;
		delete info;
	}
	else
	{
		maPanic(0, "RELOAD: Could not read info file");
	}

	// Get the most recently used server ip address.
	success = mFileUtil->readTextFromFile(
		mFileUtil->getLocalPath() + "LastServerAddress.txt",
		mServerAddress);
	if (!success)
	{
		mServerAddress = "localhost";
	}
}

void ReloadClient::createMessageHandlers()
{
	// Special handler for local file system messages.
	// This is needed because applications are unpacked to temporary
	// directories, and not in the application's root folder.
	/*mReloadFileHandler = new ReloadFileHandler(
		getMessageHandler()->getPhoneGapMessageHandler());
	(getMessageHandler()->getPhoneGapMessageHandler())->
		setFileHandler(mReloadFileHandler);*/

	// Set the log message listener.
	getMessageHandler()->setLogMessageListener(this);
}

void ReloadClient::createDownloader()
{
	// Create downloader object.
	mDownloader = new Downloader();
	mDownloader->addDownloadListener(this);
	mDownloader->addDownloadListener(mLoadingScreen);
}

void ReloadClient::createScreens()
{
	// Create login screen and loading screen.
	mLoginScreen = new LoginScreen(this);
	mLoginScreen->initializeScreen(mOS);
	mLoadingScreen = new LoadingScreen(this);
	mLoadingScreen->initializeScreen(mOS);

	// Set the most recently used server ip address.
	mLoginScreen->defaultAddress(mServerAddress.c_str());
}

/**
 * Get client info.
 * @return String with client info.
 */
MAUtil::String ReloadClient::getInfo()
{
	return mInfo;
}

/**
 * This method is called when a key is pressed.
 * Forwards the event to PhoneGapMessageHandler.
 */
void ReloadClient::keyPressEvent(int keyCode, int nativeCode)
{
	if (mRunningApp)
	{
		// Forward to PhoneGap MessageHandler.
		mMessageHandler->keyPressEvent(keyCode, nativeCode);
	}
	else
	{
		if (MAK_BACK == keyCode)
		{
			exit();
		}
	}
}

/**
 * We want to quit the ReloadClient only if an app is not running.
 * This method is called from the WOrmhole library when a JavaScript
 * application requests to exit.
 */
void ReloadClient::exit()
{
	if (mRunningApp)
	{
		// Close the running app and show the start screen.
		mRunningApp = false;
		mLoginScreen->showConnectedScreen();
	}
	else
	{
		// Exit the ReloadClient.
		exitEventLoop();
	}
}

static String SysLoadStringResource(MAHandle data)
{
	// Get size of data.
    int size = maGetDataSize(data);

    // Allocate space for text plus zero termination character.
    char* text = (char*) malloc(size + 1);
    if (NULL == text)
    {
    	return NULL;
    }

    // Read data.
    maReadData(data, text, 0, size);

    // Zero terminate string.
    text[size] = 0;

    String s = text;

    free(text);

    return s;
}

/**
 * Called from JavaScript when a Wormhole app has been loaded.
 */
void ReloadClient::openWormhole(MAHandle webViewHandle)
{
	// Apply customizations to functions loaded in wormhole.js.
	String script = SysLoadStringResource(CUSTOM_JS);
	script += "('" + mAppPath + "')";
	callJS(webViewHandle, script.c_str());

	// Call super class method to handler initialization.
	HybridMoblet::openWormhole(webViewHandle);
}

/**
 * The socket->connect() operation has completed.
 * Socket is open if result > 0.
 */
void ReloadClient::connectFinished(Connection *conn, int result)
{
	if (result > 0)
	{
		mLoginScreen->connectedTo(mServerAddress.c_str());

		// Save the server address.
		mFileUtil->writeTextToFile(
			mFileUtil->getLocalPath() + "LastServerAddress.txt",
			mServerAddress);

		sendClientDeviceInfo();

		// Read header of next message sent from server.
		mSocket.read(mBuffer,16);
	}
	else
	{
		showConErrorMessage(result);
	}
}

/**
 * We received a TCP message from the server.
 */
void ReloadClient::connReadFinished(Connection *conn, int result)
{
	// If the command is zero, we have a new header with
	// command and size data.
	if (mServerCommand == 0)
	{
		// Last two parameters are passed by reference to return
		// the values for command and size.
		getMessageCommandAndSize(
			mBuffer,
			mServerCommand,
			mServerMessageSize);

		LOG("@@@ RELOAD: connReadFinished "
			"mServerCommand: %d, mServerMessageSize: %d",
			mServerCommand, mServerMessageSize);

		// Read the message (JSON format).
		mSocket.read(mBuffer, mServerMessageSize);
	}
	else if (mServerCommand > 0)
	{
		// What will this be used for?
		if (mServerCommand == 1)
		{
			// TODO: Implement or remove.
		}
		// We have a JSON Message
		else if (mServerCommand == 2)
		{
			// Null terminate the JSON string.
			mBuffer[mServerMessageSize] = '\0';

			LOG("@@@ RELOAD: connReadFinished JSON data: %s", mBuffer);

			processJSONMessage(mBuffer);
		}
		else
		{
			maPanic(0,"RELOAD: Unknown server command");
		}

		// Reset server command.
		mServerCommand = 0;

		// Read the next TCP message header.
		mSocket.read(mBuffer, 16);

	}
	else
	{
		LOG("@@@ RELOAD: ERROR connReadFinished result %d", result);

		showConErrorMessage(result);

		// Go back to the login screen on an error.
		mLoginScreen->showNotConnectedScreen();
	}
}

/**
 * Helper function to get command and size from
 * the message header (two 32 bit numbers as
 * a hex string).
 * Header example: 0000000200000044
 * Command: 00000002
 * Size: 00000044
 * @param buffer
 * @param command
 * @param size
 */
void ReloadClient::getMessageCommandAndSize(
	char* buffer,
	int& command,
	int& size)
{
	char c = buffer[8];
	buffer[8] = '\0';
	command = Convert::hexToInt(buffer);
	buffer[8] = c;

	c = buffer[16];
	buffer[16] = '\0';
	size = Convert::hexToInt(buffer+8);
	buffer[16] = c;
}

/**
 * Process a JSON message
 */
void ReloadClient::processJSONMessage(const String& jsonString)
{
	// Parse the JSON string.
	parseJsonClientMessage(jsonString);

	// Get the message field.
	Value* jsonValue = serverMessageJSONRoot->getValueForKey("message");
	MAUtil::String message = jsonValue->toString().c_str();

	// Download a bundle.
	if (message == "ReloadBundle")
	{
		// Get fields.
		String urlData = (serverMessageJSONRoot->getValueForKey("url"))->toString();
		int fileSize = (serverMessageJSONRoot->getValueForKey("fileSize"))->toInt();

		// Check that we have valid file size field.
		if (fileSize < 0 )
		{
			maPanic(0, "RELOAD: File size identifier not found");
		}

		// Create the request.
		MAUtil::String jsonRequest("{"
			"\"message\":  \"getBundle\","
			"\"params\" : {   "
				"\"bundlePath\": \"" + urlData + "\""
				"}"
			"}");
		MAUtil::String commandUrl =
			"http://" + mServerAddress + ":" + SERVER_HTTP_PORT +
			"/proccess?jsonRPC=" + Encoder::escape(jsonRequest);

		// Save the bundle address.
		strcpy(mBundleAddress, commandUrl.c_str());

		// Save the file size.
		mBundleSize = fileSize;

		// Reset the app environment (destroy widgets, stop sensors).
		freeHardware();

		LOG("@@@ RELOAD: processJSONMessage before downloading bundle: "
			"mBundleAddress=%s mBundleSize=%d",
			mBundleAddress, mBundleSize);

		// Download the bundle.
		downloadBundle();

		// Use this to use experimental HTML download.
		// Needs divineprog/LiveApps/FileServer to work
		// and manual config of BasePath.
		// Comment out downloadBundle when testing this.
		//downloadHTML();

		// Delete Json tree.
		YAJLDom::deleteValue(serverMessageJSONRoot);
	}
	else
	{
		maPanic(0,"RELOAD: Unknown server message");
	}
}

/**
 * New function called to download index.html from the server.
 * TODO: This is experimental code.
 */
void ReloadClient::downloadHTML()
{
	// Clear web view cache.
	getWebView()->setProperty("cache", "clearall");

	// Set URL (uses experimental port).
	String url = "http://";
	url += mServerAddress + ":4042/index.html";
	lprintfln("downloadHTML: %s", url.c_str());

	// Open the page.
	showPage(url);

	mHasPage = true;
	mRunningApp = true;
}

void ReloadClient::downloadBundle()
{
	// Create a data object for the downloaded bundle.
	mResourceFile = maCreatePlaceholder();

	// Start the bundle download.
	if (mDownloader->isDownloading())
	{
		return;
		//mDownloader->cancelDownloading();
	}

	//Prepare a reciever for the download
	mResourceFile = maCreatePlaceholder();
	int result = mDownloader->beginDownloading(mBundleAddress, mResourceFile);
	if (result > 0)
	{
		LOG("@@@ RELOAD: downloadBundle started with result: %d\n", result);

		// Show the loading screen during downloading.
		mLoadingScreen->show();
	}
	else
	{
		LOG("@@@ RELOAD: downloadBundle ERROR: %d\n", result);
		showConErrorMessage(result);
	}
}

/**
 * Called when a download operation is canceled
 * @param downloader The downloader that was canceled
 */
void ReloadClient::downloadCancelled(Downloader* downloader)
{
    LOG("@@@ RELOAD: downloadCancelled");
}

/**
 * Method displays error code in case of error in downloading.
 * @param downloader The downloader that got the error
 * @param code The error code that was returned
 */
void ReloadClient::error(Downloader* downloader, int code)
{
    LOG("@@@ RELOAD: Downloader error: %d", code);
    showConErrorMessage(code);
}

/**
 * Called when the download is complete
 * @param downloader The downloader who finished it's operation
 * @param data A handle to the data that was downloaded
 */
void ReloadClient::finishedDownloading(Downloader* downloader, MAHandle data)
{
    // Check that we have the expected bundle size.
    int dataSize = maGetDataSize(data);
    LOG("@@@ RELOAD: Received size: %d, expected size: %d", dataSize, mBundleSize);
    if (dataSize < mBundleSize)
    {
    	maDestroyPlaceholder(mResourceFile);

    	// TODO: Show LoginScreen or error message?
    	// We should not try to download again, because
    	// this could case an infinite download loop.

    	return;
    }

    // Clear old files.
    clearAppsFolder();

    // Set new app path.
    char buf[1024];
    sprintf(buf, (mAppsFolder + "%d/").c_str(), maGetMilliSecondCount());
    mAppPath = buf;
    String fullPath = mFileUtil->getLocalPath() + mAppPath;
    mReloadFileHandler->setLocalPath(fullPath);

    // Extract files.
    setCurrentFileSystem(data, 0);
    int result = MAFS_extractCurrentFileSystem(fullPath.c_str());
    freeCurrentFileSystem();
    maDestroyPlaceholder(mResourceFile);

    // Load the app on success.
    if (result > 0)
    {
    	// Save location of last loaded app.
    	mFileUtil->writeTextToFile(
    		mFileUtil->getLocalPath() + "LastAppDir.txt",
    		mAppPath);

    	// Bundle was extracted, load the new app files.
    	loadSavedApp();
    }
    else
    {
    	// TODO: Show LoginScreen or error message?
    	// We should not try to download again, because
    	// this could case an infinite download loop.
    }
}

/**
 * Loads the HTML files that were extracted last time.
 */
void ReloadClient::loadSavedApp()
{
	String fullAppPath = mFileUtil->getLocalPath() + mAppPath;

	// Check that index.html exists.
	MAHandle file = mFileUtil->openFileForReading(fullAppPath + "index.html");
	if (file < 0)
	{
		maAlert("Reload: No App", "No app has been loaded yet", "Back", NULL, NULL);
		return;
	}
	maFileClose(file);

	// We want NativeUI events.
	//getMessageHandler()->nativeUIEventsOn();

	// Open the page.
	//showWebView();
	//getWebView()->setBaseUrl(fullAppPath);
	//getWebView()->openURL("index.html");
	mFileUtil->setAppPath(fullAppPath);
	getWebView()->setBaseUrl(fullAppPath);
	showPage("index.html");

	mHasPage = true;

	mRunningApp = true;
}

/**
 * Resets the client (destroys widgets and stops sensors)
 * in preparation for a new app
 */
void ReloadClient::freeHardware()
{
	// TODO: Implement or remove.
	if (mHasPage)
	{
		// TODO: Why is this commented out.
		//We delete the widgets on platforms that are NOT WP7
		/*if(mOS.find("Windows", 0) < 0)
		{
			callJS("try {mosync.nativeui.destroyAll()}catch(err){}");
		}*/
	}

	// Try stopping all sensors.
	// TODO: Replace hard coded number "6" with symbolic value.
	for (int i = 1; i <= 6; ++i)
	{
		maSensorStop(i);
	}
}

/**
 * Sends information about the device to the server
 */
void ReloadClient::sendClientDeviceInfo()
{
	char deviceName[256];
	char deviceUUID[256];
	char deviceOS[256];
	char deviceOSVersion[256];
	char buffer[1024];

	maGetSystemProperty(
		"mosync.device.name",
		deviceName,
		256);

	int uuidRes = maGetSystemProperty(
		"mosync.device.UUID",
		deviceUUID,
		256);

	maGetSystemProperty(
		"mosync.device.OS",
		deviceOS,
		256);

	maGetSystemProperty(
		"mosync.device.OS.version",
		deviceOSVersion,
		256);

	//Due to some limitations on some devices
	//We have to check the UUID separately
	if(uuidRes < 0)
	{
		sprintf(deviceUUID, "Not Accessible");
	}

	// Send the result back to the server as a JSON string
	sprintf(buffer,
		"{"
			"\"message\":\"clientConnectRequest\","
			"\"params\": {"
				"\"type\":\"deviceInfo\","
				"\"platform\":\"%s\","
				"\"name\":\"%s\","
				"\"uuid\":\"%s\","
				"\"version\":\"%s\","
				"\"phonegap\":\"1.2.0\""
			"}"
		"}",
		deviceOS,
		deviceName,
		deviceUUID,
		deviceOSVersion
		);

	mSocket.write(buffer, strlen(buffer));
}

/**
 * This method handles any connection error messages
 * @param errorCode The error code that was returned
 */
void ReloadClient::showConErrorMessage(int errorCode)
{
	String errorMessages[] =
	{
		"Could not connect to the server.", // 0
		"Could not connect to the server.", // -1
		"Could not connect to the server.", //GENERIC = -2;
		"The maximum number of open connections allowed has been reached.", //MAX = -3;
		"DNS resolution error.", //DNS = -4;
		"Internal error. Please report any occurrences", //INTERNAL = -5;
		"The connection was closed by the remote peer.", //CLOSED = -6;
		"Attempted to write to a read-only connection.", //READONLY = -7;
		"The OS does not trust you enough to let you open this connection.", //FORBIDDEN = -8;
		"No operation has been started yet.", //UNINITIALIZED = -9;
		"The Content-Length header could not be found.", //CONLEN = -10;
		"You supplied a malformed URL.", //URL = -11;
		"The protocol is not available.", //UNAVAILABLE = -12;
		"You canceled the operation.", //CANCELED = -13;
		"The server gave an invalid response.", //PROTOCOL = -14;
		"The network connection could not be established.", //NETWORK = -15;
		"The requested header could not be found.", //NOHEADER = -16;
		"The requested object could not be found.", //NOTFOUND = -17;
		"An error occurred during SSL negotiation." //SSL = -18;
	};

	//The errorCode is always a negative number, so we reverse it to
	//index our C array
	maAlert("RELOAD Error", errorMessages[-errorCode].c_str(), "OK", NULL, NULL);
}

void ReloadClient::cancelDownload()
{
	mDownloader->cancelDownloading();
	mLoginScreen->showConnectedScreen();
}

void ReloadClient::connectTo(const char *serverAddress)
{
	// User tries to connect, reset the socket and
	// start a new connection.
	mSocket.close();
	mServerAddress = serverAddress;
	sprintf(mBuffer, "socket://%s:%s",
		mServerAddress.c_str(),
		mPort.c_str());
	mSocket.connect(mBuffer);
}

void ReloadClient::disconnect()
{
	// Close the socket, and show the connect controls again.
	mSocket.close();
	mLoginScreen->disconnected();
}

void ReloadClient::clearAppsFolder()
{
	deleteFolderRecurse((mFileUtil->getLocalPath() + mAppsFolder).c_str());
}

void ReloadClient::deleteFolderRecurse(const char *path)
{
	char fileName[128];
	char fullPath[256];
	//LOG("@@@ RELOAD: Deleting files in folder: %s", path);
	MAHandle list = maFileListStart(path, "*", MA_FL_SORT_NONE);
	int length = maFileListNext(list, fileName, 128);
	while (length > 0)
	{
		sprintf(fullPath, "%s%s", path, fileName);
		if (fileName[length-1] == '/')
		{
			deleteFolderRecurse(fullPath);
		}
		MAHandle appDirHandle = maFileOpen(fullPath, MA_ACCESS_READ_WRITE);
		if (maFileExists(appDirHandle))
		{
			//LOG("@@@ RELOAD: Deleting: %s", fileName);
			maFileDelete(appDirHandle);
		}
		maFileClose(appDirHandle);
		length = maFileListNext(list, fileName, 128);
	}
	maFileListClose(list);
}

void ReloadClient::onLogMessage(const char* message, const char* url)
{
	// If the url is set to "undefined", we will use JsonRPC to
	// send the log message to the Reload server. Otherwise, we
	// just call the url supplied using a REST convention.
	if (0 == strcmp("undefined", url))
	{
		// Set URL for remote log service.
		MAUtil::String messageString = message;
		MAUtil::String json(
			"{"
			"\"message\":  \"remoteLog\","
			"\"params\" : {   "
				"\"logMessage\": \"" + messageString + "\""
				"}"
			"}");

		MAUtil::String commandUrl =
			"http://" + mServerAddress + ":" + SERVER_HTTP_PORT +
			"/proccess?jsonRPC=" + Encoder::escape(json);

		// Send request to server.
		RemoteLogConnection* connection = new RemoteLogConnection();
		connection->get(commandUrl.c_str());
	}
	else
	{
		MAUtil::String urlString = url;

		// Escape ("percent encode") the message.
		MAUtil::String request = urlString + WebViewMessage::escape(message);

		// Send request to server.
		RemoteLogConnection* connection = new RemoteLogConnection();
		connection->get(request.c_str());
	}
}

void ReloadClient::parseJsonClientMessage(MAUtil::String jsonMessage)
{
	// Parse Json data.
	serverMessageJSONRoot = YAJLDom::parse(
		(const unsigned char*)jsonMessage.c_str(),
		jsonMessage.size());

	// Check that the root is valid.
	if (NULL == serverMessageJSONRoot
		|| Value::NUL == serverMessageJSONRoot->getType()
		|| Value::MAP != serverMessageJSONRoot->getType())
	{
		maPanic(0, "RELOAD: The JSON message format is incorrect");
	}
}
