/*
Copyright (C) 2013 MoSync AB

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
 * @file ReloadScreenController.h
 *
 *  Created on: Feb 27, 2012
 *      Author: Iraklis Rossis
 */

#ifndef RELOADSCREENCONTROLLER_H_
#define RELOADSCREENCONTROLLER_H_

#include "View/LoginScreen.h"
#include "View/ReloadUIListener.h"

class ReloadClient;
class ReloadTabScreen;
class ConnectionScreen;
class WorkspaceScreen;
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
	void defaultAddress(const char *serverAddress);

	/**
	 * Called when the connect button is clicked.
	 * @param address The address contained by the connect EditBox.
	 */
	virtual void connectButtonClicked(String address);

	/**
	 * Called when the disconnect button is clicked.
	 */
	virtual void disconnectButtonClicked();

	/**
	 * Called when the reload last app button is clicked.
	 */
	virtual void loadStoredProjectsButtonClicked();

	/**
	 * Called when the info button is clicked.
	 */
	virtual void infoButtonClicked();

	/**
	 * Called when reload project button is clicked for some particular project
	 */
	virtual void reloadProjectClicked(MAUtil::String projectName);

	/**
	 * Called when the refresh workspace projects is cliecked.
	 */
	virtual void refreshWorkspaceProjectsButtonClicked();

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
	LoginScreen *mLoginScreen;

	/**
	 * The workspace screen, containing a list with the workspace projects.
	 */
	WorkspaceScreen *mWorkspaceScreen;

	/**
	 * The screen containing projects saved on the device.
	 */
	StoredProjectsScreen *mStoredProjectScreen;
};


#endif /* RELOADSCREENCONTROLLER_H_ */
