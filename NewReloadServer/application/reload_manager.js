var rpc  = require('../lib/jsonrpc');
var net  = require('net');
var fs   = require('fs');
var path = require('path');

/**
 * The functions that are available for remote calling
 */

 var globals = require('./globals');

var rpcFunctions = {

	add: function (a, b, sendResponse) {
		var r = a + b;
		sendResponse(r);
	},

    // Helping function for internal use
    getIpFromSocket: function (sendResponse) {

    	var socket = net.createConnection(80, "www.google.com");

        socket.on('connect', function() {
            
            globals.ip = socket.address().address;
            sendResponse(globals.ip);
            socket.end();
        });

        socket.on('error', function(e) {
            sendResponse("");
        });
    },

    getNetworkIP: function (sendResponse) {

    	if(globals.ip == null) {
    		this.getIpFromSocket(sendResponse);
    	}
    	else {
    		sendResponse(globals.ip);
    	}
    },

    getVersionInfo: function (sendResponse) {

        var versionInfo = fs.readFileSync("build.dat", "ascii").split("\n");

		var versionInfoJSON = JSON.stringify({"version":versionInfo[0], 
											  "timestamp": versionInfo[1]});
		console.log(versionInfoJSON);
		
		sendResponse(versionInfoJSON);
    },

    getProjectList: function (sendResponse) {
        
        var projectListJSON = [];

        globals.projects.forEach(function(p) {

            var projectInfo = {

                url: "http://localhost:8282/" + p + "/LocalFiles.html",
                name: p
            }
            projectListJSON.push(projectInfo);
        });

        sendResponse(JSON.stringify(projectListJSON));
    },

    // internal function
    findProjects: function (callback, sendResponse) {
    	try {

			path.exists( globals.rootWorkspacePath, function(exist) {

				if(!exist) {
					console.log("Creating the workspace directory " + 
								globals.rootWorkspacePath);
					fs.mkdirSync(globals.rootWorkspacePath, 0755);
				}

				// Now, check for projects in it
				files = fs.readdirSync(globals.rootWorkspacePath);

				var projects = [];

				for (var key in files) {

					var file = files[key];
					var stat = fs.statSync(globals.rootWorkspacePath + 
										   globals.fileSeparator +  
										   file);
					
					if(stat && stat.isDirectory()) {
						try {
							
							var LocalfileStat = fs.lstatSync(globals.rootWorkspacePath + 
												globals.fileSeparator +  file + "/LocalFiles");
							
							if(LocalfileStat && LocalfileStat.isDirectory()) {
								projects.push(file);
							}
						}
						catch(e) {
							//do nothing
						}
					}
				}
				callback(sendResponse);
			});
		}
		catch (err) {
			console.log("Error in findProjects: " + err);
		}
    },

    createNewProject: function (projectName, projectType, sendResponse) {
        try {
            console.log(
                "Creating new project: " + projectName + 
                ", of type " + projectType);

            var templateName = "ReloadTemplate";
            if (projectType)
            {
                if (projectType == "native")
                {
                    templateName = "NativeUITemplate";
                }
                else
                {
                    templateName = "ReloadTemplate";
                }
            }

            var exec = require('child_process').exec;

            function resultCommand(error, stdout, stderr) {
                console.log("stdout: " + stdout);
                console.log("stderr: " + stderr);
                if (error)
                {
                    console.log("error: " + error);
                }

                var projectData = fs.readFileSync(globals.rootWorkspacePath + 
                                                  globals.fileSeparator + 
                                                  projectName + 
                                                  globals.fileSeparator + 
                                                  ".project", 'utf8');

                //TODO: Very bad way to change the project name in file
                var newData = projectData.replace(templateName, projectName);

                fs.writeFileSync(globals.rootWorkspacePath + 
                                 globals.fileSeparator + 
                                 projectName + 
                                 globals.fileSeparator + 
                                 ".project", newData    , 'utf8');

                sendResponse(projectName);
            }

            if((globals.localPlatform.indexOf("darwin") >= 0) ||(globals.localPlatform.indexOf("linux") >=0))
            {
                var command = "cp -r " + this.fixPathsUnix(globals.currentWorkingPath) + 
                                         "/templates/" + 
                                         this.fixPathsUnix(templateName) +
                                   " " + this.fixPathsUnix(globals.rootWorkspacePath) + 
                                         this.fixPathsUnix(globals.fileSeparator) + 
                                         this.fixPathsUnix(projectName);
            }
            else
            {
                var command = "xcopy /e /I \"" + globals.currentWorkingPath + 
                                                 "\\templates\\" + templateName +
                                       "\" \"" + globals.rootWorkspacePath + 
                                                 globals.fileSeparator + 
                                                 projectName + "\"";
            }
            console.log("Command: " + command);
            exec(command, resultCommand);
        }
        catch(err)
        {
            console.log("Error in createNewProject: " + err);
            sendResponse("");
        }
    },

    removeProject: function (projectPath, sendResponse) {

        fs.removeRecursive = function (path,cb) {
            var self = this;

            fs.stat(path, function (err, stats) {
                if(err) {

                    cb(err, stats);
                    return;
                }

                if(stats.isFile()) {

                    fs.unlink(path, function (err) {
                        if(err) {
                            cb(err,null);
                        }
                        else {
                            cb(null,true);
                        }
                        return;
                    });
                }
                else if(stats.isDirectory()) {
                    // A folder may contain files
                    // We need to delete the files first
                    // When all are deleted we could delete the
                    // dir itself
                    fs.readdir(path, function (err, files) {
                        if(err) {

                            cb(err,null);
                            return;
                        }
                        
                        var f_length = files.length;
                        var f_delete_index = 0;

                        // Check and keep track of deleted files
                        // Delete the folder itself when the files are deleted

                        var checkStatus = function() {

                            // We check the status
                            // and count till we r done
                            if(f_length===f_delete_index) {

                                fs.rmdir(path, function(err) {
                                    if(err) {
                                        cb(err,null);
                                    }
                                    else {
                                        cb(null,true);
                                    }
                                });
                                return true;
                            }
                            return false;
                        };

                        if(!checkStatus()) {

                            for(var i=0;i<f_length;i++) {

                                // Create a local scope for filePath
                                // Not really needed, but just good practice
                                // (as strings arn't passed by reference)
                                (function(){
                                    var filePath = path + fileSeparator + files[i];
                                    // Add a named function as callback
                                    // just to enlighten debugging
                                    fs.removeRecursive(filePath, function removeRecursiveCB(err,status) {
                                        if(!err) {

                                            f_delete_index ++;
                                            checkStatus();
                                        }
                                        else {

                                            cb(err,null);
                                            return;
                                        }
                                    });
                    
                                })()
                            }
                        }
                    });
                }
            });
        };

        fs.removeRecursive(projectPath, function (error, status){
            if(!error) {
                console.log("Succesfull deletion of directory " + projectPath);
                sendResponse(projectPath);
            }
            else {
                console.log("Error in deletion of directory " + projectPath);
                console.log("ERROR: " + error);
                sendResponse("");
            }
            
        });
    },

    renameProject: function (oldName, newName) {
        try {
            console.log("Renaming Project from " + oldName + " to " + newName );
            
            var exec = require('child_process').exec;
            
            function resultCommand(error, stdout, stderr) {
                console.log("stdout: " + stdout);
                console.log("stderr: " + stderr);
                if (error)
                {
                    console.log("error: " + error);
                }

                var projectData = fs.readFileSync(globals.rootWorkspacePath + 
                                                  globals.fileSeparator + 
                                                  newName + 
                                                  globals.fileSeparator + 
                                                  ".project", 'utf8');

                var newData = projectData.replace(oldName, newName);
                fs.writeFileSync(globals.rootWorkspacePath + 
                                 globals.fileSeparator + 
                                 newName + 
                                 globals.fileSeparator + 
                                 ".project", newData, 'utf8');
                sendResponse(newName);
            }
            
            if((globals.localPlatform.indexOf("darwin") >= 0) ||(globals.localPlatform.indexOf("linux") >=0))
            {
                var command = "mv " + this.fixPathsUnix(globals.rootWorkspacePath) + 
                                      this.fixPathsUnix(globals.fileSeparator) + 
                                      this.fixPathsUnix(oldName) + 
                              " " +   this.fixPathsUnix(globals.rootWorkspacePath) + 
                                      this.fixPathsUnix(globals.fileSeparator) + 
                                      this.fixPathsUnix(newName);
            }
            else
            {
                var command = "rename " + globals.rootWorkspacePath + 
                                          globals.fileSeparator + 
                                          oldName + 
                              " " + newName;
            }
            console.log("Command: " + command);
            exec(command, resultCommand);
        }
        catch(err) {
            console.log("Error in renameProject(" + oldname + ", " + newName + "): " + err);
            sendResponse(oldName);
        }
    },

    reloadProject: function (projectPath, debug, sendResponse) {
        
        var weinreDebug;

        if( typeof debug !== "boolean" || typeof debug === "undefined") {
            weinreDebug = false;
            console.log("WEINRE ENABLED jsonRPC:" + weinreDebug);
        }
        else {
            weinreDebug = debug;
        }

        console.log("WEINRE ENABLED:" + weinreDebug);
        console.log("Reloading project");
        
        sendResponse("");
        //res.writeHead(200, { 'CACHE-CONTROL': 'no-cache'});
        //res.end();

        //var pageSplit = page.split("/");
        //var path = pageSplit[pageSplit.length -2];
        
        // Bundle the app.
        bundleApp(projectPath, weinreDebug, function (actualPath) {
            
            // We will send the file size information together with the command as 
            // an extra level of integrity checking.
            console.log("actualPath: " + actualPath);
            var data = fs.readFileSync(actualPath);
            var url = projectPath.replace("LocalFiles.html", "LocalFiles.bin").replace(' ', '%20');

            //send the new bundle URL to the device clients
            globals.clientList.forEach(function (client) {

                console.log("url: " + url + "?filesize=" + data.length);
                try {
                    // TODO: We need to send length of url.
                    // First length as hex 8 didgits, e.g.: "000000F0"
                    // Then string data follows.
                    // Update client to read this format.
                    // Or should we use "number:stringdata", e.g.: "5:Hello" ??
                    // Advantage with hex is that we can read fixed numer of bytes
                    // in the read operation.
                    // Convert to hex:
                    // http://stackoverflow.com/questions/57803/how-to-convert-decimal-to-hex-in-javascript

                    // creating message for the client
                    var jsonMessage      = {};
                    jsonMessage.message  = 'ReloadBundle';
                    jsonMessage.url      = url;// + "?filesize=" + data.length;
                    jsonMessage.fileSize = data.length;

                    console.log(toHex8Byte( commandMap['JSONMessage'] )        +
                                                toHex8Byte(JSON.stringify(jsonMessage).length) +
                                                JSON.stringify(jsonMessage));

                    var result = client.write(  toHex8Byte( commandMap['JSONMessage'] )        +
                                                toHex8Byte(JSON.stringify(jsonMessage).length) +
                                                JSON.stringify(jsonMessage), "ascii");
                    //var result = client.write(url + "?filesize=" + data.length , "ascii");
                }
                catch(err) {

                    console.log("could not send data because : " + err)
                    var index = globals.clientList.indexOf(client);
                    if(index != -1)
                    {
                        globals.clientList.splice(index, 1);
                    }
                }
            });
        });
    },

    bundleApp: function (projectDir, winreDebug, callback) {

        try {
            // WEINRE injection
            // The script is injected only in the bundle. 
            // The user is unaware of the injection in his source files
            //Checking if weinreDebug is enabled
            if(weinreDebug) {
                //INJECT WEINRE SCRIPT
                //<script src="http://<serverip>:<port>/target/target-script-min.js"></script>
                //eg: <script src="http://192.168.0.103:8080/target/target-script-min.js"></script>
                
                var injectedScript = "<script src=\"http://" + globals.ip + 
                                     ":8080/target/target-script-min.js\"></script>";
                
                var pathOfIndexHTML = globals.rootWorkspacePath + globals.fileSeparator + 
                                      projectDir + globals.fileSeparator + 
                                      "LocalFiles" + globals.fileSeparator + "index.html";

                console.log("INDEX.HTML PATH: " + pathOfIndexHTML);
                var originalIndexHTMLData = fs.readFileSync( pathOfIndexHTML, "utf8" );
                
                injectedIndexHTML = originalIndexHTMLData.replace( "<head>","<head>" + injectedScript );
                fs.writeFileSync(pathOfIndexHTML ,injectedIndexHTML, "utf8" );

                console.log("WEINRE successfully injected in Reload");
            }

            console.log("bundling the app " + projectDir);
            var exec = require('child_process').exec;

            function puts(error, stdout, stderr)
            {
                console.log("stdout: " + stdout);
                console.log("stderr: " + stderr);
                console.log("error: " + error);
                callback(globals.rootWorkspacePath + globals.fileSeparator +
                         projectDir + "/LocalFiles.bin");

                // Revert index.html to it previous state without the weinre injection
                if(weinreDebug)
                    fs.writeFileSync(pathOfIndexHTML, originalIndexHTMLData, "utf8" );
            }

            var bundleCommand = "bin\\win\\Bundle.exe";
            
            if (globals.localPlatform.indexOf("darwin") >=0)
            {
              bundleCommand = "bin/mac/Bundle";
            }
            else if (globals.localPlatform.indexOf("linux") >=0)
            {
              bundleCommand = "bin/linux/Bundle";
            }

            var command =  bundleCommand + " -in \"" + globals.rootWorkspacePath +
                globals.fileSeparator + projectDir + 
                globals.fileSeparator + "LocalFiles\" -out \"" +
                globals.rootWorkspacePath + globals.fileSeparator + projectDir  + 
                globals.fileSeparator + "LocalFiles.bin\"";
            exec(command, puts);        
        }
        catch(err)
        {
            console.log("Error in bundleApp: " + err);
        }
    },

    openProjectFolder: function (projectFolder, sendResponse) {
        try {
            var exec = require('child_process').exec;
            function puts(error, stdout, stderr) {
                console.log("stdout: " + stdout);
                console.log("stderr: " + stderr);
                console.log("error: " + error);
            }
            
            if((globals.localPlatform.indexOf("darwin") >= 0)) {

                var command = "open " + globals.rootWorkspacePath + globals.fileSeparator + 
                                        this.fixPathsUnix(projectFolder) + "/LocalFiles";
            }
            else if ((globals.localPlatform.indexOf("linux") >=0)) {

                var commandStat = fs.statSync("/usr/bin/nautilus");
                if(commandStat.isFile()) {

                  var command = "nautilus " + globals.rootWorkspacePath + globals.fileSeparator + 
                                              this.fixPathsUnix(projectFolder) + "/LocalFiles &";
                }
                else {

                  var command = "dolphin " + globals.rootWorkspacePath + globals.fileSeparator + 
                                             this.fixPathsUnix(projectFolder) + "/LocalFiles &";
                }
            }
            else {
                var command = "explorer \"" + globals.rootWorkspacePath + globals.fileSeparator + 
                                              projectFolder + "\\LocalFiles\"";
            }
            exec(command, puts);
            sendResponse("");
        }
        catch(err) {
            console.log("Error in openProjectFolder: " + err);
            sendResponse("");
        }
    },

    getClientInfo: function (sendResponse) {
        sendResponse(globals.deviceInfoListJSON);
    },

    getDebugData: function (sendResponse) {

        if(!globals.isDebuggingStarted) {
            //Initialize debugging
            this.startDebugging();
            sendResponse("");
        }
        else {

            if(globals.clearData == false) {

                if(globals.useSecondaryBuffer) {

                    globals.useSecondaryBuffer = false;
                    var dataString  = JSON.stringify(globals.logCatData);
                    globals.logCatData = [];
                    sendResponse(dataString);
                }
                else {

                    globals.useSecondaryBuffer = true;
                    var dataString  = JSON.stringify(globals.logCatData2);
                    globals.logCatData2 = [];
                    sendResponse(dataString);
                }
            }
            else {

                sendResponse("");
            }
        }
    },

    // Internal function 
    startDebugging: function () {
        try {

            globals.isDebuggingStarted = true;
            
            var util = require('util');
            var spawn = require('child_process').spawn;

            if((localPlatform.indexOf("darwin") >= 0)) {

                adb = spawn('bin/mac/android/adb', ['logcat']);
            }
            else if((localPlatform.indexOf("linux") >=0)) {

                adb = spawn('bin/linux/android/adb', ['logcat']);
            }
            else {

                adb = spawn('bin\\win\\android\\adb.exe', ['logcat']);
            }

            adb.stdout.setEncoding("utf8");
            adb.stdout.on('data', function (data) {
                
                if(globals.useSecondaryBuffer) {

                    globals.logCatData.push(data);
                }
                else {

                    globals.logCatData2.push(data);
                }
            });
        }
        catch(err) {

            console.log("Error in startDebugging: " + err);
        }
    },

    getRemoteLogData: function (sendResponse) {

        var dataString  = JSON.stringify(globals.gRemoteLogData);
        globals.gRemoteLogData = [];
        sendResponse(dataString);
    },

    getWorkspacePath: function (sendResponse) {

        var workspaceJSON = JSON.stringify({"path":globals.rootWorkspacePath})
        
        sendResponse(workspaceJSON);
    },

    changeWorkspacePath: function (newWorkspacePath, sendResponse) {
        
        
        console.log("Changing workspace to " + newWorkspacePath);
        var path = require('path');
        path.exists(newWorkspacePath, function(exists) {

            if(exists) {

                this.setRootWorkspacePath(newWorkspacePath);
                this.findProjects(function(){}, sendResponse);
            }
            else {

                console.log("workspace does not exist");
                fs.mkdirSync(newWorkspacePath);
                this.setRootWorkspacePath(newWorkspacePath);
                this.findProjects(function(){},sendResponse);
            }
        });

        sendResponse("");
    },

    // internal functions
    fixPathsUnix: function(path) {
        var pathTemp = path;

        while(pathTemp.indexOf(" ") > 0) {

            console.log(pathTemp.indexOf(" "));
            pathTemp = pathTemp.replace(" ", "%20");
        }

        while(pathTemp.indexOf("%20") > 0) {

            console.log(pathTemp.indexOf("%20"));
            pathTemp = pathTemp.replace("%20", "\\ ");
        }

        return pathTemp;
    }
};

rpc.exposeModule('manager', rpcFunctions);
