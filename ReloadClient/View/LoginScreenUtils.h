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
 * LoginScreenUtils.h
 *
 *  Created on: Feb 6, 2013
 *      Author: Spiridon Alexandru
 */

#ifndef LOGINSCREENUTILS_H_
#define LOGINSCREENUTILS_H_

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

#define LOGO_SCREEN_HEIGHT_LANDSCAPE_RATIO 0.25
#define LOGO_TOP_LANDSCAPE_RATIO 0.25
#define LOGO_WIDTH_LANDSCAPE_RATIO 0.6

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
#define MENU_BUTTON_SPACING_LANDSCAPE_RATIO 0.05

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
#define BOTTOM_INFO_WIDTH_LANDSCAPE_RATIO 0.07
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

#endif /* LOGINSCREENUTILS_H_ */
