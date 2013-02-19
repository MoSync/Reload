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

using namespace NativeUI;

class WorkspaceScreen:
	public Screen,
	public ListViewListener,
	public ButtonListener
{

public:
	/**
	 * Constructor.
	 */
	WorkspaceScreen();

	/**
	 * Destructor.
	 */
	~WorkspaceScreen();

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
	 * This method is called when a segmented/alphabetical list view item is clicked.
	 * @param listView The list view object that generated the event.
	 * @param listViewSection The ListViewSection object that contains the selected item.
	 * @param listViewItem The ListViewItem objet clicked.
	 */
	virtual void segmentedListViewItemClicked(
		ListView* listView,
		ListViewSection* listViewSection,
		ListViewItem* listViewItem);
private:
	/**
	 * Main layout.
	 */
	VerticalLayout* mMainLayout;

	/**
	 *
	 */
	Button* mRefreshButton;

	/**
	 * The alphabetical list view.
	 */
	ListView* mListView;
};

#endif /* WORKSPACESCREEN_H_ */
