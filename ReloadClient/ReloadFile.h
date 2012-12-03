/*
Copyright (C) 2011 MoSync AB

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
 * @file ReloadClient.h
 *
 * This is a simple subclassing of PhoneGapFile, in order to bypass the
 * original local file system path, and supply the correct one used by Reloaded apps
 *
 *  Created on: May 8, 2012
 *      Author: Ali Sarrafi, Iraklis Rossis
 */

#include <Wormhole/Libs/PhoneGap/PhoneGapFile.h>
#include <Wormhole/Libs/JSONMessage.h>

class ReloadFileHandler: public Wormhole::PhoneGapFile
{
public:
	/**
	 * Constructor.
	 */
	ReloadFileHandler(Wormhole::PhoneGapMessageHandler* messageHandler);

	void setLocalPath(MAUtil::String &path);

	/**
	 * Return a FileSystem object.
	 */
	void actionRequestFileSystem(Wormhole::JSONMessage& message);

	/**
	 * TODO: Implement.
	 */
	void actionResolveLocalFileSystemURI(Wormhole::JSONMessage& message);

private:
	MAUtil::String mLocalPath;
};
