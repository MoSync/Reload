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

#include "ReloadClient.h"
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
	 * Show the login screen in the connected state
	 * with the "connected" controls visible.
	 */
	void showConnectedScreen();

	/**
	 * Show the login screen in the not connected state.
	 */
	void showNotConnectedScreen();

	void connectedTo(const char *serverAddress);

	void disconnected();

	void defaultAddress(const char *serverAddress);

	/**
	 *
	 */
	virtual void connectButtonClicked(String address);

	/**
	 *
	 */
	virtual void infoButtonClicked();

	/**
	 *
	 */
	virtual void disconnectButtonClicked();

	/**
	 *
	 */
	virtual void reloadLastAppButtonClicked();
private:
	/**
	 *
	 */
	void showTabScreen(bool show);

private:
	ReloadClient *mReloadClient;

	String mOS;

	LoginScreenWidget *mLoginScreen;

	ConnectionScreen *mConnectionScreen;

	ReloadTabScreen *mReloadTabScreen;

	WorkspaceScreen *mWorkspaceScreen;
};


#endif /* LOGINSCREEN_H_ */
