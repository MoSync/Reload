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
