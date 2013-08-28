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
 * @file SocketHandler.h
 *
 * Helpers for managing socket communication
 * with the the Reload server.
 *
 * Author: Mikael Kindborg
 */

#ifndef MOSYNC_RELOAD_SOCKET_HANDLER_H
#define MOSYNC_RELOAD_SOCKET_HANDLER_H

#include <MAUtil/String.h>
#include <MAUtil/Vector.h>
#include <MAUtil/Connection.h>

/**
 * Abstract class that communicates back socket events to the client.
 */
class SocketHandlerListener
{
public:
	/**
	 * The connection to the server was established.
	 * @param result >0 on success, <0 on error.
	 */
	virtual void socketHandlerConnected(int result) = 0;

	/**
	 * The server disconnected.
	 * @param result Result code.
	 */
	virtual void socketHandlerDisconnected(int result) = 0;

	/**
	 * A message from the server was received.
	 * @param message Pointer to data or NULL if an error occurred.
	 * The pointed is valid for the duraction of this call and must NOT
	 * be deallocated by the client.
	 */
	virtual void socketHandlerMessageReceived(const char* message) = 0;
};

/**
 * Class that handles socket communication in the ReloadClient.
 * This class implements the communication protocol between the
 * client and the server.
 */
class SocketHandler :
	public MAUtil::ConnectionListener
{
public:
	/**
	 * Constructor.
	 */
	SocketHandler();

	/**
	 * Destructor.
	 */
	virtual ~SocketHandler();

	// ========== High-level public protocol ==========

	/**
	 * Set client who will get callbacks for socket events.
	 */
	void setListener(SocketHandlerListener* listener);

	/**
	 * Open connection to the server.
	 */
	int connectToServer(
		const MAUtil::String& serverAddress,
		const MAUtil::String& port);

	/**
	 * Close the connection to the server.
	 */
	void closeConnection();

	/**
	 * Send a message to the server.
	 * @param message Zero-terminated string.
	 */
	void sendMessage(const char* message);

	/**
	 * Read next message header sent from server.
	 */
	void readMessageHeader();

	/**
	 * Read next message sent from server.
	 * @param size Message size
	 */
	void readMessage(int size);

public:

	// ========== ConnectionListener protocol ==========

	/**
	 * The socket->connect() operation has finished.
	 */
	void connectFinished(MAUtil::Connection* conn, int result);

	/**
	 * We received a TCP message from the server.
	 * Not used.
	 */
	void connRecvFinished(MAUtil::Connection* conn, int result);

	/**
	 * Socket write operation has finished.
	 */
	void connWriteFinished(MAUtil::Connection* conn, int result);

	/**
	 * Socket read operation has finished.
	 */
	void connReadFinished(MAUtil::Connection* conn, int result);

protected:

	// ========== Low-level internal protocol ==========

	/**
	 * Deallocate internal read buffer.
	 */
	void deallocateReadBuffer();

	/**
	 * Allocate internal read buffer.
	 * @param size Size of buffer.
	 */
	void allocateReadBuffer(int size);

	/**
	 * Read numBytes of data from the socket into buffer.
	 * @param buffer
	 * @param numBytes
	 */
	void readRawData(char* buffer, int numBytes);

	/**
	 * Write numBytes of data to the socket from buffer.
	 * @param buffer
	 * @param numBytes
	 */
	void sendRawData(const char* buffer, int numBytes);

protected:

	// ========== Instance variables ==========

	/**
	 * Object that listens for incoming data.
	 */
	SocketHandlerListener* mListener;

	/**
	 * The TCP socket used for registering with the server
	 * and listening for commands from the server.
	 */
	MAUtil::Connection mSocket;

	/**
	 * Buffer for incoming TCP messages.
	 */
	char* mReadBuffer;

	/**
	 * Size of message being read.
	 */
	int mReadSize;

	/**
	 * Tells hat is being read. 1 for header, 2 for data.
	 */
	int mReadState;

	/**
	 * Array of string buffers used to send data.
	 * Used as a queue.
	 */
	MAUtil::Vector<MAUtil::String> mSendQueue;

	/**
	 * Magic message header has string "RELOADMSG" followed
	 * by 8-char hex number with message size. The header
	 * is not included in the message size.
	 */
	char mHeaderBufferIn[18];
	int mHeaderBufferSize;
	MAUtil::String mMagicHeader;
};

#endif
