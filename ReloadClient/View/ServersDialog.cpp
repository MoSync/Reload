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
 * ServersDialog.h.cpp
 *
 *  Created on: Mar 25, 2013
 *      Author: Kostas Tsolakis
 */
#include "ServersDialog.h"

using namespace MAUtil;
using namespace NativeUI;

/**
 * Constructor.
 * @param os The current os.
 * @param orientation The current device orientation.
 */
ServersDialog::ServersDialog(String os, int orientation)
{
	this->setTitle("Available Servers");
	mOS = os;
	mCurrentOrientation = orientation;

	MAExtent ex = maGetScrSize();
	mScreenWidth = EXTENT_X(ex);
	mScreenHeight = EXTENT_Y(ex);

	mListView = new ListView();
	mListView->fillSpaceHorizontally();
	mListView->allowSelection();
	mListView->addListViewListener(this);

	this->addChild(mListView);
}

/**
 * Destructor.
 */
ServersDialog::~ServersDialog()
{

}

/**
 * Called when list view item is clicked
 * @param listView
 * @param listViewItem
 */
void ServersDialog::listViewItemClicked(ListView *listView, ListViewItem *listViewItem)
{
	lprintfln("@@@ RELOAD: Connect to server %s", listViewItem->getPropertyString("text").c_str());
	for (int j = 0; j < mReloadUIListeners.size(); j++)
	{
		mReloadUIListeners[j]->connectToSelectedServer(listViewItem->getPropertyString("text"));
	}
}

/**
 * Adds the server ip into the list view
 */
void ServersDialog::addServerToList(MAUtil::String serverIP)
{
	// check if already exists
	bool exists = false;
	int totalItems = mListView->countChildWidgets();

	for (int i = 0; i < totalItems; i++)
	{
		if (mListView->getChild(i)->getPropertyString("text") == serverIP)
		{
			exists = true;
		}
	}

	if(!exists)
	{
		ListViewItem * item = new ListViewItem();
		item->fillSpaceHorizontally();
		item->setHeight(80);
		item->setText(serverIP);

		mListView->addChild(item);
	}
}

/**
 * Empties the server list
 */
void ServersDialog::emptyServerList()
{
	int items = mListView->countChildWidgets();
	lprintfln("@@@ RELOAD: list length=%d", items);
	for(int i = 0; i < items; i++)
	{
		Widget * listItem = mListView->getChild(0);
		mListView->removeChild(listItem);
		delete listItem;
	}
}

/**
 * Add a reload UI event listener.
 * @param listener The listener that will receive reload UI events.
 */
void ServersDialog::addReloadUIListener(ReloadUIListener* listener)
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
void ServersDialog::removeReloadUIListener(ReloadUIListener* listener)
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

void ServersDialog::dialogDismissed(Dialog* dialog)
{
	for (int j = 0; j < mReloadUIListeners.size(); j++)
	{
		mReloadUIListeners[j]->connectToSelectedServer("");
	}
}
