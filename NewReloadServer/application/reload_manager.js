var rpc = require('../lib/jsonrpc');
var net = require('net');

/**
 * The functions that are available for remote calling
 */
var rpcFunctions = {
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
    },

    add: function (a, b, send) {
        var r = a + b;
        send(r);
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
    },


    getNetworkIP: function() {

        var socket = net.createConnection(80, "www.google.com");
        socket.on('connect', function()
        {
            var ipAddress = socket.address().address;
            socket.end();
            console.log(ipAddress);
            return(ipAddress);
        });
        socket.on('error', function(e) {
            console.log("Error on socket");
            return "";
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
