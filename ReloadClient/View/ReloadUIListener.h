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
 * ReloadUIListener.h
 *
 *  Created on: Feb 4, 2013
 *      Author: Spiridon Alexandru
 */

#ifndef RELOADUILISTENER_H_
#define RELOADUILISTENER_H_

/**
 * \brief Listener for reload UI events.
 */
class ReloadUIListener
{
public:
	/**
	 * Called when the connect button is clicked.
	 * @param address The address contained by the connect EditBox.
	 */
	virtual void connectButtonClicked(MAUtil::String address) = 0;

	/**
	 * Called when the find servers button is clicked.
	 */
	virtual void findServersButtonClicked() = 0;

	/**
	 * Called when selecting a specific server from available server list
	 * @param ipAddress
	 */
	virtual void connectToSelectedServer(MAUtil::String ipAddress) = 0;

	/**
	 * Called when the disconnect button is clicked.
	 */
	virtual void disconnectButtonClicked() = 0;

	/**
	 * Called when the refresh workspace projects is cliecked.
	 */
	virtual void refreshWorkspaceProjectsButtonClicked() = 0;

	/**
	 * Called when the reload last app button is clicked.
	 */
	virtual void loadStoredProjectsButtonClicked() = 0;

	/**
	 * Called when save project button is clicked for some particular project
	 * @param projectName
	 */
	virtual void saveProjectClicked(MAUtil::String projectName) = 0;

	/**
	 * Called when reload project button is clicked for some particular project
	 * @param projectName
	 */
	virtual void reloadProjectClicked(MAUtil::String projectName) = 0;

	/**
	 * Called when on offline mode and selecting a project to load
	 * @param projectName
	 */
	virtual void launchSavedApp(MAUtil::String  projectName) = 0;

	/**
	 * Called when the info button is clicked.
	 */
	virtual void infoButtonClicked() = 0;
};

#endif /* RELOADUILISTENER_H_ */
