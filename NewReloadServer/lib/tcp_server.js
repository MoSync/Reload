var globals = require('../application/globals');

create = function (port) {

	var net = require('net');

	function generateDeviceInfoListJSON() {

		var infoListJSON = [];

		globals.clientList.forEach(function(c){

			infoListJSON.push(c.deviceInfo);
		});

		globals.deviceInfoListJSON = JSON.stringify(infoListJSON);
	}

	function saveClient(socket) {

		try {

			globals.clientList.push(socket);

			// We only transfer text messages over the TCP connection.
			socket.setEncoding('utf8');

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
				for (var i = 0; i < globals.clientList.length ; i++) {

					if (globals.clientList[i].remoteAddress == socket.remoteAddress) {

						globals.clientList.splice(i,1);
						generateDeviceInfoListJSON();
						break;
					}
				}
			});

			// Executed when the client sends data to the server.
			socket.on('data', function(jsonString) {

				// The data is always in JSON format.
				var message = JSON.parse(jsonString);
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
					else if (message.type == "log")
					{
						// TODO: Output log message.
						//socket.deviceInfo.name // the name of the device.
					}
				}
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