/*
 * ReloadFile.h
 *
 *  Created on: May 8, 2012
 *      Author: iraklis
 */

#include <Wormhole/Libs/PhoneGap/PhoneGapFile.h>
#include <Wormhole/Libs/JSONMessage.h>

class ReloadFile: public Wormhole::PhoneGapFile
{
public:

	/**
	 * Constructor.
	 */
	ReloadFile(Wormhole::PhoneGapMessageHandler* messageHandler):Wormhole::PhoneGapFile(messageHandler){};

	void setLocalPath(MAUtil::String &path);

	/**
	 * Return a FileSystem object.
	 */
	void actionRequestFileSystem(Wormhole::JSONMessage& message);

	void actionResolveLocalFileSystemURI(Wormhole::JSONMessage& message);
private:
	MAUtil::String mLocalPath;
};
