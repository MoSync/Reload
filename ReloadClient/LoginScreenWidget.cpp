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
 * LoginScreenWidget.cpp
 *
 *  Created on: Feb 4, 2013
 *      Author: Spiridon Alexandru
 */

#include "LoginScreenWidget.h"

#define ORIENTATION_PORTRAIT "Portrait"
#define ORIENTATION_PORTRAIT_UPSIDE_DOWN "Portrait upside down"
#define ORIENTATION_LANDSCAPE_LEFT "Landscape left"
#define ORIENTATION_LANDSCAPE_RIGHT "Landscape right"

using namespace MAUtil;
using namespace NativeUI;

/**
 * Constructor.
 */
LoginScreenWidget::LoginScreenWidget():
	Screen()
{
}

/**
 * Destructor.
 */
LoginScreenWidget::~LoginScreenWidget()
{
	mLoginScreenListeners.clear();
}

/**
 * Called just before the screen begins rotating.
 */
void LoginScreenWidget::orientationWillChange()
{

}

/**
 * Called after the screen orientation has changed.
 * Available only on iOS and Windows Phone 7.1 platforms.
 */
void LoginScreenWidget::orientationDidChange()
{
	int orientation = maScreenGetCurrentOrientation();
	MAExtent ex = maGetScrSize();
	int screenWidth = EXTENT_X(ex);
	int screenHeight = EXTENT_Y(ex);

	// announce the screen listeners if the orientation has changed
	for (int i = 0; i < mLoginScreenListeners.size(); i++)
	{
		mLoginScreenListeners[i]->orientationChanged(orientation,screenWidth,screenHeight);
	}
}

/**
 * Add a login screen event listener.
 * @param listener The listener that will receive login screen events.
 */
void LoginScreenWidget::addLoginScreenListener(LoginScreenListener* listener)
{
    for (int i = 0; i < mLoginScreenListeners.size(); i++)
    {
        if (listener == mLoginScreenListeners[i])
        {
            return;
        }
    }

    mLoginScreenListeners.add(listener);
}

/**
 * Remove the login screen listener.
 * @param listener The listener that receives login screen events.
 */
void LoginScreenWidget::removeLoginScreenListener(LoginScreenListener* listener)
{
	for (int i = 0; i < mLoginScreenListeners.size(); i++)
	{
		if (listener == mLoginScreenListeners[i])
		{
			mLoginScreenListeners.remove(i);
			break;
		}
	}
}

