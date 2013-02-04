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

LoginScreen::~LoginScreen()
{
	mLoginScreen->removeLoginScreenListener(this);
}

void LoginScreen::initializeScreen(MAUtil::String &os, int orientation)
{
	// set the os string
	mOS = os;

	maScreenSetFullscreen(1);
	MAExtent ex = maGetScrSize();
	int screenWidth = EXTENT_X(ex);
	int screenHeight = EXTENT_Y(ex);

	int centerH, buttonWidth, buttonHeight, buttonSpacing, editBoxHeight, logoWidth,
		layoutTop, labelHeight, labelWidth, labelSpacing, layoutHeight, ipBoxButtonSpacing;
	centerH = screenWidth / 2;

	bool isLandscape = false;
	if (orientation == MA_SCREEN_ORIENTATION_LANDSCAPE_LEFT ||
		orientation == MA_SCREEN_ORIENTATION_LANDSCAPE_RIGHT)
	{
		isLandscape = true;
	}

	buttonWidth = (int)((float)screenWidth * 0.75);
	if (isLandscape)
	{
		buttonHeight = (int)((float)screenHeight * 0.15);
	}
	else
	{
		buttonHeight = (int)((float)screenWidth * 0.15);
	}
	if(screenHeight > 1000 && os.find("Android", 0) < 0)
	{
		buttonWidth = (int)((float)screenWidth * 0.4);
	}
	if(screenHeight > 1000 && os.find("Android", 0) < 0)
	{
		buttonHeight = (int)((float)screenWidth * 0.07);
	}
	buttonSpacing = (int)((float)buttonHeight * 0.3);
	if(os.find("Windows", 0) >= 0)
	{
		buttonSpacing = (int)((float)buttonHeight * 0.1);
	}
	editBoxHeight = (int)((float)screenHeight * 0.07);
	if(screenHeight > 1000  && os.find("Android", 0) < 0)
	{
		editBoxHeight = (int)((float)screenHeight * 0.02);
	}
	logoWidth = (int)((float)screenWidth * 0.75);
	layoutTop = (int)((float)screenHeight * 0.3);
	if(screenHeight > 1000  && os.find("Android", 0) < 0)
	{
		layoutTop = (int)((float)screenHeight * 0.25);
	}
	labelHeight = (int)((float)screenHeight * 0.05);
	if(screenHeight > 1000  && os.find("Android", 0) < 0)
	{
		labelHeight = (int)((float)screenHeight * 0.025);
	}
	labelWidth = screenWidth;
	if(os.find("Android", 0) >= 0)
	{
		labelWidth = buttonWidth;
	}
	labelSpacing = (int)((float)screenHeight * 0.02);
	if(screenHeight > 1000  && os.find("Android", 0) < 0)
	{
		labelSpacing = (int)((float)labelSpacing * 0.01);
	}
	layoutHeight = (buttonHeight + buttonSpacing) * 2;
	ipBoxButtonSpacing = (int)((float)screenHeight * 0.03);

	mLoginScreen = new LoginScreenWidget();
	mLoginScreen->addLoginScreenListener(this);

	//The reload Logo
	mLogo = new Image();
	mLogo->setImage(LOGO_IMAGE);
	mLogo->wrapContentHorizontally();
	mLogo->wrapContentVertically();
	mLogo->setWidth(logoWidth);
	mLogo->setScaleMode(IMAGE_SCALE_PRESERVE_ASPECT);
	mLogo->setPosition(centerH - logoWidth/2, screenHeight / 12);

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
	mServerIPLabel = new Label();
	mServerIPLabel->setText("Server IP:");
	mServerIPLabel->setFontColor(0xFFFFFF);
	mServerIPLabel->setTextHorizontalAlignment(MAW_ALIGNMENT_CENTER);
	mServerIPLabel->setTextVerticalAlignment(MAW_ALIGNMENT_CENTER);
	mServerIPLabel->setWidth(labelWidth);
	mServerIPLabel->setPosition(centerH - labelWidth/2, layoutHeight - buttonHeight - labelHeight - editBoxHeight - ipBoxButtonSpacing);

	/*
	 * The mConnectLayout and mDisconnectLayout are placed
	 * on top of each other inside a relative layout, and
	 * each is only shown when needed.
	 */
	mConnectLayout = new RelativeLayout();
	mConnectLayout->setWidth(screenWidth);
	mConnectLayout->setHeight(layoutHeight);
	mConnectLayout->addChild(mServerIPLabel);
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
	mInstructionsLabel = new Label();
	mInstructionsLabel->setText("Use the Reload Web UI to load an app");
	mInstructionsLabel->setFontColor(0xFFFFFF);
	mInstructionsLabel->setWidth(labelWidth);
	mInstructionsLabel->setMaxNumberOfLines(2);
	mInstructionsLabel->setTextHorizontalAlignment(MAW_ALIGNMENT_CENTER);
	mInstructionsLabel->setTextVerticalAlignment(MAW_ALIGNMENT_CENTER);
	mInstructionsLabel->setPosition(centerH - labelWidth/2, layoutHeight - buttonHeight - labelHeight - ipBoxButtonSpacing);

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
	mDisconnectLayout->addChild(mInstructionsLabel);
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
	mMosynclogo = new Image();
	mMosynclogo->setImage(MOSYNC_IMAGE);
	mMosynclogo->setHeight((int)(screenWidth * 0.1));
	mMosynclogo->setScaleMode(IMAGE_SCALE_PRESERVE_ASPECT);
	mMosynclogo->setPosition((int)(screenWidth * 0.05),(int)(screenHeight * 0.95) - (int)(screenWidth * 0.1) / 2);

	mBackground = new Image();
	mBackground->setSize(screenWidth, screenHeight);
	mBackground->setImage(BACKGROUND);
	mBackground->setScaleMode(IMAGE_SCALE_XY);

	mMainLayout = new RelativeLayout();
	mMainLayout->setSize(screenWidth, screenHeight);
	if(os.find("Windows", 0) < 0)
	{
		mMainLayout->addChild(mBackground);
	}
	mMainLayout->addChild(mLogo);
	mMainLayout->addChild(mConnectLayout);
	mMainLayout->addChild(mDisconnectLayout);
	mMainLayout->addChild(mLoadLastAppButton);
	mMainLayout->addChild(mMosynclogo);
	mMainLayout->addChild(mInfoIcon);

	mLoginScreen->setMainWidget(mMainLayout);
}

void LoginScreen::rebuildScreenLayout(int screenHeight, int screenWidth, MAUtil::String os, int orientation)
{
	// on wp7 the layout changes look glitchy so we'll set the layout after all the
	// repositioning has been done
	mLoginScreen->setMainWidget(NULL);

	int centerH, buttonWidth, buttonHeight, buttonSpacing, editBoxHeight, logoWidth,
		layoutTop, labelHeight, labelWidth, labelSpacing, layoutHeight, ipBoxButtonSpacing;
	centerH = screenWidth / 2;

	bool isLandscape = false;
	if (orientation == MA_SCREEN_ORIENTATION_LANDSCAPE_LEFT ||
		orientation == MA_SCREEN_ORIENTATION_LANDSCAPE_RIGHT)
	{
		isLandscape = true;
	}

	buttonWidth = (int)((float)screenWidth * 0.75);
	if (isLandscape)
	{
		buttonHeight = (int)((float)screenHeight * 0.15);
	}
	else
	{
		buttonHeight = (int)((float)screenWidth * 0.15);
	}
	if(screenHeight > 1000 && os.find("Android", 0) < 0)
	{
		buttonWidth = (int)((float)screenWidth * 0.4);
	}
	if(screenHeight > 1000 && os.find("Android", 0) < 0)
	{
		buttonHeight = (int)((float)screenWidth * 0.07);
	}
	buttonSpacing = (int)((float)buttonHeight * 0.3);
	if(os.find("Windows", 0) >= 0)
	{
		buttonSpacing = (int)((float)buttonHeight * 0.1);
	}
	editBoxHeight = (int)((float)screenHeight * 0.07);
	if(screenHeight > 1000  && os.find("Android", 0) < 0)
	{
		editBoxHeight = (int)((float)screenHeight * 0.02);
	}
	logoWidth = (int)((float)screenWidth * 0.75);
	layoutTop = (int)((float)screenHeight * 0.3);
	if(screenHeight > 1000  && os.find("Android", 0) < 0)
	{
		layoutTop = (int)((float)screenHeight * 0.25);
	}
	labelHeight = (int)((float)screenHeight * 0.05);
	if(screenHeight > 1000  && os.find("Android", 0) < 0)
	{
		labelHeight = (int)((float)screenHeight * 0.025);
	}
	labelWidth = screenWidth;
	if(os.find("Android", 0) >= 0)
	{
		labelWidth = buttonWidth;
	}
	labelSpacing = (int)((float)screenHeight * 0.02);
	if(screenHeight > 1000  && os.find("Android", 0) < 0)
	{
		labelSpacing = (int)((float)labelSpacing * 0.01);
	}
	layoutHeight = (buttonHeight + buttonSpacing) * 2;
	ipBoxButtonSpacing = (int)((float)screenHeight * 0.03);

	mLogo->setWidth(logoWidth);
	mLogo->setPosition(centerH - logoWidth/2, screenHeight / 12);

	mServerConnectButton->setWidth(buttonWidth);
	mServerConnectButton->setHeight(buttonHeight);

	mServerIPBox->setWidth(buttonWidth);
	mServerIPBox->setPosition(centerH - buttonWidth/2,layoutHeight - buttonHeight - editBoxHeight - ipBoxButtonSpacing);

	mServerIPLabel->setWidth(labelWidth);
	mServerIPLabel->setPosition(centerH - labelWidth/2, layoutHeight - buttonHeight - labelHeight - editBoxHeight - ipBoxButtonSpacing);

	mConnectLayout->setWidth(screenWidth);
	mConnectLayout->setHeight(layoutHeight);
	mConnectLayout->setPosition(0, layoutTop);

	mServerDisconnectButton->setWidth(buttonWidth);
	mServerDisconnectButton->setHeight(buttonHeight);

	mInstructionsLabel->setWidth(labelWidth);
	mInstructionsLabel->setPosition(centerH - labelWidth/2, layoutHeight - buttonHeight - labelHeight - ipBoxButtonSpacing);

	mConnectedToLabel->setWidth(labelWidth);
	mConnectedToLabel->setPosition(centerH - labelWidth/2, layoutHeight - buttonHeight - labelHeight * 2 - labelSpacing - ipBoxButtonSpacing);

	mDisconnectLayout->setWidth(screenWidth);
	mDisconnectLayout->setHeight(layoutHeight);
	mDisconnectLayout->setPosition(0, layoutTop);

	mLoadLastAppButton->setWidth(buttonWidth);
	mLoadLastAppButton->setHeight(buttonHeight);
	mLoadLastAppButton->setPosition(centerH - buttonWidth/2, layoutTop + layoutHeight + buttonSpacing);

	mInfoIcon->setPosition((int)(screenWidth * 0.85), (int)(screenHeight * 0.95) - (int)(screenWidth * 0.1) / 2);

	mMosynclogo->setPosition((int)(screenWidth * 0.05),(int)(screenHeight * 0.95) - (int)(screenWidth * 0.1) / 2);

	// we need to set new values for some widgets for the landscape mode
	if (isLandscape)
	{
		mServerConnectButton->setPosition(centerH - buttonWidth/2, layoutHeight - buttonHeight + buttonSpacing);
		mServerDisconnectButton->setPosition(centerH - buttonWidth/2, layoutHeight - buttonHeight + buttonSpacing);
		mInfoIcon->setSize((int)(screenHeight * 0.1),(int)(screenHeight * 0.1));
		mMosynclogo->setHeight((int)(screenHeight * 0.1));
	}
	else
	{
		mServerConnectButton->setPosition(centerH - buttonWidth/2, layoutHeight - buttonHeight);
		mServerDisconnectButton->setPosition(centerH - buttonWidth/2, layoutHeight - buttonHeight);
		mInfoIcon->setSize((int)(screenWidth * 0.1),(int)(screenWidth * 0.1));
		mMosynclogo->setHeight((int)(screenWidth * 0.1));
	}

	mBackground->setSize(screenWidth, screenHeight);

	mMainLayout->setSize(screenWidth, screenHeight);

	mLoginScreen->setMainWidget(mMainLayout);
}

/**
 * Show the login screen in the connected state
 * with the "connected" controls visible.
 */
void LoginScreen::showConnectedScreen()
{
	mConnectLayout->setVisible(false);
	mDisconnectLayout->setVisible(true);
	mLoginScreen->show();
}

/**
 * Show the login screen in the not connected state.
 */
void LoginScreen::showNotConnectedScreen()
{
	mConnectLayout->setVisible(true);
	mDisconnectLayout->setVisible(false);
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
	//Trim the beggining and end of the string of any spaces.
	int firstCharPos = mServerIPBox->getText().findFirstNotOf(' ', 0);
	int lastCharPos = mServerIPBox->getText().findFirstOf(' ', firstCharPos);
	lastCharPos = (lastCharPos != String::npos)?lastCharPos - 1:mServerIPBox->getText().length() - 1;
	String address = mServerIPBox->getText().substr(firstCharPos, lastCharPos - firstCharPos + 1);

	if(button == mServerConnectButton)
	{
		mReloadClient->connectToServer(address.c_str());
		mServerIPBox->hideKeyboard(); //Needed for iOS
	}
	else if(button == mServerDisconnectButton)
	{
		mReloadClient->disconnectFromServer();
	}
	else if(button == mLoadLastAppButton)
	{
		//Just load whatever app we have already extracted
		mReloadClient->launchSavedApp();
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

/**
 * This method is called the orientation changes
 * @param newOrientation The new screen orientation. One of the values: MA_SCREEN_ORIENTATION_PORTRAIT,
 * MA_SCREEN_ORIENTATION_PORTRAIT_UPSIDE_DOWN, MA_SCREEN_ORIENTATION_LANDSCAPE_LEFT, MA_SCREEN_ORIENTATION_LANDSCAPE_RIGHT.
 * @param newScreenHeight The new screen height after orientation has changed.
 * @param newScreenWidth The new screen width after oritentation has changed.
 */
void LoginScreen::orientationChanged(int newOrientation, int newScreenHeight, int newScreenWidth)
{
	rebuildScreenLayout(newScreenHeight, newScreenWidth, mOS, newOrientation);
}
