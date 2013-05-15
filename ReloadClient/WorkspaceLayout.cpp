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

#include "WorkspaceLayout.h"
#include "WorkspaceLayoutUtils.h"
#include "MAHeaders.h"

/**
 * Constructor.
 * @param os The current os.
 * @param orientation The current device orientation.
 */
WorkspaceLayout::WorkspaceLayout(MAUtil::String os, int orientation) :
	VerticalLayout()
{

	mSelectedProject = -1;
	mSelectedProjectName = "";
	mOS = os;
	mCurrentOrientation = orientation;

	setScreenValues();

	createMainLayout();
}

/**
 * Destructor.
 */
WorkspaceLayout::~WorkspaceLayout()
{
	mListView->removeListViewListener(this);
	mReloadUIListeners.clear();
}

/**
 * Creates and adds main layout to the screen.
 */
void WorkspaceLayout::createMainLayout() {

	// Create the main layout.
	HorizontalLayout *controlButtonsContainer = new HorizontalLayout();
	controlButtonsContainer->fillSpaceHorizontally();
	controlButtonsContainer->setHeight(mWidgetHeight);

	if(mOS == "iPhone OS")
	{

		mRefreshButton = new ImageButton();
		((ImageButton*)mRefreshButton)->addButtonListener(this);
		((ImageButton*)mRefreshButton)->setBackgroundImage(RELOAD_BG);
		mRefreshButton->setFontColor(0x000000);

		mDisconnectButton = new ImageButton();
		((ImageButton*)mDisconnectButton)->addButtonListener(this);
		((ImageButton*)mDisconnectButton)->setBackgroundImage(RELOAD_BG);
		mDisconnectButton->setFontColor(0x000000);

		mSaveButton = new ImageButton();
		((ImageButton*)mSaveButton)->addButtonListener(this);
		((ImageButton*)mSaveButton)->setBackgroundImage(RELOAD_BG);
		mSaveButton->setFontColor(0x000000);

		mReloadButton = new ImageButton();
		((ImageButton*)mReloadButton)->addButtonListener(this);
		((ImageButton*)mReloadButton)->setBackgroundImage(CONNECT_BG);
		mReloadButton->setFontColor(0x000000);
	}
	else
	{
		mRefreshButton = new Button();
		((Button*)mRefreshButton)->addButtonListener(this);

		mDisconnectButton = new Button();
		((Button*)mDisconnectButton)->addButtonListener(this);

		mSaveButton = new Button();
		((Button*)mSaveButton)->addButtonListener(this);

		mReloadButton = new Button();
		((Button*)mReloadButton)->addButtonListener(this);
	}

	mRefreshButton->setText(REFRESH_LIST_BUTTON_TEXT);
	mRefreshButton->setHeight(mWidgetHeight);
	mRefreshButton->fillSpaceHorizontally();

	mDisconnectButton->setText(DISCONNECT_BUTTON_TEXT);
	mDisconnectButton->setHeight(mWidgetHeight);
	mDisconnectButton->fillSpaceHorizontally();

	controlButtonsContainer->addChild(mDisconnectButton);
	controlButtonsContainer->addChild(mRefreshButton);

	// Create Project Control Buttons SAVE and RELOAD
	mSaveButton->setText(SAVE_BUTTON_TEXT);
	mSaveButton->setWidth((int)(mScreenWidth * mSaveButtonWidthRatio));

	mReloadButton->setText(RELOAD_BUTTON_TEXT);
	mReloadButton->setWidth((int)(mScreenWidth * mReloadButtonWidthRatio));

	mListView = new ListView();
	mListView->allowSelection(true);
	mListView->addListViewListener(this);
	if(mOS.find("iPhone") >= 0)
	{
		mListView->setProperty(MAW_WIDGET_BACKGROUND_COLOR,"00000000");
	}

	this->addChild(controlButtonsContainer);
	this->addChild(mListView);

	// Create the activity indicator widgets
	mActivityIndicatorContainer = new RelativeLayout();
	mActivityIndicatorContainer->fillSpaceHorizontally();
	mActivityIndicatorContainer->fillSpaceVertically();

	/**
	 * FIXME Removing listView and adding Activity indicator causes
	 * the list view not getting events until some point,
	 * when removing activity indicator to add the list again.
	 */
	//ActivityIndicator *loadingProjectsIndicator = new ActivityIndicator();
	//loadingProjectsIndicator->setSize(80,80);
	//loadingProjectsIndicator->setPosition((int)(mScreenWidth*0.5) - 40, (int)(mScreenHeight*0.5) - 80 );
	//mActivityIndicatorContainer->addChild(loadingProjectsIndicator);

	this->setBackgroundColor(0x000000);
}

/**
 * If there is no list populates the List View Widget with the project data
 * from mProjects vector. Else destroys and deallocates previous list items
 * and creates new ones.
 */
void WorkspaceLayout::updateProjectList(MAUtil::Vector <reloadProject> * projects)
{
	// Remove The ListView and add An Activity Indicator
	lprintfln("Updating Project List");
	mListView->setVisible(false);

	/**
	 * FIXME Removing listView and adding Activity indicator causes
	 * the list view not getting events until some point,
	 * when removing activity indicator to add the list again.
	 */
	//this->removeChild(mListView);
	//this->addChild(mActivityIndicatorContainer);

	// If there was a project Selected before update remove the
	// control buttons
	if(mSelectedProject != -1)
	{
		Widget *h = mListView->getChild(mSelectedProject)->getChild(0);
		h->removeChild(h->getChild(1));
		h->removeChild(h->getChild(1));
	}

	// ReInitialize selected project
	mSelectedProject = -1;
	mSelectedProjectName = "";

	// Delete all the widgets from the ListView
	int prProjects = mListView->countChildWidgets();
	if(prProjects != 0)
	{
		for(int i = 0; i < prProjects; i++)
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
	}

	// Re-populate the ListView with projects
	for (MAUtil::Vector <reloadProject>::iterator i = projects->begin(); i != projects->end(); i++)
	{
		// New List Itemprojects
		ListViewItem* item = new ListViewItem();
		item->setHeight(mWidgetHeight);
		item->fillSpaceHorizontally();

		// New Horizontal Layout
		HorizontalLayout *itemHorizontalLayout = new HorizontalLayout();
		itemHorizontalLayout->fillSpaceHorizontally();
		itemHorizontalLayout->setHeight(mWidgetHeight);

		// New Label
		Label* projectNameLabel = new Label();
		projectNameLabel->setTextHorizontalAlignment(MAW_ALIGNMENT_LEFT);
		projectNameLabel->setTextVerticalAlignment(MAW_ALIGNMENT_CENTER);
		projectNameLabel->setText(i->name);
		projectNameLabel->fillSpaceHorizontally();
		projectNameLabel->fillSpaceVertically();

		if (mOS.find("iPhone") >= 0)
		{
			itemHorizontalLayout->setWidth(item->getWidth());
			projectNameLabel->setFontColor(0xffffff);
		}

		itemHorizontalLayout->addChild(projectNameLabel);

		item->addChild(itemHorizontalLayout);

		mListView->addChild(item);
	}
	mListView->setVisible(true);

	// Remove Indicator and Add Project ListView
	//this->addChild(mListView);
	//this->removeChild(mActivityIndicatorContainer);

}

/**
* This method is called if the touch-up event was inside the
* bounds of the button.
* @param button The button object that generated the event.
*/
void WorkspaceLayout::buttonClicked(Widget* button)
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
	else if (button == mSaveButton)
	{
		for (int i = 0; i < mReloadUIListeners.size(); i++)
		{
			mReloadUIListeners[i]->saveProjectClicked(mSelectedProjectName);
		}
	}
	else if (button == mReloadButton)
	{
		for (int i = 0; i < mReloadUIListeners.size(); i++)
		{
			mReloadUIListeners[i]->reloadProjectClicked(mSelectedProjectName);
		}
	}
}

/**
 * This method is called when a list view item is clicked.
 * @param listView The list view object that generated the event.
 * @param listViewItem The ListViewItem object that was clicked.
 */
void WorkspaceLayout::listViewItemClicked(
		ListView * listView,
		int index )
{
	lprintfln("@@@ RELOAD: Project Selected No: %d", index);
	Widget *project = listView->getChild(index);
	ListViewItem *tmp = (ListViewItem*)project;
	tmp->setSelected(false, false);

	Widget *hLayout = project->getChild(0);
	Label  *projectName = (Label*)hLayout->getChild(0);


	// Diselect previous item
	if (mSelectedProject != -1)
	{
		Widget *delItem = listView->getChild(mSelectedProject);
		Widget *delHLayout = delItem->getChild(0);
		delHLayout->removeChild(mSaveButton);
		delHLayout->removeChild(mReloadButton);
	}

	// Add control Buttons to the currently selected Project
	hLayout->addChild(mSaveButton);
	hLayout->addChild(mReloadButton);

	if (mOS.find("iPhone") >= 0)
	{
		hLayout->setWidth(project->getWidth());
	}

	mSelectedProject = index;
	mSelectedProjectName = projectName->getText();

	lprintfln("@@@ RELOAD: Selected Project No:%d, Name:%s", index,  mSelectedProjectName.c_str());
}

/**
 * Add a reload UI event listener.
 * @param listener The listener that will receive reload UI events.
 */
void WorkspaceLayout::addReloadUIListener(ReloadUIListener* listener)
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
void WorkspaceLayout::removeReloadUIListener(ReloadUIListener* listener)
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
 * Sets the screen height/width values and the screen width ratio
 * for the save and reload buttons.
 */
void WorkspaceLayout::setScreenValues()
{
	int orientation = maScreenGetCurrentOrientation();
	MAExtent ex = maGetScrSize();
	mScreenWidth = EXTENT_X(ex);
	mScreenHeight = EXTENT_Y(ex);

	if (orientation == MA_SCREEN_ORIENTATION_LANDSCAPE_LEFT ||
		orientation == MA_SCREEN_ORIENTATION_LANDSCAPE_RIGHT)
	{
		mSaveButtonWidthRatio = SAVE_BUTTON_LANDSCAPE_WIDTH_RATIO;
		mReloadButtonWidthRatio = RELOAD_BUTTON_LANDSCAPE_WIDTH_RATIO;
		mWidgetHeight = (int)((float)mScreenWidth * WIDGET_HEIGHT_RATIO);
	}
	else
	{
		mSaveButtonWidthRatio = SAVE_BUTTON_PORTRAIT_WIDTH_RATIO;
		mReloadButtonWidthRatio = RELOAD_BUTTON_PORTRAIT_WIDTH_RATIO;
		mWidgetHeight = (int)((float)mScreenHeight * WIDGET_HEIGHT_RATIO);
	}

}
