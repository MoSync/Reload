var vars    = require("./application/globals"),
    logModule = require("./application/log");

var os  = require('os'),
    net = require('net');

/**
 * Overriding console.log() for different levels of logging output
 * Use: cosnole.log( <object-message>, level)
 * <object-message> : Output data
 * level: 0 for minimum log, 1 for verbose, 2 for debug
 *
 * ATTENTION: if no argument is used for level it will be considered as 
 * debug level (2)
 */
console.dlog = console.log;
console.log = logModule.log;

vars.globals.localPlatform = os.platform();
vars.globals.currentWorkingPath = process.cwd();

process.argv.forEach(function (value, index, array) {

    switch (value) {
        case "-nobrowser" : 
            vars.globals.openBrowser = false;
            break;
        case "-verbose" :
            vars.globals.logLevel = 1;
            break;
        case "-debug" :
            vars.globals.logLevel = 2;
            break;
    }
});

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
var server  = require("./lib/jsonrpc_server"),
    tcp     = require("./lib/tcp_server");
    
var manager = require("./application/reload_manager"),
    client  = require("./application/client_manager");
/**
 * Starting the http and TCP Services
 */
WebUI       = server.create(8283);
tcpSocket   = tcp.create(7000);
