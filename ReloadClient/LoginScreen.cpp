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
 * @file LoginScreen.cpp
 *
 *  Created on: Feb 27, 2012
 *      Author: Iraklis Rossis
 */

#include "LoginScreen.h"
#include "MainStackScreen.h"

using namespace MAUtil; // Class Moblet
using namespace NativeUI; // WebView widget.

LoginScreen::LoginScreen(ReloadClient *client)
{
	mReloadClient = client;
}

LoginScreen::~LoginScreen()
{
	mLoginScreen->removeLoginScreenListener(this);
}

/**
 * Creates the screen, the layouts, the widgets and positions everything.
 * @param os A string containing the current os.
 * @param orientation One of the values:
 * 		MA_SCREEN_ORIENTATION_LANDSCAPE_LEFT
 * 		MA_SCREEN_ORIENTATION_LANDSCAPE_RIGHT
 * 		MA_SCREEN_ORIENTATION_PORTRAIT
 * 		MA_SCREEN_ORIENTATION_PORTRAIT_UPSIDE_DOWN
 */
void LoginScreen::initializeScreen(MAUtil::String &os, int orientation)
{
	mLoginScreen = new LoginScreenWidget(os, orientation);
	mLoginScreen->addLoginScreenListener(this);

	MainStackScreen::getInstance()->push(mLoginScreen);
	MainStackScreen::getInstance()->show();
}
/**
 * Show the login screen in the connected state
 * with the "connected" controls visible.
 */
void LoginScreen::showConnectedScreen()
{
//	mConnectLayout->setVisible(false);
//	mDisconnectLayout->setVisible(true);
//	mLoginScreen->show();
}

/**
 * Show the login screen in the not connected state.
 */
void LoginScreen::showNotConnectedScreen()
{
//	mConnectLayout->setVisible(true);
//	mDisconnectLayout->setVisible(false);
//	mLoginScreen->show();
}

void LoginScreen::connectedTo(const char *serverAddress)
{
	//Success, show the disconnect controls
	String conTo = "Connected to: ";
	conTo += serverAddress;
//	mConnectedToLabel->setText(conTo.c_str());
//	mConnectLayout->setVisible(false);
//	mDisconnectLayout->setVisible(true);
}

void LoginScreen::disconnected()
{
//	mConnectLayout->setVisible(true);
//	mDisconnectLayout->setVisible(false);
}

void LoginScreen::defaultAddress(const char *serverAddress)
{
//	mServerIPBox->setText(serverAddress);
}

/**
 *
 */
void LoginScreen::connectButtonClicked(String address)
{
//	mReloadClient->connectToServer(address.c_str());
}

/**
 *
 */
void LoginScreen::infoButtonClicked()
{
	//Show the info screen
	maMessageBox("Reload Client Info",mReloadClient->getInfo().c_str());
}
