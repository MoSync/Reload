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

#include "ReloadClient.h"

// Namespaces we want to access.
using namespace MAUtil; // Class Moblet
using namespace NativeUI; // WebView widget.
using namespace Wormhole; // Wormhole library.

ReloadClient::ReloadClient() :
		mSocket(this),
		hasPage(false),
		mPhoneGapMessageHandler(getWebView()),
		mResourceMessageHandler(getWebView()),
		mPort(":7000"),
		mAppsFolder("apps/")
{
	char buffer[64];
	maGetSystemProperty(
				"mosync.device.OS",
				buffer,
				64);
	mOS = buffer;
	mNativeUIMessageHandler = NULL;

	MAHandle appDirHandle = maFileOpen((mFileUtil->getLocalPath() + mAppsFolder).c_str(), MA_ACCESS_READ_WRITE);
	if(!maFileExists(appDirHandle))
	{
		lprintfln("Creating Apps folder:%s", (mFileUtil->getLocalPath() + mAppsFolder).c_str());
		maFileCreate(appDirHandle);
	}
	maFileClose(appDirHandle);

	mLoginScreen = new LoginScreen(this);
	mLoadingScreen = new LoadingScreen(this);

	mLoginScreen->initializeScreen(mOS);
	mLoadingScreen->initializeScreen(mOS);

	bool success = mFileUtil->readTextFromFile(mFileUtil->getLocalPath() + "LastServerAddress.txt",mServerAddress);
	if(!success)
	{
		mServerAddress = "localhost";
	}

	mLoginScreen->defaultAddress(mServerAddress.c_str());

	int size = maGetDataSize(INFO_TEXT);
	if(size > 0)
	{
		char *info = new char[size + 1];
		maReadData(INFO_TEXT, (void*)info, 0, size);
		info[size] = '\0';
		mInfo = info;
		delete info;
	}
	else
	{
		maPanic(0,"Could not read info file");
	}

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
	mLoginScreen->show();

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
	if(mRunningApp)
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
		lprintfln("@@@ MOSYNC: Undefined message protocol");
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
			mPhoneGapMessageHandler.handlePhoneGapMessage(message);
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
			//Forward NativeUI messages to the respective message handler
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
	maWriteLog("@@@ MOSYNC Message:", 19);
	maWriteLog(stringData, dataSize);

	free(stringData);
}

//The socket->connect() operation has finished
void ReloadClient::connectFinished(Connection *conn, int result)
{
	printf("connection result: %d\n", result);
	if(result > 0)
	{
		mLoginScreen->connectedTo(mServerAddress.c_str());
		mSocket.recv(mBuffer,1024);

		//Save the server address
		mFileUtil->writeTextToFile(mFileUtil->getLocalPath() + "LastServerAddress.txt",mServerAddress);

		sendClientDeviceInfo();
	}
	else
	{
		showConErrorMessage(result);
	}
}

//We received a TCP message from the server
void ReloadClient::connRecvFinished(Connection *conn, int result)
{
	lprintfln("recv result: %d\n", result);
	if(result > 0)
	{
		//Null terminate the string message (it's a URL of the .bin bundle)
		mBuffer[result] = '\0';
		sprintf(mBundleAddress,"http://%s:8282%s", mServerAddress.c_str(), mBuffer);
		lprintfln("FileURL:%s\n",mBundleAddress);
		//Reset the app environment (destroy widgets, stop sensors)
        freeHardware();
        downloadBundle();
		//Set the socket to receive the next TCP message
		mSocket.recv(mBuffer, 1024);


	}
	else
	{
		printf("connRecvFinished result %d", result);
		showConErrorMessage(result);
		//Go back to the login screen on an error
		mLoginScreen->show();
	}

}

void ReloadClient::downloadBundle()
{
	//Prepare a reciever for the download
	mResourceFile = maCreatePlaceholder();
	//Start the bundle download
	if(mDownloader->isDownloading())
	{
		mDownloader->cancelDownloading();
	}
	int res = mDownloader->beginDownloading(mBundleAddress, mResourceFile);
	if(res > 0)
	{
		printf("Downloading Started with %d\n", res);
		//Show the loading screen during downloading
		mLoadingScreen->show();
	}
	else
	{
		showConErrorMessage(res);
	}
}


/**
 * Called when a download operation is canceled
 * @param downloader The downloader that was canceled
 */
void ReloadClient::downloadCancelled(Downloader* downloader)
{
    printf("Cancelled");
}

/**
 * Method displays error code in case of error in downloading.
 * @param downloader The downloader that got the error
 * @param code The error code that was returned
 */
void ReloadClient::error(Downloader* downloader, int code)
{
    printf("Error: %d", code);
    showConErrorMessage(code);
}

/**
 * Called when the download is complete
 * @param downloader The downloader who finished it's operation
 * @param data A handle to the data that was downloaded
 */
void ReloadClient::finishedDownloading(Downloader* downloader, MAHandle data)
{
    lprintfln("Completed download");
    //extract the file System
    setCurrentFileSystem(data, 0);
    clearAppsFolder();
    char buf[128];
    sprintf(buf, (mAppsFolder + "%d/").c_str(), maGetMilliSecondCount());
    mAppPath = buf;
    lprintfln("App Path:%s", mAppPath.c_str());
    int result = MAFS_extractCurrentFileSystem((mFileUtil->getLocalPath() + mAppPath).c_str());
    freeCurrentFileSystem();
    maDestroyPlaceholder(mResourceFile);
    if(result > 0)
    {
    	//Bundle was extracted, load the new app files
    	loadSavedApp();
    }
    else
    {
    	//App failed to extract, download it again.
    	downloadBundle();
    }
}

/**
 * Loads the HTML files that were extracted last time.
 */
void ReloadClient::loadSavedApp()
{
	if(mFileUtil->openFileForReading(mFileUtil->getLocalPath() + mAppPath + "index.html") < 0)
	{
		maAlert("No App", "No app has been loaded yet", "Back", NULL, NULL);
		return;
	}
	//We do lazy initialization of the NativeUI message handler for the
	//sake of WP7
	if(mNativeUIMessageHandler == NULL)
	{
		mNativeUIMessageHandler = new NativeUIMessageHandler(getWebView());
	}
	showWebView();
	// Open the page.
	getWebView()->openURL(mAppPath + "index.html");
	hasPage = true;
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
	if(hasPage)
	{
		//Currently crashes
		//callJS("try {mosync.nativeui.destroyAll()}catch(err){}");
	}
	//Try stopping all sensors
	for(int i= 1; i<=6; i++)
	{
		maSensorStop(i);
	}
	//getWebView()->openURL("justadummyhtmlfiletofoolthecacheinios5.html");
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
			"\"type\":\"deviceInfo\","
			"\"platform\":\"%s\","
			"\"name\":\"%s\","
			"\"uuid\":\"%s\","
			"\"version\":\"%s\","
			"\"phonegap\":\"1.2.0\""
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
	String errorMessages[] = {
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
	maAlert("Error", errorMessages[-errorCode].c_str(), "OK", NULL, NULL);
}

void ReloadClient::cancelDownload()
{
	mDownloader->cancelDownloading();
	mLoginScreen->show();
}

void ReloadClient::connectTo(const char *serverAddress)
{
	//User tries to connect, reset the socket and start a new connection
	mSocket.close();
	mServerAddress = serverAddress;
	//Add the port number to the IP
	sprintf(mBuffer,"socket://%s", (mServerAddress + mPort).c_str());
	lprintfln(mBuffer);
	mSocket.connect(mBuffer);
}

void ReloadClient::disconnect()
{
	//Close the socket, and show the connect controls again
	mSocket.close();
	mLoginScreen->disconnected();
}

void ReloadClient::clearAppsFolder()
{
	deleteFolderRecurse((mFileUtil->getLocalPath() + mAppsFolder).c_str());
	/*MAHandle appDirHandle = maFileOpen(path, MA_ACCESS_READ_WRITE);
	if(maFileExists(appDirHandle))
	{
		lprintfln("Deleting folder:%s", path);
		maFileDelete(appDirHandle);
	}
	maFileClose(appDirHandle);*/
}

void ReloadClient::deleteFolderRecurse(const char *path)
{
	char fileName[128];
	char fullPath[256];
	lprintfln("Deleting contents of folder:%s", path);
	MAHandle list = maFileListStart(path, "*", MA_FL_SORT_NONE);
	int length = maFileListNext(list, fileName, 128);
	while(length > 0)
	{
		lprintfln("Filename:%s", fileName);
		sprintf(fullPath,"%s%s", path, fileName);
		if(fileName[length-1] == '/')
		{
			deleteFolderRecurse(fullPath);
		}
		MAHandle appDirHandle = maFileOpen(fullPath, MA_ACCESS_READ_WRITE);
		if(maFileExists(appDirHandle))
		{
			lprintfln("Deleting file:%s", fileName);
			maFileDelete(appDirHandle);
		}
		maFileClose(appDirHandle);
		length = maFileListNext(list, fileName, 128);
	}
	maFileListClose(list);
}
