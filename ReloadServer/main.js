var vars      = require("./application/globals"),
    logModule = require("./application/log");

var os  = require('os'),
    net = require('net'),
    fs  = require('fs');

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

// Platform specific considerations for getting the home directory
var darwin = vars.globals.localPlatform.indexOf("darwin") >= 0;
var linux = vars.globals.localPlatform.indexOf("linux") >=0;

if ( darwin || linux ) {
    vars.globals.homeDir = process.env.HOME;
} else {
    vars.globals.homeDir = process.env.USERPROFILE;
}

// Platform specific considerations for getting the directory separator
vars.globals.fileSeparator = ( darwin || linux )? "/" : "\\";

// Kill adb when the server dies
process.on('exit', function(){
    vars.globals.adb.kill("-9");
});

/**
 * Include and execute the modules of the rpc
 */
var server  = require("./lib/jsonrpc_server"),
    tcp     = require("./lib/tcp_server");
    udp     = require("./lib/udp_server");

var manager = require("./application/reload_manager"),
    client  = require("./application/client_manager");

/**
 * Figure out a project directory. Accepts a callback to be processed
 * efter path is set.
 *
 * @param {function()}   A callback to be executed.
 *
 * @return void
 */
function getLatestPath(done) {
    var self = this;
    var configFile = vars.globals.lastWorkspaceFile;
    var defaultPath =
        vars.globals.homeDir
        + vars.globals.fileSeparator
        + "MoSync_Reload_Projects";

    try {
        fs.exists(configFile, function(exists) {
            // If config file exists
            if (exists) {
                // Read it's contents
                var data = String(fs.readFileSync(configFile, "utf8"));
                if (data != "") {
                    // If "data" is a file system path
                    fs.exists(data, function (exists) {
                        if (exists) {
                            // Set it as current workspace
                            vars.methods.setRootWorkspacePath(data, done);
                        } else {
                            // Otherwise use default workspace instead
                            vars.methods.setRootWorkspacePath(defaultPath, done);
                        }
                    });
                } else {
                    console.log("ERROR reading " + configFile + ", reverting to " + defaultPath, 0);
                    vars.methods.setRootWorkspacePath(defaultPath, done);
                }
            } else {
                console.log(configFile + "doesn't exist. Workspace path set to " + defaultPath, 0);
                vars.methods.setRootWorkspacePath(defaultPath, done);
            }
        });
    } catch(err) {
        console.log("ERROR in getLatestPath: " + err, 0);
    }
}

/**
 * Starting the http and TCP Services
 */
getLatestPath(function(){
    manager.rpc.getNetworkIP(function(){
        manager.rpc.findProjects(); // Generate project list.
        manager.rpc.getVersionInfo();
        WebUI       = server.create(8283);
        tcpSocket   = tcp.create(7000);
        udp         = udp.create(41234);
    });

});
