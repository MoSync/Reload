/*
 * WorkspaceScreen.cpp
 *
 *  Created on: Jan 31, 2013
 *      Author: spiri
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

	//Set the moblet to receive events from the button
	mRefreshButton->addButtonListener(this);
	mListView->addListViewListener(this);

	// TODO SA: get all the projects from the server
}

/**
 * Destructor.
 */
WorkspaceScreen::~WorkspaceScreen()
{
	mRefreshButton->removeButtonListener(this);
	mListView->removeListViewListener(this);
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

	mListView = new ListView(LIST_VIEW_TYPE_ALPHABETICAL);

	// the list view doesn't automatically sort its elements - the
	// developer has to handle the sorting
	for (int i = 0; i <= 4; i++)
	{
		ListViewSection* section = new ListViewSection(LIST_VIEW_SECTION_TYPE_ALPHABETICAL);
		MAUtil::String sectionTitle = "A";
		sectionTitle[0] += i;
		section->setTitle(sectionTitle);
		section->setHeaderText(sectionTitle);

		mListView->addChild(section);
		for (int j = 0; j <= 3; j++)
		{
			ListViewItem* item = new ListViewItem();
			MAUtil::String itemText = "Project " + sectionTitle + "0";
			item->setText(itemText);
			item->setSubtitle("project type");
			section->addItem(item);
		}
	}

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
		// TODO SA: refresh all projects (get them from the server)
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
 * This method is called when a segmented/alphabetical list view item is clicked.
 * @param listView The list view object that generated the event.
 * @param listViewSection The ListViewSection object that contains the selected item.
 * @param listViewItem The ListViewItem objet clicked.
 */
void WorkspaceScreen::segmentedListViewItemClicked(
	ListView* listView,
	ListViewSection* listViewSection,
	ListViewItem* listViewItem)
{

}
