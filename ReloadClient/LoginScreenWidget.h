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
 * LoginScreenWidget.h
 *
 *  Created on: Feb 4, 2013
 *      Author: Spiridon Alexandru
 */

#ifndef LOGINSCREENWIDGET_H_
#define LOGINSCREENWIDGET_H_

#include <NativeUI/Widgets.h>

#include "LoginScreenListener.h"

using namespace MAUtil;
using namespace NativeUI;

class LoginScreenWidget:
	public Screen
{

public:
	/**
	 * Constructor.
	 */
	LoginScreenWidget();

	/**
	 * Destructor.
	 */
	~LoginScreenWidget();

	/**
	 * Add a login screen event listener.
	 * @param listener The listener that will receive login screen events.
	 */
	void addLoginScreenListener(LoginScreenListener* listener);

	/**
	 * Remove the login screen listener.
	 * @param listener The listener that receives login screen events.
	 */
	void removeLoginScreenListener(LoginScreenListener* listener);

	/**
	 * Called just before the screen begins rotating.
	 */
	virtual void orientationWillChange();

	/**
	 * Called after the screen orientation has changed.
	 * Available only on iOS and Windows Phone 7.1 platforms.
	 */
	virtual void orientationDidChange();

private:
	/**
	 * Array with login screen listeners.
	 */
	MAUtil::Vector<LoginScreenListener*> mLoginScreenListeners;
};

#endif /* LOGINSCREENWIDGET_H_ */
