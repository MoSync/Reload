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
 * ServerScreen.h
 *
 *  Created on: May 13, 2013
 *      Author: Kostas Tsolakis
 */

#ifndef SERVERSCREEN_H_
#define SERVERSCREEN_H_

#include "LoginLayout.h"
#include "WorkspaceLayout.h"

class ServerScreen : public Screen
{

public:

	ServerScreen(VerticalLayout *loginLayout,
			 	 VerticalLayout *workspaceLayout);

	~ServerScreen();

	/**
	 * Getter for mEnabledLayout
	 * @return
	 */
	int getEnabledLayout();

	/**
	 * Setter for mEnabledLayout
	 * @param layout
	 */
	void setEnabledLayout(int layout);

private:
	/**
	 * Contains the information about what layout is enabled
	 * 1 = the login layout is enabled
	 * 2 = the workspace layout is enabled
	 */
	int mEnabledLayout;

	/**
	 * Contains the Login Screen Layout
	 */
	VerticalLayout *mLoginLayout;

	/**
	 * Contains the Workspace Screen Layout
	 */
	VerticalLayout *mWorkspaceLayout;
};


#endif /* SERVERSCREEN_H_ */
