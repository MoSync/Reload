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
#include "View/MainStackSingleton.h"
#include "View/MainStackScreen.h"
#include "View/WorkspaceScreen.h"
#include "View/StoredProjectsScreen.h"
#include "View/ServersDialog.h"

using namespace MAUtil; // Class Moblet
using namespace NativeUI; // WebView widget.

/**
 * Constructor.
 * @param client The ReloadClient that will handle all the reload business logic.
 */
ReloadScreenController::ReloadScreenController(ReloadClient *client) :
		mLoginScreen(NULL),
		mWorkspaceScreen(NULL),
		mStoredProjectScreen(NULL),
		mServersDialog(NULL)
{
	mReloadClient = client;
}

ReloadScreenController::~ReloadScreenController()
{
	mLoginScreen->removeReloadUIListener(this);
	mWorkspaceScreen->removeReloadUIListener(this);
	mStoredProjectScreen->removeReloadUIListener(this);

	delete mLoginScreen;
	delete mWorkspaceScreen;
	delete mStoredProjectScreen;

	delete MainStackSingleton::getInstance();
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

	mLoginScreen = new LoginScreen(os, orientation);
	mLoginScreen->addReloadUIListener(this);

	MainStackSingleton::getInstance()->push(mLoginScreen);
	MainStackSingleton::getInstance()->show();
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
void ReloadScreenController::defaultAddress(const char *serverAddress)
{
	mLoginScreen->setDefaultIPAddress(serverAddress);
}

/**
 * Pushes the workspace screen into the main stack.
 */
void ReloadScreenController::pushWorkspaceScreen()
{
	mLoginScreen->setTitle("");
	if (mWorkspaceScreen == NULL)
	{
		int orientation = maScreenGetCurrentOrientation();
		mWorkspaceScreen = new WorkspaceScreen(mOS, orientation, mReloadClient->getListOfProjects());
		mWorkspaceScreen->setTitle("Workspace");
		mWorkspaceScreen->addReloadUIListener(this);
	}
	else
	{
		mWorkspaceScreen->updateProjectList();
		MainStackSingleton::getInstance()->show();
	}

	if(MainStackSingleton::getInstance()->getStackSize() < 2)
	{
		MainStackSingleton::getInstance()->push(mWorkspaceScreen);
	}
}

/**
 * Updates the workspace screen with new data
 */

void ReloadScreenController::updateWorkspaceScreen()
{
	mWorkspaceScreen->updateProjectList();
}

/**
 * Pops the workspace screen from the stack.
 */
void ReloadScreenController::popWorkspaceScreen()
{
	int screenCount = MainStackSingleton::getInstance()->getStackSize();

	if (screenCount >= 2)
	{
		MainStackSingleton::getInstance()->pop();
		mLoginScreen->setTitle("Login screen");
	}
}

/**
 * Called when the connect button is clicked.
 * @param address The address contained by the connect EditBox.
 */
void ReloadScreenController::connectButtonClicked(String address)
{
	mReloadClient->connectToServer(address.c_str());
}

/**
 * Called when find servers button is clicked
 */
void ReloadScreenController::findServersButtonClicked()
{
	if(mServersDialog == NULL)
	{
		int orientation = maScreenGetCurrentOrientation();
		mServersDialog = new ServersDialog(mOS, orientation);
		mServersDialog->setTitle("Servers");
		mServersDialog->addReloadUIListener(this);
	}

	mServersDialog->show();
	// TODO: make broadcast for server discovery
}

/**
 * Called when selecting a specific server from available server list
 * @param ipAddress
 */
void ReloadScreenController::connectToSelectedServer(MAUtil::String ipAddress)
{
	mServersDialog->hide();
	defaultAddress(ipAddress.c_str());
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
void ReloadScreenController::loadStoredProjectsButtonClicked()
{
	//Just load whatever app we have already extracted
	if (mStoredProjectScreen == NULL)
	{
		int orientation = maScreenGetCurrentOrientation();
		mStoredProjectScreen = new StoredProjectsScreen(mOS, orientation, mReloadClient->getListOfSavedProjects());
		mStoredProjectScreen->setTitle("Stored Projects");
		mStoredProjectScreen->addReloadUIListener(this);
	}

	MainStackSingleton::getInstance()->push(mStoredProjectScreen);
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
	if (MainStackSingleton::getInstance()->getStackSize() > 1)
	{
		return false;
	}
	return true;
}
