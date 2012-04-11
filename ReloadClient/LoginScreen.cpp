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

using namespace MAUtil; // Class Moblet
using namespace NativeUI; // WebView widget.

LoginScreen::LoginScreen(ReloadClient *client)
{
	mReloadClient = client;
}

void LoginScreen::initializeScreen(MAUtil::String &os)
{
	maScreenSetFullscreen(1);
	MAExtent ex = maGetScrSize();
	int screenWidth = EXTENT_X(ex);
	int screenHeight = EXTENT_Y(ex);

	int centerH = screenWidth / 2;
	int buttonWidth = screenWidth * 0.75;
	if(screenHeight > 1000)
	{
		buttonWidth = screenWidth * 0.4;
	}
	int buttonHeight = screenWidth * 0.15;
	if(screenHeight > 1000)
	{
		buttonHeight = screenWidth * 0.07;
	}
	int buttonSpacing = buttonHeight * 0.3;
	if(os.find("Windows", 0) >= 0)
	{
		buttonSpacing = buttonHeight * 0.1;
	}
	int editBoxHeight = screenHeight * 0.07;
	if(screenHeight > 1000)
	{
		editBoxHeight = screenHeight * 0.02;
	}
	int logoWidth = screenWidth * 0.75;
	int layoutTop = screenHeight * 0.3;
	if(screenHeight > 1000)
	{
		layoutTop = screenHeight * 0.25;
	}
	int labelHeight = screenHeight * 0.05;
	if(screenHeight > 1000)
	{
		labelHeight = screenHeight * 0.025;
	}
	int labelWidth = screenWidth;
	int labelSpacing = screenHeight * 0.02;
	if(screenHeight > 1000)
	{
		labelSpacing = labelSpacing * 0.01;
	}
	int layoutHeight = (buttonHeight + buttonSpacing) * 2;
	int ipBoxButtonSpacing = screenHeight * 0.03;

	mLoginScreen = new Screen();

	//The reload Logo
	Image* logo = new Image();
	logo->setImage(LOGO_IMAGE);
	logo->wrapContentHorizontally();
	logo->wrapContentVertically();
	logo->setWidth(logoWidth);
	logo->setScaleMode(IMAGE_SCALE_PRESERVE_ASPECT);
	logo->setPosition(centerH - logoWidth/2, screenHeight / 12);

	//The connect to server button
	if(os == "iPhone OS") //Android image buttons do not support text
	{
		mServerConnectButton = new ImageButton();
		((ImageButton*)mServerConnectButton)->addButtonListener(this);
		((ImageButton*)mServerConnectButton)->setBackgroundImage(CONNECT_BG);
		mServerConnectButton->setFontColor(0x000000);
	}
	else
	{
		mServerConnectButton = new Button();
		((Button*)mServerConnectButton)->addButtonListener(this);
	}

	mServerConnectButton->setText("Connect");
	mServerConnectButton->setTextHorizontalAlignment(MAW_ALIGNMENT_CENTER);
	mServerConnectButton->setTextVerticalAlignment(MAW_ALIGNMENT_CENTER);
	mServerConnectButton->setWidth(buttonWidth);
	mServerConnectButton->setHeight(buttonHeight);
	mServerConnectButton->setPosition(centerH - buttonWidth/2, layoutHeight - buttonHeight);

	//The edit box that receives the server IP
	mServerIPBox = new EditBox();
	mServerIPBox->setWidth(buttonWidth);
	//mServerIPBox->setHeight(editBoxHeight);
	mServerIPBox->addEditBoxListener(this);
	mServerIPBox->setPosition(centerH - buttonWidth/2,layoutHeight - buttonHeight - editBoxHeight - ipBoxButtonSpacing);

	//Label for the server IP edit box
	Label *serverIPLabel = new Label();
	serverIPLabel->setText("Server IP:");
	serverIPLabel->setFontColor(0xFFFFFF);
	serverIPLabel->setTextHorizontalAlignment(MAW_ALIGNMENT_CENTER);
	serverIPLabel->setTextVerticalAlignment(MAW_ALIGNMENT_CENTER);
	serverIPLabel->setWidth(labelWidth);
	serverIPLabel->setPosition(centerH - labelWidth/2, layoutHeight - buttonHeight - labelHeight - editBoxHeight - ipBoxButtonSpacing);


	/*
	 * The mConnectLayout and mDisconnectLayout are placed
	 * on top of each other inside a relative layout, and
	 * each is only shown when needed.
	 */
	mConnectLayout = new RelativeLayout();
	mConnectLayout->setWidth(screenWidth);
	mConnectLayout->setHeight(layoutHeight);
	mConnectLayout->addChild(serverIPLabel);
	mConnectLayout->addChild(mServerIPBox);
	mConnectLayout->addChild(mServerConnectButton);
	mConnectLayout->setPosition(0, layoutTop);

	//The disconnect button
	if(os == "iPhone OS")
	{
		mServerDisconnectButton = new ImageButton();
		((ImageButton*)mServerDisconnectButton)->addButtonListener(this);
		((ImageButton*)mServerDisconnectButton)->setBackgroundImage(CONNECT_BG);
		mServerDisconnectButton->setFontColor(0x000000);
	}
	else
	{
		mServerDisconnectButton = new Button();
		((Button*)mServerDisconnectButton)->addButtonListener(this);
	}


	mServerDisconnectButton->setText("Disconnect");
	mServerDisconnectButton->setTextHorizontalAlignment(MAW_ALIGNMENT_CENTER);
	mServerDisconnectButton->setTextVerticalAlignment(MAW_ALIGNMENT_CENTER);
	mServerDisconnectButton->setWidth(buttonWidth);
	mServerDisconnectButton->setHeight(buttonHeight);
	mServerDisconnectButton->setPosition(centerH - buttonWidth/2, layoutHeight - buttonHeight);

	//Some instructions for the user
	Label *instructionsLabel = new Label();
	instructionsLabel->setText("Use the HTML Interface to load an app");
	instructionsLabel->setFontColor(0xFFFFFF);
	instructionsLabel->setWidth(labelWidth);
	instructionsLabel->setMaxNumberOfLines(2);
	instructionsLabel->setTextHorizontalAlignment(MAW_ALIGNMENT_CENTER);
	instructionsLabel->setTextVerticalAlignment(MAW_ALIGNMENT_CENTER);
	instructionsLabel->setPosition(centerH - labelWidth/2, layoutHeight - buttonHeight - labelHeight - ipBoxButtonSpacing);

	//Label with the Server IP
	mConnectedToLabel = new Label();
	mConnectedToLabel->setFontColor(0xFFFFFF);
	mConnectedToLabel->setWidth(labelWidth);
	mConnectedToLabel->setTextHorizontalAlignment(MAW_ALIGNMENT_CENTER);
	mConnectedToLabel->setTextVerticalAlignment(MAW_ALIGNMENT_CENTER);
	mConnectedToLabel->setPosition(centerH - labelWidth/2, layoutHeight - buttonHeight - labelHeight * 2 - labelSpacing - ipBoxButtonSpacing);

	/*
	 * The mConnectLayout and mDisconnectLayout are placed
	 * on top of each other inside a relative layout, and
	 * each is only shown when needed.
	 */
	mDisconnectLayout = new RelativeLayout();
	mDisconnectLayout->setWidth(screenWidth);
	mDisconnectLayout->setHeight(layoutHeight);
	mDisconnectLayout->addChild(mConnectedToLabel);
	mDisconnectLayout->addChild(instructionsLabel);
	mDisconnectLayout->addChild(mServerDisconnectButton);
	mDisconnectLayout->setPosition(0, layoutTop);

	//The layout that appears when the client is connected
	//is hidden on startup
	mDisconnectLayout->setVisible(false);

	//Button that loads the last loaded app
	if(os == "iPhone OS")
	{
		mLoadLastAppButton = new ImageButton();
		((ImageButton*)mLoadLastAppButton)->addButtonListener(this);
		((ImageButton*)mLoadLastAppButton)->setBackgroundImage(RELOAD_BG);
		mLoadLastAppButton->setFontColor(0x000000);
	}
	else
	{
		mLoadLastAppButton = new Button();
		((Button*)mLoadLastAppButton)->addButtonListener(this);
	}


	mLoadLastAppButton->setText("Reload last app");
	mLoadLastAppButton->setTextHorizontalAlignment(MAW_ALIGNMENT_CENTER);
	mLoadLastAppButton->setTextVerticalAlignment(MAW_ALIGNMENT_CENTER);
	mLoadLastAppButton->setWidth(buttonWidth);
	mLoadLastAppButton->setHeight(buttonHeight);
	mLoadLastAppButton->setPosition(centerH - buttonWidth/2, layoutTop + layoutHeight + buttonSpacing);

	//The info icon
	mInfoIcon = new ImageButton();
	mInfoIcon->addButtonListener(this);
	mInfoIcon->setBackgroundImage(INFO_ICON);
	mInfoIcon->setSize((int)(screenWidth * 0.1),(int)(screenWidth * 0.1));
	//mInfoIcon->setScaleMode(IMAGE_SCALE_PRESERVE_ASPECT);
	mInfoIcon->setPosition((int)(screenWidth * 0.85), (int)(screenHeight * 0.95) - (int)(screenWidth * 0.1) / 2);

	//A little MoSync logo at the lower right of the screen
	Image* mosynclogo = new Image();
	mosynclogo->setImage(MOSYNC_IMAGE);
	mosynclogo->setHeight((int)(screenWidth * 0.1));
	mosynclogo->setScaleMode(IMAGE_SCALE_PRESERVE_ASPECT);
	mosynclogo->setPosition((int)(screenWidth * 0.05),(int)(screenHeight * 0.95) - (int)(screenWidth * 0.1) / 2);

	Image *background = new Image();
	background->setSize(screenWidth, screenHeight);
	background->setImage(BACKGROUND);
	background->setScaleMode(IMAGE_SCALE_XY);

	RelativeLayout *mainLayout = new RelativeLayout();
	mainLayout->setSize(screenWidth, screenHeight);
	if(os.find("Windows", 0) < 0)
	{
		mainLayout->addChild(background);
	}
	mainLayout->addChild(logo);
	mainLayout->addChild(mConnectLayout);
	mainLayout->addChild(mDisconnectLayout);
	mainLayout->addChild(mLoadLastAppButton);
	mainLayout->addChild(mosynclogo);
	mainLayout->addChild(mInfoIcon);

	mLoginScreen->setMainWidget(mainLayout);
}

void LoginScreen::show()
{
	mLoginScreen->show();
}

/**
 * On iOS, it's called when the return button is clicked on
 * a virtual keyboard
 * @param editBox The editbox using the virtual keyboard
 */
void LoginScreen::editBoxReturn(EditBox* editBox)
{
	editBox->hideKeyboard();
}

/**
 * Called by the system when the user clicks a button
 * @param button The button that was clicked
 */
void LoginScreen::buttonClicked(Widget *button)
{
	if(button == mServerConnectButton)
	{
		mReloadClient->connectTo(mServerIPBox->getText().c_str());
		mServerIPBox->hideKeyboard(); //Needed for iOS
	}
	else if(button == mServerDisconnectButton)
	{
		mReloadClient->disconnect();
	}
	else if(button == mLoadLastAppButton)
	{
		//Just load whatever app we have already extracted
		mReloadClient->loadSavedApp();
	}
	else if(button == mInfoIcon)
	{
		//Show the info screen
		maMessageBox("Reload Client Info",mReloadClient->getInfo().c_str());
	}
}

void LoginScreen::connectedTo(const char *serverAddress)
{
	//Success, show the disconnect controls
	String conTo = "Connected to: ";
	conTo += serverAddress;
	mConnectedToLabel->setText(conTo.c_str());
	mConnectLayout->setVisible(false);
	mDisconnectLayout->setVisible(true);
}

void LoginScreen::disconnected()
{
	mConnectLayout->setVisible(true);
	mDisconnectLayout->setVisible(false);
}

void LoginScreen::defaultAddress(const char *serverAddress)
{
	mServerIPBox->setText(serverAddress);
}

