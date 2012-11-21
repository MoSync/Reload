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

#include <Wormhole/HighLevelHttpConnection.h>
#include <Wormhole/WebViewMessage.h>
#include <Wormhole/Encoder.h>

#include "ReloadClient.h"
#include "mastdlib.h"

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
		mSocket(this),
		mHasPage(false),
		mNativeUIMessageReceived(false),
		mPhoneGapMessageHandler(getWebView()),
		mReloadFile(&mPhoneGapMessageHandler),
		mResourceMessageHandler(getWebView()),
		mPort(SERVER_TCP_PORT),
		mAppsFolder("apps/")
{
	char buffer[64];
	maGetSystemProperty(
				"mosync.device.OS",
				buffer,
				64);
	mOS = buffer;
	mNativeUIMessageHandler = NULL;

	// Initialize the server command.
	mServerCommand = 0;

	MAHandle appDirHandle = maFileOpen(
		(mFileUtil->getLocalPath() + mAppsFolder).c_str(),
		MA_ACCESS_READ_WRITE);
	if (!maFileExists(appDirHandle))
	{
		LOG("@@@ RELOAD: Creating Apps folder: %s",
			(mFileUtil->getLocalPath() + mAppsFolder).c_str());
		maFileCreate(appDirHandle);
	}
	maFileClose(appDirHandle);

	mLoginScreen = new LoginScreen(this);
	mLoadingScreen = new LoadingScreen(this);

	mLoginScreen->initializeScreen(mOS);
	mLoadingScreen->initializeScreen(mOS);

	bool success = mFileUtil->readTextFromFile(
		mFileUtil->getLocalPath() + "LastServerAddress.txt",
		mServerAddress);
	if (!success)
	{
		mServerAddress = "localhost";
	}

	mLoginScreen->defaultAddress(mServerAddress.c_str());

	success = mFileUtil->readTextFromFile(
		mFileUtil->getLocalPath() + "LastAppDir.txt",
		mAppPath);
	if (!success)
	{
		mAppPath = "";
	}

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

	// Set the beep sound. This is defined in the
	// Resources/Resources.lst file. You can change
	// this by changing the sound file in that folder.
	mPhoneGapMessageHandler.setBeepSound(BEEP_WAV);

	// Enable message sending from JavaScript to C++.
	enableWebViewMessages();
	// Show the WebView that contains the HTML/CSS UI
	// and the JavaScript code.
	getWebView()->setVisible(true);

	mDownloader = new Downloader();
	mDownloader->addDownloadListener(this);
	mDownloader->addDownloadListener(mLoadingScreen);

	Environment::getEnvironment().addCustomEventListener(this);

	mRunningApp = false;
	mLoginScreen->show(false);

	mResourceMessageHandler.setLogMessageListener(this);
}

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
		mPhoneGapMessageHandler.processKeyEvent(keyCode, nativeCode);
	}
	else
	{
		if (MAK_BACK == keyCode)
		{
			maExit(0);
		}
	}
}

/**
 * This method handles messages sent from the WebView.
 *
 * Note that the data object will be valid only during
 * the life-time of the call of this method, then it
 * will be deallocated.
 *
 * @param webView The WebView that sent the message.
 * @param urlData Data object that holds message content.
 */
void ReloadClient::handleWebViewMessage(WebView* webView, MAHandle data)
{
	// Uncomment to print message data for debugging.
	// You need to build the project in debug mode for
	// the log output to be displayed.
	//printMessage(data);

	// Check the message protocol.
	MessageProtocol protocol(data);
	if (protocol.isMessageStreamJSON())
	{
		handleMessageStreamJSON(webView, data);
	}
	else if (protocol.isMessageStream())
	{
		handleMessageStream(webView, data);
	}
	else
	{
		LOG("@@@ RELOAD: Undefined message protocol");
	}
}

/**
 * Handles JSON messages. This is used by PhoneGap.
 *
 * You can send your own messages from JavaScript and handle them here.
 *
 * @param webView A pointer to the web view posting this message.
 * @param data The raw encoded JSON message array.
 */
void ReloadClient::handleMessageStreamJSON(WebView* webView, MAHandle data)
{
	// Create the message object. This parses the message data.
	// The message object contains one or more messages.
	JSONMessage message(webView, data);

	// Loop through messages.
	while (message.next())
	{
		// This detects the PhoneGap protocol.
		if (message.is("PhoneGap"))
		{
			// The local file system is different from a normal Wormhole app,
			// we need to intervene in the normal API call.
			if (message.getParam("service") == "File"
				&& message.getParam("action")=="requestFileSystem")
			{
				mReloadFile.actionRequestFileSystem(message);
			}
			else
			{
				mPhoneGapMessageHandler.handlePhoneGapMessage(message);
			}
		}
		// Here we add our own messages. See index.html for
		// the JavaScript code used to send the message.
		else if (message.is("Custom"))
		{
			String command = message.getParam("command");
			if (command == "vibrate")
			{
				int duration = message.getParamInt("duration");
				maVibrate(duration);
			}
		}
	}
}

/**
 * Handles string stream messages (generally faster than JSON messages).
 * This is used by the JavaScript NativeUI system.
 *
 * You can send your own messages from JavaScript and handle them here.
 *
 * @param webView A pointer to the web view posting this message.
 * @param data The raw encoded stream of string messages.
 */
void ReloadClient::handleMessageStream(WebView* webView, MAHandle data)
{
	// Create a message stream object. This parses the message data.
	// The message object contains one or more strings.
	MessageStream stream(webView, data);

	// Pointer to a string in the message stream.
	const char* p;

	// Process messages while there are strings left in the stream.
	while (p = stream.getNext())
	{
		if (0 == strcmp(p, "NativeUI"))
		{
			// If this is the first NativeUI message we receive (init), we also hijack the
			// loadImage function to point to the new relative path
			if (!mNativeUIMessageReceived)
			{
				char buff[512];
				sprintf(
					buff,
					"mosync.resource.loadImageOld = mosync.resource.loadImage;"
					" mosync.resource.loadImage = function(imagePath, imageID, successCallback)"
					"{"
					"mosync.resource.loadImageOld('%s' + imagePath, imageID, successCallback)"
					"}",
					mAppPath.c_str());
				getWebView()->callJS(buff);
				mNativeUIMessageReceived = true;
			}

			// Forward NativeUI messages to the respective message handler
			mNativeUIMessageHandler->handleMessage(stream);
		}
		else if (0 == strcmp(p, "Resource"))
		{
			//Forward Resource messages to the respective message handler
			mResourceMessageHandler.handleMessage(stream);
		}
		else if (0 == strcmp(p, "close"))
		{
			// Close the application (calls method in class Moblet).
			close();
		}
		// Here we add your own messages. See index.html for
		// the JavaScript code used to send the message.
		else if (0 == strcmp(p, "Custom"))
		{
			const char* command = stream.getNext();
			if (NULL != command && (0 == strcmp(command, "beep")))
			{
				// This is how to play the sound in the resource BEEP_WAV.
				lprintfln("beeping");
				maSoundPlay(BEEP_WAV, 0, maGetDataSize(BEEP_WAV));
			}
		}
	}
}

/**
 * For debugging.
 */
void ReloadClient::printMessage(MAHandle dataHandle)
{
	// Get length of the data, it is not zero terminated.
	int dataSize = maGetDataSize(dataHandle);

	// Allocate buffer for string data.
	char* stringData = (char*) malloc(dataSize + 1);

	// Get the data.
	maReadData(dataHandle, stringData, 0, dataSize);

	// Zero terminate.
	stringData[dataSize] = 0;

	// Print unparsed message data.
	maWriteLog("@@@ RELOAD Message:", 19);
	maWriteLog(stringData, dataSize);

	free(stringData);
}

/**
 * The socket->connect() operation has completed.
 * Socket is open if result > 0.
 */
void ReloadClient::connectFinished(Connection *conn, int result)
{
	LOG("@@@ RELOAD: connectFinished result: %d\n", result);

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
	LOG("@@@ RELOAD connReadFinished result: %d\n", result);

	// If the command is zero, we have a new header with
	// command and size data.
	if (mServerCommand == 0)
	{
		getMessageCommandAndSize(mBuffer, &mServerCommand, &mServerMessageSize);

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
		mLoginScreen->show(false);
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
	const char* buffer,
	int* command,
	int* size)
{
	char commandBuf[9];
	char sizeBuf[9];

	for (int i = 0; i < 8; ++i)
	{
		commandBuf[i] = buffer[i];
		sizeBuf[i] = buffer[8+i];
	}

	commandBuf[8] = '\0';
	sizeBuf[8] = '\0';

	*command = Convert::hexToInt(commandBuf);
	*size = Convert::hexToInt(sizeBuf);
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
	MAUtil::String message	= jsonValue->toString().c_str();

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
 * TODO: This is experimental code. Use of remove.
 */
void ReloadClient::downloadHTML()
{
	// Clear web view cache.
	getWebView()->setProperty("cache", "clearall");

	//We do lazy initialization of the NativeUI message handler for the
	//sake of WP7
	if (mNativeUIMessageHandler == NULL)
	{
		mNativeUIMessageHandler = new NativeUIMessageHandler(getWebView());
	}

	// Make the WebView visible.
	showWebView();

	// Set URL (uses experimental port).
	String url = "http://";
	url += mServerAddress + ":4042/index.html";
	lprintfln("downloadHTML: %s", url.c_str());

	// Open the page.
	getWebView()->openURL(url);

	mHasPage = true;

	//Send the Device Screen size to JavaScript
	MAExtent scrSize = maGetScrSize();
	int width = EXTENT_X(scrSize);
	int height = EXTENT_Y(scrSize);
	char buf[512];
	sprintf(
			buf,
			"{mosyncScreenWidth=%d, mosyncScreenHeight = %d;}",
			width,
			height);
	//lprintfln(buf);
	callJS(buf);

	// Initialize PhoneGap.
	mPhoneGapMessageHandler.initializePhoneGap();
	mRunningApp = true;
}

void ReloadClient::downloadBundle()
{
	//Prepare a reciever for the download
	mResourceFile = maCreatePlaceholder();
	//Start the bundle download
	if (mDownloader->isDownloading())
	{
		mDownloader->cancelDownloading();
	}
	int result = mDownloader->beginDownloading(mBundleAddress, mResourceFile);
	if (result > 0)
	{
		LOG("@@@RELOAD: downloadBundle started with result: %d\n", result);

		// Show the loading screen during downloading.
		mLoadingScreen->show();
	}
	else
	{
		LOG("@@@RELOAD: downloadBundle ERROR: %d\n", result);
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
    LOG("@@@RELOAD: finishedDownloading Completed download");

    // Extract the file System.
    int dataSize = maGetDataSize(data);
    lprintfln("Recieved size: %d, expected size: %d", dataSize, mBundleSize);
    if (dataSize < mBundleSize)
    {
    	maDestroyPlaceholder(mResourceFile);

    	// Download again.
    	downloadBundle();

    	return;
    }
    setCurrentFileSystem(data, 0);

    // TODO: Comment what this code does.
    clearAppsFolder();
    char buf[128];
    sprintf(buf, (mAppsFolder + "%d/").c_str(), maGetMilliSecondCount());
    mAppPath = buf;
    lprintfln("App Path:%s", mAppPath.c_str());
    String fullPath = mFileUtil->getLocalPath() + mAppPath;
    int result = MAFS_extractCurrentFileSystem(fullPath.c_str());
    mReloadFile.setLocalPath(fullPath);
    freeCurrentFileSystem();
    maDestroyPlaceholder(mResourceFile);
    if (result > 0)
    {
    	mFileUtil->writeTextToFile(mFileUtil->getLocalPath() + "LastAppDir.txt", mAppPath);

    	// Bundle was extracted, load the new app files.
    	loadSavedApp();
    }
    else
    {
    	// App failed to extract, download it again.
    	downloadBundle();

    	return;
    }
}

/**
 * Loads the HTML files that were extracted last time.
 */
void ReloadClient::loadSavedApp()
{
	if (mFileUtil->openFileForReading(mFileUtil->getLocalPath() + mAppPath + "index.html") < 0)
	{
		maAlert("No App", "No app has been loaded yet", "Back", NULL, NULL);
		return;
	}

	// We do lazy initialization of the NativeUI message handler for the
	// sake of WP7.
	if (mNativeUIMessageHandler == NULL)
	{
		mNativeUIMessageHandler = new NativeUIMessageHandler(getWebView());
	}

	showWebView();

	// Open the page.
	getWebView()->openURL(mAppPath + "index.html");
	mHasPage = true;

	// TODO: Replace this with with new Wormhole protocol.
	// Send the Device Screen size to JavaScript.
	MAExtent scrSize = maGetScrSize();
	int width = EXTENT_X(scrSize);
	int height = EXTENT_Y(scrSize);
	char buf[512];
	sprintf(
		buf,
		"{mosyncScreenWidth=%d, mosyncScreenHeight = %d;}",
		width,
		height);
	lprintfln(buf);
	callJS(buf);

	// Initialize PhoneGap.
	mPhoneGapMessageHandler.initializePhoneGap();

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

	mNativeUIMessageReceived = false;

	// Try stopping all sensors.
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
	mLoginScreen->show(true);
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
	LOG("@@@ RELOAD connectTo: %s", mBuffer);
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
	LOG("@@@ RELOAD: Deleting contents of folder: %s", path);
	MAHandle list = maFileListStart(path, "*", MA_FL_SORT_NONE);
	int length = maFileListNext(list, fileName, 128);
	while(length > 0)
	{
		LOG("@@@ RELOAD: Deleting file: %s", fileName);
		sprintf(fullPath,"%s%s", path, fileName);
		if (fileName[length-1] == '/')
		{
			deleteFolderRecurse(fullPath);
		}
		MAHandle appDirHandle = maFileOpen(fullPath, MA_ACCESS_READ_WRITE);
		if (maFileExists(appDirHandle))
		{
			lprintfln("Deleting file:%s", fileName);
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
