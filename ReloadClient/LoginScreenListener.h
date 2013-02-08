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
 * LoginScreenListener.h
 *
 *  Created on: Feb 4, 2013
 *      Author: Spiridon Alexandru
 */

#ifndef LOGINSCREENLISTENER_H_
#define LOGINSCREENLISTENER_H_

/**
 * \brief Listener for list screen events.
 */
class LoginScreenListener
{
public:
	/**
	 * This method is called the orientation changes
	 * @param newOrientation The new screen orientation. One of the values: MA_SCREEN_ORIENTATION_PORTRAIT,
	 * MA_SCREEN_ORIENTATION_PORTRAIT_UPSIDE_DOWN, MA_SCREEN_ORIENTATION_LANDSCAPE_LEFT, MA_SCREEN_ORIENTATION_LANDSCAPE_RIGHT.
	 * @param newScreenHeight The new screen height after orientation has changed.
	 * @param newScreenWidth The new screen width after oritentation has changed.
	 */
	virtual void orientationChanged(int newOrientation, int newScreenWidth, int newScreenHeight) = 0;
};


#endif /* LOGINSCREENLISTENER_H_ */
