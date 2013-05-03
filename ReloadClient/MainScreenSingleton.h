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
 * MainScreenSingleton.h
 *
 *  Created on: Feb 28, 2013
 *      Author: Spiridon Alexandru
 */


#ifndef MAINSCREENSINGLETON_H_
#define MAINSCREENSINGLETON_H_

#include <NativeUI/Widgets.h>
using namespace NativeUI;

class MainScreen;

class MainScreenSingleton
{
public:
   static MainScreen* getInstance();

private:
   MainScreenSingleton();
   static MainScreen* pSingleton;
};

#endif /* MAINSCREENSINGLETON_H_ */
