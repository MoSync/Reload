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

	mLoginScreen = new LoginScreenWidget();
	mLoginScreen->addLoginScreenListener(this);

	mMainLayout = new RelativeLayout();
	mMainLayout->setSize(screenWidth, screenHeight);

	createBackgroundImage(screenWidth, screenHeight);
	createLogo();
	createMenuLayout();
	createBottomLayout(screenWidth, screenHeight);

	if (orientation == MA_SCREEN_ORIENTATION_LANDSCAPE_LEFT ||
		orientation == MA_SCREEN_ORIENTATION_LANDSCAPE_RIGHT)
	{
		// the reload logo layout will represent 30% of the screen
		int logoBottomY = positionLogoLayout(screenHeight, screenWidth, 0.10);
		int menuBottomY = positionMenuLayout(screenHeight, screenWidth, logoBottomY, 0.80);
		positionBottomLayout(screenHeight, screenWidth, menuBottomY, 0.10);
	}
	else
	{
		// the reload logo layout will represent 30% of the screen
		int logoBottomY = positionLogoLayout(screenWidth, screenHeight, 0.20);
		int menuBottomY = positionMenuLayout(screenWidth, screenHeight, logoBottomY, 0.70);
		positionBottomLayout(screenWidth, screenHeight, menuBottomY, 0.10);
	}

	mMainLayout->addChild(mLoadLastAppButton);
	mMainLayout->addChild(mMosynclogo);
	mMainLayout->addChild(mInfoIcon);

	mLoginScreen->setMainWidget(mMainLayout);
}

void LoginScreen::rebuildScreenLayout(int screenWidth, int screenHeight, MAUtil::String os, int orientation)
{
	// on wp7 the layout changes look glitchy so we'll set the layout after all the
	// repositioning has been done
	mLoginScreen->setMainWidget(NULL);

	if (orientation == MA_SCREEN_ORIENTATION_LANDSCAPE_LEFT ||
		orientation == MA_SCREEN_ORIENTATION_LANDSCAPE_RIGHT)
	{
		// the reload logo layout will represent 30% of the screen
		int logoBottomY = positionLogoLayout(screenWidth, screenHeight, 0.20);
		int menuBottomY = positionMenuLayout(screenWidth, screenHeight, logoBottomY, 0.70);
		positionBottomLayout(screenWidth, screenHeight, menuBottomY, 0.10);
	}
	else
	{
		// the reload logo layout will represent 30% of the screen
		int logoBottomY = positionLogoLayout(screenWidth, screenHeight, 0.20);
		int menuBottomY = positionMenuLayout(screenWidth, screenHeight, logoBottomY, 0.70);
		positionBottomLayout(screenWidth, screenHeight, menuBottomY, 0.10);
	}

	mLoginScreen->setMainWidget(mMainLayout);
}

void LoginScreen::createBackgroundImage(int screenWidth, int screenHeight)
{
	mBackground = new Image();
	mBackground->setSize(screenWidth, screenHeight);
	mBackground->setImage(BACKGROUND);
	mBackground->setScaleMode(IMAGE_SCALE_XY);

	if(mOS.find("Windows", 0) < 0)
	{
		mMainLayout->addChild(mBackground);
	}
}

void LoginScreen::createLogo()
{
	//The reload Logo
	mLogo = new Image();
	mLogo->setImage(LOGO_IMAGE);
	mLogo->wrapContentHorizontally();
	mLogo->wrapContentVertically();
	mLogo->setScaleMode(IMAGE_SCALE_PRESERVE_ASPECT);

	mMainLayout->addChild(mLogo);
}

void LoginScreen::createMenuLayout()
{
	createConnectedLayout();
	createDisconnectedLayout();

	//Button that loads the last loaded app
	if(mOS == "iPhone OS")
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
}

void LoginScreen::createConnectedLayout()
{
	//Label for the server IP edit box
	mServerIPLabel = new Label();
	mServerIPLabel->setText("Server IP:");
	mServerIPLabel->setFontColor(0xFFFFFF);
	mServerIPLabel->setTextHorizontalAlignment(MAW_ALIGNMENT_CENTER);
	mServerIPLabel->setTextVerticalAlignment(MAW_ALIGNMENT_CENTER);

	//The edit box that receives the server IP
	mServerIPBox = new EditBox();
	mServerIPBox->addEditBoxListener(this);

	//The connect to server button
	if(mOS == "iPhone OS") //Android image buttons do not support text
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

	mConnectLayout = new RelativeLayout();
	mConnectLayout->addChild(mServerIPLabel);
	mConnectLayout->addChild(mServerIPBox);
	mConnectLayout->addChild(mServerConnectButton);

	mMainLayout->addChild(mConnectLayout);
}

void LoginScreen::createDisconnectedLayout()
{
	//Some instructions for the user
	mInstructionsLabel = new Label();
	mInstructionsLabel->setText("Use the Reload Web UI to load an app");
	mInstructionsLabel->setFontColor(0xFFFFFF);
	mInstructionsLabel->setMaxNumberOfLines(2);
	mInstructionsLabel->setTextHorizontalAlignment(MAW_ALIGNMENT_CENTER);
	mInstructionsLabel->setTextVerticalAlignment(MAW_ALIGNMENT_CENTER);

	//Label with the Server IP
	mConnectedToLabel = new Label();
	mConnectedToLabel->setFontColor(0xFFFFFF);
	mConnectedToLabel->setTextHorizontalAlignment(MAW_ALIGNMENT_CENTER);
	mConnectedToLabel->setTextVerticalAlignment(MAW_ALIGNMENT_CENTER);

	//The disconnect button
	if(mOS == "iPhone OS")
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

	/*
	 * The mConnectLayout and mDisconnectLayout are placed
	 * on top of each other inside a relative layout, and
	 * each is only shown when needed.
	 */
	mDisconnectLayout = new RelativeLayout();
	mDisconnectLayout->addChild(mConnectedToLabel);
	mDisconnectLayout->addChild(mInstructionsLabel);
	mDisconnectLayout->addChild(mServerDisconnectButton);
	mDisconnectLayout->setVisible(false);

	mMainLayout->addChild(mDisconnectLayout);
}

void LoginScreen::createBottomLayout(int screenWidth, int screenHeight)
{
	//A little MoSync logo at the lower left of the screen
	mMosynclogo = new Image();
	mMosynclogo->setImage(MOSYNC_IMAGE);
	mMosynclogo->setScaleMode(IMAGE_SCALE_PRESERVE_ASPECT);
	mMosynclogo->setPosition((int)(screenWidth * 0.05),(int)(screenHeight * 0.95) - (int)(screenWidth * 0.1) / 2);

	//The info icon
	mInfoIcon = new ImageButton();
	mInfoIcon->addButtonListener(this);
	mInfoIcon->setBackgroundImage(INFO_ICON);

	//mInfoIcon->setScaleMode(IMAGE_SCALE_PRESERVE_ASPECT);
	mInfoIcon->setPosition((int)(screenWidth * 0.85), (int)(screenHeight * 0.95) - (int)(screenWidth * 0.1) / 2);
}

int LoginScreen::positionLogoLayout(int screenWidth, int screenHeight, float screenRatio)
{
	int height = (int)((float)screenHeight * screenRatio);

	// 25% above
	int aboveHeight = (int)((float)height * 0.25);

	// 50% will be the logo
	int logoWidth = (int)((float)screenWidth * 0.75);
	mLogo->setWidth(logoWidth);
	int centerH = screenWidth / 2;
	mLogo->setPosition(centerH - logoWidth/2, aboveHeight);

	return height;
}

int LoginScreen::positionMenuLayout(int screenWidth, int screenHeight, int top, float screenRatio)
{
	int height = (int)((float)screenHeight * screenRatio);
	// every widget will occupy 60% of the screen width
	int widgetWidth = (int)((float)screenWidth * 0.8);
	// the left position will be 20% of the screen, as well as the right distance to the edge
	int widgetLeft = (int)((float)screenWidth * 0.1);

	int labelHeight = (int)((float)height * 0.08);
	int labelSpacing = (int)((float)height * 0.02);
	int editBoxHeight = (int)((float)height * 0.08);
	if(screenHeight > 1000  && mOS.find("Android", 0) < 0)
	{
		editBoxHeight = (int)((float)height * 0.04);
	}
	else
	{
		editBoxHeight = (int)((float)height * 0.10);
	}
	int buttonSpacing = (int)((float)height * 0.03);
	int buttonHeight = (int)((float)height * 0.15);

	mServerIPLabel->setWidth(widgetWidth);
	mServerIPLabel->setPosition(widgetLeft, labelSpacing);

	mServerIPBox->setWidth(widgetWidth);
	mServerIPBox->setPosition(widgetLeft, labelSpacing + labelHeight);

	mServerConnectButton->setWidth(widgetWidth);
	mServerConnectButton->setHeight(buttonHeight);
	mServerConnectButton->setPosition(widgetLeft, labelSpacing * 2 + labelHeight + editBoxHeight + buttonSpacing);

	mConnectLayout->setWidth(screenWidth);
	mConnectLayout->setHeight(height);
	mConnectLayout->setPosition(0, top);

	mConnectedToLabel->setWidth(widgetWidth);
	mConnectedToLabel->setPosition(widgetLeft, labelSpacing);

	mInstructionsLabel->setWidth(widgetWidth);
	mInstructionsLabel->setPosition(widgetLeft, labelSpacing * 2 + labelHeight);

	mServerDisconnectButton->setWidth(widgetWidth);
	mServerDisconnectButton->setHeight(buttonHeight);
	mServerDisconnectButton->setPosition(widgetLeft, labelSpacing * 2 + labelHeight + editBoxHeight + buttonSpacing);

	mDisconnectLayout->setWidth(screenWidth);
	mDisconnectLayout->setHeight(height);
	mDisconnectLayout->setPosition(0, top);

	mLoadLastAppButton->setWidth(widgetWidth);
	mLoadLastAppButton->setHeight(buttonHeight);
	mLoadLastAppButton->setPosition(widgetLeft,top + labelSpacing * 2 + labelHeight + editBoxHeight + buttonSpacing * 2 + buttonHeight);

	return top + height;
}

int LoginScreen::positionBottomLayout(int screenWidth, int screenHeight, int top, float screenRatio)
{
	int height = (int)((float)screenHeight * screenRatio);

	int logoWidth = (int)((float)screenWidth * 0.3);
	int infoWidth = (int)((float)screenWidth * 0.1);
	int logoLeft = (int)((float)screenWidth * 0.05);
	int infoLeft = (int)((float)screenWidth * 0.7);
	int logoInfoDistance = (int)(screenWidth - logoWidth - infoWidth - logoLeft * 2);
	int logoHeight = (int)((float)height * 0.6);
	int logoTop = (int)((float)height * 0.1);

	mMosynclogo->setHeight(logoHeight);
	mInfoIcon->setSize(infoWidth,infoWidth);

	mMosynclogo->setPosition(logoLeft, top + logoTop);
	mInfoIcon->setPosition(logoLeft + logoWidth + logoInfoDistance, top + logoTop);

	return top + height;
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
void LoginScreen::orientationChanged(int newOrientation, int newScreenWidth, int newScreenHeight)
{
	rebuildScreenLayout(newScreenWidth, newScreenHeight, mOS, newOrientation);
}
