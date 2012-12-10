var buster = require('buster');
//var express = require('express');
var request = require('request');


buster.testCase("RPC", {
    setUp: function() {
       this.host = 'http://localhost';
       this.port = 8283;
       this.url = this.host + ':'+ this.port;
       this.headers = {'content-type' : 'application/json'};
    },

    tearDown: function() {
    },

    "add": function (done) {
        var message = {
            "method":   "manager.add",
            "params":   [1,1],
            "id"    :   null
        };

        var expected = 2;
        var result = 0;

        var callback = function(error, response, body) {
            if (!error && response.statusCode === 200) {
                result = JSON.parse(body).result;
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

        var expected = '{"version":"MoSync Reload Version 0.1 Beta 4","timestamp":"120808-1138"}';
        var result = '';

        var callback = function(error, response, body) {
            result = JSON.parse(body).result;
            assert.equals(expected, result);
            done();
        };

        request.post({
            headers: this.headers,
            url: this.url,
            body: JSON.stringify(message)
        }, callback );
    },

    "getServerAddress": function(done) {
        var message = {
            "method":   "manager.getNetworkIP",
            "params":   [],
            "id"    :   null
        };

        var expected = '192.168.0.139';
        var result = '';

        var callback = function(error, response, body) {
            result = JSON.parse(body).result;
            assert.equals(expected, result);
            done();
        };

        request.post({
            headers: this.headers,
            url: this.url,
            body: JSON.stringify(message)
        }, callback );
    },

    "getProjectList": function(done) {
        var message = {
            "method":   "manager.getProjectList",
            "params":   [],
            "id"    :   null
        };

        var expected = '[{"url":"http://localhost:8282/hello/LocalFiles.html","name":"hello"}]';
        var result = '';

        var callback = function(error, response, body) {
            result = JSON.parse(body).result;
            assert.equals(expected, result);
            done();
        };

        request.post({
            headers: this.headers,
            url: this.url,
            body: JSON.stringify(message)
        }, callback );
    },

    "createNewProject": function(done) {
        var projectName = 'My_Project';
        var projectType = 'web';

        var message = {
            "method":   "manager.createNewProject",
            "params":   [projectName, projectType],
            "id"    :   null
        };

        var expected = projectName;
        var result = '';

        var callback = function(error, response, body) {
            result = JSON.parse(body).result;
            assert.equals(expected, result);

            // CLEANUP
            // Get workspace path for cleanup.
            request.post({
                headers: {'content-type' : 'application/json'},
                url: 'http://localhost:8283',
                body: JSON.stringify({ "method":"manager.getWorkspacePath", "params":[], "id":null })
            }, function(error, response, body){

                var projectPath = JSON.parse(body).result.path + '/' + projectName;

                // Remove project.
                request.post({
                    headers: {'content-type' : 'application/json'},
                    url: 'http://localhost:8283',
                    body: JSON.stringify({ "method":"manager.removeProject", "params":[projectPath], "id":null })
                }, function(error, response, body){
                    done();
                });
            });
        };

        request.post({
            headers: this.headers,
            url: this.url,
            body: JSON.stringify(message)
        }, callback );

    },

    "removeProject": function(done) {
        var message = {
            "method":   "manager.removeProject",
            "params":   [projectPath],
            "id"    :   null
        };

        var expected = 'My Project';
        var result = '';

        var callback = function(error, response, body) {
            result = JSON.parse(body).result;
            assert.equals(expected, result);
            // Cleanup created project. Depends on removeProject
            done();
        };

        request.post({
            headers: this.headers,
            url: this.url,
            body: JSON.stringify(message)
        }, callback );
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
        var message = {
            "method":   "manager.getWorkspacePath",
            "params":   [],
            "id"    :   null
        };

        var expected = { path: '/Users/igor/MoSync_Reload_Projects' };
        var result = '';

        var callback = function(error, response, body) {
            if (!error && response.statusCode === 200) {
                result = JSON.parse(body).result;
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

    "changeWorkspacePath": function(done) {
        assert(true);
        done();
    }
});
