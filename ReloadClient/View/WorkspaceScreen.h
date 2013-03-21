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
 * WorkspaceScreen.h
 *
 *  Created on: Jan 31, 2013
 *      Author: Spiridon Alexandru
 */

#ifndef WORKSPACESCREEN_H_
#define WORKSPACESCREEN_H_

#include <maapi.h>
#include <MAUtil/util.h>

// Include all the wrappers.
#include <NativeUI/Widgets.h>
#include "ReloadUIListener.h"
#include "../dataTypes.h"

using namespace NativeUI;
using namespace MAUtil;

class WorkspaceScreen:
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
	WorkspaceScreen(MAUtil::String os, int orientation,
					MAUtil::Vector <reloadProject> * project);

	/**
	 * Destructor.
	 */
	~WorkspaceScreen();

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
	 * If there is no list populates the List View Widget with the project data
	 * from mProjects vector. Else destroys and deallocates previous list items
	 * and creates new ones.
	 */
	void updateProjectList();

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
	 * The button that refreshes the workspace project list.
	 */
	Button* mRefreshButton;

	/**
	 * The button that disconnects us from the server.
	 */
	Button *mDisconnectButton;

	/**
	 * The alphabetical list view.
	 */
	ListView* mListView;

	/**
	 * An array containing the list view item save buttons.
	 * Used to identify which list view item button has been clicked.
	 */
	MAUtil::Vector<Button*> mSaveButtons;

	/**
	 * An array containing the list view item reload buttons.
	 * Used to identify which list view item button has been clicked.
	 */
	MAUtil::Vector<Button*> mReloadButtons;

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
	 * The save button screen width ratio.
	 */
	float mSaveButtonWidthRatio;

	/**
	 * The reload button screen width ratio.
	 */
	float mReloadButtonWidthRatio;

	/**
	 * Pointer to the vector that holds all the projects data
	 */
	MAUtil::Vector <struct reloadProject> *mProjects;

	/**
	 * Holds the List View index of the currently selected project
	 */
	int mSelectedProject;

	/**
	 * The save button widget
	 */
	Button* mSaveButton;

	/**
	 * The reload Button widget
	 */
	Button* mReloadButton;

	/**
	 * Holds the project name of the currently selected project
	 */
	MAUtil::String mSelectedProjectName;
};

#endif /* WORKSPACESCREEN_H_ */
