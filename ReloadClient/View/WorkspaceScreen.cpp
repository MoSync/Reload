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
 * WorkspaceScreen.cpp
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

#include "WorkspaceScreen.h"
#include "WorkspaceScreenUtils.h"

/**
 * Constructor.
 * @param os The current os.
 * @param orientation The current device orientation.
 */
WorkspaceScreen::WorkspaceScreen(MAUtil::String os, int orientation) :
	Screen(),
	mMainLayout(NULL)
{
	mOS = os;
	setScreenValues();
	createMainLayout();

	//Set the moblet to receive events from the buttons and listview
	mRefreshButton->addButtonListener(this);
	mDisconnectButton->addButtonListener(this);
	mListView->addListViewListener(this);
}

/**
 * Destructor.
 */
WorkspaceScreen::~WorkspaceScreen()
{
	mRefreshButton->removeButtonListener(this);
	mDisconnectButton->removeButtonListener(this);
	mListView->removeListViewListener(this);

	mReloadUIListeners.clear();
}

/**
 * Creates and adds main layout to the screen.
 */
void WorkspaceScreen::createMainLayout() {
	// Create and add the main layout to the screen.
	mMainLayout = new VerticalLayout();
	Screen::setMainWidget(mMainLayout);

	mRefreshButton = new Button();
	mRefreshButton->setText(REFRESH_LIST_BUTTON_TEXT);
	mRefreshButton->fillSpaceHorizontally();

	mDisconnectButton = new Button();
	mDisconnectButton->setText(DISCONNECT_BUTTON_TEXT);
	mDisconnectButton->fillSpaceHorizontally();

	mListView = new ListView();

	// the list view doesn't automatically sort its elements - the
	// developer has to handle the sorting
	for (int i = 0; i <= 9; i++)
	{
		ListViewItem* item = new ListViewItem();

		HorizontalLayout *itemHorizontalLayout = new HorizontalLayout();
		Label* projectNameLabel = new Label();
		projectNameLabel->setText("Project " + MAUtil::integerToString(i));
		projectNameLabel->fillSpaceHorizontally();
		projectNameLabel->fillSpaceVertically();

		Button* saveButton = new Button();
		saveButton->setText(SAVE_BUTTON_TEXT);
		saveButton->setWidth((int)(mScreenWidth * mSaveButtonWidthRatio));
		saveButton->addButtonListener(this);
		saveButton->wrapContentHorizontally();
		mSaveButtons.add(saveButton);

		Button* reloadButton = new Button();
		reloadButton->setText(RELOAD_BUTTON_TEXT);
		reloadButton->setWidth((int)(mScreenWidth * mReloadButtonWidthRatio));
		reloadButton->addButtonListener(this);
		reloadButton->wrapContentHorizontally();
		mReloadButtons.add(reloadButton);

		if (mOS.find("iPhone") >= 0)
		{
			itemHorizontalLayout->setWidth(item->getWidth());
		}

		itemHorizontalLayout->addChild(projectNameLabel);
		itemHorizontalLayout->addChild(saveButton);
		itemHorizontalLayout->addChild(reloadButton);
		item->addChild(itemHorizontalLayout);

		mListView->addChild(item);
	}

	mMainLayout->addChild(mDisconnectButton);
	mMainLayout->addChild(mListView);
	mMainLayout->addChild(mRefreshButton);
}


/**
* This method is called if the touch-up event was inside the
* bounds of the button.
* @param button The button object that generated the event.
*/
void WorkspaceScreen::buttonClicked(Widget* button)
{
	if (button == mRefreshButton)
	{
		for (int i = 0; i < mReloadUIListeners.size(); i++)
		{
			mReloadUIListeners[i]->refreshWorkspaceProjectsButtonClicked();
		}
	}
	else if (button == mDisconnectButton)
	{
		for (int i = 0; i < mReloadUIListeners.size(); i++)
		{
			mReloadUIListeners[i]->disconnectButtonClicked();
		}
	}
	else
	{
		// check if a save button was clicked
		for (int i = 0; i < mSaveButtons.size(); i++)
		{
			if (button == mSaveButtons[i])
			{
				// TODO SA: add logic
				return;
			}
		}

		// check if a reload button was clicked
		for (int i = 0; i < mReloadButtons.size(); i++)
		{
			if (button == mReloadButtons[i])
			{
				// TODO SA: add logic
				return;
			}
		}
	}
}

/**
 * This method is called when a list view item is clicked.
 * @param listView The list view object that generated the event.
 * @param listViewItem The ListViewItem object that was clicked.
 */
void WorkspaceScreen::listViewItemClicked(
	ListView* listView,
	ListViewItem* listViewItem)
{

}

/**
 * Add a reload UI event listener.
 * @param listener The listener that will receive reload UI events.
 */
void WorkspaceScreen::addReloadUIListener(ReloadUIListener* listener)
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
void WorkspaceScreen::removeReloadUIListener(ReloadUIListener* listener)
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

/**
 * Called after the screen orientation has changed.
 * Available only on iOS and Windows Phone 7.1 platforms.
 */
void WorkspaceScreen::orientationDidChange()
{
	setScreenValues();

	for (int i = 0; i < mSaveButtons.size(); i++)
	{
		Button* saveButton = mSaveButtons[i];
		Button* reloadButton = mReloadButtons[i];

		saveButton->setWidth((int)(mScreenWidth * mSaveButtonWidthRatio));
		reloadButton->setWidth((int)(mScreenWidth * mReloadButtonWidthRatio));
	}
}

/**
 * Sets the screen height/width values and the screen width ratio
 * for the save and reload buttons.
 */
void WorkspaceScreen::setScreenValues()
{
	int orientation = maScreenGetCurrentOrientation();
	MAExtent ex = maGetScrSize();
	mScreenWidth = EXTENT_X(ex);
	mScreenHeight = EXTENT_Y(ex);

	// on wp7 the screen size on landscape has the same values as portrait
	// so we need to swap those values
	if ((orientation == MA_SCREEN_ORIENTATION_LANDSCAPE_LEFT ||
			orientation == MA_SCREEN_ORIENTATION_LANDSCAPE_RIGHT) &&
			mOS.find("Windows", 0) >= 0)
	{
		int aux = mScreenWidth;
		mScreenWidth = mScreenHeight;
		mScreenHeight = aux;
	}

	if (orientation == MA_SCREEN_ORIENTATION_LANDSCAPE_LEFT ||
		orientation == MA_SCREEN_ORIENTATION_LANDSCAPE_RIGHT)
	{
		mSaveButtonWidthRatio = SAVE_BUTTON_LANDSCAPE_WIDTH_RATIO;
		mReloadButtonWidthRatio = RELOAD_BUTTON_LANDSCAPE_WIDTH_RATIO;
	}
	else
	{
		mSaveButtonWidthRatio = SAVE_BUTTON_PORTRAIT_WIDTH_RATIO;
		mReloadButtonWidthRatio = RELOAD_BUTTON_PORTRAIT_WIDTH_RATIO;
	}
}
