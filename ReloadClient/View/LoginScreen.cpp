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
 * LoginScreen.cpp
 *
 *  Created on: Feb 4, 2013
 *      Author: Spiridon Alexandru
 */

#include "LoginScreen.h"
#include "LoginScreenUtils.h"
#include "MAHeaders.h"

#define ORIENTATION_PORTRAIT "Portrait"
#define ORIENTATION_PORTRAIT_UPSIDE_DOWN "Portrait upside down"
#define ORIENTATION_LANDSCAPE_LEFT "Landscape left"
#define ORIENTATION_LANDSCAPE_RIGHT "Landscape right"

using namespace MAUtil;
using namespace NativeUI;

/**
 * Constructor.
 * @param os The current os.
 * @param orientation The current device orientation.
 */
LoginScreen::LoginScreen(MAUtil::String os, int orientation):
	Screen()
{
	this->setTitle("Login screen");
	this->mOS = os;
	this->mCurrentOrientation = orientation;

	initializeScreen();
}

/**
 * Destructor.
 */
LoginScreen::~LoginScreen()
{
	mReloadUIListeners.clear();
}

/**
 * Sets the default IP address of the server.
 * @param ipAddress The server IP default address.
 */
void LoginScreen::setDefaultIPAddress(const char *serverAddress)
{
	mServerIPBox->setText(serverAddress);
}

/**
 * Creates the screen, the layouts, the widgets and positions everything.
 */
void LoginScreen::initializeScreen()
{
	maScreenSetFullscreen(1);
	MAExtent ex = maGetScrSize();
	int screenWidth = EXTENT_X(ex);
	int screenHeight = EXTENT_Y(ex);

	mMainLayout = new RelativeLayout();

	createBackgroundImage(screenWidth, screenHeight);
	createLogoLayout();
	createMenuLayout();
	createBottomLayout();

	if (mCurrentOrientation == MA_SCREEN_ORIENTATION_LANDSCAPE_LEFT ||
		mCurrentOrientation == MA_SCREEN_ORIENTATION_LANDSCAPE_RIGHT)
	{
		mMainLayout->setSize(screenHeight, screenWidth);
		mBackground->setSize(screenHeight, screenWidth);

		// the reload logo layout will represent 30% of the screen
		int logoBottomY = positionLogoLayout(screenHeight, screenWidth,
				LOGO_SCREEN_HEIGHT_LANDSCAPE_RATIO,
				LOGO_TOP_LANDSCAPE_RATIO,
				LOGO_WIDTH_LANDSCAPE_RATIO,
				LOGO_HEIGHT_LANDSCAPE_RATIO);
		int menuBottomY = positionMenuLayout(screenHeight, screenWidth, logoBottomY,
				MENU_SCREEN_HEIGHT_LANDSCAPE_RATIO,
				MENU_WIDGET_WIDTH_LANDSCAPE_RATIO,
				MENU_WIDGET_LEFT_LANDSCAPE_RATIO,
				MENU_LABEL_HEIGHT_LANDSCAPE_RATIO,
				MENU_LABEL_SPACING_LANDSCAPE_RATIO,
				MENU_EDIT_BOX_HEIGHT_LANDSCAPE_RATIO,
				MENU_BUTTON_HEIGHT_LANDSCAPE_RATIO,
				MENU_BUTTON_SPACING_LANDSCAPE_RATIO);
		positionBottomLayout(screenHeight, screenWidth,
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

		// the reload logo layout will represent 30% of the screen
		int logoBottomY = positionLogoLayout(screenWidth, screenHeight,
				LOGO_SCREEN_HEIGHT_PORTRAIT_RATIO,
				LOGO_TOP_PORTRAIT_RATIO,
				LOGO_HEIGHT_PORTRAIT_RATIO,
				LOGO_HEIGHT_PORTRAIT_RATIO);
		int menuBottomY = positionMenuLayout(screenWidth, screenHeight, logoBottomY,
				MENU_SCREEN_HEIGHT_PORTRAIT_RATIO,
				MENU_WIDGET_WIDTH_PORTRAIT_RATIO,
				MENU_WIDGET_LEFT_PORTRAIT_RATIO,
				MENU_LABEL_HEIGHT_PORTRAIT_RATIO,
				MENU_LABEL_SPACING_PORTRAIT_RATIO,
				MENU_EDIT_BOX_HEIGHT_PORTRAIT_RATIO,
				MENU_BUTTON_HEIGHT_PORTRAIT_RATIO,
				MENU_BUTTON_SPACING_PORTRAIT_RATIO);
		positionBottomLayout(screenWidth, screenHeight,
				BOTTOM_SCREEN_HEIGHT_PORTRAIT_RATIO,
				BOTTOM_LOGO_WIDTH_PORTRAIT_RATIO,
				BOTTOM_LOGO_HEIGHT_PORTRAIT_RATIO,
				BOTTOM_LOGO_LEFT_PORTRAIT_RATIO,
				BOTTOM_LOGO_TOP_PORTRAIT_RATIO,
				BOTTOM_INFO_WIDTH_PORTRAIT_RATIO,
				BOTTOM_INFO_LEFT_PORTRAIT_RATIO,
				BOTTOM_INFO_TOP_PORTRAIT_RATIO);
	}

	mMainLayout->addChild(mFindServersButton);
	mMainLayout->addChild(mLoadStoredProjectsButton);
	mMainLayout->addChild(mMosynclogo);
	mMainLayout->addChild(mInfoIcon);

	this->setMainWidget(mMainLayout);
}

/**
 * Repositions all the screen widgets/layouts.
 * @param screenWidth The current screen width.
 * @param screenHeight The current screen height.
 */
void LoginScreen::rebuildScreenLayout(int screenWidth, int screenHeight)
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
		// the reload logo layout will represent 30% of the screen
		int logoBottomY = positionLogoLayout(screenWidth, screenHeight,
				LOGO_SCREEN_HEIGHT_LANDSCAPE_RATIO,
				LOGO_TOP_LANDSCAPE_RATIO,
				LOGO_WIDTH_LANDSCAPE_RATIO,
				LOGO_HEIGHT_LANDSCAPE_RATIO);
		int menuBottomY = positionMenuLayout(screenWidth, screenHeight, logoBottomY,
				MENU_SCREEN_HEIGHT_LANDSCAPE_RATIO,
				MENU_WIDGET_WIDTH_LANDSCAPE_RATIO,
				MENU_WIDGET_LEFT_LANDSCAPE_RATIO,
				MENU_LABEL_HEIGHT_LANDSCAPE_RATIO,
				MENU_LABEL_SPACING_LANDSCAPE_RATIO,
				MENU_EDIT_BOX_HEIGHT_LANDSCAPE_RATIO,
				MENU_BUTTON_HEIGHT_LANDSCAPE_RATIO,
				MENU_BUTTON_SPACING_LANDSCAPE_RATIO);
		positionBottomLayout(screenWidth, screenHeight,
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
		int logoBottomY = (int)(screenHeight * LOGO_SCREEN_HEIGHT_PORTRAIT_RATIO);
		int menuBottomY = logoBottomY + (int)(screenHeight * MENU_SCREEN_HEIGHT_PORTRAIT_RATIO);

		positionBottomLayout(screenWidth, screenHeight,
				BOTTOM_SCREEN_HEIGHT_PORTRAIT_RATIO,
				BOTTOM_LOGO_WIDTH_PORTRAIT_RATIO,
				BOTTOM_LOGO_HEIGHT_PORTRAIT_RATIO,
				BOTTOM_LOGO_LEFT_PORTRAIT_RATIO,
				BOTTOM_LOGO_TOP_PORTRAIT_RATIO,
				BOTTOM_INFO_WIDTH_PORTRAIT_RATIO,
				BOTTOM_INFO_LEFT_PORTRAIT_RATIO,
				BOTTOM_INFO_TOP_PORTRAIT_RATIO);
		positionMenuLayout(screenWidth, screenHeight, logoBottomY,
				MENU_SCREEN_HEIGHT_PORTRAIT_RATIO,
				MENU_WIDGET_WIDTH_PORTRAIT_RATIO,
				MENU_WIDGET_LEFT_PORTRAIT_RATIO,
				MENU_LABEL_HEIGHT_PORTRAIT_RATIO,
				MENU_LABEL_SPACING_PORTRAIT_RATIO,
				MENU_EDIT_BOX_HEIGHT_PORTRAIT_RATIO,
				MENU_BUTTON_HEIGHT_PORTRAIT_RATIO,
				MENU_BUTTON_SPACING_PORTRAIT_RATIO);
		positionLogoLayout(screenWidth, screenHeight,
				LOGO_SCREEN_HEIGHT_PORTRAIT_RATIO,
				LOGO_TOP_PORTRAIT_RATIO,
				LOGO_WIDTH_PORTRAIT_RATIO,
				LOGO_HEIGHT_PORTRAIT_RATIO);
	}
}

/**
 * Creates and adds the background image to the main layout.
 * @param screenWidth Used to set the background image width.
 * @param screenHeight Used to set the background image height.
 */
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

/**
 * Creates the upper layout of the main screen (that contains the Reload logo)
 * and adds it to the main layout.
 */
void LoginScreen::createLogoLayout()
{
	//The reload Logo
	mLogo = new Image();
	mLogo->setImage(LOGO_IMAGE);
	mLogo->wrapContentHorizontally();
	mLogo->wrapContentVertically();
	mLogo->setScaleMode(IMAGE_SCALE_PRESERVE_ASPECT);

	mMainLayout->addChild(mLogo);
}

/**
 * Creates the middle layout of the main screen (that contains the menu)
 * and adds it to the main layout.
 */
void LoginScreen::createMenuLayout()
{
	createConnectedLayout();

	//Button that loads the last loaded app
	if(mOS == "iPhone OS")
	{
		mFindServersButton = new ImageButton();
		((ImageButton*)mFindServersButton)->addButtonListener(this);
		((ImageButton*)mFindServersButton)->setBackgroundImage(RELOAD_BG);
		mFindServersButton->setFontColor(0x000000);

		mLoadStoredProjectsButton = new ImageButton();
		((ImageButton*)mLoadStoredProjectsButton)->addButtonListener(this);
		((ImageButton*)mLoadStoredProjectsButton)->setBackgroundImage(RELOAD_BG);
		mLoadStoredProjectsButton->setFontColor(0x000000);
	}
	else
	{
		mFindServersButton = new Button();
		((Button*)mFindServersButton)->addButtonListener(this);

		mLoadStoredProjectsButton = new Button();
		((Button*)mLoadStoredProjectsButton)->addButtonListener(this);
	}

	mFindServersButton->setText(FIND_SERVERS_BUTTON_TEXT);

	mLoadStoredProjectsButton->setText(LOAD_STORED_PROJECTS_TEXT);
	mLoadStoredProjectsButton->setTextHorizontalAlignment(MAW_ALIGNMENT_CENTER);
	mLoadStoredProjectsButton->setTextVerticalAlignment(MAW_ALIGNMENT_CENTER);
}

/**
 * Creates the connected layout and adds it to the menu layout.
 */
void LoginScreen::createConnectedLayout()
{
	//Label for the server IP edit box
	mServerIPLabel = new Label();
	mServerIPLabel->setText(SERVER_IP_LABEL_TEXT);
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
	mServerConnectButton->setText(CONNECT_BUTTON_TEXT);
	mServerConnectButton->setTextHorizontalAlignment(MAW_ALIGNMENT_CENTER);
	mServerConnectButton->setTextVerticalAlignment(MAW_ALIGNMENT_CENTER);

	mConnectLayout = new RelativeLayout();
	mConnectLayout->addChild(mServerIPLabel);
	mConnectLayout->addChild(mServerIPBox);
	mConnectLayout->addChild(mServerConnectButton);

	mMainLayout->addChild(mConnectLayout);
}

/**
 * Creates and adds the bottom layout (that contains the MoSync logo
 * and the info button) to the main layout.
 */
void LoginScreen::createBottomLayout()
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
int LoginScreen::positionLogoLayout(int screenWidth, int screenHeight, float screenRatio,
		float logoTopRatio, float logoWidthRatio, float logoHeightRatio)
{
	int height = (int)((float)screenHeight * screenRatio);
	int aboveHeight = (int)((float)height * logoTopRatio);

	int logoWidth = (int)((float)screenWidth * logoWidthRatio);
	int logoHeight = (int)((float)height * logoHeightRatio);
	int centerH = screenWidth / 2;

	if (mOS.find("iPhone") >= 0)
	{
		mLogo->setHeight(logoHeight);
		mLogo->setPosition(centerH - mLogo->getWidth()/2, 0);
	}
	else
	{
		mLogo->setWidth(logoWidth);
		mLogo->setPosition(centerH - logoWidth/2, aboveHeight);
	}

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
int LoginScreen::positionMenuLayout(int screenWidth, int screenHeight, int top, float screenRatio,
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

	mServerIPLabel->setWidth(widgetWidth);
	int labelLeft = widgetLeft;
	if(mOS.find("Windows", 0) >= 0)
	{
		labelLeft = (int)((float)screenWidth * MENU_LABEL_WINDOWS_PHONE_LEFT_RATIO);
	}

	mServerIPBox->setWidth(widgetWidth);

	mServerConnectButton->setWidth(widgetWidth);
	mServerConnectButton->setHeight(buttonHeight);

	mConnectLayout->setWidth(screenWidth);
	mConnectLayout->setHeight(height);

	mFindServersButton->setWidth(widgetWidth);
	mFindServersButton->setHeight(buttonHeight);

	mLoadStoredProjectsButton->setWidth(widgetWidth);
	mLoadStoredProjectsButton->setHeight(buttonHeight);

	// windows phone 7 orientation animation is glitchy - this is a small
	// fix for the wp7 platform - when going from portrait to landscape, the
	// repositioning is done from top to bottom but when going from landscape
	// to portrait, all the elements are repositioned bottom-up in order
	// to have a somehow smoother animation
	if (mCurrentOrientation == MA_SCREEN_ORIENTATION_LANDSCAPE_LEFT ||
			mCurrentOrientation == MA_SCREEN_ORIENTATION_LANDSCAPE_RIGHT)
	{
		mServerIPLabel->setPosition(labelLeft, labelSpacing);
		mServerIPBox->setPosition(widgetLeft, labelSpacing * 2 + labelHeight);
		mServerConnectButton->setPosition(widgetLeft, labelSpacing * 3 + labelHeight + editBoxHeight + buttonSpacing);
		mConnectLayout->setPosition(0, top);

		mFindServersButton->setPosition(widgetLeft,top + labelSpacing * 3 + labelHeight + editBoxHeight + buttonSpacing * 2 + buttonHeight);
		mLoadStoredProjectsButton->setPosition(widgetLeft,top + labelSpacing * 3 + labelHeight + editBoxHeight + buttonSpacing * 3 + buttonHeight * 2);
	}
	else
	{
		mFindServersButton->setPosition(widgetLeft,top + labelSpacing * 2 + labelHeight + editBoxHeight + buttonSpacing * 2 + buttonHeight);
		mLoadStoredProjectsButton->setPosition(widgetLeft,top + labelSpacing * 2 + labelHeight + editBoxHeight + buttonSpacing * 3 + buttonHeight * 2);

		mConnectLayout->setPosition(0, top);
		mServerConnectButton->setPosition(widgetLeft, labelSpacing * 2 + labelHeight + editBoxHeight + buttonSpacing);
		mServerIPBox->setPosition(widgetLeft, labelSpacing + labelHeight);
		mServerIPLabel->setPosition(labelLeft, labelSpacing);
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
int LoginScreen::positionBottomLayout(int screenWidth, int screenHeight, float screenRatio,
					float logoWidthRatio, float logoHeightRatio, float logoLeftRatio, float logoTopRatio,
					float infoWidthRatio, float infoLeftRatio, float infoTopRatio)
{
	int height = (int)((float)screenHeight * screenRatio);

	int top = screenHeight - height;

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
		// announce the screen listeners that the connect button was clicked
		for (int i = 0; i < mReloadUIListeners.size(); i++)
		{
			mReloadUIListeners[i]->connectButtonClicked(address);
		}

		mServerIPBox->hideKeyboard(); //Needed for iOS
	}
	else if (button == mFindServersButton)
	{
		// announce that finding servers button was clicked
		for (int i = 0; i < mReloadUIListeners.size(); i++)
		{
			mReloadUIListeners[i]->findServersButtonClicked();
		}
	}
	else if(button == mLoadStoredProjectsButton)
	{
		// announce the screen listeners that the reload last app button was clicked
		for (int i = 0; i < mReloadUIListeners.size(); i++)
		{
			mReloadUIListeners[i]->loadStoredProjectsButtonClicked();
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
void LoginScreen::orientationWillChange()
{
	int orientation = maScreenGetCurrentOrientation();
	mCurrentOrientation = orientation;
	MAExtent ex = maGetScrSize();
	int screenWidth = EXTENT_X(ex);
	int screenHeight = EXTENT_Y(ex);

	rebuildScreenLayout(screenWidth, screenHeight);
}

/**
 * Called after the screen orientation has changed.
 * Available only on iOS and Windows Phone 7.1 platforms.
 */
void LoginScreen::orientationDidChange()
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

		rebuildScreenLayout(screenWidth, screenHeight);
	}
}

/**
 * Add a reload UI event listener.
 * @param listener The listener that will receive reload UI events.
 */
void LoginScreen::addReloadUIListener(ReloadUIListener* listener)
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
void LoginScreen::removeReloadUIListener(ReloadUIListener* listener)
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

