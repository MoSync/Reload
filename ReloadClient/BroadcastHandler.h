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
#include "LoginLayout.h"

class LoginLayout;

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
	BroadcastHandler(LoginLayout *loginScreen);

	/**
	 * Destructor.
	 */
	virtual ~BroadcastHandler();

	/**
	 * Method that starts a broadcast for server discovery
	 */
	void findServer();

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
	void broadcast();

	/**
	 * Initialize the buffer
	 */
	void initializeBuffer();

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
	LoginLayout *mLoginScreen;
};

#endif
