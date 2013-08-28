/* Copyright 2013 David Axmark

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/*
 * LoginLayout.h
 *
 *  Created on: Feb 4, 2013
 *      Author: Kostas Tsolakis
 */

#ifndef LOGINLAYOUT_H_
#define LOGINLAYOUT_H_

#include <NativeUI/Widgets.h>

#include "ReloadUIListener.h"
#include "BroadcastHandler.h"

using namespace MAUtil;
using namespace NativeUI;

class BroadcastHandler;

class LoginLayout:
	public VerticalLayout, ButtonListener, EditBoxListener, ListViewListener
{
public:
	/**
	 * Constructor.
	 * @param os The current os.
	 * @param orientation The current device orientation.
	 */
	LoginLayout(MAUtil::String os, int orientation);

	/**
	 * Destructor.
	 */
	~LoginLayout();

	/**
	 * Sets the default IP address of the server.
	 * @param ipAddress The server IP default address.
	 */
	void setDefaultIPAddress(const char * ipAddress);

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
	 * Creates new Broadcast Handler that initiates server discovery
	 */
	void findServers();

	/**
	 * Empties the server list
	 */
	void emptyServerList();

	/**
	 * Adds the server ip into the list view
	 */
	void addServerToList(MAUtil::String serverIP);

private:
	/**
	 * Creates the screen, the layouts, the widgets and positions everything.
	 */
	void createMainLayout();

	void createWidgetLayout();

	/**
	 * Called by the system when the user clicks a button
	 * @param button The button that was clicked
	 */
	void buttonClicked(Widget *button);

	void listViewItemClicked(ListView *listView, ListViewItem *listViewItem);

	/**
	 * On iOS, it's called when the return button is clicked on
	 * a virtual keyboard
	 * @param editBox The editbox using the virtual keyboard
	 */
	void editBoxReturn(EditBox* editBox);

private:
	int mScreenWidth;

	int mScreenHeight;

	/**
	 * Array with login screen listeners.
	 */
	MAUtil::Vector<ReloadUIListener*> mReloadUIListeners;

	/**
	 * The current os.
	 */
	MAUtil::String mOS;

	/**
	 * The current screen orientation.
	 */
	int mCurrentOrientation;

	/**
	 * The TextWidgets declared here are instantiated as either
	 * Buttons or ImageButtons depending on the platform
	 */
	ListView *mServersListView;

	TextWidget *mServersTitle;

	TextWidget *mServerConnectButton;

	ImageButton *mInfoIcon;

	EditBox *mServerIPBox;

	RelativeLayout *mConnectLayout;

	VerticalLayout* mMainLayout;

	BroadcastHandler *mBroadcastHandler;

	/**
	 * Stores the widget Height depending on the screen size
	 */
	int mWidgetHeight;
};

#endif /* LOGINLAYOUT_H_ */
