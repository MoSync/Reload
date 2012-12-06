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

    getVersionInfo: function() {
        var r;
        return r;
    },

    getServerAddress: function() {
        var r;
        return r;
    },

    getProjectList: function() {
        var r;
        return r;
    },

    createNewProject: function(name, type) {
        var r;
        return r;
    },

    removeProject: function(name) {
        var r;
        return r;
    },

    renameProject: function(from, to) {
        var r;
        return r;
    },

    reloadProject: function(name) {
        var r;
        return r;
    },

    openProjectFolder: function(name) {
        var r;
        return r;
    },

    getClientInfo: function() {
        var r;
        return r;
    },

    getDebugData: function() {
        var r;
        return r;
    },

    getRemoteLogData: function() {
        var r;
        return r;
    },

    getWorkspacePath: function() {
        var r;
        return r;
    },

    changeWorkspacePath: function() {
        var r;
        return r;
    }
};

rpc.exposeModule('manager', rpcFunctions);
