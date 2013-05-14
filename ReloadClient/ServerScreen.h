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
