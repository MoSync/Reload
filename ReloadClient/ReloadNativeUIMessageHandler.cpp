/*
Copyright (C) 2012 MoSync AB

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

/**
 * @file ReloadNativeUIMessageHandler.cpp
 */

#include "ReloadNativeUIMessageHandler.h"

/**
 * Constructor.
 */
ReloadNativeUIMessageHandler::ReloadNativeUIMessageHandler(NativeUI::WebView* webView)
	: Wormhole::NativeUIMessageHandler(webView)
{
	mIsUsingNativeUI = false;
}

/**
 * Destructor.
 */
ReloadNativeUIMessageHandler::~ReloadNativeUIMessageHandler()
{
}

/**
 * @return true if nativeUI messages have been seen.
 */
bool ReloadNativeUIMessageHandler::isUsingNativeUI()
{
	return mIsUsingNativeUI;
}

/**
 * Reset Native UI tracking flag.
 */
bool ReloadNativeUIMessageHandler::reset()
{
	mIsUsingNativeUI = false;
}

/**
 * Handler for native UI messages.
 */
bool ReloadNativeUIMessageHandler::handleMessage(Wormhole::MessageStream& message)
{
	mIsUsingNativeUI = true;
	Wormhole::NativeUIMessageHandler::handleMessage(message);
}
