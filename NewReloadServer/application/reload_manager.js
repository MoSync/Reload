var rpc = require('../lib/jsonrpc');
var net = require('net');
/**
 * The functions that are available for remote calling
 */

 var globals = require('./globals');

var rpcFunctions = {
	add: function (a, b, sendResponse) {
		var r = a + b;
		console.log(globals.rootWorkspacePath);
		sendResponse(r);
	},

	setIP: function(ip, sendResponse) {
		this.IP = ip;
		console.log("THE IP IS:"+ip);
		sendResponse( ip );
	},

	getNetworkIP: function(callback, sendResponse) {

		var socket = net.createConnection(80, "www.google.com");
		socket.on('connect', function() {
			
			socket.end();
			//sendResponse( socket.address().address );
			callback(socket.address().address, sendResponse);
		});
		socket.on('error', function(e) {
			return 50;
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