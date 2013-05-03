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
 * LoginScreen.h
 *
 *  Created on: Feb 4, 2013
 *      Author: Spiridon Alexandru
 */

#ifndef LOGINSCREEN_H_
#define LOGINSCREEN_H_

#include <NativeUI/Widgets.h>

#include "ReloadUIListener.h"
#include "BroadcastHandler.h"

using namespace MAUtil;
using namespace NativeUI;

class BroadcastHandler;

class LoginScreen:
	public Screen, ButtonListener, EditBoxListener, ListViewListener
{
public:
	/**
	 * Constructor.
	 * @param os The current os.
	 * @param orientation The current device orientation.
	 */
	LoginScreen(MAUtil::String os, int orientation);

	/**
	 * Destructor.
	 */
	~LoginScreen();

	/**
	 * Sets the default IP address of the server.
	 * @param ipAddress The server IP default address.
	 */
	void setDefaultIPAddress(const char * ipAddress);

	/**
	 * Add a reload UI event listener.
	 * @param listener The listener that will receive reload UI events.
	 */
	void addReloadUIListener(ReloadUIListener* listener);

	/**
	 * Remove a reload UI listener.
	 * @param listener The listener that receives reload UI events.
	 */
	void removeReloadUIListener(ReloadUIListener* listener);

	/**
	 * Called just before the screen begins rotating.
	 */
	virtual void orientationWillChange();

	/**
	 * Called after the screen orientation has changed.
	 * Available only on iOS and Windows Phone 7.1 platforms.
	 */
	virtual void orientationDidChange();

	/**
	 * Creates new Broadcast Handler that initiates server discovery
	 */
	void findServers();

	/**
	 * Empties the server list
	 */
	void LoginScreen::emptyServerList();

	/**
	 * Adds the server ip into the list view
	 */
	void addServerToList(MAUtil::String serverIP);

private:
	/**
	 * Creates the screen, the layouts, the widgets and positions everything.
	 */
	void initializeScreen();

	/**
	 * Creates and adds the background image to the main layout.
	 * @param screenWidth Used to set the background image width.
	 * @param screenHeight Used to set the background image height.
	 */
	void createBackgroundImage(int screenWidth, int screenHeight);

	void createNewLayout();

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
	 * @param logoHeightRatio The logo height ratio (based on the layout height).
	 * @return Returns the lower x coordinate of the layout after positioning.
	 */
	int positionLogoLayout(int screenWidth, int screenHeight,
			float screenRatio, float logoTopRatio,
			float logoWidthRatio, float logoHeightRatio);

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
	int positionBottomLayout(int screenWidth, int screenHeight, float screenRatio,
			float logoWidthRatio, float logoHeightRatio, float logoLeftRatio, float logoTopRatio,
			float infoWidthRatio, float infoLeftRatio, float infoTopRatio);

	/**
	 * Repositions all the screen widgets/layouts.
	 * @param screenWidth The current screen width.
	 * @param screenHeight The current screen height.
	 */
	void rebuildScreenLayout(int screenWidth, int screenHeight);

	/**
	 * Called by the system when the user clicks a button
	 * @param button The button that was clicked
	 */
	void buttonClicked(Widget *button);

	void listViewItemClicked(ListView *listView, ListViewItem *listViewItem);

	/**
	 * On iOS, it's called when the return button is clicked on
	 * a virtual keyboard
	 * @param editBox The editbox using the virtual keyboard
	 */
	void editBoxReturn(EditBox* editBox);

private:
	int mScreenWidth;

	int mScreenHeight;

	/**
	 * Array with login screen listeners.
	 */
	MAUtil::Vector<ReloadUIListener*> mReloadUIListeners;

	/**
	 * The current os.
	 */
	MAUtil::String mOS;

	/**
	 * The current screen orientation.
	 */
	int mCurrentOrientation;

	/**
	 * The TextWidgets declared here are instantiated as either
	 * Buttons or ImageButtons depending on the platform
	 */
	ListView *mServersListView;

	TextWidget *mServersTitle;

	TextWidget *mServerConnectButton;

	TextWidget *mLoadStoredProjectsButton;

	TextWidget *mFindServersButton;

	ImageButton *mInfoIcon;

	EditBox *mServerIPBox;

	RelativeLayout *mConnectLayout;

	Label *mServerIPLabel;

	Image* mLogo;

	Image* mMosynclogo;

	Image *mBackground;

	RelativeLayout* mMainLayout;

	BroadcastHandler *mBroadcastHandler;
};

#endif /* LOGINSCREEN_H_ */
