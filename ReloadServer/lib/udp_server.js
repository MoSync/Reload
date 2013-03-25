var dgram = require("dgram")
vars = require("../application/globals");



var create = function (port) {

	var server = dgram.createSocket("udp4");

	server.on("message", function (msg, rinfo) {

		console.log("server got: " + msg + " from " +
		rinfo.address + ":" + rinfo.port);

		var message = new Buffer(vars.globals.ip);

		clientAddr = rinfo.address;
		clientPort = rinfo.port;

		server.setBroadcast(true);
		server.send(message, 0, message.length, clientPort,
					clientAddr, function(err, bytes) {
			console.log("Write to: " + clientAddr + ":" + 
						clientPort + ", data:" + message);
		});
	});

	server.on("listening", function () {
		var address = server.address();
		console.log(address);
		console.log("UDP server listening " + address.address + ":" + 
					address.port);
	});

	server.bind(port);

	return server;
}

exports.create = create;