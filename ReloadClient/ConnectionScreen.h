/*
 * ConnectionScreen.h
 *
 *  Created on: Jan 31, 2013
 *      Author: spiri
 */

#ifndef CONNECTIONSCREEN_H_
#define CONNECTIONSCREEN_H_

#include <maapi.h>
#include <MAUtil/util.h>

#include "ReloadUIListener.h"

// Include all the wrappers.
#include <NativeUI/Widgets.h>

using namespace NativeUI;

class ConnectionScreen:
	public Screen,
	public ButtonListener
{
public:
	/**
	 * Constructor.
	 */
	ConnectionScreen(MAUtil::String os, int orientation);

	/**
	 * Destructor.
	 */
	~ConnectionScreen();

	/**
	 *
	 * @param address
	 */
	void fillConnectionData(const char* address);

	/**
	 * Add a login screen event listener.
	 * @param listener The listener that will receive login screen events.
	 */
	void addReloadUIListener(ReloadUIListener* listener);

	/**
	 * Remove the login screen listener.
	 * @param listener The listener that receives login screen events.
	 */
	void removeReloadUIListener(ReloadUIListener* listener);

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
	 *
	 * @param screenWidth
	 * @param screenHeight
	 */
	void rebuildScreenLayout(int screenWidth, int screenHeight);

    /**
	* This method is called if the touch-up event was inside the
	* bounds of the button.
	* @param button The button object that generated the event.
	*/
	virtual void buttonClicked(Widget* button);

	/**
	 * Called just before the screen begins rotating.
	 */
	virtual void orientationWillChange();

	/**
	 * Called after the screen orientation has changed.
	 * Available only on iOS and Windows Phone 7.1 platforms.
	 */
	virtual void orientationDidChange();

private:
	/**
	 * Array with login screen listeners.
	 */
	MAUtil::Vector<ReloadUIListener*> mReloadUIListeners;

	/**
	 * The current os.
	 */
	MAUtil::String mOS;

	int mCurrentOrientation;

	ImageButton *mInfoIcon;

	/**
	 * The TextWidgets declared here are instantiated as either
	 * Buttons or ImageButtons depending on the platform
	 */

	TextWidget *mServerDisconnectButton;

	TextWidget *mLoadLastAppButton;

	RelativeLayout *mDisconnectLayout;

	Label *mConnectedToLabel;

	Label *mInstructionsLabel;

	Image* mLogo;

	Image* mMosynclogo;

	Image *mBackground;

	RelativeLayout* mMainLayout;
};


#endif /* CONNECTIONSCREEN_H_ */
