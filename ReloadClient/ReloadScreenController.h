/* Copyright 2013 David Axmark

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * @file ReloadScreenController.h
 *
 *  Created on: Feb 27, 2012
 *      Author: Iraklis Rossis
 */

#ifndef RELOADSCREENCONTROLLER_H_
#define RELOADSCREENCONTROLLER_H_

#include "LoginLayout.h"
#include "ReloadUIListener.h"
#include "ServerScreen.h"

// Forward Declarations
class ReloadClient;
class ReloadTabScreen;
class ConnectionScreen;
class WorkspaceLayout;
class StoredProjectsScreen;

using namespace MAUtil; // Class Moblet
using namespace NativeUI; // WebView widget.

class ReloadScreenController : public ReloadUIListener
{
public:
	/**
	 * Constructor.
	 * @param client The ReloadClient that will handle all the reload business logic.
	 */
	ReloadScreenController(ReloadClient *client);

	~ReloadScreenController();

	/**
	 * Creates the screen, the layouts, the widgets and positions everything.
	 * @param os A string containing the current os.
	 * @param orientation One of the values:
	 * 		MA_SCREEN_ORIENTATION_LANDSCAPE_LEFT
	 * 		MA_SCREEN_ORIENTATION_LANDSCAPE_RIGHT
	 * 		MA_SCREEN_ORIENTATION_PORTRAIT
	 * 		MA_SCREEN_ORIENTATION_PORTRAIT_UPSIDE_DOWN
	 */
	void initializeScreen(MAUtil::String &os, int orientation);

	/**
	 * Called when the client has connected to the server.
	 * @param serverAddress The server IP address.
	 */
	void connectedTo(const char *serverAddress);

	/**
	 * Called when the client has disconnected from the server.
	 */
	void disconnected();

	/**
	 * Show the login screen in the connected state
	 * with the "connected" controls visible.
	 */
	void showConnectedScreen();

	/**
	 * Show the login screen in the not connected state.
	 */
	void showNotConnectedScreen();

	/**
	 * Sets the default address (will appear inside the connect EditBox).
	 * @param serverAddress The default server address.
	 */
	virtual void defaultAddress();

	/**
	 * Called when selecting a specific server from available server list
	 * @param ipAddress
	 */
	virtual void connectToSelectedServer(MAUtil::String ipAddress);

	/**
	 * Called when the disconnect button is clicked.
	 */
	virtual void disconnectButtonClicked();

	/**
	 * Called when the reload last app button is clicked.
	 */
	virtual void loadStoredProjects();

	/**
	 * Called when the info button is clicked.
	 */
	virtual void infoButtonClicked();

	/**
	 * Called when save project button is clicked for a particular project
	 * @param projectName The name of the project to be saved
	 */
	virtual void saveProjectClicked(MAUtil::String projectName);

	/**
	 * Called when reload project button is clicked for some particular project
	 * @param projectName The name of the project to be reloaded
	 */
	virtual void reloadProjectClicked(MAUtil::String projectName);

	/**
	 * Called when the refresh workspace projects is cliecked.
	 */
	virtual void refreshWorkspaceProjectsButtonClicked();

	/**
	 * Called when on offline mode an reloading a saved project
	 * @param projectName The name of the stored project to be reloaded
	 */
	virtual void launchSavedApp(MAUtil::String projectName);

	/**
	 * If the stack screen has only one screen, the application should exit.
	 * @return true if the application should exit, false otherwise.
	 */
	bool shouldExit();

	/**
	 * Pushes the workspace screen into the main stack.
	 */
	void pushWorkspaceScreen();

	/**
	 * Pops the workspace screen from the stack.
	 */
	void popWorkspaceScreen();

	/**
	 * Updates the workspace screen with new data
	 */
	void updateWorkspaceScreen();

private:
	int mAppLevel;

	ServerScreen * mServerScreen;
	/**
	 * The ReloadClient the handles the business logic of tha application.
	 */
	ReloadClient *mReloadClient;

	/**
	 * A string containing the current operating system.
	 */
	String mOS;

	/**
	 * The login screen containing the connection options and the reload last app option.
	 */
	LoginLayout *mLoginLayout;

	/**
	 * The workspace screen, containing a list with the workspace projects.
	 */
	WorkspaceLayout *mWorkspaceLayout;

	/**
	 * The screen containing projects saved on the device.
	 */
	StoredProjectsScreen *mStoredProjectScreen;

	/**
	 * The modal dialog containing available servers
	 */
	//ServersDialog *mServersDialog;

	//BroadcastHandler *mBroadcastHandler;
};


#endif /* RELOADSCREENCONTROLLER_H_ */
