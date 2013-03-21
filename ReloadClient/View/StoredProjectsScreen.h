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
 * StoredProjectsScreen.h
 *
 *  Created on: Feb 27, 2013
 *      Author: Spiridon Alexandru
 */

#ifndef STOREDPROJECTSSCREEN_H_
#define STOREDPROJECTSSCREEN_H_

#include <NativeUI/Widgets.h>
#include "ReloadUIListener.h"

using namespace NativeUI;
using namespace MAUtil;

class StoredProjectsScreen:
	public Screen,
	public ListViewListener,
	public ButtonListener
{

public:
	/**
	 * Constructor.
	 * @param os The current os.
	 * @param orientation The current device orientation.
	 */
	StoredProjectsScreen(MAUtil::String os, int orientation);

	/**
	 * Destructor.
	 */
	~StoredProjectsScreen();

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

private:
	/**
	 * Creates and adds main layout to the screen.
	 */
	void createMainLayout();

    /**
	* This method is called if the touch-up event was inside the
	* bounds of the button.
	* @param button The button object that generated the event.
	*/
	virtual void buttonClicked(Widget* button);

	/**
	 * This method is called when a list view item is clicked.
	 * @param listView The list view object that generated the event.
	 * @param listViewItem The ListViewItem object that was clicked.
	 */
	virtual void listViewItemClicked(
		ListView* listView,
		ListViewItem* listViewItem);

	/**
	 * Called after the screen orientation has changed.
	 * Available only on iOS and Windows Phone 7.1 platforms.
	 */
	virtual void orientationDidChange();

	/**
	 * Sets the screen height/width values and the screen width ratio
	 * for the save and reload buttons.
	 */
	void setScreenValues();
private:
	/**
	 * Array with login screen listeners.
	 */
	MAUtil::Vector<ReloadUIListener*> mReloadUIListeners;

	/**
	 * Main layout.
	 */
	VerticalLayout* mMainLayout;

	/**
	 * The alphabetical list view.
	 */
	ListView* mListView;

	/**
	 * An array containing the list view item reload buttons.
	 * Used to identify which list view item button has been clicked.
	 */
	MAUtil::Vector<Button*> mLoadButtons;

	/**
	 * The platform the client is running on.
	 */
	MAUtil::String mOS;

	/**
	 * The device screen width.
	 */
	int mScreenWidth;

	/**
	 * The device screen height.
	 */
	int mScreenHeight;

	/**
	 * The reload button screen width ratio.
	 */
	float mLoadButtonWidthRatio;
};

#endif /* STOREDPROJECTSSCREEN_H_ */
