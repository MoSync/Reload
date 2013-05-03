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
 * @file BroadcastHandler.h
 *
 * Functionality for Automatic Server Discovery
 *
 * Created On: Feb 19, 2013
 * 	   Author: Kostas Tsolakis
 */

#ifndef BROADCAST_HANDLER_H
#define BROADCAST_HANDLER_H

#define BUFFER_SIZE		512

#include <MAUtil/String.h>
#include <MAUtil/Vector.h>
#include <MAUtil/Connection.h>
#include "LoginScreen.h"

class LoginScreen;

/**
 * Class that broadcasts message for server discovery
 */
class BroadcastHandler :
	public MAUtil::ConnectionListener
{
public:
	/**
	 * Constructor.
	 */
	BroadcastHandler(LoginScreen *loginScreen);

	/**
	 * Destructor.
	 */
	virtual ~BroadcastHandler();

	/**
	 * Method that starts a broadcast for server discovery
	 */
	void BroadcastHandler::findServer();

	/**
	 * The connect() operation has finished.
	 */
	void connectFinished(MAUtil::Connection* conn, int result);

	/**
	 * We received a Package message from the server.
	 */
	void connRecvFinished(MAUtil::Connection* conn, int result);

	/**
	 * Socket write operation has finished.
	 */
	void connWriteFinished(MAUtil::Connection* conn, int result);

	/**
	 * Closes the connection
	 */
	void closeConnection();

private:
	/**
	 * Method that executes writeTo using UDP socket connection
	 */
	void BroadcastHandler::broadcast();

	/**
	 * Initialize the buffer
	 */
	void BroadcastHandler::initializeBuffer();

	/**
	 * The UDP socket used for registering with the server
	 * and listening for commands from the server.
	 */
	MAUtil::Connection mDatagramSocket;

	/**
	 * The data that are broadcasted to the network
	 */
	char mBroadcastedData[6];

	/**
	 * The data structure used to read data from the server
	 */
	char mBuffer[BUFFER_SIZE];

	/**
	 * The sender's address
	 */
	MAConnAddr mAddress;

	/**
	 * To wich ip send the data to broadcast: 255.255.255.255
	 */
	MAConnAddr mBroadcastAddress;

	/**
	 * Servers ip
	 */
	MAUtil::String mServerAddress;

	/**
	 * The dialog of available server
	 */
	LoginScreen *mLoginScreen;
};

#endif
