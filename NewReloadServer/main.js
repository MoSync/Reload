var server  = require("./lib/jsonrpc_server"),
	tcp     = require("./lib/tcp_server");

var	vars    = require("./application/globals");

var os  = require('os'),
	net = require('net');

/** 
 * initializations of some global vars
 */
vars.globals.localPlatform = os.platform();
vars.globals.currentWorkingPath = process.cwd();

//Platform specific considerations for getting the home directory
if((vars.globals.localPlatform.indexOf("darwin") >= 0) ||
   (vars.globals.localPlatform.indexOf("linux") >=0)) {

	vars.globals.homeDir = process.env.HOME;
}
else {

	vars.globals.homeDir = process.env.USERPROFILE;
}

//Platform specific considerations for getting the directory separator
vars.globals.fileSeparator = ((vars.globals.localPlatform.indexOf("darwin") >=0) ||
						 (vars.globals.localPlatform.indexOf("linux") >=0))?"/" : "\\";

process.on('exit', function(){
	vars.globals.adb.kill("-9"); //Kill adb when the server dies
});


/**
 * Include and execute the modules of the rpc
 */
var manager = require("./application/reload_manager"),
	client  = require("./application/client_manager");

/**
 * Starting the http and TCP Services
 */
webUI     = server.create(8282);
client    = server.create(8283);
tcpSocket = tcp.create(7000);
