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

class ReloadClient;

using namespace MAUtil; // Class Moblet
using namespace NativeUI; // WebView widget.

class LoginScreen : public ButtonListener, EditBoxListener
{
public:
	LoginScreen(ReloadClient *client);

	void initializeScreen(MAUtil::String &os);

	/**
	 * Called by the system when the user clicks a button
	 * @param button The button that was clicked
	 */
	void buttonClicked(Widget *button);

	/**
	 * On iOS, it's called when the return button is clicked on
	 * a virtual keyboard
	 * @param editBox The editbox using the virtual keyboard
	 */
	void editBoxReturn(EditBox* editBox);

	/**
	 * Show the login screen in the desired state
	 * @param connected If true, show the "connected" controls
	 */
	void show(bool connected);

	void connectedTo(const char *serverAddress);

	void disconnected();

	void defaultAddress(const char *serverAddress);

private:
	Screen *mLoginScreen;

	ImageButton *mInfoIcon;

	EditBox *mServerIPBox;

	/**
	 * The TextWidgets declared here are instantiated as either
	 * Buttons or ImageButtons depending on the platform
	 */
	TextWidget *mServerConnectButton;

	TextWidget *mServerDisconnectButton;

	TextWidget *mLoadLastAppButton;

	RelativeLayout *mConnectLayout;

	RelativeLayout *mDisconnectLayout;

	Label *mConnectedToLabel;

	ReloadClient *mReloadClient;
};


#endif /* LOGINSCREEN_H_ */
