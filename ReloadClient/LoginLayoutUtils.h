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
 * LoginScreenUtils.h
 *
 *  Created on: Feb 6, 2013
 *      Author: Spiridon Alexandru
 */

#ifndef LOGINLAYOUTUTILS_H_
#define LOGINLAYOUTUTILS_H_

/**
 * Text resources for UI elements
 */
#define SERVER_IP_LABEL_TEXT "Server IP:"
#define CONNECT_BUTTON_TEXT "Connect"
#define FIND_SERVERS_BUTTON_TEXT "Find servers"
#define LOAD_STORED_PROJECTS_TEXT "Load stored projects"

/**
 * The logo is the top part of the screen. Here are defined
 * a couple of values used to position the logo elements.
 */
#define LOGO_SCREEN_HEIGHT_PORTRAIT_RATIO 0.20
#define LOGO_TOP_PORTRAIT_RATIO 0.25
#define LOGO_WIDTH_PORTRAIT_RATIO 0.75
#define LOGO_HEIGHT_PORTRAIT_RATIO 0.60

#define LOGO_SCREEN_HEIGHT_LANDSCAPE_RATIO 0.15
#define LOGO_TOP_LANDSCAPE_RATIO 0.25
#define LOGO_WIDTH_LANDSCAPE_RATIO 0.4
#define LOGO_HEIGHT_LANDSCAPE_RATIO 0.75

/**
 * The menu is the middle part of the screen. Here are defined
 * a couple of values used to position the menu elements.
 */
#define MENU_SCREEN_HEIGHT_PORTRAIT_RATIO 0.7
#define MENU_WIDGET_WIDTH_PORTRAIT_RATIO 0.8
#define MENU_WIDGET_LEFT_PORTRAIT_RATIO 0.1
#define MENU_LABEL_HEIGHT_PORTRAIT_RATIO 0.08
#define MENU_LABEL_SPACING_PORTRAIT_RATIO 0.02
#define MENU_EDIT_BOX_HEIGHT_PORTRAIT_RATIO 0.1
#define MENU_BUTTON_HEIGHT_PORTRAIT_RATIO 0.15
#define MENU_BUTTON_SPACING_PORTRAIT_RATIO 0.03

// on wp7 the label is not centered as it should
#define MENU_LABEL_WINDOWS_PHONE_LEFT_RATIO 0.2

#define MENU_SCREEN_HEIGHT_LANDSCAPE_RATIO 0.65
#define MENU_WIDGET_WIDTH_LANDSCAPE_RATIO 0.8
#define MENU_WIDGET_LEFT_LANDSCAPE_RATIO 0.1
#define MENU_LABEL_HEIGHT_LANDSCAPE_RATIO 0.1
#define MENU_LABEL_SPACING_LANDSCAPE_RATIO 0.02
#define MENU_EDIT_BOX_HEIGHT_LANDSCAPE_RATIO 0.14
#define MENU_BUTTON_HEIGHT_LANDSCAPE_RATIO 0.25
#define MENU_BUTTON_SPACING_LANDSCAPE_RATIO 0.02

#define CONNECTION_MENU_SCREEN_HEIGHT_PORTRAIT_RATIO 0.75
#define CONNECTION_MENU_SCREEN_HEIGHT_LANDSCAPE_RATIO 0.60

/**
 * The bottom part of the screen contains the MoSync logo and the info button.
 * Here are defined a couple of values used to position the two widgets.
 */
#define BOTTOM_SCREEN_HEIGHT_LANDSCAPE_RATIO 0.1
#define BOTTOM_LOGO_WIDTH_LANDSCAPE_RATIO 0.3
#define BOTTOM_LOGO_HEIGHT_LANDSCAPE_RATIO 0.6
#define BOTTOM_LOGO_LEFT_LANDSCAPE_RATIO 0.05
#define BOTTOM_LOGO_TOP_LANDSCAPE_RATIO 0.1
#define BOTTOM_INFO_WIDTH_LANDSCAPE_RATIO 0.04
#define BOTTOM_INFO_LEFT_LANDSCAPE_RATIO 0.07
#define BOTTOM_INFO_TOP_LANDSCAPE_RATIO -0.2

#define BOTTOM_SCREEN_HEIGHT_PORTRAIT_RATIO 0.1
#define BOTTOM_LOGO_WIDTH_PORTRAIT_RATIO 0.3
#define BOTTOM_LOGO_HEIGHT_PORTRAIT_RATIO 0.6
#define BOTTOM_LOGO_LEFT_PORTRAIT_RATIO 0.05
#define BOTTOM_LOGO_TOP_PORTRAIT_RATIO 0.1
#define BOTTOM_INFO_WIDTH_PORTRAIT_RATIO 0.1
#define BOTTOM_INFO_LEFT_PORTRAIT_RATIO 0.1
#define BOTTOM_INFO_TOP_PORTRAIT_RATIO 0.1

#define WIDGET_HEIGHT_RATIO 0.1

#endif /* LOGINLAYOUTUTILS_H_ */
