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
	for(int i = 0; i < BUFFER_SIZE; i++)
	{
		mBuffer[i] = NULL;
	}
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
