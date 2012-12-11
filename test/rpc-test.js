var buster = require('buster');
var request = require('request');
var net = require('net');

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

    "changeWorkspacePath": function(done) {
        // Change workspace path
        var home = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
        var newWorkspacePath = home + '/newWorkspace';
        request.post({
            headers: {'content-type' : 'application/json'},
            url: 'http://localhost:8283',
            body: JSON.stringify({ "method":"manager.changeWorkspacePath", "params":[newWorkspacePath], "id":null })
        }, function(error, response, body){
            request.post({
                headers: {'content-type' : 'application/json'},
                url: 'http://localhost:8283',
                body: JSON.stringify({ "method":"manager.getWorkspacePath", "params":[], "id":null })
            }, function(error, response, body){

                console.log(JSON.parse(body).result.path);
            });
        });
        // Get Workspace path
        // Change back workspace path
        // Remove created workspace path

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
        var expected;
        var result;

        var socket = net.createConnection(80, "www.google.com");
        socket.on('connect', function() {
            expected = socket.address().address;
            socket.end();

            request.post({
                headers: {'content-type' : 'application/json'},
                url: 'http://localhost:8283',
                body: JSON.stringify({ "method": "manager.getNetworkIP", "params": [], "id" :null })
            }, function(error, response, body) {

                result = JSON.parse(body).result;
                assert.equals(expected, result);
                done();

            });
        });
    },

    "getProjectList": function(done) {
        // Create project.
        var projectName = 'My_Project';
        var projectType = 'web';
        request.post({
            headers: {'content-type' : 'application/json'},
            url: 'http://localhost:8283',
            body: JSON.stringify({ "method":"manager.createNewProject", "params":[projectName, projectType], "id":null })
        }, function(error, response, body){

            // Get project list.
            request.post({
                headers: {'content-type' : 'application/json'},
                url: 'http://localhost:8283',
                body: JSON.stringify({ "method":"manager.removeProject", "params":[projectPath], "id":null })
            }, function(error, response, body){

                var expected = [{"url":"http://localhost:8282/" + projectName + "/LocalFiles.html", "name": projectName}];
                console.log(expected);
                console.log(JSON.parse(body).result);
                //assert.equals(projectPath ,JSON.parse(body).result);


                // Remove project.
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

                        assert.equals(projectPath ,JSON.parse(body).result);
                        done();

                    });
                });
            });

        });
        // Get project list.
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
        // Create project.
        var projectName = 'My_Project';
        var projectType = 'web';
        request.post({
            headers: {'content-type' : 'application/json'},
            url: 'http://localhost:8283',
            body: JSON.stringify({ "method":"manager.createNewProject", "params":[projectName, projectType], "id":null })
        }, function(error, response, body){

            // Remove project.
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

                    assert.equals(projectPath ,JSON.parse(body).result);
                    done();

                });
            });
        });
    },

    "renameProject": function(done) {
        done();
    },

    "reloadProject": function(done) {
        done();
    },

    "openProjectFolder": function(done) {
        done();
    },

    "getClientInfo": function(done) {
        done();
    },

    "getDebugData": function(done) {
        done();
    },

    "getRemoteLogData": function(done) {
        done();
    },

    "getWorkspacePath": function(done) {
        var expected = { path: '/Users/igor/MoSync_Reload_Projects' };
        var result;

        request.post({
            headers: {'content-type' : 'application/json'},
            url: 'http://localhost:8283',
            body: JSON.stringify({ "method":"manager.getWorkspacePath", "params":[], "id":null })
        }, function(error, response, body){
                console.log(JSON.parse(body).result.path);
                result = JSON.parse(body).result.path;
                assert.equals(expected.path, result);
        });
    }

});
