var rpc   = require('../lib/jsonrpc');
var net   = require('net');
var fs    = require('fs');
var path  = require('path');
var ncp   = require('../node_modules/ncp');
var cheerio = require('cheerio');
var http = require('http');

/**
 * The functions that are available for remote calling
 */

var vars = require('./globals');

/**
 * Send a given message to all connected clients.
 * @param jsonMessage Message in JSON format.
 * The message must contain a field named 'message'
 * with the message name.
 */
var sendToAllClients = function(jsonMessage) {

    // TODO: What about a client list object that has a send
    // method in it and other methods for managing the client list.
    // And a client object instaed of using bare socket objects.
    vars.globals.clientList.forEach(function (client) {

        try {
            // Protocol consists of header "RELOADMSG" followed
            // by data length encoded as 8 hex didgits, e.g.: "000000F0"
            // Then string data follows with actual JSON message.
            // Advantage with hex is that we can read fixed numer of bytes
            // in the read operation.
            // Convert to hex:
            // http://stackoverflow.com/questions/57803/how-to-convert-decimal-to-hex-in-javascript

            // Construct message with proper header.
            var message = JSON.stringify(jsonMessage);
            var fullMessage = "RELOADMSG" + self.toHex8Byte(message.length) + message;

            // Send the message.
            // TODO: Perhaps make client object that wraps the base socket and
            // put a send/write method in there.
            var result = client.write(fullMessage, "ascii");
        }
        catch (err) {
            console.log("@@@ reload_manager.js: sendToAllClients error: " + err, 0)

            // Remove this client from the list since we have problems with it.
            var index = vars.globals.clientList.indexOf(client);
            if (index != -1)
            {
                vars.globals.clientList.splice(index, 1);
            }
        }
    });
};

// TODO: Move non-RPC functions out of this object to make the code
// mode clean and make rpcFunctions contain only the RPC functions.
var rpcFunctions = {

    /**
     * (internal function) Used to acquire the server ip address
     */
    getIpFromSocket: function (sendResponse) {

        var socket = net.createConnection(80, "www.google.com");

        socket.on('connect', function () {

            vars.globals.ip = socket.address().address;
            if (sendResponse !== undefined) {
                sendResponse({hasError: false, data: vars.globals.ip});
            } else {
                console.log("Server IP: " + vars.globals.ip, 0);
            }
            socket.end();
        });

        socket.on('error', function (e) {
            if (sendResponse !== undefined) {
                sendResponse({hasError: true, data: "Error in socket"});
            }
        });
    },

    /**
     * (RPC): Returns the server IP
     */
    getNetworkIP: function (sendResponse) {
        //check if parameter passing was correct
        if( (typeof sendResponse !== 'function') &&
            (sendResponse !== undefined) ) return false;

        if (vars.globals.ip === null) {
            this.getIpFromSocket(sendResponse);
        }
        else {
            if(sendResponse !== undefined) {
                sendResponse({hasError: false, data: vars.globals.ip});
            }
        }
    },

    /**
     * (RPC): Returns the version information of Reload
     */
    getVersionInfo: function (sendResponse) {

        //check if parameter passing was correct
        if(typeof sendResponse !== 'function') return false;

        vars.globals.versionInfo = fs.readFileSync("build.dat", "ascii").split("\n");

        var versionInfoJSON = JSON.stringify({"version":vars.globals.versionInfo[0],
                                              "timestamp": vars.globals.versionInfo[1]});

        console.log(vars.globals.versionInfo[0].replace(/^\s+|\s+$/g,'') + "  " + 
                    vars.globals.versionInfo[1].replace(/^\s+|\s+$/g,''), 0);

        sendResponse({hasError: false, data: versionInfoJSON});
    },

    /**
     * (RPC): Returns the Project list with attributes: url, name, path
     */
    getProjectList: function (sendResponse) {

        //check if parameter passing was correct
        if(typeof sendResponse !== 'function') return false;

        this.findProjects( function (projects) {

            var projectListJSON = [];

            projects.forEach(function(p) {

                var projectInfo = {

                    url: "http://localhost:8282/" + p + "/LocalFiles.html",
                    name: p,
                    path: vars.globals.rootWorkspacePath +
                          vars.globals.fileSeparator + p
                }
                projectListJSON.push(projectInfo);

            });

            sendResponse({hasError: false, data: projectListJSON});
        },sendResponse);
    },

    /**
     * (internal function) Searches the current workspace path, finds
     * and creates a list of projects exist in tha directory
     */
    findProjects: function (callback, sendResponse) {
        try {

            fs.exists( vars.globals.rootWorkspacePath, function(exist) {

                if(!exist) {
                    console.log("Creating the workspace directory " +
                                vars.globals.rootWorkspacePath, 0);
                    fs.mkdirSync(vars.globals.rootWorkspacePath, 0755);
                }

                // Now, check for projects in it
                files = fs.readdirSync(vars.globals.rootWorkspacePath);

                var projects = [];

                for (var key in files) {

                    var file = files[key];
                    var stat = fs.statSync(vars.globals.rootWorkspacePath +
                                           vars.globals.fileSeparator +
                                           file);

                    if(stat && stat.isDirectory()) {
                        try {

                            var LocalfileStat = fs.lstatSync(vars.globals.rootWorkspacePath +
                                                vars.globals.fileSeparator +  file + "/LocalFiles");

                            if(LocalfileStat && LocalfileStat.isDirectory()) {
                                projects.push(file);
                            }
                        }
                        catch(e) {
                            //do nothing
                        }
                    }
                }
                callback(projects, sendResponse);
            });
        }
        catch (err) {
            console.log("ERROR in findProjects: " + err, 0);
        }
    },

    /**
     * (RPC): Creates a new Project "projectName" of type "projectType"
     *        which can be NativeUI or Web based
     */
    createNewProject: function (projectName, projectType, sendResponse) {

        //check if parameter passing was correct
        if(typeof sendResponse !== 'function') return false;

        var self = this;

        // check if directory exists
        fs.exists( vars.globals.rootWorkspacePath +
                   vars.globals.fileSeparator +
                   projectName, function (exists) {
            if(exists) {
                sendResponse({hasError: true, data: "Error in createNewProject: Project already exists."});
            }
            else {
                try {
                    console.log(
                        "Creating new project: " + projectName +
                        ", of type " + projectType, 0);

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
                        
                        console.log("stdout: " + stdout, 2);
                        if (error)
                        {
                            console.log("ERROR stderr: " + stderr, 0);
                            console.log("ERROR error: " + error, 0);
                        }

                        var projectData = fs.readFileSync(vars.globals.rootWorkspacePath +
                                                          vars.globals.fileSeparator +
                                                          projectName +
                                                          vars.globals.fileSeparator +
                                                          ".project", 'utf8');

                        //TODO: Very bad way to change the project name in file
                        var newData = projectData.replace(templateName, projectName);

                        fs.writeFileSync(vars.globals.rootWorkspacePath +
                                         vars.globals.fileSeparator +
                                         projectName +
                                         vars.globals.fileSeparator +
                                         ".project", newData    , 'utf8');

                        sendResponse({hasError: false, data: projectName});
                    }

                    if((vars.globals.localPlatform.indexOf("darwin") >= 0) ||(vars.globals.localPlatform.indexOf("linux") >=0))
                    {
                        var command = "cp -r " + self.fixPathsUnix(vars.globals.currentWorkingPath) +
                                                 "/templates/" +
                                                 self.fixPathsUnix(templateName) +
                                           " " + self.fixPathsUnix(vars.globals.rootWorkspacePath) +
                                                 self.fixPathsUnix(vars.globals.fileSeparator) +
                                                 self.fixPathsUnix(projectName);
                    }
                    else
                    {
                        var command = "xcopy /e /I \"" + vars.globals.currentWorkingPath +
                                                         "\\templates\\" + templateName +
                                               "\" \"" + vars.globals.rootWorkspacePath +
                                                         vars.globals.fileSeparator +
                                                         projectName + "\"";
                    }
                    console.log("Command: " + command, 2);
                    exec(command, resultCommand);
                }
                catch(err)
                {
                    console.log("ERROR in createNewProject: " + err, 0);
                    sendResponse({hasError: true, data: "Error in createNewProject: " + err});
                }
            }
        });
    },

    /**
     * (RPC): Deletes the "projectName" directory
     */
    removeProject: function (projectName, sendResponse) {

        var responseSent = false;
        //check if parameter passing was correct
        if ((typeof sendResponse !== 'function') || projectName === "") {
            return false;
        }

        var projectPath = vars.globals.rootWorkspacePath +
                          vars.globals.fileSeparator +
                          projectName;

        // Delete directory
        this.removeRecursive(projectPath, function (error, status){
            if(!error) {
                console.log("Succesfull deletion of directory " + projectPath, 0);
                if (!responseSent) {
                    sendResponse({hasError: false, data: "Succesfull deletion of project " + projectName});
                    responseSent = true;
                }
            }
            else {
                console.log("ERROR in deletion of directory " + projectPath, 0);
                console.log("ERROR deleting project: " + error, 0);
                if (!responseSent) {
                    sendResponse({hasError: true, data: "Error deleting project: " + error});
                    responseSent = true;
                }
            }
        });
    },

    /**
     * (internal function) Deletes recursively a file or folder given in "path"
     * and all of it's contents if there are any.
     */
    removeRecursive: function (path, cb) {
        var self = this;

        fs.stat(path, function (err, stats) {

            if (err) {
                cb(err, stats);
                return;
            }

            if (stats.isFile()) {

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
            else if (stats.isDirectory()) {
                // A folder may contain files
                // We need to delete the files first
                // When all are deleted we could delete the
                // dir itself
                fs.readdir(path, function (err, files) {

                    if (err) {

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
                        if (f_length===f_delete_index) {

                            fs.rmdir(path, function(err) {
                                if (err) {
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

                    if (!checkStatus()) {

                        for (var i = 0; i < f_length; i++) {

                            // Create a local scope for filePath
                            // Not really needed, but just good practice
                            // (as strings arn't passed by reference)
                            (function(){
                                var filePath = path + vars.globals.fileSeparator + files[i];
                                // Add a named function as callback
                                // just to enlighten debugging
                                self.removeRecursive(filePath, function removeRecursiveCB(err, status) {
                                    if (!err) {

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
    },

    /**
     * (RPC): Rename the "oldName" project to "newName"
     */
    renameProject: function (oldName, newName, sendResponse) {

        //check if parameter passing was correct
        if(typeof sendResponse !== 'function') return false;

        try {
            console.log("Renaming Project from " + oldName + " to " + newName, 0);

            var exec = require('child_process').exec;
            var respond = sendResponse;

            function resultCommand(error, stdout, stderr) {
                
                console.log("stdout: " + stdout, 2);
                if (error)
                {
                    console.log("ERROR stderr: " + stderr, 0);
                    console.log("ERROR error: " + error, 0);
                }

                var projectData = fs.readFileSync(vars.globals.rootWorkspacePath +
                                                  vars.globals.fileSeparator +
                                                  newName +
                                                  vars.globals.fileSeparator +
                                                  ".project", 'utf8');

                var newData = projectData.replace(oldName, newName);
                fs.writeFileSync(vars.globals.rootWorkspacePath +
                                 vars.globals.fileSeparator +
                                 newName +
                                 vars.globals.fileSeparator +
                                 ".project", newData, 'utf8');
                respond({hasError: false, data: newName});
            }

            if((vars.globals.localPlatform.indexOf("darwin") >= 0) ||(vars.globals.localPlatform.indexOf("linux") >=0))
            {
                var command = "mv " + this.fixPathsUnix(vars.globals.rootWorkspacePath) +
                                      this.fixPathsUnix(vars.globals.fileSeparator) +
                                      this.fixPathsUnix(oldName) +
                              " "   + this.fixPathsUnix(vars.globals.rootWorkspacePath) +
                                      this.fixPathsUnix(vars.globals.fileSeparator) +
                                      this.fixPathsUnix(newName);
            }
            else
            {
                var command = "rename \"" + vars.globals.rootWorkspacePath +
                                          vars.globals.fileSeparator +
                                          oldName +
                              "\" \"" + newName + "\"";
            }
            console.log("Command: " + command, 2);
            exec(command, resultCommand);
        }
        catch(err) {
            console.log("ERROR in renameProject(" + oldname + ", " + newName + "): " + err, 0);
            sendResponse({hasError: true, data: "Error in renameProject(" + oldname + ", " + newName + "): " + err});
        }
    },

    /**
     * (RPC): - Makes a copy of the project
     *        - Modifies the data weinre and Js debuging
     *        - Bundles the project folder
     *        - Request the mobile device to "Reload" the project.
     */
    reloadProject: function (projectPath, debug, sendResponse) {

        //check if parameter passing was correct
        if (typeof sendResponse !== 'function') return false;

        var self = this;

        var weinreDebug;
        console.log("-----------------------------------------------");
        console.log("-                 R e l o a d                 -");
        console.log("-----------------------------------------------");
        if (typeof debug !== "boolean" || typeof debug === "undefined") {
            weinreDebug = false;
        }
        else {
            weinreDebug = debug;
        }

        console.log("Weinre Enabled:" + weinreDebug);

        sendResponse({hasError: false, data: ""});

        // Bundle the app.
        this.bundleApp(projectPath, weinreDebug, function(actualPath) {

            // We will send the file size information together with
            // the command as an extra level of integrity checking.
            var data = fs.readFileSync(actualPath);
            var url = projectPath.replace(
                "LocalFiles.html",
                "LocalFiles.bin").replace(
                    ' ',
                    '%20');

            console.log("---------- S e n d i n g   B u n d l e --------");
            console.log("actualPath: " + actualPath);
            console.log("url: " + url + "?filesize=" + data.length);

            // Send the new bundle URL to the device clients.
            sendToAllClients({
                message: 'ReloadBundle',
                url: url,
                fileSize: data.length
            });

            // Collect Stats Statistics
            if(vars.globals.statistics === true) {
                var indexPath = vars.globals.rootWorkspacePath +
                                vars.globals.fileSeparator + projectPath +
                                vars.globals.fileSeparator + "LocalFiles" +
                                vars.globals.fileSeparator + "index.html";

                var indexFileData = String(fs.readFileSync(indexPath, "utf8"));
                
                $ = cheerio.load(indexFileData,{
                    lowerCaseTags: false
                });
                var nativeUIProject = $("#NativeUI");
                vars.methods.loadStats(function (statistics) {

                    if(nativeUIProject.length) {
                        statistics.totalReloadsNative += 1;
                    } else {
                        statistics.totalReloadsHTML += 1;
                    }
                    
                    statistics.lastActivityTS = new Date().getTime();
                    vars.methods.saveStats(statistics);
                });
            }
        });
    },

    /**
     * (RPC): Evaluate JS on the clients.
     */
    evalJS: function (script, sendResponse) {
        if(typeof sendResponse !== 'function') return false;
        console.log("@@@ ====================================");
        console.log("@@@ evalJS " + script);
        //console.log("@@@ Callstack:");
        //console.log(new Error("CallStack").stack);
        sendResponse({hasError: false, data: "ok"});
        sendToAllClients({
            message: 'EvalJS',
            script: script
        });
    },

    /**
     * (internal function) Used exclusivle by reloadProject RPC and is used
     * to create a temporary directory, modify data as needed bundle the app
     * and delete the temp directory
     */
    bundleApp: function (projectDir, weinreDebug, callback) {

        // copy project files to naother directory which will
        // be bundled
        var self = this,
            pathToLocalFiles =  vars.globals.rootWorkspacePath +
                                vars.globals.fileSeparator +
                                projectDir +
                                vars.globals.fileSeparator + "LocalFiles",
            pathToTempBundle =  vars.globals.rootWorkspacePath +
                                vars.globals.fileSeparator +
                                projectDir +
                                vars.globals.fileSeparator + "TempBundle";
        ncp.limit = 16;

        console.log("Path to Project  : " + pathToLocalFiles);
        console.log("Path to TempFiles: " + pathToTempBundle);

        if(weinreDebug) {

            try {

                ncp.ncp(pathToLocalFiles, pathToTempBundle, function (err){
                    if (err) {
                        console.log('ERROR Copy Process      : Error-' + err, 0);
                    }
                    console.log('Copy Process      : Successfull');

                    self.debugInjection(projectDir, function (){

                        
                            //INJECT WEINRE SCRIPT
                            //<script src="http://<serverip>:<port>/target/target-script-min.js"></script>
                            //eg: <script src="http://192.168.0.103:8080/target/target-script-min.js"></script>
                            console.log("Server IP         : "+vars.globals.ip);
                            var injectedScript = "<script src=\"http://" + vars.globals.ip +
                                                 ":8080/target/target-script-min.js\"></script>";

                            var pathOfIndexHTML =   pathToTempBundle +
                                                    vars.globals.fileSeparator + "index.html";

                            console.log("Path to index.html: " + pathOfIndexHTML);
                            var originalIndexHTMLData = fs.readFileSync( pathOfIndexHTML, "utf8" );

                            injectedIndexHTML = originalIndexHTMLData.replace( "<head>","<head>" + injectedScript );

                            fs.writeFileSync(pathOfIndexHTML ,injectedIndexHTML, "utf8" );

                            console.log("WEINRE Injection  : Successfull");

                            console.log("----------- C r e a t e   B u n d l e ---------");
                            var exec = require('child_process').exec;

                            function puts(error, stdout, stderr)
                            {
                                console.log("stdout: " + stdout);
                                if (error) {
                                    console.log("ERROR stderr: " + stderr, 0);
                                    console.log("ERROR error : " + error, 0);
                                }
                                
                                callback(vars.globals.rootWorkspacePath + vars.globals.fileSeparator +
                                         projectDir + "/LocalFiles.bin");

                                // Delete TempBundle directory
                                self.removeRecursive(pathToTempBundle, function (error, status){
                                    if(!error) {
                                        console.log("Delete Temp: Successfull");
                                    }
                                    else {
                                        console.log("Delete Temp: Error-" + error);
                                    }
                                });
                            }

                            var bundleCommand = "bin\\win\\Bundle.exe";

                            if (vars.globals.localPlatform.indexOf("darwin") >=0)
                            {
                              bundleCommand = "bin/mac/Bundle";
                            }
                            else if (vars.globals.localPlatform.indexOf("linux") >=0)
                            {
                              bundleCommand = "bin/linux/Bundle";
                            }

                            var command =  bundleCommand + " -in \"" + pathToTempBundle + "\" -out \"" +
                                vars.globals.rootWorkspacePath + vars.globals.fileSeparator + projectDir  +
                                vars.globals.fileSeparator + "LocalFiles.bin\"";
                            exec(command, puts);
                    });
                });
            } catch(err) {
                console.log("ERROR in bundleApp: " + err, 0);
            }
        } else {
            try {

                console.log("----------- C r e a t e   B u n d l e ---------");
                var exec = require('child_process').exec;

                function puts(error, stdout, stderr)
                {
                    console.log("stdout: " + stdout);
                    if (error){
                        console.log("stderr: " + stderr, 0);
                        console.log("error : " + error, 0);
                    }
                                        
                    callback(vars.globals.rootWorkspacePath + vars.globals.fileSeparator +
                             projectDir + "/LocalFiles.bin");
                }

                var bundleCommand = "bin\\win\\Bundle.exe";

                if (vars.globals.localPlatform.indexOf("darwin") >=0)
                {
                  bundleCommand = "bin/mac/Bundle";
                }
                else if (vars.globals.localPlatform.indexOf("linux") >=0)
                {
                  bundleCommand = "bin/linux/Bundle";
                }

                var command =  bundleCommand + " -in \"" + pathToLocalFiles + "\" -out \"" +
                    vars.globals.rootWorkspacePath + vars.globals.fileSeparator + projectDir  +
                    vars.globals.fileSeparator + "LocalFiles.bin\"";
                exec(command, puts);
            }
            catch(err)
            {
                console.log("Error in bundleApp: " + err, 0);
            }
        }
    },

    /**
     * (RPC): Open the project folderin a new window
     */
    openProjectFolder: function (projectFolder, sendResponse) {

        //check if parameter passing was correct
        if(typeof sendResponse !== 'function') return false;

        try {
            var exec = require('child_process').exec;

            console.log("stdout: " + stdout);
            function puts(error, stdout, stderr) {
                console.log("ERROR stderr: " + stderr, 0);
                console.log("ERROR error: " + error, 0);
            }

            if((vars.globals.localPlatform.indexOf("darwin") >= 0)) {

                var command = "open " + vars.globals.rootWorkspacePath + vars.globals.fileSeparator +
                                        this.fixPathsUnix(projectFolder) + "/LocalFiles";
            }
            else if ((vars.globals.localPlatform.indexOf("linux") >=0)) {

                var commandStat = fs.statSync("/usr/bin/nautilus");
                if(commandStat.isFile()) {

                  var command = "nautilus " + vars.globals.rootWorkspacePath + vars.globals.fileSeparator +
                                              this.fixPathsUnix(projectFolder) + "/LocalFiles &";
                }
                else {

                  var command = "dolphin " + vars.globals.rootWorkspacePath + vars.globals.fileSeparator +
                                             this.fixPathsUnix(projectFolder) + "/LocalFiles &";
                }
            }
            else {
                var command = "explorer \"" + vars.globals.rootWorkspacePath + vars.globals.fileSeparator +
                                              projectFolder + "\\LocalFiles\"";
            }
            exec(command, puts);
            sendResponse({hasError: false, data: ""});
        }
        catch(err) {
            console.log("ERROR in openProjectFolder: " + err, 0);
            sendResponse({hasError: true, data: "Error in openProjectFolder: " + err});
        }
    },

    /**
     * (RPC): Returns a list with the devices connected to the Server and info
     */
    getClientInfo: function (sendResponse) {

        //check if parameter passing was correct
        if(typeof sendResponse !== 'function') return false;

        sendResponse({hasError: false, data: vars.globals.deviceInfoListJSON});
    },

    /**
     * (RPC): Returns the log from adb logcat
     */
    getDebugData: function (sendResponse) {

        //check if parameter passing was correct
        if(typeof sendResponse !== 'function') return false;

        if(!vars.globals.isDebuggingStarted) {
            //Initialize debugging
            this.startDebugging();
            sendResponse({hasError: false, data: ""});
        }
        else {

            if(vars.globals.clearData == false) {

                if(vars.globals.useSecondaryBuffer) {

                    vars.globals.useSecondaryBuffer = false;
                    var dataString  = JSON.stringify(vars.globals.logCatData);
                    vars.globals.logCatData = [];
                    sendResponse({hasError: false, data: dataString});
                }
                else {

                    vars.globals.useSecondaryBuffer = true;
                    var dataString  = JSON.stringify(vars.globals.logCatData2);
                    vars.globals.logCatData2 = [];
                    sendResponse({hasError: false, data: dataString});
                }
            }
            else {

                sendResponse({hasError: false, data: ""});
            }
        }
    },

    /**
     * (internal function) Starts the adb for android
     */
    startDebugging: function () {
        try {

            vars.globals.isDebuggingStarted = true;

            var util = require('util');
            var spawn = require('child_process').spawn;

            if((vars.globals.localPlatform.indexOf("darwin") >= 0)) {

                adb = spawn('bin/mac/android/adb', ['logcat']);
            }
            else if((vars.globals.localPlatform.indexOf("linux") >=0)) {

                adb = spawn('bin/linux/android/adb', ['logcat']);
            }
            else {

                adb = spawn('bin\\win\\android\\adb.exe', ['logcat']);
            }

            adb.stdout.setEncoding("utf8");
            adb.stdout.on('data', function (data) {

                if(vars.globals.useSecondaryBuffer) {

                    vars.globals.logCatData.push(data);
                }
                else {

                    vars.globals.logCatData2.push(data);
                }
            });
        }
        catch(err) {

            console.log("ERROR in startDebugging: " + err, 0);
        }
    },

    /**
     * (RPC): Returns log messages from the Reload Client
     */
    getRemoteLogData: function (sendResponse) {

        //check if parameter passing was correct
        if(typeof sendResponse !== 'function') return false;

        var unescapedLogArray = [];
        vars.globals.gRemoteLogData.forEach(function (element, index, self){
            unescapedLogArray[index] = unescape(element);
        });

        var dataString  = JSON.stringify(unescapedLogArray);
        
        vars.globals.gRemoteLogData = [];

        sendResponse({hasError: false, data: dataString});
    },

    /**
     * (RPC): Returns the current workspace directory
     */
    getWorkspacePath: function (sendResponse) {

        //check if parameter passing was correct
        if(typeof sendResponse !== 'function') return false;

        sendResponse({hasError: false, data: {"path":vars.globals.rootWorkspacePath}});
    },

    sendFeedback : function (text, sendResponse) {
        //check if parameter passing was correct
        if(typeof sendResponse !== 'function' || typeof text !== "string") {
            return false;
        }

        var postData = "data=" + escape(JSON.stringify({ feedback : text }));

        var requestOptions = vars.globals.feedbackRequestOptions;

        requestOptions.headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        };

        // Set up the request
        var postRequest = http.request(requestOptions, function(res) {

            var responseText = "";

            if(res.statusCode == 200) {
                sendResponse({hasError: false, data: true});
            } else {
                sendResponse({hasError: true, data: "Error in processing feedback"});
            }

            res.setEncoding('utf8');
            res.on('error', function (){
                sendResponse({hasError: true, data: "Error in processing feedback"});
            });
            res.on('data', function (chunk) {

                responseText += chunk;
            });
        });

        postRequest.on('error', function(e) {
            sendResponse({hasError: true, data: "Could not establish connection with Mosync."});
            console.log('ERROR Could not establish connection with MoSync: ' + e.message, 0);
        });
        // post the data
        postRequest.write(postData);
        postRequest.end();
    },

    /**
     * (RPC and Internal) Used to send the feedback data if there are any
     */
    sendStats: function (sendResponse) {

        function respond( error, message) {
            if(typeof sendResponse === 'function') {
                sendResponse({hasError: error, data: message});
            }
            console.log(message);
        };

        if (!vars.globals.statistics) {
            respond(true, "Sending Statistics is not enabled.");
            return;
        }
        
        vars.methods.loadStats( function(statistics){

            if( statistics.clients.length === 0 ) {
                respond(false, "Nothing to Send");
                return;
            }

            var postData = "data=" + escape(JSON.stringify(statistics));
        
            var requestOptions = vars.globals.statsRequestOptions;
            requestOptions.headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length
            };

            // Set up the request
            var postRequest = http.request(requestOptions, function(res) {

                var responseText = "",
                    startTS = new Date().getTime();

                if(res.statusCode == 200) {
                    vars.methods.loadStats(function (statistics) {
                        statistics.totalReloadsNative = 0;
                        statistics.totalReloadsHTML = 0;
                        statistics.serverStartTS = startTS;
                        statistics.lastActivityTS = startTS;
                        statistics.clients = [];
                        vars.methods.saveStats(statistics);
                    });

                    //if it is an RPC call
                    respond(false, "Statistics Sent");
                    
                } else {
                    respond(true, "Status Code: " + res.statusCode);
                }

                res.setEncoding('utf8');
                res.on('error', function (){
                    respond(true, "Error in processing feedback");
                });
                res.on('data', function (chunk) {

                    responseText += chunk;
                });
            });

            postRequest.on('error', function(e) {
                respond(true, 'Could not establish connection with MoSync: ' + e.message);                
            });
            // post the data
            postRequest.write(postData);
            postRequest.end();
        });
    },

    /**
     * (RPC): Changes the workspace directory to "newWorkspacePath"
     */
    changeWorkspacePath: function (newWorkspacePath, sendResponse) {

        //check if parameter passing was correct
        if(typeof sendResponse !== 'function') return false;

        var self = this;

        console.log("Changing workspace to " + newWorkspacePath, 0);

        path.exists(newWorkspacePath, function(exists) {

            if(exists) {

                self.setRootWorkspacePath(newWorkspacePath);
                self.findProjects(function(){}, sendResponse);
            }
            else {

                console.log("workspace does not exist", 0);
                fs.mkdirSync(newWorkspacePath);
                self.setRootWorkspacePath(newWorkspacePath);
                self.findProjects(function(){},sendResponse);
            }
        });

        if(sendResponse !== undefined) {

            sendResponse({hasError: false, data: newWorkspacePath});
        }
    },

    /**
     * (RPC): Removes a workspace directory.
     */
    removeWorkspace: function (workspacePath, sendResponse) {
        var self, responseSent, response;

        self = this;
        responseSent = false;
        response = { hasError: false, data: workspacePath };

        // check if parameter passing was correct
        if (typeof sendResponse !== 'function') {
            return false;
        }

        console.log("--- Removing workspace " + workspacePath);

        path.exists(workspacePath, function(exists) {
            if(exists) {
                self.removeRecursive(workspacePath, function (error, status){
                    if(!error) {
                        console.log("Succesfull deletion of directory " + workspacePath, 0);
                        response = {hasError: false, data: "Succesfull deletion of " + workspacePath};
                    } else {
                        console.log("ERROR in deletion of " + workspacePath, 0);
                        response = {hasError: true, data: "ERROR deleting project: " + error};
                    }
                });
            } else {
                console.log('ERROR ' + workspacePath + ' does not exist', 0);
            }
        });

        if(sendResponse !== undefined && !responseSent) {
            sendResponse(response);
            responseSent = true;
        }
    },

    /**
     * (RPC): Sets a configuration option to specified value
     */
    setConfig: function (option, value, sendResponse ) {
        //check if parameter passing was correct
        var config = {};
        if(typeof sendResponse !== 'function') return false;

        fs.exists(process.cwd() + vars.globals.fileSeparator + "config.dat", function (exists) {
            if(exists) {
                fs.readFile(process.cwd() + vars.globals.fileSeparator + "config.dat", 
                    "utf8", 
                    function(err, data){
                        //console.log(data);
                        if (err) throw err;

                        config = JSON.parse(data);
                        config[option] = value;

                        fs.writeFile( process.cwd() + vars.globals.fileSeparator + "config.dat",
                                      JSON.stringify(config),
                                      "utf8", 
                                      function(err, data){
                                        if (err) throw err;

                                        //set the configuration var
                                        vars.globals[option] = value;

                                        sendResponse({hasError: false, data: true});
                                    });
                    });
            } else {
                config[option] = value;

                fs.writeFile( process.cwd() + vars.globals.fileSeparator + "config.dat",
                                      JSON.stringify(config),
                                      "utf8", 
                                      function(err, data){
                                        if (err) throw err;

                                        //set the configuration var
                                        vars.globals[option] = value;

                                        sendResponse({hasError: false, data: true});
                                    });   
            }
        });
    },
    
    /**
     * (RPC): Gets a configuration option's value
     */
    getConfig: function (option, sendResponse ) {
        //check if parameter passing was correct
        var config = {};
        if(typeof sendResponse !== 'function') return false;

        sendResponse({hasError: false, data: vars.globals[option]});
    },

    /**
     * (internal function) At server startup initializes the global var for path
     */
    getLatestPath : function () {

        self = this;
        var defaultPath = vars.globals.homeDir + vars.globals.fileSeparator + "MoSync_Reload_Projects"
        try {

            fs.exists('lastWorkspace.dat', function(exists) {

                if (exists) {

                    var data = String(fs.readFileSync('lastWorkspace.dat', "utf8"));
                    if(data != "") {

                        self.setRootWorkspacePath(data);
                    }
                    else {

                        console.log("ERROR reading last workspace path, reverting to default", 0);
                        self.setRootWorkspacePath(defaultPath);
                        self.changeWorkspacePath(defaultPath);
                    }
                }
                else {

                    self.setRootWorkspacePath(defaultPath);
                    self.changeWorkspacePath(defaultPath);
                }
            });
        }
        catch(err) {

            console.log("ERROR in getLatestPath: " + err, 0);
        }
    },

    /**
     * (internal function) Setter function that sets the path global variable
     * and write the value to lastworkspace.dat
     */
    setRootWorkspacePath : function (path){

        vars.globals.rootWorkspacePath = path;
        console.log("Using workspace at: " + path, 0);

        try {

            fs.writeFile('lastWorkspace.dat', path, function (err) { });
        }
        catch(err) {

            console.log("ERROR in setRootWorkspacePath: " + err, 0);
        }
    },

    /**
     * (internal function)
     */
    fixPathsUnix: function (path) {
        var pathTemp = path;

        while(pathTemp.indexOf(" ") > 0) {

            console.log(pathTemp.indexOf(" "));
            pathTemp = pathTemp.replace(" ", "%20");
        }

        while(pathTemp.indexOf("%20") > 0) {

            //console.log(pathTemp.indexOf("%20"));
            pathTemp = pathTemp.replace("%20", "\\ ");
        }

        return pathTemp;
    },

    /**
     * (internal function) Converts a decimal value to 8byte length Hex
     */
    toHex8Byte: function (decimal) {

        var finalHex  = decimal.toString(16);

        while (finalHex.length < 8)
            finalHex = "0"+finalHex;

        return finalHex;
    },

    /**
     * (internal function) injects evaluation code for error capturing
     * in the javascript code
     */
    debugInjection: function (projectName, callback) {

        var self = this,
            indexHtmlPath = vars.globals.rootWorkspacePath +
                            vars.globals.fileSeparator +
                            projectName +
                            vars.globals.fileSeparator + 'TempBundle' +
                            vars.globals.fileSeparator + 'index.html',
            data = String(fs.readFileSync( indexHtmlPath.replace("TempBundle","LocalFiles"), "utf8")),
            debugNotice =   "/**\n" + 
                            " * NOTICE: The try catch statement is automaticaly added\n" + 
                            " * when the project is reloaded in debug mode.\n" +
                            " */\n";

        /**
         * Load the index.html file and parse it to a new window object
         * including jQuery for accessing and manipulating elements
         */
        $ = cheerio.load(data,{
            lowerCaseTags: false
        });

        /**
         * Get all embeded script tags
         */

        var embededScriptTags = $("script:not([class='jsdom']):not([src])").each( function (index, element) {
            $(this).html(debugNotice + "try {" + $(this).html() + " } catch (e) { mosync.rlog(e.stack); };");
        });
        console.log("--Debug Feature-- There was: " + embededScriptTags.length + " embeded JS scripts found.");

        /**
         * Get all external js script files
         */
        var externalScriptFiles = $("script[src]:not([class='jsdom'])").each(function (index, element){

            if( element.attribs.src !== "js/wormhole.js") {
                var scriptPath = vars.globals.rootWorkspacePath +
                                 vars.globals.fileSeparator +
                                 projectName +
                                 vars.globals.fileSeparator + 'TempBundle' +
                                 vars.globals.fileSeparator + self.fixPathsUnix(element.attribs.src);
                try {

                    var s = fs.statSync(scriptPath);

                    if( s.isFile() ) {
                        var jsFileData = String(fs.readFileSync(scriptPath, "utf8"));

                        jsFileData = debugNotice + "try {" + jsFileData + "} catch (e) { mosync.rlog(e.stack); };";
                        fs.writeFileSync(scriptPath, jsFileData, "utf8");
                    }
                } catch (e) {
                    console.log("ERROR in debugInjection:", 0);
                    console.log(e, 0);
                }
            }
        });
        console.log("--Debug Feature-- There was: " + externalScriptFiles.length + " external JS scripts found.");

        /**
         * Get all elements that have inline js code
         * To add more tag attributes:
         *   - add the attribute name (lowercase in attrs)
         * TODO: search more elements than only div
         */
        var attrs = ["onclick", "onevent", "onload"];    // Attribute list
        var inlineJsCode = $("div,body").each(function (index, element){

            for( var i in element.attribs ) {

                for( var j = 0; j < attrs.length; j++) {

                    if( i.toLowerCase() == attrs[j] ) {

                        var inlineCode = $(this).attr(i);

                        $(element).attr(i, debugNotice + "try {" + inlineCode + "} catch (e) { mosync.rlog(e.stack); };");
                    }
                }
            }
        });
        console.log("--Debug Feature-- There was: " + inlineJsCode.length + " inline JS scripts found.");

         /**
          * Write index.html file
          */
        fs.writeFileSync(indexHtmlPath, $.html(), "utf8");

        callback();
    }
};

// These functions are called for initialization
rpcFunctions.getVersionInfo(function (a){});
rpcFunctions.getLatestPath();
rpcFunctions.getNetworkIP();
vars.methods.loadConfig(function () {
    if(vars.globals.statistics === true) {
        rpcFunctions.sendStats();
    }
});

rpc.exposeModule('manager', rpcFunctions);
