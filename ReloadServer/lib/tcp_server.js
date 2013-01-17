var vars = require('../application/globals');

/**
 * Object that accumulates data sent over a streaming
 * protocol (TCP).
 * A separator string is used to delimit the start and
 * end of a message.
 */
var dataAccumulator = (function()
{
	var self = {};
	var separatorLength = 16;
	var separator = null;
	var accumulatedData = "";
	
	/**
	 * Reset the accumulator. Will keep any data after the
	 * ending separator.
	 */
	self.reset = function()
	{
		// If a separator is set, then scan for ending
		// separator to preserve any accumunated data.
		if (separator)
		{
			// Find ending separator.
			var index = accumulatedData.indexOf(separator);
			if (index >= 0)
			{
				// This could be an empty string if no data follows
				// the ending separator.
				accumulatedData = accumulatedData.substr(index + separatorLength);
			}
			else
			{
				// No separatyor found, resent to empty string.
				accumulatedData = "";
			}
		}
		
		// Reset separator.
		separator = null;
	};
	
	/**
	 * Read (accumulate) data.
	 */
	self.read = function(data)
	{
		if (!separator)
		{
			separator = data.substr(0, separatorLength);
			accumulatedData = accumulatedData + data.substr(separatorLength);
		}
		else 
		{
			accumulatedData = accumulatedData + data;
		}
		separator = ;
	};
	
	/**
	 * Scan for message.
	 */
	self.getMessage = function()
	{
		
		return accumulatedData;
	};
	
	return self;
}();

/**
 * Object that accumulates data sent over a streaming
 * protocol (TCP).
 * A hex size header (8 characters) is used to encode
 * the length of a message.
 */
var dataAccumulator = (function()
{
	var self = {};
	var messageLength = 0;
	var remainingLength = 0;
	var accumulatedData = "";
	
	/**
	 * Reset the accumulator. Will keep any data after the
	 * ending separator.
	 */
	self.reset = function()
	{
		if (remainingLength == 0)
		{
			// Find ending separator.
			var index = accumulatedData.indexOf(separator);
			if (index >= 0)
			{
				// This could be an empty string if no data follows
				// the ending separator.
				accumulatedData = accumulatedData.substr(index + separatorLength);
			}
			else
			{
				// No separatyor found, resent to empty string.
				accumulatedData = "";
			}
		}
		
		// Reset separator.
		separator = null;
	};
	
	/**
	 * Read (accumulate) data.
	 */
	self.read = function(data)
	{
		// If messageLength is not set, the assume
		// we are getting it as the first 8 characters.
		if (messageLength == 0)
		{
			var dataLength = data.substr(0, 8);
			messageLength = parseInt(dataLength, 16);
			accumulatedData = data.substr(8);
		}
		else
		{
			accumulatedData += data;
		}
		
		// Have we got the whole message?
		if (accumulatedData.length >= messageLength)
		{
			
		}
		
		var chunkLength = accumulatedData.length;
		remainingLength = messageLength - chunkLength;
			
		if (remainingLength > 0)
		{
			accumulatedData = accumulatedData + data.substr(separatorLength);
		}
		else 
		{
			accumulatedData = accumulatedData + data;
		}
		separator = ;
	};
	
	/**
	 * Scan for message.
	 */
	self.getMessage = function()
	{
		
		return accumulatedData;
	};
	
	return self;
}();

create = function (port) {

	var net = require('net');

	function generateDeviceInfoListJSON() {

		var infoListJSON = [];

		vars.globals.clientList.forEach(function(c){

			infoListJSON.push(c.deviceInfo);
		});

		vars.globals.deviceInfoListJSON = JSON.stringify(infoListJSON);
	}
	
	function processMessage(messageObject) {
	
		// The data is always in JSON format.
		console.log("socket.on jsonString: " + jsonString);
		var message = JSON.parse(jsonString);
		console.log("socket.on message.message: " + message.message);
		if (message != undefined);
		{
			// The device sent it's info upon connecting.
			if (message.message == "clientConnectRequest")
			{
				// Platform, name, uuid, os version, phonegap version.
				//message.type == null;
				socket.deviceInfo 		  = message.params;
				socket.deviceInfo.address = socket.remoteAddress;
				generateDeviceInfoListJSON();
				console.log("Client " + socket.remoteAddress +
					" (" + socket.deviceInfo.name + ") has connected." )
			}
			// The device sent a log message.
			else if (message.message == "remoteLog")
			{
				// TODO: Output log message.
				//socket.deviceInfo.name // the name of the device.
				console.log("NEW remote log: " + message);
				console.log(jsonString);
				console.log(message);
				
				//vars.globals.gRemoteLogData.push(message.params);
			}
		}
	}

	function saveClient(socket) {

		try {

			vars.globals.clientList.push(socket);

			// Use ascii encoding.
			socket.setEncoding('ascii');

			// Executed then the client closes the connection.
			socket.on('close',function (had_error) {

				var address = "-unknown address-";
				if (socket.deviceInfo != undefined) {

					address = socket.deviceInfo.address;
				}

				console.log(
					"Client " +
					address + " (" +
					socket.deviceInfo.name +
					") has disconnected.");
				for (var i = 0; i < vars.globals.clientList.length ; i++) {

					if (vars.globals.clientList[i].remoteAddress == socket.remoteAddress) {

						vars.globals.clientList.splice(i,1);
						generateDeviceInfoListJSON();
						break;
					}
				}
			});

			// Executed when the client sends data to the server.
			socket.on('data', function(jsonString) {
				
			});
		}
		catch(err)
		{
			console.log("Error in saveClient: " + err);
		}
	}

	console.log("Opening TPC socket on port: " + port);
	var server = net.createServer(saveClient);
	server.listen(7000);

	return server;
}

exports.create = create;