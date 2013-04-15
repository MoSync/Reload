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
 *	Created on: Feb 27, 2012
 *	  Author: Ali Sarrafi, Iraklis Rossis
 */

#include "mastdlib.h"

#include <Wormhole/HighLevelHttpConnection.h>
#include <Wormhole/Encoder.h>
#include <maapi.h>

#include "ReloadClient.h"
#include "ReloadNativeUIMessageHandler.h"
#include "Log.h"
#include "View/MainStackSingleton.h"
#include "View/MainStackScreen.h"

#define SERVER_TCP_PORT "7000"
#define SERVER_HTTP_PORT "8283"

// Namespaces we want to access.
using namespace MAUtil;
using namespace NativeUI;
using namespace Wormhole;

// ========== Error messages ==========

#define RELOAD_ERROR_COULD_NOT_CONNECT_TO_SERVER 0


static String sErrorMessages[] =
{
	"Could not connect to the server", // 0
	"Could not connect to the server", // -1
	"Could not connect to the server", //GENERIC = -2;
	"The maximum number of open connections allowed has been reached", //MAX = -3;
	"DNS resolution error", //DNS = -4;
	"Internal error. Please report any occurrences", //INTERNAL = -5;
	"The connection was closed by the remote peer", //CLOSED = -6;
	"Attempted to write to a read-only connection", //READONLY = -7;
	"The OS does not trust you enough to let you open this connection", //FORBIDDEN = -8;
	"No operation has been started yet", //UNINITIALIZED = -9;
	"The Content-Length header could not be found", //CONLEN = -10;
	"You supplied a malformed URL", //URL = -11;
	"The protocol is not available", //UNAVAILABLE = -12;
	"You canceled the operation", //CANCELED = -13;
	"The server gave an invalid response", //PROTOCOL = -14;
	"The network connection could not be established", //NETWORK = -15;
	"The requested header could not be found", //NOHEADER = -16;
	"The requested object could not be found", //NOTFOUND = -17;
	"An error occurred during SSL negotiation" //SSL = -18;
};

// ========== Helper class ==========

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

/**
 * Helper function to read a string resource.
 */
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
 * Helper function to delete a directory and its sub directories.
 */
static void DeleteFolderRecursively(const char *path)
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
			DeleteFolderRecursively(fullPath);
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

// ========== Creation and destruction ==========

ReloadClient::ReloadClient()
{
	lprintfln("@@@ ReloadClient");
	// Initialize application.
	// Order of calls are important as data needed by
	// later calls are created in earlier calls.

	setScreenOrientation();
	initializeWebView();
	initializeVariables();
	initializeFiles();
	createScreens();
	createMessageHandlers();
	createNetworkHandlers();

	// Show first screen.
	mReloadScreenController->showNotConnectedScreen();
}

ReloadClient::~ReloadClient()
{
}

void ReloadClient::setScreenOrientation()
{
	char buffer[64];
	maGetSystemProperty(
		"mosync.device.OS",
		buffer,
		64);
	MAUtil::String os = buffer;

	// Android orientation events not implemented.
	if(os.find("Android", 0) < 0)
	{
		// Android and Windows Phone.
		maScreenSetOrientation(SCREEN_ORIENTATION_DYNAMIC);

		// iOS and Windows Phone.
		maScreenSetSupportedOrientations(
			MA_SCREEN_ORIENTATION_LANDSCAPE_LEFT |
			MA_SCREEN_ORIENTATION_LANDSCAPE_RIGHT |
			MA_SCREEN_ORIENTATION_PORTRAIT |
			MA_SCREEN_ORIENTATION_PORTRAIT_UPSIDE_DOWN);
	}
	else
	{
		maScreenSetOrientation(SCREEN_ORIENTATION_PORTRAIT);

		maScreenSetSupportedOrientations(
			MA_SCREEN_ORIENTATION_PORTRAIT |
			MA_SCREEN_ORIENTATION_PORTRAIT_UPSIDE_DOWN);
	}
}

void ReloadClient::initializeWebView()
{
	// Create WebView widget and message handlers.
	// This code is from HybridMoblet::initialize().
	mInitialized = true;
	createUI();
	enableWebViewMessages();
	getMessageHandler()->initialize(this);

	// Set the beep sound. This is defined in the
	// Resources/Resources.lst file. You can change
	// this by changing the sound file in that folder.
	setBeepSound(BEEP_WAV);
}

void ReloadClient::initializeVariables()
{
	mHasPage = false;
	mAppsFolder = "apps/";
	mSavedAppsFolder = "saved/";
	mRunningApp = false;
	mProtocolVersion = 0;
	mProjectToSave = "";

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

	// Create folder where saved apps are stored
	appDirHandle = maFileOpen(
		(mFileUtil->getLocalPath() + mSavedAppsFolder).c_str(),
		MA_ACCESS_READ_WRITE);
	if (!maFileExists(appDirHandle))
	{
		maFileCreate(appDirHandle);
	}
	maFileClose(appDirHandle);

	// load stored project data
	MAUtil::String storedProjectData;
	bool success = mFileUtil->readTextFromFile(
			mFileUtil->getLocalPath() + "SavedAppsData.txt",
			storedProjectData);

	// parse the data read and populate the mSavedProjects Vector
	if (success && storedProjectData.length() > 0)
	{
		struct reloadProject node;
		char *prPtr = NULL;

		char * spa = new char[storedProjectData.length()+1];
		memcpy(spa, storedProjectData.c_str(),storedProjectData.length()+1);

		prPtr = strtok( spa, "\n");

		while( prPtr != NULL)
		{
			node.name = prPtr;
			node.path = strtok(NULL, "\n");
			this->mSavedProjects.add(node);

			prPtr = strtok(NULL, "\n");
		}
	}

	// Reading information resource file and populate mInfo
	// and mProtocolVersion
	// TODO: What is this? Some resource string?
	// TODO: Use SysLoadStringResource(MAHandle data)
	int size = maGetDataSize(INFO_TEXT);
	if (size > 0)
	{
		// Read the whole information resource file
		mInfo.resize(size);
		maReadData(INFO_TEXT, mInfo.pointer(), 0, size);

		// Get the Protocol Version from the data read.
		const char* prv;
		char * infoTemp = new char[size + 1];
		memcpy(infoTemp, mInfo.c_str(), size + 1);

		int stringsRead = 0;
		prv = strtok(infoTemp, "\r\n");
		while(true)
		{
			if(prv != NULL)
			{
				stringsRead++;
				//LOG("@@@RELOAD: %s", prv);
			}
			if(stringsRead == 3)
			{
				break;
			}
			prv = strtok(NULL, "\r\n");
		}
		mProtocolVersion = (char*)prv;
	}
	else
	{
		maPanic(0, "RELOAD: Could not read INFO_TEXT");
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

void ReloadClient::createScreens()
{
	// Create login screen and loading screen.
	mReloadScreenController = new ReloadScreenController(this);
	int orientation = maScreenGetCurrentOrientation();
	mReloadScreenController->initializeScreen(mOS, orientation);
	mLoadingScreen = new LoadingScreen(this);
	mLoadingScreen->initializeScreen(mOS);

	// Set the most recently used server IP address.
	mReloadScreenController->defaultAddress(mServerAddress.c_str());
}

void ReloadClient::createMessageHandlers()
{
	// Set the log message listener.
	getMessageHandler()->setLogMessageListener(this);
}

void ReloadClient::createNetworkHandlers()
{
	mDownloadHandler.setListener(this);
	mDownloadHandler.addDownloadListener(mLoadingScreen);

	mSocketHandler.setListener(this);
}

// ========== Implemented (inherited) methods  ==========

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
			if (mReloadScreenController->shouldExit())
			{
				// on wp7, we cannot exit the application programmatically - the
				// system closes the application on back button press
				if (mOS.find("Windows", 0) < 0)
				{
					exit();
				}
			}
			else
			{
				disconnectFromServer();
			}
		}
	}
}

/**
 * We want to quit the ReloadClient only if an app is not running.
 * This method is called from the Wormhole library when a JavaScript
 * application requests to exit.
 */
void ReloadClient::exit()
{
	if (mRunningApp)
	{
		// Close the running app and show the start screen.
		mRunningApp = false;
		mReloadScreenController->showConnectedScreen();
	}
	else
	{
		// Exit the ReloadClient.
		exitEventLoop();
	}
}

/**
 * Log message handler.
 */
void ReloadClient::onLogMessage(const char* message, const char* url)
{
	// If the url is set to "undefined", we will use JsonRPC to
	// send the log message to the Reload server. Otherwise, we
	// just call the url supplied using a REST convention.
	if (0 == strcmp("undefined", url))
	{
#if(1)
		// New method (TCP).

		// Send the result back to the server as a JSON string
		MAUtil::String messageString = Encoder::escape(message);
		MAUtil::String json(
			"{"
			"\"message\":\"remoteLogRequest\","
			"\"params\":["
				"\"" + messageString + "\""
				"],"
			"\"id\":0"
			"}");

		sendTCPMessage(json);
#endif

#if(0)
		// Unused method (HTTP).

		// Set URL for remote log service.
		MAUtil::String messageString = message;
		MAUtil::String json(
			"{"
			"\"method\":  \"client.remoteLog\","
			"\"params\": [	 "
				"\"" + messageString + "\""
				"],"
			"\"id\": 0"
			"}");

		MAUtil::String commandUrl =
			"http://" + mServerAddress + ":" + SERVER_HTTP_PORT +
			"/proccess?jsonRPC=" + Encoder::escape(json);

		// Send request to server.
		RemoteLogConnection* connection = new RemoteLogConnection();
		connection->get(commandUrl.c_str());
#endif
	}
	else
	{
		MAUtil::String urlString = url;

		// Escape ("percent encode") the message.
		MAUtil::String request = urlString + Encoder::escape(message);

		// Send request to server.
		RemoteLogConnection* connection = new RemoteLogConnection();
		connection->get(request.c_str());
	}
}

// ========== SocketHandlerListener methods  ==========

/**
 * A connection to the server has been established.
 */
void ReloadClient::socketHandlerConnected(int result)
{
	if (result > 0)
	{
		LOG("@@@ RELOAD connected to: %s", mServerAddress.c_str());

		getProjectListFromServer();

		// Tell UI we are connected.
		mReloadScreenController->connectedTo(mServerAddress.c_str());

		// Send info about this device to the server.
		sendClientDeviceInfo();
	}
	else
	{
		// Special handling of error code -13, which is sent
		// when a maConnect fails, on Android at least. Is this
		// a bug in the runtime? See issue RELOAD-133.
		if (-13 == result)
		{
			showConnectionErrorMessage(
				RELOAD_ERROR_COULD_NOT_CONNECT_TO_SERVER);
		}
		else
		{
			showConnectionErrorMessage(result);
		}
	}
}

/**
 * We received a message from the server.
 */
void ReloadClient::socketHandlerDisconnected(int result)
{
	LOG("@@@ RELOAD: ERROR socketHandlerDisconnected: %i", result);

	// Do not show the alert if we have result code zero.
	// This means we have closed the connection manually,
	// it is not an error. Does this work the same on all
	// platforms? (Tested on Android.)
	if (0 != result)
	{
		showConnectionErrorMessage(result);

		// Go back to the login screen.
		mReloadScreenController->showNotConnectedScreen();
	}
}

/**
 * We received a message from the server.
 */
void ReloadClient::socketHandlerMessageReceived(const char* message)
{
	if (NULL != message)
	{
		handleJSONMessage(message);
	}
	else
	{
		LOG("@@@ RELOAD: ERROR socketHandlerMessageReceived");

		// TODO: Add error message.
		//showConErrorMessage(result);

		// Go back to the login screen.
		mReloadScreenController->showNotConnectedScreen();
	}
}

// ========== DownloadHandlerListener methods  ==========

void ReloadClient::downloadHandlerError(int code)
{
	LOG("@@@ RELOAD: Download handler error: %d", code);
	showConnectionErrorMessage(code);
}

void ReloadClient::downloadHandlerSuccess(MAHandle data)
{
	// Check that we have the expected bundle size.
	int dataSize = maGetDataSize(data);
	LOG("@@@ RELOAD: Received size: %d, expected size: %d", dataSize, mBundleSize);
	if (dataSize != mBundleSize)
	{
		maDestroyPlaceholder(data);

		// TODO: Show LoginScreen or error message?
		// We should not try to download again, because
		// this could case an infinite download loop.

		return;
	}

	// Check if the project exists
	bool projectExists = false;
	if(mProjectToSave != "")
	{
		for(MAUtil::Vector <reloadProject>::iterator i = mSavedProjects.begin(); i != mSavedProjects.end(); i++)
		{
			if(i->name == mProjectToSave)
			{
				projectExists = true;
				lprintfln("@@@ RELOAD: The project %s already exists", mProjectToSave.c_str());
				break;
			}
		}
	}

	// Delete old files if necessary.
	if(mProjectToSave == "" || projectExists )
	{
		clearAppsFolder(mProjectToSave);
	}

	// Set the project Path depending on weather the
	// we are reloading or saving
	if (mProjectToSave == "")
	{
		char buf[1024];
		sprintf(buf, (mAppsFolder + "%d/").c_str(), maGetMilliSecondCount());
		mAppPath = buf;
	}
	else
	{
		mAppPath = mSavedAppsFolder + "RLDPRJ" + mProjectToSave +"/";
	}

	String fullPath = mFileUtil->getLocalPath() + mAppPath;

	// Extract files.
	setCurrentFileSystem(data, 0);
	int result = MAFS_extractCurrentFileSystem(fullPath.c_str());
	freeCurrentFileSystem();
	maDestroyPlaceholder(data);

	// Load the app if reloading or return to workspace screen if saving.
	if (result > 0)
	{
		// Save the new project to the vector and write the data on file
		if(mProjectToSave != "")
		{
			if( !projectExists)
			{
				struct reloadProject projectItem;
				projectItem.name = mProjectToSave;
				projectItem.path = mFileUtil->getLocalPath() + mSavedAppsFolder + "RLDPRJ" + mProjectToSave +"/";
				mSavedProjects.add(projectItem);

				MAUtil::String stringToWrite = "";
				for(MAUtil::Vector <reloadProject>::iterator i = mSavedProjects.begin(); i != mSavedProjects.end(); i++)
				{
					stringToWrite += i->name + "\n" + i->path + "\n";
				}
				mFileUtil->writeTextToFile(
								mFileUtil->getLocalPath() + "SavedAppsData.txt",
								stringToWrite);
			}
			maAlert("Saving Project", ("Project " + mProjectToSave + " was succesfully saved").c_str(),
					NULL, "OK", NULL);
			mProjectToSave = "";

			mReloadScreenController->showConnectedScreen();
		}
		else
		{
			// We are in reload mode. Just start the saved app
			// without providing project Name
			launchSavedApp("");
		}
	}
	else
	{
		// TODO: Show LoginScreen or error message?
		// We should not try to download again, because
		// this could case an infinite download loop.
	}
}

// ========== Methods called from the UI  ==========

void ReloadClient::cancelDownload()
{
	mDownloadHandler.cancelDownload();
	mReloadScreenController->showConnectedScreen();
}

void ReloadClient::connectToServer(const char* serverAddress)
{
	// Store the server address.
	mServerAddress = serverAddress;

	// Save the server address on file.
	mFileUtil->writeTextToFile(
		mFileUtil->getLocalPath() + "LastServerAddress.txt",
		mServerAddress);

	// Initiate connection sequence.
	int result = mSocketHandler.connectToServer(
		serverAddress,
		SERVER_TCP_PORT);
	if (result < 0)
	{
		showConnectionErrorMessage(RELOAD_ERROR_COULD_NOT_CONNECT_TO_SERVER);
	}
}

void ReloadClient::disconnectFromServer()
{
	// Close the socket, and show the connect controls again.
	mSocketHandler.closeConnection();
	mReloadScreenController->disconnected();
}

void ReloadClient::showDisconnectionMessage (MAUtil::String disconnectData)
{

	MAUtil::String finalString = "";

	int disconnectDataSize = disconnectData.length();
	int startPos = 0;

	while (startPos < disconnectDataSize)
	{
		finalString += disconnectData.substr(startPos,40) + "\n";
		startPos += 40;
	}

	// Add \n every 40 characters so alert will be shown
	// correctly on all devices
	maAlert("Disconnection",
			finalString.c_str(),
			NULL,"OK",NULL);
}

// ========== Server message handling  ==========

/**
 * Handle JSON messages.
 */
void ReloadClient::handleJSONMessage(const String& json)
{
	// Parse JSON data.
	YAJLDom::Value* jsonRoot = YAJLDom::parse(
		(const unsigned char*)json.c_str(),
		json.size());

	// Check that the root is valid.
	if (NULL == jsonRoot
		|| YAJLDom::Value::NUL == jsonRoot->getType()
		|| YAJLDom::Value::MAP != jsonRoot->getType())
	{
		maPanic(0, "RELOAD: The JSON message format is incorrect");
	}

	// Get the message name.
	String message = (jsonRoot->getValueForKey("message"))->toString();

	// Download a bundle.
	if (message == "ReloadBundle")
	{
		// Get message parameters.
		String urlData = (jsonRoot->getValueForKey("url"))->toString();
		int fileSize = (jsonRoot->getValueForKey("fileSize"))->toInt();

		// Initiate the download.
		downloadBundle(urlData, fileSize);
	}
	// Disconnect from server.
	else if (message == "Disconnect")
	{
		LOG("@@@ disconnect");
		disconnectFromServer();
	}
	// Evaluate a JavaScript string.
	else if (message == "EvalJS")
	{
		// Get message parameters.
		String script = (jsonRoot->getValueForKey("script"))->toString();
		evaluateScript(script);
	}
	else if (message == "Disconnect")
	{
		this->disconnectFromServer();

		YAJLDom::Value* tempstr = jsonRoot->getValueForKey("data");
		if(!tempstr->isNull())
		{
			MAUtil::String disconnectData = (tempstr->toString()) + "\n";
			this->showDisconnectionMessage(disconnectData);
		}
	}
	else if (message == "projectList")
	{
		mProjects.clear();

		YAJLDom::Value *data = jsonRoot->getValueForKey("data");

		int totalProjects = (int)data->getValueForKey("projectsCount")->toDouble();

		struct reloadProject tmp;

		YAJLDom::Value *projectArray = data->getValueForKey("projects");

		for(int i = 0; i < totalProjects; i++)
		{
			YAJLDom::Value *row = projectArray->getValueByIndex(i);
			tmp.name = row->getValueForKey("name")->toString();
			tmp.path = row->getValueForKey("path")->toString();
			tmp.url = row->getValueForKey("url")->toString();
			mProjects.add(tmp);
		}
		mReloadScreenController->pushWorkspaceScreen();
	}
	else
	{
		maPanic(0,"RELOAD: Unknown server message");
	}

	// Delete the JSON tree.
	YAJLDom::deleteValue(jsonRoot);
}

// ========== Download methods ==========

void ReloadClient::downloadBundle(const String& urlData, int fileSize)
{
	// Check that we have valid file size field.
	if (fileSize <= 0 )
	{
		maPanic(0, "RELOAD: downloadBundle file size is invalid");
	}

	// If there is an ongoing download, then cancel it.
	if (mDownloadHandler.isDownloading())
	{
		mDownloadHandler.cancelDownload();
	}

	// Create download request.
	MAUtil::String jsonRequest("{"
		"\"method\":\"client.getBundle\","
		"\"params\":["
			 "\"" + urlData + "\""
			"],"
		"\"id\":1"
		"}");

	LOG("@@@ RELOAD urlData: %s", urlData.c_str() );
	LOG("@@@ RELOAD jsonRequest: %s", jsonRequest.c_str() );

	MAUtil::String url =
		"http://" + mServerAddress + ":" + SERVER_HTTP_PORT +
		"/proccess?jsonRPC=" + Encoder::escape(jsonRequest);

	LOG("@@@ RELOAD: downloadBundle before downloading bundle: "
		"url: %s fileSize: %d",
		url.c_str(), fileSize);

	// Save the file size so that we can verify the download.
	mBundleSize = fileSize;

	// Start the download.
	int result = mDownloadHandler.startDownload(url.c_str());
	if (result > 0)
	{
		LOG("@@@ RELOAD: downloadBundle started with result: %d\n", result);

		// Show the loading screen during downloading.
		mLoadingScreen->show();
	}
	else
	{
		LOG("@@@ RELOAD: downloadBundle ERROR: %d\n", result);
		showConnectionErrorMessage(result);
	}
}

/**
 * New function called to download index.html from the server.
 * TODO: This is experimental code. NOT USED.
 */
/*
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
*/

// ========== Evaluate JavaScript ==========

void ReloadClient::evaluateScript(const String& script)
{
	String url = "javascript:";
	url += "try{var res=eval(unescape('";
	url += script;
	url += "'));";
	url += "if (typeof res!=='undefined'){mosync.rlog('javascript:'+JSON.stringify(res))}}";
	url += "catch(err){mosync.rlog('javascript:'+err)}";
	getWebView()->openURL(url);
}

// ========== Launching apps ==========

/**
 * Loads the HTML files that were extracted last time.
 */
void ReloadClient::launchSavedApp(MAUtil::String projectName)
{
	MAUtil::String fullAppPath;

	if (projectName == "")
	{
		// Get path to app.
		fullAppPath = mFileUtil->getLocalPath() + mAppPath;
	}
	else
	{
		for(MAUtil::Vector <reloadProject>::iterator i = mSavedProjects.begin(); i != mSavedProjects.end(); i++)
		{
			if(i->name == projectName)
			{
				fullAppPath = i->path;
				break;
			}
		}
	}

	// Check that index.html exists.
	MAHandle file = mFileUtil->openFileForReading(fullAppPath + "index.html");
	if (file < 0)
	{
		maAlert("Reload: No App", "No app has been saved yet", "Back", NULL, NULL);
		return;
	}
	maFileClose(file);

	// Reset the app environment (destroy widgets, stop sensors).
	freeHardware();

	// Set path to the app's local files.
	mFileUtil->setAppPath(fullAppPath);

	// Open the page.
	getWebView()->setVisible(true);
	showWebView();
	String baseURL = "file://" + fullAppPath;
	getWebView()->setBaseUrl(baseURL);
	getWebView()->openURL("index.html");

	// Set status variables.
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

void ReloadClient::clearAppsFolder(MAUtil::String appFolder)
{
	if (appFolder == "") // Normal Reload mode
	{
		DeleteFolderRecursively((mFileUtil->getLocalPath() + mAppsFolder).c_str());
	}
	else // Save app mode
	{
		DeleteFolderRecursively((mFileUtil->getLocalPath() +
								 mSavedAppsFolder +
								 "RLDPRJ" + appFolder + "/").c_str());
	}
}

// ========== Send info to server  ==========
/**
 * Send a message requesting project list
 */
void ReloadClient::getProjectListFromServer()
{
	MAUtil::String tmpMsg = "{\"message\":\"getProjectList\",\"params\": {}}";

	sendTCPMessage(tmpMsg);
}

/**
 * Send a message requesting a project so it can be saved
 * @param projectName The name of the project to be saved
 */
void ReloadClient::saveProjectFromServer(MAUtil::String projectName)
{
	mProjectToSave = projectName;
	MAUtil::String tmpMsg = "{ \"message\": \"reloadProject\","
							  "\"params\" : {"
								  "\"projectName\": \"" + projectName + "\""
								"}"
							"}";
	sendTCPMessage(tmpMsg);
}

/**
 * Send a message requesting a project to be reloaded
 * @param projectName The name of the project to be reloaded
 */
void ReloadClient::reloadProjectFromServer(MAUtil::String projectName)
{
	MAUtil::String tmpMsg = "{ \"message\": \"reloadProject\","
							  "\"params\" : {"
							  	  "\"projectName\": \"" + projectName + "\""
							    "}"
							"}";
	sendTCPMessage(tmpMsg);
}

/**
 * Sends information about the device to the server.
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
	if (uuidRes < 0)
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
				"\"phonegap\":\"1.2.0\","
				"\"protocolVersion\":\"%s\""
			"}"
		"}",
		deviceOS,
		deviceName,
		deviceUUID,
		deviceOSVersion,
		mProtocolVersion
		);

	sendTCPMessage(buffer);
}

// ========== Helper methods ==========

void ReloadClient::sendTCPMessage(const String& message)
{
	mSocketHandler.sendMessage(message.c_str());
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
 * This method handles any connection error messages.
 * @param errorCode The error code that was returned.
 */
void ReloadClient::showConnectionErrorMessage(int errorCode)
{
	String errorMessage;
	char code[64];

	sprintf(code, "%i", errorCode);

	// Check if the error code is an internal Reload code.
	// In this case we use the above error messages.
	if (errorCode <= 0 && errorCode >= -18)
	{
		// The errorCode is a negative number, so we
		// negate it to get a positive array index.
		errorMessage = sErrorMessages[-errorCode] + " (";
		errorMessage += code;
		errorMessage += ")";
	}
	else
	{
		// Otherwise, display the error code.
		errorMessage = "Error: ";
		errorMessage += code;
	}

	LOG("@@@ RELOAD: showConnectionErrorMessage: %s", errorMessage.c_str());

	maAlert("Network Status", errorMessage.c_str(), "OK", NULL, NULL);
}

/**
 * Getter returns the vector of projects on server
 * @return MAUtil::Vector <reloadProject>
 */
MAUtil::Vector <reloadProject> * ReloadClient::getListOfProjects()
{
	return &mProjects;
}

/**
 * Getter returns the vector of projects stored on the device
 * @return MAUtil::Vector <reloadProject>
 */
MAUtil::Vector <reloadProject> * ReloadClient::getListOfSavedProjects()
{
	return &mSavedProjects;
}
