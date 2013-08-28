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
 * @file BroadcastHandler.cpp
 *
 * Functionality for Automatic Server Discovery
 *
 * Created on: Feb 19, 2013
 *     Author: Kostas Tsolakis
 */

#include "BroadcastHandler.h"

#include <maheap.h>
#include "Convert.h"
#include "Log.h"

using namespace MAUtil;

/**
 * Constructor.
 */
BroadcastHandler::BroadcastHandler(LoginLayout *loginScreen) :
	mDatagramSocket(this)
{
	mLoginScreen = loginScreen;

	// Initialize broadcastAddress
	mBroadcastAddress.family = CONN_FAMILY_INET4;
	mBroadcastAddress.inet4.addr = (255 << 24) | (255 << 16) | (255 << 8) | 255;
	mBroadcastAddress.inet4.port = 41234;

	// Initialize buffer, server address and other data
	initializeBuffer();
	this->mServerAddress = "";
	sprintf(mBroadcastedData,"%s","CONREQ");
}

/**
 * Destructor.
 */
BroadcastHandler::~BroadcastHandler()
{
	closeConnection();
}

/**
 * Initialize the buffer
 */
void BroadcastHandler::initializeBuffer()
{
	memset(mBuffer, 0, BUFFER_SIZE);
}

/**
 * Method that starts a broadcast for server discovery
 */
void BroadcastHandler::findServer()
{
	int res = mDatagramSocket.connect("datagram://");
	lprintfln("@@@ RELOAD: findServer connect: %i\n", res);
	if(res > 0)
	{
		broadcast();
	}
}

/**
 * Closes the connection
 */
void BroadcastHandler::closeConnection()
{
	mDatagramSocket.close();
}

/**
 * Method that executes writeTo using UDP socket connection
 */
void BroadcastHandler::broadcast()
{
	lprintfln("@@@ RELOAD: mBroadcastAddres.family = %d", mBroadcastAddress.family);
	mDatagramSocket.writeTo(mBroadcastedData, 6, mBroadcastAddress);
}

/**
 * The connect() operation has finished.
 */
void BroadcastHandler::connectFinished(Connection* conn, int result)
{
	lprintfln("@@@ RELOAD: connectFinished connection:%d",result);
	if(result < 0) {
		return;
	}
}

/**
 * We received a Package message from the server.
 */
void BroadcastHandler::connRecvFinished(Connection* conn, int result)
{
	lprintfln("@@@ RELOAD: connRecvFinished: %i\n", result);
	if(result < 0)
	{
		return;
	}
	else
	{
		mServerAddress = mBuffer;
		lprintfln("@@@ RELOAD: SERVER RESPONSE:%s",mBuffer);

		initializeBuffer();
		mLoginScreen->addServerToList(mServerAddress);
	}
	mDatagramSocket.recvFrom(mBuffer, sizeof(mBuffer), &mAddress);
}

/**
 * Socket write operation has finished.
 */
void BroadcastHandler::connWriteFinished(Connection* conn, int result)
{
	mDatagramSocket.recvFrom(mBuffer, sizeof(mBuffer), &mAddress);
}
