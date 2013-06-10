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

/**
 * @file ReloadScreenController.cpp
 *
 *  Created on: Feb 27, 2012
 *      Author: Iraklis Rossis
 */

#include "ReloadClient.h"
#include "ReloadScreenController.h"
#include "MainScreenSingleton.h"
#include "MainScreen.h"
#include "WorkspaceLayout.h"
#include "StoredProjectsScreen.h"

using namespace MAUtil; // Class Moblet
using namespace NativeUI; // WebView widget.


/**
 * Constructor.
 * @param client The ReloadClient that will handle all the reload business logic.
 */
ReloadScreenController::ReloadScreenController(ReloadClient *client) :
		mLoginLayout(NULL),
		mWorkspaceLayout(NULL),
		mStoredProjectScreen(NULL)
{
	mReloadClient = client;
}

ReloadScreenController::~ReloadScreenController()
{
	mLoginLayout->removeReloadUIListener(this);
	mWorkspaceLayout->removeReloadUIListener(this);
	mStoredProjectScreen->removeReloadUIListener(this);

	delete mLoginLayout;
	delete mWorkspaceLayout;
	delete mStoredProjectScreen;
	delete MainScreenSingleton::getInstance();
}

/**
 * Creates the screen, the layouts, the widgets and positions everything.
 * @param os A string containing the current os.
 * @param orientation One of the values:
 * 		MA_SCREEN_ORIENTATION_LANDSCAPE_LEFT
 * 		MA_SCREEN_ORIENTATION_LANDSCAPE_RIGHT
 * 		MA_SCREEN_ORIENTATION_PORTRAIT
 * 		MA_SCREEN_ORIENTATION_PORTRAIT_UPSIDE_DOWN
 */
void ReloadScreenController::initializeScreen(MAUtil::String &os, int orientation)
{
	mOS = os;

	mLoginLayout = new LoginLayout(os, orientation);
	mLoginLayout->addReloadUIListener(this);

	mWorkspaceLayout = new WorkspaceLayout(mOS, orientation);
	mWorkspaceLayout->addReloadUIListener(this);

	mServerScreen = new ServerScreen(mLoginLayout, mWorkspaceLayout);
	mServerScreen->setTitle("Server");

	if ( mOS.find("Android") >= 0 )
	{
		mServerScreen->setIcon(SERVER_ANDROID);
	}
	else if( mOS.find("iPhone OS") >= 0 )
	{
		mServerScreen->setIcon(SERVER);
	}


	//Just load whatever app we have already extracted
	if (mStoredProjectScreen == NULL)
	{
		int orientation = maScreenGetCurrentOrientation();
		mStoredProjectScreen = new StoredProjectsScreen(os, orientation, mReloadClient->getListOfSavedProjects());
		mStoredProjectScreen->setTitle("Local");
		mStoredProjectScreen->addReloadUIListener(this);
		if ( mOS.find("Android") >= 0 )
		{
			mStoredProjectScreen->setIcon(LOCAL_ANDROID);
		}
		else if( mOS.find("iPhone OS") >= 0 )
		{
			mStoredProjectScreen->setIcon(LOCAL);
		}
	}
	else
	{
		mStoredProjectScreen->updateProjectList();
	}

	mServerScreen->addChild(mLoginLayout);
	mServerScreen->setMainWidget(mLoginLayout);

	MainScreenSingleton::getInstance()->addTab(mServerScreen);
	MainScreenSingleton::getInstance()->addTab(mStoredProjectScreen);

	MainScreenSingleton::getInstance()->show();
}

/**
 * Called when the client has connected to the server.
 * @param serverAddress The server IP address.
 */
void ReloadScreenController::connectedTo(const char *serverAddress)
{
	//Success, show the disconnect controls
	String conTo = "Connected to: ";
	conTo += serverAddress;
}

/**
 * Called when the client has disconnected from the server.
 */
void ReloadScreenController::disconnected()
{
	popWorkspaceScreen();
}

/**
 * Show the login screen in the connected state
 * with the "connected" controls visible.
 */
void ReloadScreenController::showConnectedScreen()
{
	pushWorkspaceScreen();
}

/**
 * Show the login screen in the not connected state.
 */
void ReloadScreenController::showNotConnectedScreen()
{
	popWorkspaceScreen();
}

/**
 * Sets the default address (will appear inside the connect EditBox).
 * @param serverAddress The default server address.
 */
void ReloadScreenController::defaultAddress()
{
	lprintfln("@@@@ RELOAD: address=%s",mReloadClient->getServerIpAddress().c_str());
	mLoginLayout->setDefaultIPAddress(mReloadClient->getServerIpAddress().c_str());
}

/**
 * Pushes the workspace screen into the main stack.
 */
void ReloadScreenController::pushWorkspaceScreen()
{
	if (mServerScreen->getChild(0) == mLoginLayout)
	{
		mServerScreen->removeChild(mLoginLayout);
		mServerScreen->addChild(mWorkspaceLayout);
	}
	mWorkspaceLayout->updateProjectList(mReloadClient->getListOfProjects());

	mServerScreen->setEnabledLayout(2);
	MainScreenSingleton::getInstance()->show();

	lprintfln("@@@ RELOAD: push workspace mServerScreen Widgets count=%d", mServerScreen->countChildWidgets());
}

/**
 * Updates the workspace screen with new data
 */

void ReloadScreenController::updateWorkspaceScreen()
{
	mWorkspaceLayout->updateProjectList(mReloadClient->getListOfProjects());
}

/**
 * Pops the workspace screen from the stack.
 */
void ReloadScreenController::popWorkspaceScreen()
{
	mServerScreen->setEnabledLayout(1);

	mLoginLayout->emptyServerList();
	mLoginLayout->findServers();

	if( mServerScreen->countChildWidgets() > 0 && mServerScreen->getChild(0) == mWorkspaceLayout )
	{
		mServerScreen->removeChild(mWorkspaceLayout);
		mServerScreen->addChild(mLoginLayout);
	}

	MainScreenSingleton::getInstance()->show();
	lprintfln("@@@ RELOAD: pop workspace mServerScreen Widgets count=%d", mServerScreen->countChildWidgets());
}

/**
 * Called when selecting a specific server from available server list
 * @param ipAddress
 */
void ReloadScreenController::connectToSelectedServer(MAUtil::String ipAddress)
{
	mReloadClient->connectToServer(ipAddress.c_str());
}

/**
 * Called when the disconnect button is clicked.
 */
void ReloadScreenController::disconnectButtonClicked()
{
	mReloadClient->disconnectFromServer();
}

/**
 * Called when the reload last app button is clicked.
 */
void ReloadScreenController::loadStoredProjects()
{
	lprintfln("@@@@ RELOAD: loadStoredProjectsButtonClicked");
	//Just load whatever app we have already extracted
	if (mStoredProjectScreen == NULL)
	{
		lprintfln("@@@@ RELOAD: mStoredProjectScreen == NULL");
		int orientation = maScreenGetCurrentOrientation();
		mStoredProjectScreen = new StoredProjectsScreen(mOS, orientation, mReloadClient->getListOfSavedProjects());
		mStoredProjectScreen->setTitle("Stored Projects");
		mStoredProjectScreen->addReloadUIListener(this);
	}
	else
	{
		mStoredProjectScreen->updateProjectList();
	}
}

/**
 * Called when the info button is clicked.
 */
void ReloadScreenController::infoButtonClicked()
{
	//Show the info screen
	maMessageBox("Reload Client Info",mReloadClient->getInfo().c_str());
}

/**
 * Called when save project button is clicked for a particular project
 * @param projectName The name of the project to be saved
 */
void ReloadScreenController::saveProjectClicked(MAUtil::String projectName)
{
	mReloadClient->saveProjectFromServer(projectName);
}

/**
 * Called when reload project button is clicked for some particular project
 * @param projectName The name of the project to be reloaded
 */
void ReloadScreenController::reloadProjectClicked(MAUtil::String projectName)
{
	mReloadClient->reloadProjectFromServer(projectName);
}

/**
 * Called when the refresh workspace projects is clicked.
 */
void ReloadScreenController::refreshWorkspaceProjectsButtonClicked()
{
	mReloadClient->getProjectListFromServer();
}

/**
 * Called when on offline mode an reloading a saved project
 * @param projectName The name of the stored project to be reloaded
 */
void ReloadScreenController::launchSavedApp(MAUtil::String projectName)
{
	mReloadClient->launchSavedApp(projectName);
}

/**
 * If the stack screen has only one screen, the application should exit.
 * @return true if the application should exit, false otherwise.
 */
bool ReloadScreenController::shouldExit()
{
	if(mServerScreen->getEnabledLayout() > 1)
	{
		return false;
	}
	return true;
}
