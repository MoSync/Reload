var buster = require('buster');
var request = require('request');
var net = require('net');

/*
 * RPC test suit on top of buster.js
 * Buster.JS on the command-line requires Node.js 0.6.3 or newer and
 * npm.
 *
 * == Install Buster ==
 * $ npm install -g buster
 * $ npm install -g request
 *
 * == Run tests ==
 * $ buster test
 *
 * Docs @ busterjs.org
 */
buster.testCase("RPC", {
    /*
     * Creates a new workspace directory to isolate operations of
     * current test on the file system to that directory.
     */
    setUp: function(done) {
        this.host    = 'http://localhost';
        this.port    = 8283;
        this.url     = this.host + ':'+ this.port;
        this.headers = {'content-type' : 'application/json'};
        this.tmpWorkspaceName = 'newTmpWorkspace';
        this.oldWorkspacePath = '';

        /*
         * Create temp workspace dir.
         */
        var self = this;
        request.post({
            headers  : this.headers,
            url      : this.url,
            body     : JSON.stringify({
                "method" : "manager.getWorkspacePath",
                "params" : [],
                "id"     : null
            })
        }, function(error, response, body) {
            // Save reference to current workspace to change it back to
            // in tearDown call.
            self.oldWorkspacePath = JSON.parse(body).result.path;

            // Change workspace path to new one.
            var home = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
            var newWorkspacePath = home + '/' + self.tmpWorkspaceName;

            request.post({
                headers  : self.headers,
                url      : self.url,
                body     : JSON.stringify({
                    "method" : "manager.changeWorkspacePath",
                    "params" : [newWorkspacePath],
                    "id"     : null
                })
            }, function(error, response, body) {
                done();
            });
        });
    },


    /*
     * Reverts workspace to the state before setUp.
     */
    tearDown: function(done) {

        /*
         * Restore to previous workspace.
         */
        request.post({
            headers  : this.headers,
            url      : this.url,
            body     : JSON.stringify({
                "method" : "manager.changeWorkspacePath",
                "params" : [this.oldWorkspacePath],
                "id"     : null
            })
        }, function(error, response, body){
            done();
            // Remove this.newWorkspacePath
        });
    },

    "changeWorkspacePath": function(done) {
        // Change workspace path to new one
        var home = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
        var newWorkspacePath = home + '/newWorkspace';
        var self = this;

        request.post({
            headers: this.headers,
            url: this.url,
            body: JSON.stringify({
                "method":"manager.changeWorkspacePath",
                "params":[newWorkspacePath],
                "id":null
            })
        }, function(error, response, body) {
            var expected = newWorkspacePath;
            var result = JSON.parse(body).result;
            assert.equals(expected, result);

            // Cleanup
            request.post({
                headers: self.headers,
                url: self.url,
                body: JSON.stringify({
                    "method":"manager.removeWorkspace",
                    "params":[newWorkspacePath],
                    "id":null
                })
            }, function(error, response, body) {
                done();
            });
        });
    },

    "removeWorkspace": function(done) {
        // Switch to workspace to remove.
        // Switch back to original workspace.
        // Remove workspace to remove.
        var workspaceToRemove, originalWorkspace, self, result, expected;
        originalWorkspace = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'] +'/'+ this.tmpWorkspaceName;
        workspaceToRemove = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'] +'/newWorkspaceToRemove';
        self = this;
        expected = workspaceToRemove;

        // Switch to workspace to remove.
        request.post({
            headers: this.headers,
            url: this.url,
            body: JSON.stringify({
                "method":   "manager.changeWorkspacePath",
                "params":   [workspaceToRemove],
                "id"    :   null
            })
        }, function (error, response, body) {

            // Switch back to original workspace.
            request.post({
                headers: self.headers,
                url: self.url,
                body: JSON.stringify({
                    "method":   "manager.changeWorkspacePath",
                    "params":   [originalWorkspace],
                    "id"    :   null
                })
            }, function(error, response, body) {

                // Remove workspace to remove.
                request.post({
                    headers: self.headers,
                    url: self.url,
                    body: JSON.stringify({
                        "method":   "manager.removeWorkspace",
                        "params":   [workspaceToRemove],
                        "id"    :   null
                    })
                }, function(error, response, body) {
                    result = JSON.parse(body).result;
                    assert.equals(result,expected);
                    done();
                });
            });
        });
    },

    "getVersionInfo": function(done) {
        var expected = {
            "version":"",
            "timestamp":""
        };
        var result = '';

        request.post({
            headers: this.headers,
            url: this.url,
            body: JSON.stringify({
                "method":   "manager.getVersionInfo",
                "params":   [],
                "id"    :   null
            })
        }, function(error, response, body) {
            result = JSON.parse(JSON.parse(body).result);

            assert.match(result, expected);
            done();
        });
    },

    "getServerAddress": function(done) {
        var expected, result;
        expected = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;

        request.post({
            headers: this.headers,
            url: this.url,
            body: JSON.stringify({
                "method": "manager.getNetworkIP",
                "params": [],
                "id" :null
            })
        }, function(error, response, body) {
            result = JSON.parse(body).result;
            assert.match(result, expected);
            done();
        });
    },

    "getProjectList": function(done) {
        var self, result, expected, projectName, projectType;

        self = this;
        projectName = 'MyTmpProject';
        projectType = 'web';

        // Create project.
        request.post({
            headers: this.headers,
            url: this.url,
            body: JSON.stringify({
                "method": "manager.createNewProject",
                "params": [projectName, projectType],
                "id": null
            })
        }, function(error, response, body) {
            // Get project list.
            request.post({
                headers: self.headers,
                url: self.url,
                body: JSON.stringify({
                    "method": "manager.getProjectList",
                    "params": [],
                    "id": null
                })
            }, function(error, response, body){

                expected = [{
                    name: "",
                    path: "",
                    url: ""
                }];
                result = JSON.parse(body).result;
                assert.match(result, expected);

                // Clean up.
                request.post({
                    headers: self.headers,
                    url: self.url,
                    body: JSON.stringify({
                        "method": "manager.removeProject",
                        "params": [projectName],
                        "id":null
                    })
                }, function(error, response, body){
                    done();
                });
            });
        });
    },

    "createNewProject": function(done) {
        var self, projectName, projectType, expected, result;
        projectName = 'Create_My_Project';
        projectType = 'web';

        expected = projectName;
        self = this;

        request.post({
            headers: this.headers,
            url: this.url,
            body: JSON.stringify({
                "method":"manager.createNewProject",
                "params":[projectName, projectType],
                "id":null
            })
        }, function(error, response, body) {

            result = JSON.parse(body).result;
            assert.equals(result, expected);

            // Cleanup.
            request.post({
                headers: self.headers,
                url: self.url,
                body: JSON.stringify({
                    "method":"manager.removeProject",
                    "params":[projectName],
                    "id":null
                })
            }, function(error, response, body){
                done();
            });
        });
    },

    "removeProject": function(done) {
        var projectName, projectType, expected, result, self;
        projectName = 'Remove_My_Project';
        projectType = 'web';
        self = this;

        // Create project.
        request.post({
            headers: this.headers,
            url: this.url,
            body: JSON.stringify({
                "method":"manager.createNewProject",
                "params":[projectName, projectType],
                "id":null
            })
        }, function(error, response, body){
            // Remove project.
            request.post({
                headers: self.headers,
                url: self.url,
                body: JSON.stringify({
                    "method":"manager.removeProject",
                    "params":[projectName],
                    "id":null
                })
            }, function(error, response, body){
                result = JSON.parse(body).result
                expected = 'Succesfull deletion of project ' + projectName;

                assert.equals(result, expected);
                done();
            });
        });
    },

    "renameProject": function(done) {
        var oldProjectName, newProjectName, projectType, expected, result, self;
        oldProjectName = 'oldProjectName';
        newProjectName = 'newProjectName';
        projectType = 'web';
        self = this;

        // Create new project.
        request.post({
            headers: this.headers,
            url: this.url,
            body: JSON.stringify({
                "method":"manager.createNewProject",
                "params":[oldProjectName, projectType],
                "id":null
            })
        }, function(error, response, body){

            // Rename project.
            request.post({
                headers: self.headers,
                url: self.url,
                body: JSON.stringify({
                    "method":"manager.renameProject",
                    "params":[oldProjectName, newProjectName],
                    "id":null
                })
            }, function(error, response, body){

                result = JSON.parse(body).result;
                expected = newProjectName;
                assert.equals(result, expected);

                // Cleanup
                request.post({
                    headers: self.headers,
                    url: self.url,
                    body: JSON.stringify({
                        "method":"manager.removeProject",
                        "params":[newProjectName],
                        "id":null
                    })
                }, function(error, response, body){
                    done();
                });
            });
        });
    },

    "openProjectFolder": function(done) {
        var projectName, projectType, expected, result, self;
        projectName = 'OpenFolder_My_Project';
        projectType = 'web';
        expected = '';
        self = this;

        request.post({
            headers: this.headers,
            url: this.url,
            body: JSON.stringify({
                "method":"manager.createNewProject",
                "params":[projectName, projectType],
                "id":null
            })
        }, function(error, response, body) {
            request.post({
                headers: self.headers,
                url: self.url,
                body: JSON.stringify({
                    "method":"manager.openProjectFolder",
                    "params":[projectName],
                    "id":null
                })
            }, function(error, response, body){
                result = JSON.parse(body).result;
                assert.equals(result,expected);

                var home = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];

                buster.log('Please remove "' + home + '/' + self.tmpWorkspaceName + '/' + projectName + '" manually.');
                done();
            });
        });
    },

    "getClientInfo": function(done) {
        request.post({
            headers: this.headers,
            url: this.url,
            body: JSON.stringify({
                "method":"manager.getClientInfo",
                "params":[],
                "id":null
            })
        }, function(error, response, body){

            var expected = [{
                type:     "",
                platform: "",
                name:     "",
                uuid:     "",
                version:  "",
                phonegap: "",
                address:  ""
            }];

            var result = JSON.parse(JSON.parse(body).result);
            assert.match(result, expected);
            done();
        });
    },

    "getWorkspacePath": function(done) {
        var expected, result, home;

        home = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
        expected = { path: home + '/' + this.tmpWorkspaceName };

        request.post({
            headers: this.headers,
            url: this.url,
            body: JSON.stringify({
                "method":"manager.getWorkspacePath",
                "params":[],
                "id":null
            })
        }, function(error, response, body){
            result = JSON.parse(body).result;
            assert.equals(result, expected);
            done();
        });
    },

    "getExampleList": function (done) {
        var result, expected;
        expected = {feed: [{}]};

        request.post({
            headers:  this.headers,
            url:      this.url,
            body:     JSON.stringify({
                "method":  "manager.getExampleList",
                "params":  [],
                "id":      null
            })
        }, function(error, response, body) {
            result = JSON.parse(body).result;
            //buster.log(result);
            assert.match(result, expected);
            done();
        });
    },

    "//reloadExample": function() {},

    "//reloadProject": function(done) {
        var self, result, projectName, projectType;
        projectName = 'ProjectToReload';
        projectType = 'web';
        self = this;

        // Create project to reload.
        request.post({
            headers:  this.headers,
            url:      this.url,
            body:     JSON.stringify({
                "method":  "manager.createNewProject",
                "params":  [projectName, projectType],
                "id":      null
            })
        }, function(error, response, body) {
            // Reload project.
            request.post({
                headers:  self.headers,
                url:      self.url,
                body:     JSON.stringify({
                    "method":  "manager.reloadProject",
                    "params":  [projectName, false],
                    "id":      null
                })
            }, function(error, response, body) {
                // Cleanup.
                request.post({
                    headers:  self.headers,
                    url:      self.url,
                    body:     JSON.stringify({
                        "method":  "manager.removeProject",
                        "params":  [projectName],
                        "id":      null
                    })
                }, function(error, response, body) {
                    done();
                });
            });
        });
    },

    "//reloadInDebugMode": function(done) {
        done();
    },
});
