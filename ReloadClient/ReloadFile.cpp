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

#include "ReloadFile.h"

// File system options.
#define LOCALFILESYSTEM_TEMPORARY 0
#define LOCALFILESYSTEM_PERSISTENT 1
#define LOCALFILESYSTEM_RESOURCE 2
#define LOCALFILESYSTEM_APPLICATION 3

// FileTransfer error codes.
#define FILETRANSERERROR_FILE_NOT_FOUND_ERR "1"
#define FILETRANSERERROR_INVALID_URL_ERR "2"
#define FILETRANSERERROR_CONNECTION_ERR "3"

// File error codes.
#define FILEERROR_NOT_FOUND_ERR "1"
#define FILEERROR_SECURITY_ERR "2"
#define FILEERROR_ABORT_ERR "3"
#define FILEERROR_NOT_READABLE_ERR "4"
#define FILEERROR_ENCODING_ERR "5"
#define FILEERROR_NO_MODIFICATION_ALLOWED_ERR "6"
#define FILEERROR_INVALID_STATE_ERR "7"
#define FILEERROR_SYNTAX_ERR "8"
#define FILEERROR_INVALID_MODIFICATION_ERR "9"
#define FILEERROR_QUOTA_EXCEEDED_ERR "10"
#define FILEERROR_TYPE_MISMATCH_ERR "11"
#define FILEERROR_PATH_EXISTS_ERR "12"


void ReloadFile::setLocalPath(MAUtil::String &path)
{
	mLocalPath = path;
}

/**
 * Return a FileSystem object.
 */
void ReloadFile::actionRequestFileSystem(Wormhole::JSONMessage& message)
{
	MAUtil::String callbackID = message.getParam("PhoneGapCallBackId");

	// We support only persistent storage.
	int type = message.getArgsFieldInt("type");
	if (LOCALFILESYSTEM_PERSISTENT != type)
	{
		callFileError(callbackID, FILEERROR_NO_MODIFICATION_ALLOWED_ERR);
		return;
	}

	// Size parameter must be zero.
	int size = message.getArgsFieldInt("size");
	if (0 != size)
	{
		callFileError(callbackID, FILEERROR_NO_MODIFICATION_ALLOWED_ERR);
		return;
	}

	// Get local root path and remove trailing slash, if any.
	MAUtil::String path = mLocalPath;

	// If we get just a slash, we won't remove the last slash.
	// TODO: It is unclear if PhoneGap requires all path names
	// to not end with a slash, or if it does not matter. Typical
	// directory entry has name "sdcard" and full path "/sdcard".
	if (path.size() == 1 && '/' == path[0])
	{
		// Just a slash, do nothing.
	}
	else if (path.size() > 1 && '/' == path[path.size() - 1])
	{
		// Remove last slash.
		path = path.substr(0, path.size() - 1);
	}

	MAUtil::String fileName = path;

	// Remove last slash if path ends with a slash.
	if ('/' == fileName[fileName.size() - 1])
	{
		fileName = fileName.substr(0, fileName.size() - 1);
	}

	// Find last slash.
	int pos = fileName.findLastOf('/');
	if (!(MAUtil::String::npos == pos))
	{

		// Move to position after the '/'
		pos = pos + 1;

		// Return file name.
		fileName = fileName.substr(pos, fileName.size() - pos);
	}
	MAUtil::String rootEntry = emitDirectoryEntry(
			fileName,path);

	MAUtil::String fileSystemInfo = emitFileSystemInfo("persistent", rootEntry);
	callSuccess(
		callbackID,
		fileSystemInfo,
		"window.localFileSystem._castFS");
}

