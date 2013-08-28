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
