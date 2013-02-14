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
 * @file LoginScreen.h
 *
 *  Created on: Feb 27, 2012
 *      Author: Iraklis Rossis
 */

#ifndef LOGINSCREEN_H_
#define LOGINSCREEN_H_

#include "LoginScreenWidget.h"
#include "ReloadUIListener.h"

class ReloadClient;
class ReloadTabScreen;
class ConnectionScreen;
class WorkspaceScreen;

using namespace MAUtil; // Class Moblet
using namespace NativeUI; // WebView widget.

class LoginScreen : public ReloadUIListener
{
public:
	/**
	 * Constructor.
	 * @param client The ReloadClient that will handle all the reload business logic.
	 */
	LoginScreen(ReloadClient *client);

	~LoginScreen();

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
	virtual void reloadLastAppButtonClicked();

	/**
	 * Called when the info button is clicked.
	 */
	virtual void infoButtonClicked();

private:
	/**
	 * Shows or hides the reload tab screen (containing the connection screen and the
	 * workspace screen).
	 * @param show If true, the reload tab screen is pushed into the main stack screen and poped
	 * 	otherwise.
	 */
	void showTabScreen(bool show);

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
	LoginScreenWidget *mLoginScreen;

	/**
	 * The main application tab screen, containing the ConnectionScreen and the WorkspaceScreen
	 */
	ReloadTabScreen *mReloadTabScreen;

	/**
	 * The connected screen, containing options for reloading last app and
	 * for disconnecting from the server.
	 */
	ConnectionScreen *mConnectionScreen;

	/**
	 * The workspace screen, containing a list with the workspace projects.
	 */
	WorkspaceScreen *mWorkspaceScreen;
};


#endif /* LOGINSCREEN_H_ */
