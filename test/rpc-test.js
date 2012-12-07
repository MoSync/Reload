var buster = require('buster');
//var express = require('express');
var request = require('request');


buster.testCase("RPC", {
    setUp: function() {
       this.host = 'http://localhost';
       this.port = 8283;
       this.url = this.host + ':'+ this.port;
       this.headers = {'content-type' : 'application/json'};

       this.responseHandler = function(error, response, body) {
           if (!error && response.statusCode === 200) {
               result = JSON.parse(body).result;
               console.log('res: ' + result);

               assert.equals(expected, result);

               done();
           }
       };

       this.rpcCall = function(message, callback) {
           request.post({
               headers: this.headers,
               url: this.url,
               body: JSON.stringify(message)
           }, this.responseHandler );
       };
    },

    tearDown: function() {
    },

    "add": function (done) {
        var message = {
            "method":   "manager.add",
            "params":   [1,1],
            "id"    :   null
        };
        console.log(message);

        var expected = 2;
        var result = 0;

        var callback = function(error, response, body) {
            if (!error && response.statusCode === 200) {
                result = JSON.parse(body).result;
                console.log('res: ' + result);

                assert.equals(expected, result);

                done();
            }
        };

        request.post({
            headers: this.headers,
            url: this.url,
            body: JSON.stringify(message)
        }, callback );
    },

    "getVersionInfo": function(done) {
        var message = {
            "method":   "manager.getVersionInfo",
            "params":   [],
            "id"    :   null
        };

        var expected = '';
        var result = '';

        var callback = function(response) {
            assert.equals(expected, result);
            done();
        };

        this.rpcCall(message, callback);
    },

    "getServerAddress": function(done) {
        assert(true);
        done();
    },

    "getProjectList": function(done) {
        assert(true);
        done();
    },

    "createNewProject": function(done) {
        assert(true);
        done();
    },

    "removeProject": function(done) {
        assert(true);
        done();
    },

    "renameProject": function(done) {
        assert(true);
        done();
    },

    "reloadProject": function(done) {
        assert(true);
        done();
    },

    "openProjectFolder": function(done) {
        assert(true);
        done();
    },

    "getClientInfo": function(done) {
        assert(true);
        done();
    },

    "getDebugData": function(done) {
        assert(true);
        done();
    },

    "getRemoteLogData": function(done) {
        assert(true);
        done();
    },

    "getWorkspacePath": function(done) {
        assert(true);
        done();
    },

    "changeWorkspacePath": function(done) {
        assert(true);
        done();
    }
});
