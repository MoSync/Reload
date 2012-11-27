var rpc  = require('../lib/jsonrpc');

/**
 * The functions that are available for remote calling
 */
var rpcFunctions = {
	add: function (a, b) {

		var r = a + b;
		return r;
	},

	getNetworkIP: function(callback) {
		var socket = net.createConnection(80, "www.google.com");
		socket.on('connect', function()
		{
			callback(undefined, socket.address().address);
			socket.end();
		});
		socket.on('error', function(e) {
			callback(e, 'error');
		});
	},

	generateHTML: function(projects) {
		var html = " \
		<!DOCTYPE HTML PUBLIC '-//W3C//DTD HTML 4.0 Transitional//EN'>\
		<html>\
		<head> \
		<title>Your Page Title</title>\
		<meta http-equiv='REFRESH' content='0;url=http://localhost:8282/UI/index.html'></HEAD>\
		<BODY> \
		Optional page text here.\
		</BODY>\
		</HTML>";

		return html;
	}
};

rpc.exposeModule('manager', rpcFunctions);