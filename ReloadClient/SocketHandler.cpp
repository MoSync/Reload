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
 * @file SocketHandler.cpp
 *
 * Helpers for managing socket communication
 * with the the Reload server.
 *
 * Author: Mikael Kindborg
 */

#include <maheap.h>
#include "SocketHandler.h"
#include "Convert.h"
#include "Log.h"

using namespace MAUtil;

SocketHandler::SocketHandler() :
	mSocket(this)
{
	// 17 = 9 (Magic header) + 8 (message size hex data).
	mHeaderBufferSize = 17;
	mMagicHeader = "RELOADMSG";

	mReadState = 0;
	mReadBuffer = NULL;
}

SocketHandler::~SocketHandler()
{
	deallocateReadBuffer();
}

// ========== High-level public protocol ==========

void SocketHandler::setListener(SocketHandlerListener* listener)
{
	mListener = listener;
}

int SocketHandler::connectToServer(
	const MAUtil::String& serverAddress,
	const MAUtil::String& port)
{
	char buffer[512];

	mSocket.close();
	sprintf(buffer, "socket://%s:%s",
		serverAddress.c_str(),
		port.c_str());
	LOG("@@@ RELOAD: Connect string: %s", buffer);
	return mSocket.connect(buffer);
}

void SocketHandler::closeConnection()
{
	mSocket.close();

	// TODO: Should we call this? No, I think.
	mListener->socketHandlerDisconnected(0);
}

void SocketHandler::sendMessage(const char* message)
{
	// Get message size.
	String messageLength = Convert::intToHex(strlen(message));

	// Do we have a valid size string?
	if (messageLength.length() != 8)
	{
		maPanic(0, "ReloadClient::sendTCPMessage: messageLength.length != 8");
	}

	// Create message data, starting with a magic header.
	String data = mMagicHeader + messageLength + message;

	// Queue the data.
	mSendQueue.add(data);

	// Send it directly if this is the only item to be sent.
	// If there are elements waiting in the queue, they will
	// be sent in connWriteFinished.
	if (mSendQueue.size() == 1)
	{
		// Send the data.
		mSocket.write(data.c_str(), data.length());
	}
}

void SocketHandler::readMessageHeader()
{
	mReadState = 1;

	// Read header of next message sent from server.
	readRawData(mHeaderBufferIn, mHeaderBufferSize);
}

/**
 * Read next message sent from server.
 * @param size Message size
 */
void SocketHandler::readMessage(int size)
{
	mReadState = 2;

	allocateReadBuffer(size);

	// Read message sent from server.
	readRawData(mReadBuffer, size);
}

// ========== ConnectionListener protocol ==========

/**
 * The socket->connect() operation has completed.
 */
void SocketHandler::connectFinished(Connection* conn, int result)
{
	if (result > 0)
	{
		// Call connected callback.
		mListener->socketHandlerConnected(result);

		// Read header of first message.
		readMessageHeader();
	}
	else
	{
		// Call with error code.
		mListener->socketHandlerConnected(result);
	}
}

void SocketHandler::connReadFinished(Connection* conn, int result)
{
	if (result > 0)
	{
		// Did we get the message header?
		if (1 == mReadState)
		{
			// We have the header, get the message size.
			mHeaderBufferIn[mHeaderBufferSize] = 0;
			const char* sizeHeader = mHeaderBufferIn + mMagicHeader.length();
			int size = Convert::hexToInt(sizeHeader);
			LOG("@@@ SocketHandler::connReadFinished header size: %s %i",
				sizeHeader, size);

			// Read the actual message data.
			readMessage(size);
		}
		// Did we get the message data?
		else if (2 == mReadState)
		{
			// NULL-terminate message and call listener callback.
			mReadBuffer[mReadSize] = 0;

			// Read next message. The message can be Disconnect and
			// close the socket. That's why read is called before
			// handling the Message
			readMessageHeader();

			mListener->socketHandlerMessageReceived(mReadBuffer);
		}
		else
		{
			maPanic(0, "SocketHandler::connReadFinished: invalid read state");
		}
	}
	else
	{
		// TODO: Should we call this?
		mListener->socketHandlerDisconnected(result);
	}
}

void SocketHandler::connRecvFinished(Connection* conn, int result)
{
	// Not used.
}

void SocketHandler::connWriteFinished(Connection* conn, int result)
{
	if (result > 0)
	{
		// Write has finished, remove written element (first in queue).
		mSendQueue.remove(0);

		// Is there more data waiting to be sent?
		if (mSendQueue.size() > 0)
		{
			// Send first in queue.
			mSocket.write((mSendQueue[0]).c_str(), (mSendQueue[0]).length());
		}
	}
	else
	{
		// Empty the queue.
		mSendQueue.clear();

		// TODO: Should we call this?
		mListener->socketHandlerDisconnected(result);
	}
}

// ========== Low-level internal protocol ==========

void SocketHandler::deallocateReadBuffer()
{
	if (mReadBuffer)
	{
		free(mReadBuffer);
		mReadBuffer = NULL;
	}
}

void SocketHandler::allocateReadBuffer(int size)
{
	deallocateReadBuffer();

	mReadSize = size;

	// Make room for ending NULL terminator.
	mReadBuffer = (char*) malloc(size + 1);
}

void SocketHandler::readRawData(char* buffer, int numBytes)
{
	mSocket.read(buffer, numBytes);
}

void SocketHandler::sendRawData(const char* buffer, int numBytes)
{
	mSocket.write(buffer, numBytes);
}

