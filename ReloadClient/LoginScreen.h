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
	void rebuildScreenLayout(int screenWidth, int screenHeight, String os, int orientation);
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
	 * Creates and adds the background image to the main layout.
	 * @param screenWidth Used to set the background image width.
	 * @param screenHeight Used to set the background image height.
	 */
	void createBackgroundImage(int screenWidth, int screenHeight);

	/**
	 * Creates the upper layout of the main screen (that contains the Reload logo)
	 * and adds it to the main layout.
	 */
	void createLogoLayout();

	/**
	 * Creates the middle layout of the main screen (that contains the menu)
	 * and adds it to the main layout.
	 */
	void createMenuLayout();

	/**
	 * Creates the connected layout and adds it to the menu layout.
	 */
	void createConnectedLayout();

	/**
	 * Creates the disconnected layout and adds it to the menu layout.
	 */
	void createDisconnectedLayout();

	/**
	 * Creates and adds the bottom layout (that contains the MoSync logo
	 * and the info button) to the main layout.
	 */
	void createBottomLayout();

	/**
	 * Positions the upper layout (containing the Reload logo) on the main layout.
	 * @param screenWidth The device screen width.
	 * @param screenHeight The device screen height.
	 * @param screenRatio Defines how much space the layout will occupy on the Y axix.
	 * @param logoTopRatio The logo top ratio (based on the layout height).
	 * @param logoWidthRatio The logo width ratio (based on the layout width).
	 * @return Returns the lower x coordinate of the layout after positioning.
	 */
	int positionLogoLayout(int screenWidth, int screenHeight,
			float screenRatio, float logoTopRatio, float logoWidthRatio);

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
	int positionMenuLayout(int screenWidth, int screenHeight, int top, float screenRatio,
			float widgetWidthRatio, float widgetLeftRatio,
			float labelHeightRatio, float labelSpacingRatio,
			float editBoxHeightRatio, float buttonHeightRatio, float buttonSpacingRatio);

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
	int positionBottomLayout(int screenWidth, int screenHeight, int top, float screenRatio,
			float logoWidthRatio, float logoHeightRatio, float logoLeftRatio, float logoTopRatio,
			float infoWidthRatio, float infoLeftRatio, float infoTopRatio);

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
	virtual void orientationChanged(int newOrientation, int newScreenWidth, int newScreenHeight);

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

	int mCurrentOrientation;
};


#endif /* LOGINSCREEN_H_ */
