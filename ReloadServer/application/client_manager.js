var rpc = require('../lib/jsonrpc');
var net = require('net');
var fs = require('fs');

var vars = require('./globals');

/**
 * The functions that are available for remote calling
 */
var rpcFunctions = {

    /**
     * Test function used for testing //TODO: remove after testing
     */
    add: function (a, b, sendResponse) {

        //check if parameter passing was correct
        if(typeof sendResponse !== 'function') return false;

        var r = a + b + 3;
        sendResponse({hasError: false, data: r});
    },

    /**
     * Function that send the bundle to the client.
     */
    getBundle: function(bundlePath, sendResponse) {
        
        //check if parameter passing was correct
        if(typeof sendResponse !== 'function') return false;

        // Set path to the project folder.
        console.log("MOSYNC: Bundle Path: " + unescape(bundlePath));

        var data = fs.readFileSync(unescape(bundlePath) +
                                   vars.globals.fileSeparator +
                                   "LocalFiles.bin");
        
        sendResponse({hasError: false, data: data});
    },

    /**
     * UNUSED: This method is replaced with function in
     * tcp_server.js.
     *
     * Function that pushes a log message to gRemoteData[]
     * so it can be read from the web browser.
     */
    remoteLog: function (logMessage, sendResponse) {
        
        //check if parameter passing was correct
        if(typeof sendResponse !== 'function') return false;

        console.log("SHOULD NOT BE USED! CLIENT LOG: " + logMessage);
        console.log(logMessage);
        
        vars.globals.gRemoteLogData.push(logMessage);
        sendResponse({hasError: false, data: ""});
    }
    
};

rpc.exposeModule('client', rpcFunctions);
