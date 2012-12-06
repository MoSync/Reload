var rpc = require('../lib/jsonrpc');
var net = require('net');
var fs = require('fs');

var globals = require('./globals');

/**
 * The functions that are available for remote calling
 */
var rpcFunctions = {

	/**
	 * Test function used for testing //TODO: remove after testing
	 */
	add: function (a, b, sendResponse) {
		var r = a + b + 3;
		globals.rootWorkspacePath = "test";
		sendResponse(r);
	},

	/**
	 * Function that send the bundle to the client.
	 */
	getBundle: function(bundlePath, sendResponse) {

		// Set path to the project folder.
		console.log("MOSYNC: Bundle Path" + bundlePath);
		var data = fs.readFileSync(rootWorkspacePath + bundlePath);
		
		sendResponse(data);
	},

	/**
	 * Function that pushes a log message to gRemoteData[]
	 * so it can be read from the web browser.
	 */
	remoteLog: function (logMessage, sendResponse) {
		
		console.log("CLIENT LOG: " + message);
		gRemoteLogData.push(logMessage);
		sendResponse("");
	}
	
};

rpc.exposeModule('client', rpcFunctions);