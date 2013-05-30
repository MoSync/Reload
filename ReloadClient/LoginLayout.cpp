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
 * LoginLayout.cpp
 *
 *  Created on: Feb 4, 2013
 *      Author: Kostas Tsolakis
 */

#include "LoginLayout.h"
#include "LoginLayoutUtils.h"
#include "MAHeaders.h"

#define ORIENTATION_PORTRAIT "Portrait"
#define ORIENTATION_PORTRAIT_UPSIDE_DOWN "Portrait upside down"
#define ORIENTATION_LANDSCAPE_LEFT "Landscape left"
#define ORIENTATION_LANDSCAPE_RIGHT "Landscape right"

using namespace MAUtil;
using namespace NativeUI;

/**
 * Constructor.
 * @param os The current os.
 * @param orientation The current device orientation.
 */
LoginLayout::LoginLayout(MAUtil::String os, int orientation):
	VerticalLayout()
{
	this->mOS = os;
	this->mCurrentOrientation = orientation;

	createMainLayout();
}

/**
 * Destructor.
 */
LoginLayout::~LoginLayout()
{
	mReloadUIListeners.clear();
}

/**
 * Sets the default IP address of the server.
 * @param ipAddress The server IP default address.
 */
void LoginLayout::setDefaultIPAddress(const char *serverAddress)
{
	mServerIPBox->setText(serverAddress);
}

/**
 * Creates the screen, the layouts, the widgets and positions everything.
 */
void LoginLayout::createMainLayout()
{
	maScreenSetFullscreen(1);
	MAExtent ex = maGetScrSize();
	mScreenWidth = EXTENT_X(ex);
	mScreenHeight = EXTENT_Y(ex);

	// The widget Height is calculated from the size of the biggest side
	// of the screen
	if ( mCurrentOrientation == MA_SCREEN_ORIENTATION_LANDSCAPE_LEFT ||
		 mCurrentOrientation == MA_SCREEN_ORIENTATION_LANDSCAPE_RIGHT )
	{
		mWidgetHeight = (int)((float)mScreenWidth * WIDGET_HEIGHT_RATIO);
	}
	else
	{
		mWidgetHeight = (int)((float)mScreenHeight * WIDGET_HEIGHT_RATIO);
	}

	lprintfln("@@@ RELOAD: Screen Height=%d, Widget Height=%d", mScreenHeight, mWidgetHeight);

	createWidgetLayout();

	this->fillSpaceHorizontally();
	this->fillSpaceVertically();
}

void LoginLayout::createWidgetLayout()
{


	if(mOS == "iPhone OS")
	{
		this->setBackgroundColor(0x000000);
		mServersTitle = new ImageButton();
		((ImageButton*)mServersTitle)->addButtonListener(this);
		((ImageButton*)mServersTitle)->setBackgroundImage(RELOAD_BG);
		mServersTitle->setFontColor(0x000000);
	}
	else
	{
		mServersTitle = new Button();
		((Button*)mServersTitle)->addButtonListener(this);
	}

	mServersTitle->setText("Refresh Server List");
	mServersTitle->setHeight(mWidgetHeight);
	mServersTitle->fillSpaceHorizontally();
	mServersTitle->setTextHorizontalAlignment(MAW_ALIGNMENT_CENTER);
	mServersTitle->setTextVerticalAlignment(MAW_ALIGNMENT_CENTER);
	this->addChild(mServersTitle);


	// Available servers LIST VIEW
	mServersListView = new ListView();
	mServersListView->fillSpaceHorizontally();
	mServersListView->fillSpaceVertically();
	mServersListView->addListViewListener(this);

	this->addChild(mServersListView);

	// Create the list item for manual server ip entry
	ListViewItem * serverItem = new ListViewItem();
	if(mOS.find("iPhone") >= 0)
	{
		mServersListView->setProperty(MAW_WIDGET_BACKGROUND_COLOR,"00000000");
		serverItem->setFontColor(0xffffff);
	}
	serverItem->setText("Enter ip manually");
	serverItem->setHeight(mWidgetHeight);
	mServersListView->addChild(serverItem);

	// Create Info Icon
	HorizontalLayout * infoContainer = new HorizontalLayout();
	infoContainer->setChildHorizontalAlignment(MAW_ALIGNMENT_RIGHT);
	infoContainer->fillSpaceHorizontally();
	infoContainer->setHeight(mWidgetHeight);

	mInfoIcon = new ImageButton();
	mInfoIcon->addButtonListener(this);
	mInfoIcon->setBackgroundImage(INFO_ICON);
	mInfoIcon->setSize(mWidgetHeight, mWidgetHeight);

	infoContainer->addChild(mInfoIcon);
	this->addChild(infoContainer);
}

/**
 * Creates new Broadcast Handler that initiates server discovery
 */
void LoginLayout::findServers()
{
	if(mOS.find("Windows") < 0)
	{
		mBroadcastHandler = new BroadcastHandler(this);
		mBroadcastHandler->findServer();
	}
	else
	{
		mServersTitle->setText("Server Discovery is not Supported");
		mServersTitle->setEnabled(false);
	}
}

/**
 * Empties the server list
 */
void LoginLayout::emptyServerList()
{
	int items = mServersListView->countChildWidgets();
	lprintfln("@@@ RELOAD: list length=%d", items);
	for(int i = 0; i < items-1; i++)
	{
		Widget * listItem = mServersListView->getChild(0);
		mServersListView->removeChild(listItem);
		delete listItem;
	}
}

/**
 * Adds the server ip into the list view
 */
void LoginLayout::addServerToList(MAUtil::String serverIP)
{
	// check if already exists
	bool exists = false;
	int totalItems = mServersListView->countChildWidgets();

	for (int i = 0; i < totalItems; i++)
	{
		if (mServersListView->getChild(i)->getPropertyString("text") == serverIP)
		{
			exists = true;
		}
	}

	if(!exists)
	{
		ListViewItem * serverItem = new ListViewItem();
		serverItem->setText(serverIP);
		serverItem->setHeight(mWidgetHeight);
		if(mOS.find("iPhone") >= 0)
		{
			serverItem->setFontColor(0xffffff);
		}
		Widget *manualIp = mServersListView->getChild(totalItems-1);
		mServersListView->removeChild(manualIp);
		mServersListView->addChild(serverItem);
		mServersListView->addChild(manualIp);
	}
}

/**
 * On iOS, it's called when the return button is clicked on
 * a virtual keyboard
 * @param editBox The editbox using the virtual keyboard
 */
void LoginLayout::editBoxReturn(EditBox* editBox)
{
	editBox->hideKeyboard();
}

/**
 * Called by the system when the user clicks a button
 * @param button The button that was clicked
 */
void LoginLayout::buttonClicked(Widget *button)
{


	if(button == mServerConnectButton)
	{
		//Trim the beggining and end of the string of any spaces.
		int firstCharPos = mServerIPBox->getText().findFirstNotOf(' ', 0);
		int lastCharPos = mServerIPBox->getText().findFirstOf(' ', firstCharPos);
		lastCharPos = (lastCharPos != String::npos)?lastCharPos - 1:mServerIPBox->getText().length() - 1;
		String address = mServerIPBox->getText().substr(firstCharPos, lastCharPos - firstCharPos + 1);

		// announce the screen listeners that the connect button was clicked
		for (int i = 0; i < mReloadUIListeners.size(); i++)
		{
			mReloadUIListeners[i]->connectToSelectedServer(address);
		}

		mServerIPBox->hideKeyboard(); //Needed for iOS
	}
	else if(button == mInfoIcon)
	{
		// announce the screen listeners that the info button was clicked
		for (int i = 0; i < mReloadUIListeners.size(); i++)
		{
			mReloadUIListeners[i]->infoButtonClicked();
		}
	}
	else if(button == mServersTitle)
	{
		delete mBroadcastHandler;
		this->emptyServerList();
		this->findServers();
	}
}

void LoginLayout::listViewItemClicked(ListView *listView, ListViewItem *listViewItem)
{

	lprintfln("@@@ RELOAD: item clicked with text=%s",listViewItem->getPropertyString("text").c_str());
	if(listViewItem->getPropertyString("text") == "Enter ip manually")
	{
		listViewItem->setSelected(false,false);

		//The edit box that receives the server IP
		mServerIPBox = new EditBox();
		mServerIPBox->addEditBoxListener(this);

		for (int j = 0; j < mReloadUIListeners.size(); j++)
		{
			mReloadUIListeners[j]->defaultAddress();
		}
		mServerIPBox->setWidth((int)(mScreenWidth * 0.45));


		//The connect to server button
		if(mOS == "iPhone OS") //Android image buttons do not support text
		{
			mServerConnectButton = new ImageButton();
			((ImageButton*)mServerConnectButton)->addButtonListener(this);
			((ImageButton*)mServerConnectButton)->setBackgroundImage(CONNECT_BG);
			mServerConnectButton->setFontColor(0x000000);
			mServerConnectButton->setHeight((int)((float)mWidgetHeight * 0.8));

			mServerIPBox->setHeight((int)((float)mWidgetHeight * 0.8));
		}
		else
		{
			mServerConnectButton = new Button();
			((Button*)mServerConnectButton)->addButtonListener(this);
			mServerConnectButton->setHeight(mWidgetHeight);

			mServerIPBox->setHeight(mWidgetHeight);
		}
		mServerConnectButton->setText(CONNECT_BUTTON_TEXT);
		mServerConnectButton->setTextHorizontalAlignment(MAW_ALIGNMENT_CENTER);
		mServerConnectButton->setTextVerticalAlignment(MAW_ALIGNMENT_CENTER);
		mServerConnectButton->setWidth((int)(mScreenWidth * 0.30));


		HorizontalLayout *hLayout = new HorizontalLayout();
		hLayout->setPaddingTop((int)((float)mWidgetHeight * 0.1));
		hLayout->addChild(mServerIPBox);
		hLayout->addChild(mServerConnectButton);

		listViewItem->setText("");
		listViewItem->addChild(hLayout);
	}
	else if (listViewItem->getPropertyString("text") != "")
	{
		lprintfln("@@@ RELOAD: Connect to server %s", listViewItem->getPropertyString("text").c_str());
		for (int j = 0; j < mReloadUIListeners.size(); j++)
		{
			mReloadUIListeners[j]->connectToSelectedServer(listViewItem->getPropertyString("text"));
		}
		delete mBroadcastHandler;
	}
}

/**
 * Add a reload UI event listener.
 * @param listener The listener that will receive reload UI events.
 */
void LoginLayout::addReloadUIListener(ReloadUIListener* listener)
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
void LoginLayout::removeReloadUIListener(ReloadUIListener* listener)
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
