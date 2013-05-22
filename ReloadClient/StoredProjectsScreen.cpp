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
 * StoredProjetsScreen.cpp
 *
 *  Created on: Feb 27, 2013
 *      Author: Spiridon Alexandru
 */

#include <conprint.h>
#include <wchar.h>
#include <ma.h>
#include <maassert.h>
#include <mawstring.h>
#include <mastdlib.h>

#include "MainScreenSingleton.h"
#include "MainScreen.h"
#include "StoredProjectsScreen.h"
#include "StoredProjectsScreenUtils.h"

/**
 * Constructor.
 * @param os The current os.
 * @param orientation The current device orientation.
 */
StoredProjectsScreen::StoredProjectsScreen(MAUtil::String os, int orientation,
										   MAUtil::Vector <reloadProject> * projects) :
	Screen(),
	mMainLayout(NULL)
{
	mProjects = projects;
	mOS = os;
	mCurrentOrientation = orientation;

	setScreenValues();

	createMainLayout();
}

/**
 * Destructor.
 */
StoredProjectsScreen::~StoredProjectsScreen()
{
	mListView->removeListViewListener(this);
	mReloadUIListeners.clear();
}

/**
 * Creates and adds main layout to the screen.
 */
void StoredProjectsScreen::createMainLayout() {
	// Create and add the main layout to the screen.
	mMainLayout = new VerticalLayout();
	if(mOS.find("iPhone") >= 0)
	{
		mMainLayout->setBackgroundColor(0x000000);
	}

	Screen::setMainWidget(mMainLayout);

	mScreenLabel = new Label();
	//mScreenLabel->setBackgroundColor(66,133,244);
	mScreenLabel->setBackgroundColor(0xFF8B00);
	mScreenLabel->setBackgroundGradient(0xFFA900, 0xFF7A00);
	mScreenLabel->setFontColor(0x000000);
	if(mOS.find("iPhone") >= 0)
	{
		mScreenLabel->setFontColor(0xFFFFFF);
	}
	mScreenLabel->setHeight(mWidgetHeight);
	mScreenLabel->setText("Saved Projects: " + integerToString(mProjects->size()));
	mScreenLabel->fillSpaceHorizontally();

	mMainLayout->addChild(mScreenLabel);

	mListView = new ListView();
	mListView->allowSelection(true);
	mListView->fillSpaceHorizontally();
	mListView->fillSpaceVertically();
	mListView->addListViewListener(this);

	if(mOS.find("iPhone") >= 0)
	{
		mListView->setProperty(MAW_WIDGET_BACKGROUND_COLOR,"00000000");
	}

	for (MAUtil::Vector <reloadProject>::iterator i = mProjects->begin(); i != mProjects->end(); i++)
	{
		ListViewItem* item = new ListViewItem();
		item->fillSpaceHorizontally();
		item->setHeight(mWidgetHeight);

		HorizontalLayout *itemHorizontalLayout = new HorizontalLayout();
		itemHorizontalLayout->fillSpaceHorizontally();
		itemHorizontalLayout->setHeight(mWidgetHeight);

		Label* projectNameLabel = new Label();
		projectNameLabel->setText(i->name);
		projectNameLabel->fillSpaceHorizontally();
		projectNameLabel->fillSpaceVertically();
		if(mOS.find("iPhone") >= 0)
		{
			projectNameLabel->setFontColor(0xffffff);
		}

		/**
		 * TODO: Keep this for the posibility of adding load and
		 * remove project button
		 */
		// will affect StoredProjectsScreen::buttonClicked
		//Button* loadButton = new Button();
		//loadButton->setText(LOAD_BUTTON_TEXT);
		//loadButton->setWidth((int)(mScreenWidth * mLoadButtonWidthRatio));
		//loadButton->addButtonListener(this);
		//loadButton->wrapContentHorizontally();
		//mLoadButtons.add(loadButton);

		if (mOS.find("iPhone") >= 0)
		{
			itemHorizontalLayout->setWidth(item->getWidth());
		}

		itemHorizontalLayout->addChild(projectNameLabel);
		//itemHorizontalLayout->addChild(loadButton);
		item->addChild(itemHorizontalLayout);

		mListView->addChild(item);
	}

	mMainLayout->addChild(mListView);
}

/**
 * Updates the list view that contains the stored projects
 */
void StoredProjectsScreen::updateProjectList()
{
	lprintfln("@@@ RELOAD: Updating stored projects");
	// clear the list of projects
	int oldProjects = mListView->countChildWidgets();

	for(int i = 0; i < oldProjects; i++)
	{
		Widget *listItemWidget = mListView->getChild(0); // list Item Widget

		Widget *hLayout = listItemWidget->getChild(0); // horizontal layout widget
		for( int j = 0; j < hLayout->countChildWidgets(); j++)
		{
			Widget * w = hLayout->getChild(0);
			hLayout->removeChild(w);
			delete w;
		}

		listItemWidget->removeChild(hLayout);

		delete hLayout;

		mListView->removeChild(listItemWidget);
		delete listItemWidget;
	}

	// populate the list view
	for (MAUtil::Vector <reloadProject>::iterator i = mProjects->begin(); i != mProjects->end(); i++)
	{
		lprintfln("@@@ RELOAD Project Name: %s", i->name.c_str());
		ListViewItem* item = new ListViewItem();
		item->fillSpaceHorizontally();
		item->setHeight(mWidgetHeight);

		HorizontalLayout *itemHorizontalLayout = new HorizontalLayout();
		itemHorizontalLayout->fillSpaceHorizontally();
		itemHorizontalLayout->setHeight(mWidgetHeight);
		Label* projectNameLabel = new Label();
		projectNameLabel->setText(i->name);
		projectNameLabel->fillSpaceHorizontally();
		projectNameLabel->fillSpaceVertically();
		if(mOS.find("iPhone") >= 0)
		{
			projectNameLabel->setFontColor(0xffffff);
		}

		// TODO: Keep this for the posibility of adding remove button
		// will affect StoredProjectsScreen::buttonClicked
		//Button* loadButton = new Button();
		//loadButton->setText(LOAD_BUTTON_TEXT);
		//loadButton->setWidth((int)(mScreenWidth * mLoadButtonWidthRatio));
		//loadButton->addButtonListener(this);
		//loadButton->wrapContentHorizontally();
		//mLoadButtons.add(loadButton);

		if (mOS.find("iPhone") >= 0)
		{
			itemHorizontalLayout->setWidth(item->getWidth());
		}

		itemHorizontalLayout->addChild(projectNameLabel);
		//itemHorizontalLayout->addChild(loadButton);
		item->addChild(itemHorizontalLayout);

		mListView->addChild(item);
	}
	mScreenLabel->setText("Saved Projects: " + integerToString(mProjects->size()));
	mListView->fillSpaceVertically();
}

/**
* This method is called if the touch-up event was inside the
* bounds of the button.
* @param button The button object that generated the event.
*/
//TODO: use it for deleting app functionality
void StoredProjectsScreen::buttonClicked(Widget* button)
{
	// check if a load button was clicked
	for (int i = 0; i < mLoadButtons.size(); i++)
	{
		if (button == mLoadButtons[i])
		{
			// TODO SA: add logic
			return;
		}
	}
}

/**
 * This method is called when a list view item is clicked.
 * @param listView The list view object that generated the event.
 * @param listViewItem The ListViewItem object that was clicked.
 */
void StoredProjectsScreen::listViewItemClicked(
	ListView* listView,
	ListViewItem* listViewItem)
{
	Widget * hLayout = listViewItem->getChild(0);
	Label * lb = (Label*)hLayout->getChild(0);
	int selection = 0;

	for (MAUtil::Vector <reloadProject>::iterator i = mProjects->begin(); i != mProjects->end(); i++)
	{

		if(i->name == lb->getText())
		{
			mSelectedProjectName = i->name;
			lprintfln("@@@ RELOAD: project %s was selected",lb->getText().c_str());
			break;
		}
		selection++;
	}

	for (int j = 0; j < mReloadUIListeners.size(); j++)
	{
		mReloadUIListeners[j]->launchSavedApp(mSelectedProjectName);
	}
}

/**
 * Add a reload UI event listener.
 * @param listener The listener that will receive reload UI events.
 */
void StoredProjectsScreen::addReloadUIListener(ReloadUIListener* listener)
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
void StoredProjectsScreen::removeReloadUIListener(ReloadUIListener* listener)
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
void StoredProjectsScreen::orientationDidChange()
{
	setScreenValues();

	for (int i = 0; i < mLoadButtons.size(); i++)
	{
		Button* loadButton = mLoadButtons[i];

		loadButton->setWidth((int)(mScreenWidth * mLoadButtonWidthRatio));
	}
}

/**
 * Sets the screen height/width values and the screen width ratio
 * for the save and reload buttons.
 */
void StoredProjectsScreen::setScreenValues()
{
	int orientation = maScreenGetCurrentOrientation();
	MAExtent ex = maGetScrSize();
	mScreenWidth = EXTENT_X(ex);
	mScreenHeight = EXTENT_Y(ex);

	if (orientation == MA_SCREEN_ORIENTATION_LANDSCAPE_LEFT ||
		orientation == MA_SCREEN_ORIENTATION_LANDSCAPE_RIGHT)
	{
		mLoadButtonWidthRatio = LOAD_BUTTON_LANDSCAPE_WIDTH_RATIO;
		mWidgetHeight = (int)((float)mScreenWidth * WIDGET_HEIGHT_RATIO);
	}
	else
	{
		mLoadButtonWidthRatio = LOAD_BUTTON_PORTRAIT_WIDTH_RATIO;
		mWidgetHeight = (int)((float)mScreenHeight * WIDGET_HEIGHT_RATIO);
	}
}
