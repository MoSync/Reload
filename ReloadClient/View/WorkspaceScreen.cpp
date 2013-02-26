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

/**
 * Constructor.
 */
WorkspaceScreen::WorkspaceScreen() :
	Screen(),
	mMainLayout(NULL)
{
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
	mRefreshButton->setText("Refresh projects");
	mRefreshButton->fillSpaceHorizontally();

	mDisconnectButton = new Button();
	mDisconnectButton->setText("Disconnect");
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

		Button* saveButton = new Button();
		saveButton->setText("Save " + MAUtil::integerToString(i));
		saveButton->addButtonListener(this);
		mSaveButtons.add(saveButton);

		Button* reloadButton = new Button();
		reloadButton->setText("Reload " + MAUtil::integerToString(i));
		reloadButton->addButtonListener(this);
		mReloadButtons.add(reloadButton);

		itemHorizontalLayout->addChild(projectNameLabel);
		itemHorizontalLayout->addChild(saveButton);
		itemHorizontalLayout->addChild(reloadButton);

		mListView->addChild(itemHorizontalLayout);
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
		mRefreshButton->setText("DIISCONENN");
		for (int i = 0; i < mReloadUIListeners.size(); i++)
		{
			mRefreshButton->setText("DIISCONENN");
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
