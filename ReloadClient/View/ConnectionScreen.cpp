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

/*
 * ConnectionScreen.cpp
 *
 *  Created on: Jan 31, 2013
 *      Author: Spiridon Alexandru
 */

#include <conprint.h>
#include <wchar.h>
#include <ma.h>
#include <maassert.h>
#include <mawstring.h>
#include <mastdlib.h>

#include "ConnectionScreen.h"
#include "MainStackScreen.h"
#include "LoginScreenUtils.h"
#include "MAHeaders.h"

using namespace MAUtil; // Class Moblet
using namespace NativeUI; // WebView widget.

/**
 * Constructor.
 */
ConnectionScreen::ConnectionScreen(MAUtil::String os, int orientation) :
	Screen(),
	mMainLayout(NULL)
{
	mOS = os;
	mCurrentOrientation = orientation;

	initializeScreen();
}

/**
 * Destructor.
 */
ConnectionScreen::~ConnectionScreen()
{
	((Button*)mServerDisconnectButton)->removeButtonListener(this);

	mReloadUIListeners.clear();
}

/**
 *
 * @param address
 */
void ConnectionScreen::fillConnectionData(const char* address)
{
	mConnectedToLabel->setText(address);
}

/**
 * Creates the screen, the layouts, the widgets and positions everything.
 */
void ConnectionScreen::initializeScreen()
{
	maScreenSetFullscreen(1);
	MAExtent ex = maGetScrSize();
	int screenWidth = EXTENT_X(ex);
	int screenHeight = EXTENT_Y(ex);

	mMainLayout = new RelativeLayout();

	createBackgroundImage(screenWidth, screenHeight);
	createMenuLayout();
	createBottomLayout();

	if (mCurrentOrientation == MA_SCREEN_ORIENTATION_LANDSCAPE_LEFT ||
		mCurrentOrientation == MA_SCREEN_ORIENTATION_LANDSCAPE_RIGHT)
	{
		mMainLayout->setSize(screenHeight, screenWidth);
		mBackground->setSize(screenHeight, screenWidth);

		int menuBottomY = positionMenuLayout(screenHeight, screenWidth, 0,
				CONNECTION_MENU_SCREEN_HEIGHT_LANDSCAPE_RATIO,
				MENU_WIDGET_WIDTH_LANDSCAPE_RATIO,
				MENU_WIDGET_LEFT_LANDSCAPE_RATIO,
				MENU_LABEL_HEIGHT_LANDSCAPE_RATIO,
				MENU_LABEL_SPACING_LANDSCAPE_RATIO,
				MENU_EDIT_BOX_HEIGHT_LANDSCAPE_RATIO,
				MENU_BUTTON_HEIGHT_LANDSCAPE_RATIO,
				MENU_BUTTON_SPACING_LANDSCAPE_RATIO);
		positionBottomLayout(screenHeight, screenWidth, menuBottomY,
				BOTTOM_SCREEN_HEIGHT_LANDSCAPE_RATIO,
				BOTTOM_LOGO_WIDTH_LANDSCAPE_RATIO,
				BOTTOM_LOGO_HEIGHT_LANDSCAPE_RATIO,
				BOTTOM_LOGO_LEFT_LANDSCAPE_RATIO,
				BOTTOM_LOGO_TOP_LANDSCAPE_RATIO,
				BOTTOM_INFO_WIDTH_LANDSCAPE_RATIO,
				BOTTOM_INFO_LEFT_LANDSCAPE_RATIO,
				BOTTOM_INFO_TOP_LANDSCAPE_RATIO);
	}
	else
	{
		mMainLayout->setSize(screenWidth, screenHeight);
		mBackground->setSize(screenWidth, screenHeight);

		int menuBottomY = positionMenuLayout(screenWidth, screenHeight, 0,
				CONNECTION_MENU_SCREEN_HEIGHT_PORTRAIT_RATIO,
				MENU_WIDGET_WIDTH_PORTRAIT_RATIO,
				MENU_WIDGET_LEFT_PORTRAIT_RATIO,
				MENU_LABEL_HEIGHT_PORTRAIT_RATIO,
				MENU_LABEL_SPACING_PORTRAIT_RATIO,
				MENU_EDIT_BOX_HEIGHT_PORTRAIT_RATIO,
				MENU_BUTTON_HEIGHT_PORTRAIT_RATIO,
				MENU_BUTTON_SPACING_PORTRAIT_RATIO);
		positionBottomLayout(screenWidth, screenHeight, menuBottomY,
				BOTTOM_SCREEN_HEIGHT_PORTRAIT_RATIO,
				BOTTOM_LOGO_WIDTH_PORTRAIT_RATIO,
				BOTTOM_LOGO_HEIGHT_PORTRAIT_RATIO,
				BOTTOM_LOGO_LEFT_PORTRAIT_RATIO,
				BOTTOM_LOGO_TOP_PORTRAIT_RATIO,
				BOTTOM_INFO_WIDTH_PORTRAIT_RATIO,
				BOTTOM_INFO_LEFT_PORTRAIT_RATIO,
				BOTTOM_INFO_TOP_PORTRAIT_RATIO);
	}

	mMainLayout->addChild(mLoadLastAppButton);
	mMainLayout->addChild(mMosynclogo);
	mMainLayout->addChild(mInfoIcon);

	this->setMainWidget(mMainLayout);
}

/**
 * Repositions all the screen widgets/layouts.
 * @param screenWidth The current screen width.
 * @param screenHeight The current screen height.
 */
void ConnectionScreen::rebuildScreenLayout(int screenWidth, int screenHeight)
{
	mMainLayout->setSize(screenWidth, screenHeight);
	mBackground->setSize(screenWidth, screenHeight);

	// windows phone 7 orientation animation is glitchy - this is a small
	// fix for the wp7 platform - when going from portrait to landscape, the
	// repositioning is done from top to bottom but when going from landscape
	// to portrait, all the elements are repositioned bottom-up in order
	// to have a somehow smoother animation
	if (mCurrentOrientation == MA_SCREEN_ORIENTATION_LANDSCAPE_LEFT ||
			mCurrentOrientation == MA_SCREEN_ORIENTATION_LANDSCAPE_RIGHT)
	{
		int menuBottomY = positionMenuLayout(screenWidth, screenHeight, 0,
				CONNECTION_MENU_SCREEN_HEIGHT_LANDSCAPE_RATIO,
				MENU_WIDGET_WIDTH_LANDSCAPE_RATIO,
				MENU_WIDGET_LEFT_LANDSCAPE_RATIO,
				MENU_LABEL_HEIGHT_LANDSCAPE_RATIO,
				MENU_LABEL_SPACING_LANDSCAPE_RATIO,
				MENU_EDIT_BOX_HEIGHT_LANDSCAPE_RATIO,
				MENU_BUTTON_HEIGHT_LANDSCAPE_RATIO,
				MENU_BUTTON_SPACING_LANDSCAPE_RATIO);
		positionBottomLayout(screenWidth, screenHeight, menuBottomY,
				BOTTOM_SCREEN_HEIGHT_LANDSCAPE_RATIO,
				BOTTOM_LOGO_WIDTH_LANDSCAPE_RATIO,
				BOTTOM_LOGO_HEIGHT_LANDSCAPE_RATIO,
				BOTTOM_LOGO_LEFT_LANDSCAPE_RATIO,
				BOTTOM_LOGO_TOP_LANDSCAPE_RATIO,
				BOTTOM_INFO_WIDTH_LANDSCAPE_RATIO,
				BOTTOM_INFO_LEFT_LANDSCAPE_RATIO,
				BOTTOM_INFO_TOP_LANDSCAPE_RATIO);
	}
	else
	{
		//int logoBottomY = (int)(screenHeight * LOGO_SCREEN_HEIGHT_PORTRAIT_RATIO);
		int menuBottomY = (int)(screenHeight * CONNECTION_MENU_SCREEN_HEIGHT_PORTRAIT_RATIO);

		positionBottomLayout(screenWidth, screenHeight, menuBottomY,
				BOTTOM_SCREEN_HEIGHT_PORTRAIT_RATIO,
				BOTTOM_LOGO_WIDTH_PORTRAIT_RATIO,
				BOTTOM_LOGO_HEIGHT_PORTRAIT_RATIO,
				BOTTOM_LOGO_LEFT_PORTRAIT_RATIO,
				BOTTOM_LOGO_TOP_PORTRAIT_RATIO,
				BOTTOM_INFO_WIDTH_PORTRAIT_RATIO,
				BOTTOM_INFO_LEFT_PORTRAIT_RATIO,
				BOTTOM_INFO_TOP_PORTRAIT_RATIO);
		positionMenuLayout(screenWidth, screenHeight, 0,
				CONNECTION_MENU_SCREEN_HEIGHT_PORTRAIT_RATIO,
				MENU_WIDGET_WIDTH_PORTRAIT_RATIO,
				MENU_WIDGET_LEFT_PORTRAIT_RATIO,
				MENU_LABEL_HEIGHT_PORTRAIT_RATIO,
				MENU_LABEL_SPACING_PORTRAIT_RATIO,
				MENU_EDIT_BOX_HEIGHT_PORTRAIT_RATIO,
				MENU_BUTTON_HEIGHT_PORTRAIT_RATIO,
				MENU_BUTTON_SPACING_PORTRAIT_RATIO);
	}
}

/**
 * Creates and adds the background image to the main layout.
 * @param screenWidth Used to set the background image width.
 * @param screenHeight Used to set the background image height.
 */
void ConnectionScreen::createBackgroundImage(int screenWidth, int screenHeight)
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

/**
 * Creates the middle layout of the main screen (that contains the menu)
 * and adds it to the main layout.
 */
void ConnectionScreen::createMenuLayout()
{
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

/**
 * Creates the disconnected layout and adds it to the menu layout.
 */
void ConnectionScreen::createDisconnectedLayout()
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

	mMainLayout->addChild(mDisconnectLayout);
}

/**
 * Creates and adds the bottom layout (that contains the MoSync logo
 * and the info button) to the main layout.
 */
void ConnectionScreen::createBottomLayout()
{
	//A little MoSync logo at the lower left of the screen
	mMosynclogo = new Image();
	mMosynclogo->setImage(MOSYNC_IMAGE);
	mMosynclogo->setScaleMode(IMAGE_SCALE_PRESERVE_ASPECT);

	//The info icon
	mInfoIcon = new ImageButton();
	mInfoIcon->addButtonListener(this);
	mInfoIcon->setBackgroundImage(INFO_ICON);
}

/**
 * Positions the upper layout (containing the Reload logo) on the main layout.
 * @param screenWidth The device screen width.
 * @param screenHeight The device screen height.
 * @param screenRatio Defines how much space the layout will occupy on the Y axix.
 * @param logoTopRatio The logo top ratio (based on the layout height).
 * @param logoWidthRatio The logo width ratio (based on the layout width).
 * @return Returns the lower x coordinate of the layout after positioning.
 */
int ConnectionScreen::positionLogoLayout(int screenWidth, int screenHeight, float screenRatio, float logoTopRatio, float logoWidthRatio)
{
	int height = (int)((float)screenHeight * screenRatio);

	int aboveHeight = (int)((float)height * logoTopRatio);

	int logoWidth = (int)((float)screenWidth * logoWidthRatio);
	mLogo->setWidth(logoWidth);

	int centerH = screenWidth / 2;
	mLogo->setPosition(centerH - logoWidth/2, aboveHeight);

	return height;
}

/**
 * Positions the menu layout on the main layout.
 * @param screenWidth The device screen width.
 * @param screenHeight The device screen height.
 * @param top The top position of the layout.
 * @param screenRatio Defines how much space the layout will occupy on the Y axix.
 * @param widgetWidthRatio The menu widget width ratio (based on the layout width).
 * @param widgetLeftRatio The menu widget left ratio (based on the layout width).
 * @param labelHeightRatio The label height ratio (based on the layout height).
 * @param labelSpacingRatio The label spacing ratio (based on the layout height).
 * @param editBoxHeightRatio The ip edit box height ratio (based on the layout height).
 * @param buttonHeightRatio The button height ratio (based on the layout height).
 * @param buttonSpacingRatio The button spacing ratio (based on the layout height).
 * @return Returns the lower x coordinate of the layout after positioning.
 */
int ConnectionScreen::positionMenuLayout(int screenWidth, int screenHeight, int top, float screenRatio,
					float widgetWidthRatio, float widgetLeftRatio,
					float labelHeightRatio, float labelSpacingRatio,
					float editBoxHeightRatio, float buttonHeightRatio, float buttonSpacingRatio)
{
	int height = (int)((float)screenHeight * screenRatio);
	// every widget will occupy 60% of the screen width
	int widgetWidth = (int)((float)screenWidth * widgetWidthRatio);
	// the left position will be 20% of the screen, as well as the right distance to the edge
	int widgetLeft = (int)((float)screenWidth * widgetLeftRatio);

	int labelHeight = (int)((float)height * labelHeightRatio);
	int labelSpacing = (int)((float)height * labelSpacingRatio);
	int editBoxHeight = (int)((float)height * editBoxHeightRatio);
	int buttonHeight = (int)((float)height * buttonHeightRatio);
	int buttonSpacing = (int)((float)height * buttonSpacingRatio);

	mConnectedToLabel->setWidth(widgetWidth);

	mInstructionsLabel->setWidth(widgetWidth);

	mServerDisconnectButton->setWidth(widgetWidth);
	mServerDisconnectButton->setHeight(buttonHeight);

	mDisconnectLayout->setWidth(screenWidth);
	mDisconnectLayout->setHeight(height);

	mLoadLastAppButton->setWidth(widgetWidth);
	mLoadLastAppButton->setHeight(buttonHeight);

	// windows phone 7 orientation animation is glitchy - this is a small
	// fix for the wp7 platform - when going from portrait to landscape, the
	// repositioning is done from top to bottom but when going from landscape
	// to portrait, all the elements are repositioned bottom-up in order
	// to have a somehow smoother animation
	if (mCurrentOrientation == MA_SCREEN_ORIENTATION_LANDSCAPE_LEFT ||
			mCurrentOrientation == MA_SCREEN_ORIENTATION_LANDSCAPE_RIGHT)
	{
		mInstructionsLabel->setPosition(widgetLeft, labelSpacing * 2 + labelHeight);
		mServerDisconnectButton->setPosition(widgetLeft, labelSpacing * 2 + labelHeight + editBoxHeight + buttonSpacing);
		mConnectedToLabel->setPosition(widgetLeft, labelSpacing);
		mDisconnectLayout->setPosition(0, top);

		mLoadLastAppButton->setPosition(widgetLeft,top + labelSpacing * 2 + labelHeight + editBoxHeight + buttonSpacing * 2 + buttonHeight);
	}
	else
	{
		mLoadLastAppButton->setPosition(widgetLeft,top + labelSpacing * 2 + labelHeight + editBoxHeight + buttonSpacing * 2 + buttonHeight);

		mDisconnectLayout->setPosition(0, top);
		mConnectedToLabel->setPosition(widgetLeft, labelSpacing);
		mServerDisconnectButton->setPosition(widgetLeft, labelSpacing * 2 + labelHeight + editBoxHeight + buttonSpacing);
		mInstructionsLabel->setPosition(widgetLeft, labelSpacing * 2 + labelHeight);
	}

	return top + height;
}

/**
 * Positions the bottom layout (that contains the MoSync logo and the info button)
 * on the main layout.
 * @param screenWidth The device screen width.
 * @param screenHeight The device screen height.
 * @param top The top position of the layout.
 * @param screenRatio Defines how much space the layout will occupy on the Y axix.
 * @param logoWidthRatio The logo height ratio (based on the layout height).
 * @param logoHeightRatio The logo width ratio (based on the layout width).
 * @param logoLeftRatio The logo left ratio (based on the layout width).
 * @param logoTopRatio The logo top ratio (based on the layout height).
 * @param infoWidthRatio The info button width ratio (based on the layout width).
 * @param infoLeftRatio The info button left ratio (based on the layout width).
 * @param infoTopRatio The logo top ratio (based on the layout height).
 * @return Returns the lower x coordinate of the layout after positioning.
 */
int ConnectionScreen::positionBottomLayout(int screenWidth, int screenHeight, int top, float screenRatio,
					float logoWidthRatio, float logoHeightRatio, float logoLeftRatio, float logoTopRatio,
					float infoWidthRatio, float infoLeftRatio, float infoTopRatio)
{
	int height = (int)((float)screenHeight * screenRatio);

	int logoWidth = (int)((float)screenWidth * logoWidthRatio);
	int infoWidth = (int)((float)screenWidth * infoWidthRatio);
	int logoLeft = (int)((float)screenWidth * logoLeftRatio);
	int infoLeft = (int)((float)screenWidth * infoLeftRatio);
	int logoInfoDistance = (int)(screenWidth - logoWidth - infoWidth - logoLeft * 2);
	int logoHeight = (int)((float)height * logoHeightRatio);
	int logoTop = (int)((float)height * logoTopRatio);
	int infoTop = (int)((float)height * infoTopRatio);

	// the mosync logo not positioned correctly at the left side of the screen on
	// iPhone devices (on iPad, it was ok) so right now we need to set the width
	// property depending on the orientation
	if (mOS.find("iPhone") >= 0)
	{
		if (mCurrentOrientation == MA_SCREEN_ORIENTATION_LANDSCAPE_LEFT ||
				mCurrentOrientation == MA_SCREEN_ORIENTATION_LANDSCAPE_RIGHT)
		{
			mMosynclogo->setWidth(logoWidth/2);
		}
		else
		{
			mMosynclogo->setWidth(logoWidth);
		}
	}
	mMosynclogo->setHeight(logoHeight);
	mMosynclogo->setPosition(logoLeft, top + logoTop);

	mInfoIcon->setSize(infoWidth,infoWidth);
	mInfoIcon->setPosition(logoLeft + logoWidth + logoInfoDistance, top + infoTop);

	return top + height;
}

/**
* This method is called if the touch-up event was inside the
* bounds of the button.
* @param button The button object that generated the event.
*/
void ConnectionScreen::buttonClicked(Widget* button)
{
	if(button == mServerDisconnectButton)
	{
		// announce the screen listeners that the disconnect button was clicked
		for (int i = 0; i < mReloadUIListeners.size(); i++)
		{
			mReloadUIListeners[i]->disconnectButtonClicked();
		}
	}
	else if(button == mLoadLastAppButton)
	{
		// announce the screen listeners that the reload last app button was clicked
		for (int i = 0; i < mReloadUIListeners.size(); i++)
		{
			mReloadUIListeners[i]->reloadLastAppButtonClicked();
		}
	}
	else if(button == mInfoIcon)
	{
		// announce the screen listeners that the info button was clicked
		for (int i = 0; i < mReloadUIListeners.size(); i++)
		{
			mReloadUIListeners[i]->infoButtonClicked();
		}
	}
}

/**
 * Called just before the screen begins rotating.
 */
void ConnectionScreen::orientationWillChange()
{
	int orientation = maScreenGetCurrentOrientation();
	MAExtent ex = maGetScrSize();
	int screenWidth = EXTENT_X(ex);
	int screenHeight = EXTENT_Y(ex);

	rebuildScreenLayout(screenWidth, screenHeight);
}

/**
 * Called after the screen orientation has changed.
 * Available only on iOS and Windows Phone 7.1 platforms.
 */
void ConnectionScreen::orientationDidChange()
{
	int orientation = maScreenGetCurrentOrientation();
	mCurrentOrientation = orientation;

	// on iOS the layouts are repositioned on orientation will change
	if (mOS.find("iPhone") < 0)
	{

		MAExtent ex = maGetScrSize();
		int screenWidth = EXTENT_X(ex);
		int screenHeight = EXTENT_Y(ex);

		// on wp7 the screen size on landscape has the same values as portrait
		// so we need to swap those values
		if ((orientation == MA_SCREEN_ORIENTATION_LANDSCAPE_LEFT ||
				orientation == MA_SCREEN_ORIENTATION_LANDSCAPE_RIGHT) &&
				mOS.find("Windows", 0) >= 0)
		{
			int aux = screenWidth;
			screenWidth = screenHeight;
			screenHeight = aux;
		}

		rebuildScreenLayout(screenWidth, screenHeight);
	}
}

/**
 * Add a reload UI event listener.
 * @param listener The listener that will receive reload UI events.
 */
void ConnectionScreen::addReloadUIListener(ReloadUIListener* listener)
{
    for (int i = 0; i < mReloadUIListeners.size(); i++)
    {
        if (listener == mReloadUIListeners[i])
        {
            return;
        }
    }

    mReloadUIListeners.add(listener);
}

/**
 * Remove a reload UI listener.
 * @param listener The listener that receives reload UI events.
 */
void ConnectionScreen::removeReloadUIListener(ReloadUIListener* listener)
{
	for (int i = 0; i < mReloadUIListeners.size(); i++)
	{
		if (listener == mReloadUIListeners[i])
		{
			mReloadUIListeners.remove(i);
			break;
		}
	}
}
