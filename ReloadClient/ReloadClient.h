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
 * @file ReloadClient.h
 *
 *  Created on: Feb 27, 2012
 *      Author: Ali Sarrafi, Iraklis Rossis
 */

#ifndef RELOADCLIENT_H_
#define RELOADCLIENT_H_

#include <Wormhole/HybridMoblet.h>
#include <Wormhole/MessageProtocol.h>
#include <Wormhole/MessageStream.h>
#include <Wormhole/Libs/JSONMessage.h>
#include <Wormhole/Libs/PhoneGap/PhoneGapMessageHandler.h>
#include <Wormhole/Libs/JSNativeUI/NativeUIMessageHandler.h>
#include <Wormhole/Libs/JSNativeUI/ResourceMessageHandler.h>
#include <NativeUI/Widgets.h>
#include <MAUtil/Connection.h>
#include <wchar.h>
#include "MAHeaders.h"
#include <MAUtil/Downloader.h>
#include <MAFS/File.h>		// Library for file system bundles

#include "LoginScreen.h"
#include "LoadingScreen.h"
#include "ReloadFile.h"

#include <yajl/YAJLDom.h>

class LoginScreen;
class LoadingScreen;

// Namespaces we want to access.
using namespace MAUtil; // Class Moblet
using namespace NativeUI; // WebView widget.
using namespace Wormhole; // Wormhole library.
using namespace MAUtil::YAJLDom; //Json Parser

/**
 * The application class.
 */
class ReloadClient :
	public HybridMoblet,
	public ConnectionListener,
	public DownloadListener,
	public LogMessageListener
{
public:
	ReloadClient();
	virtual ~ReloadClient();

	void initializeWebView();
	void initializeVariables();
	void initializeFiles();
	void createMessageHandlers();
	void createDownloader();
	void createScreens();

	/**
	 * This method is called when a key is pressed.
	 * Forwards the event to PhoneGapMessageHandler.
	 */
	void keyPressEvent(int keyCode, int nativeCode);

	/**
	 * Called from JavaScript when a Wormhole app has been loaded.
	 */
	void openWormhole(MAHandle webViewHandle);

	//The socket->connect() operation has finished
	void connectFinished(Connection *conn, int result);

	//We received a TCP message from the server
	void connRecvFinished(Connection *conn, int result) {}

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
	void getMessageCommandAndSize(
		char* buffer,
		int& command,
		int& size);

	/**
	 * Process a JSON message
	 */
	void processJSONMessage(const MAUtil::String& jsonString);

	void downloadHTML();

	//Download the bundle
	void downloadBundle();

    /**
     * Called when a download operation is canceled
     * @param downloader The downloader that was canceled
     */
    void downloadCancelled(Downloader* downloader);

    /**
     * Method displays error code in case of error in downloading.
     * @param downloader The downloader that got the error
     * @param code The error code that was returned
     */
    void error(Downloader* downloader, int code);

    /**
     * Called when the download is complete
     * @param downloader The downloader who finished it's operation
     * @param data A handle to the data that was downloaded
     */
    void finishedDownloading(Downloader* downloader, MAHandle data);

    /**
     * Loads the HTML files that were extracted last time.
     */
    void loadSavedApp();

    /**
     * Resets the client (destroys widgets and stops sensors)
     * in preparation for a new app
     */
    void freeHardware();

    /**
     * Get client info.
     * @return String with client info.
     */
	MAUtil::String getInfo();

    /**
     * Sends information about the device to the server
     */
    void sendClientDeviceInfo();

    /**
     * This method handles any connection error messages
     * @param errorCode The error code that was returned
     */
    void showConErrorMessage(int errorCode);

    void cancelDownload();

    void connectTo(const char *serverAddress);

    void disconnect();

	void connWriteFinished(Connection *conn, int result) {}

	void connReadFinished(Connection *conn, int result);

	void clearAppsFolder();

	void deleteFolderRecurse(const char *path);

	/**
	 * Set the url to be used for remote log messages.
	 * @param url The url to use for the remote logging service,
	 * for example: "http://localhost:8282/log/"
	 */
	void setRemoteLogURL(const MAUtil::String& url);

	/**
	 * Method in interface LogMessageListener.
	 */
	void onLogMessage(const char* message, const char* url);

	/**
	 * This method parses and stores the JSON data received from server
	 * @param jsonMessage The JSON message received from the server
	 */
	void parseJsonClientMessage(MAUtil::String jsonMessage);

private:
	/**
	 * The TCP socket used for registering with the server
	 * and listening for commands from the server.
	 */
	Connection mSocket;

	/**
	 * TODO: Document what this variable is used for.
	 */
	bool mHasPage;

	/**
	 * Buffer for TCP messages.
	 * TODO: Should be allocated dynamically,
	 * based on message size.
	 */
	char mBuffer[4096];

	/**
	 * Buffer for the bundle address.
	 */
	char mBundleAddress[512];

	/**
	 * Buffer for the bundle address.
	 */
	int mBundleSize;

	/**
	 * Server Message Command Size.
	 */
	int mServerCommand;

	/**
	 * Server Message Size.
	 */
	int mServerMessageSize;

	/**
	 * A pointer to a JSON Message Received from the server.
	 */
	Value* serverMessageJSONRoot;

	/**
	 * Class that handles the Login Screen UI.
	 */
	LoginScreen *mLoginScreen;

	/**
	 * Class that handles the Loading screen UI.
	 */
	LoadingScreen *mLoadingScreen;

	/**
	 * Custom handler for PhoneGap File API messages.
	 */
	ReloadFileHandler* mReloadFileHandler;

	/**
	 * true when an app is running, false if on the login screen.
	 */
	bool mRunningApp;

	/**
	 * Used to download the app bundles.
	 */
	Downloader *mDownloader;

	/**
	 * A placeholder that holds the bundle as it's
	 * being downloaded.
	 */
	MAHandle mResourceFile;

	/**
	 * The platform the client is running on.
	 */
	String mOS;

	/**
	 * The client information (version, timestamp).
	 */
	String mInfo;

	/**
	 * The address of the server we are connected to.
	 */
	String mServerAddress;

	/**
	 * The TCP port we are connecting to.
	 */
	String mPort;

	bool mNativeUIMessageReceived;

	/**
	 * The general folder where app files reside.
	 */
	String mAppsFolder;

	/**
	 * The relative path to the downloaded app folder.
	 */
	String mAppPath;

};

#endif /* RELOADCLIENT_H_ */
