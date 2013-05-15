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
 * SplashScreen.h
 *
 *  Created on: May 2, 2013
 *      Author: Kostas Tsolakis
 */

#ifndef SPLASHSCREEN_H_
#define SPLASHSCREEN_H_

#include <NativeUI/Widgets.h>

using namespace MAUtil;
using namespace NativeUI;


class SplashScreen : public Screen
{
public:
	/**
	 * Default Constructor
	 */
	SplashScreen();

	/**
	 * Default Destructor
	 */
	~SplashScreen();

private:
	/**
	 * Widget that holds mosync image needed for WP
	 */
	Widget *mMosync;
	/**
	 * Reload logo Widget
	 */
	Image *mReloadImage;

	/**
	 * Mosync logo Widget
	 */
	Image *mMosyncImage;

	/**
	 * Powered by label
	 */
	Label * mPoweredBy;

	/**
	 * Relative  layout container that holds all
	 * the elements of the splash screen
	 */
	VerticalLayout *mContainer;

};


#endif /* SPLASHSCREEN_H_ */
