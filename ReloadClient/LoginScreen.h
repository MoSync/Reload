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
#include "LoginScreenListener.h"

class ReloadClient;

using namespace MAUtil; // Class Moblet
using namespace NativeUI; // WebView widget.

class LoginScreen : public ButtonListener, EditBoxListener, LoginScreenListener
{
	void rebuildScreenLayout(int screenHeight, int screenWidth, String os, int orientation);
public:
	LoginScreen(ReloadClient *client);

	~LoginScreen();

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
	 * This method is called the orientation changes
	 * @param newOrientation The new screen orientation. One of the values: MA_SCREEN_ORIENTATION_PORTRAIT,
	 * MA_SCREEN_ORIENTATION_PORTRAIT_UPSIDE_DOWN, MA_SCREEN_ORIENTATION_LANDSCAPE_LEFT, MA_SCREEN_ORIENTATION_LANDSCAPE_RIGHT.
	 * @param newScreenHeight The new screen height after orientation has changed.
	 * @param newScreenWidth The new screen width after oritentation has changed.
	 */
	virtual void orientationChanged(int newOrientation, int newScreenHeight, int newScreenWidth);

private:
	LoginScreenWidget *mLoginScreen;

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

	Label *mServerIPLabel;

	Label *mInstructionsLabel;

	Image* mLogo;

	Image* mMosynclogo;

	Image *mBackground;

	RelativeLayout* mMainLayout;

	ReloadClient *mReloadClient;

	MAUtil::String mOS;
};


#endif /* LOGINSCREEN_H_ */
