var server  = require("./lib/jsonrpc_server");
var manager = require("./application/reload_manager");
var client  = require("./application/client_manager");
var globals = require("./application/globals");

var os = require('os');

// initializations
globals.localPlatform = os.platform();
globals.currentWorkingPath = process.cwd();

//globals.commandMap.ConnectRequest = 1;
//globals.commandMap.JSONMessage    = 2;

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

webUI = server.create(8282);
client = server.create(8283);