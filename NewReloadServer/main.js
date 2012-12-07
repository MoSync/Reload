var server  = require("./lib/jsonrpc_server"),
	tcp     = require("./lib/tcp_server");

var manager = require("./application/reload_manager"),
	client  = require("./application/client_manager"),
	globals = require("./application/globals");


var os  = require('os'),
	net = require('net');

/** 
 * initializations of some global vars
 */
globals.localPlatform = os.platform();
globals.currentWorkingPath = process.cwd();

//Platform specific considerations for getting the home directory
if((globals.localPlatform.indexOf("darwin") >= 0) ||
   (globals.localPlatform.indexOf("linux") >=0)) {

	globals.homeDir = process.env.HOME;
}
else {

	globals.homeDir = process.env.USERPROFILE;
}

//Platform specific considerations for getting the directory separator
globals.fileSeparator = ((globals.localPlatform.indexOf("darwin") >=0) ||
						 (globals.localPlatform.indexOf("linux") >=0))?"/" : "\\";

process.on('exit', function(){
	global.adb.kill("-9"); //Kill adb when the server dies
});


/**
 * Starting the http and TCP Services
 */
webUI     = server.create(8282);
client    = server.create(8283);
tcpSocket = tcp.create(7000);
