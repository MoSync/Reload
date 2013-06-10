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
 * ServerScreen.cpp
 *
 *  Created on: May 13, 2013
 *      Author: Kostas Tsolakis
 */
#include "ServerScreen.h"

ServerScreen::ServerScreen(VerticalLayout *loginLayout,
			 	 	 	   VerticalLayout *workspaceLayout)
			: Screen()
{
	this->setEnabledLayout(1);
	mLoginLayout = loginLayout;
	mWorkspaceLayout = workspaceLayout;
}

ServerScreen::~ServerScreen()
{
}

int ServerScreen::getEnabledLayout()
{
	return mEnabledLayout;
}

void ServerScreen::setEnabledLayout(int layout)
{
	mEnabledLayout = layout;
}
