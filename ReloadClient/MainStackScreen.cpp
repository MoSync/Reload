/*
 * MainStackScreen.cpp
 *
 *  Created on: Feb 1, 2013
 *      Author: spiri
 */

#include "MainStackScreen.h"

StackScreen* MainStackScreen::pSingleton= NULL;

MainStackScreen::MainStackScreen()
{
   // do init stuff
}

StackScreen* MainStackScreen::getInstance()
{
	if (pSingleton== NULL) {
		pSingleton = new StackScreen();
	}
	return pSingleton;
}


