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
 * ServersDialog.h
 *
 *  Created on: Mar 25, 2013
 *      Author: Kostas Tsolakis
 */

#ifndef AVAILABLESERVER_H_
#define AVAILABLESERVER_H_

#include <NativeUI/Widgets.h>
#include "ReloadUIListener.h"

using namespace MAUtil;
using namespace NativeUI;

class ServersDialog : public Dialog, ListViewListener, DialogListener
{
public:
	/**
	 * Constructor.
	 * @param os The current os.
	 * @param orientation The current device orientation.
	 */
	ServersDialog(MAUtil::String os, int orientation);

	/**
	 * Destructor.
	 */
	~ServersDialog();

	/**
	 * Called when list view item is clicked
	 * @param listView
	 * @param listViewItem
	 */
	void listViewItemClicked(ListView *listView, ListViewItem *listViewItem);

	/**
	 * Adds the server ip into the list view
	 */
	void addServerToList(MAUtil::String serverIP);

	/**
	 * Empties the server list
	 */
	void emptyServerList();

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

	void dialogDismissed(Dialog* dialog);

private:
	/**
	 * Array with login screen listeners.
	 */
	MAUtil::Vector<ReloadUIListener*> mReloadUIListeners;

	/**
	 * ListView that holds the available servers
	 */
	ListView *mListView;

	/**
	 * The current os.
	 */
	MAUtil::String mOS;

	/**
	 * The current screen orientation.
	 */
	int mCurrentOrientation;

	/**
	 * The device screen width
	 */
	int mScreenWidth;

	/**
	 * The device screen height
	 */
	int mScreenHeight;
};


#endif /* AVAILABLESERVER_H_ */
