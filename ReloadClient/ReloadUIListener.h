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
	virtual void loadStoredProjects() = 0;

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

	/**
	 * Called when the manual setting of server ip is clicked
	 */
	virtual void defaultAddress() = 0;
};

#endif /* RELOADUILISTENER_H_ */
