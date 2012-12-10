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
 * @file ReloadNativeUIMessageHandler.h
 */

#include <Wormhole/Libs/JSNativeUI/NativeUIMessageHandler.h>

class ReloadNativeUIMessageHandler: public Wormhole::NativeUIMessageHandler
{
public:
	/**
	 * Constructor.
	 */
	ReloadNativeUIMessageHandler(NativeUI::WebView* webView);

	/**
	 * Destructor.
	 */
	virtual ~ReloadNativeUIMessageHandler();

	/**
	 * @return true if nativeUI messages have been seen.
	 */
	virtual bool isUsingNativeUI();

	/**
	 * Reset Native UI tracking flag.
	 */
	virtual bool reset();

	/**
	 * Handler for native UI messages.
	 */
	virtual bool handleMessage(Wormhole::MessageStream& message);

private:
	bool mIsUsingNativeUI;
};
