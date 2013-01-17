var rpc   = require('../lib/jsonrpc');
var net   = require('net');
var fs    = require('fs');
var path  = require('path');
var jsdom = require('../node_modules/jsdom');
var ncp   = require('../node_modules/ncp');

/**
 * The functions that are available for remote calling
 */

var vars = require('./globals');

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

        var versionInfo = fs.readFileSync("build.dat", "ascii").split("\n");

        var versionInfoJSON = JSON.stringify({"version":versionInfo[0],
                                              "timestamp": versionInfo[1]});
        console.log(versionInfoJSON);

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
                                vars.globals.rootWorkspacePath);
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
            console.log("Error in findProjects: " + err);
        }
    },

    /**
     * (RPC): Creates a new Project "projectName" of type "projectType"
     *        which can be NativeUI or Web based
     */
    createNewProject: function (projectName, projectType, sendResponse) {

        //check if parameter passing was correct
        if(typeof sendResponse !== 'function') return false;

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
                var command = "cp -r " + this.fixPathsUnix(vars.globals.currentWorkingPath) +
                                         "/templates/" +
                                         this.fixPathsUnix(templateName) +
                                   " " + this.fixPathsUnix(vars.globals.rootWorkspacePath) +
                                         this.fixPathsUnix(vars.globals.fileSeparator) +
                                         this.fixPathsUnix(projectName);
            }
            else
            {
                var command = "xcopy /e /I \"" + vars.globals.currentWorkingPath +
                                                 "\\templates\\" + templateName +
                                       "\" \"" + vars.globals.rootWorkspacePath +
                                                 vars.globals.fileSeparator +
                                                 projectName + "\"";
            }
            console.log("Command: " + command);
            exec(command, resultCommand);
        }
        catch(err)
        {
            console.log("Error in createNewProject: " + err);
            sendResponse({hasError: true, data: "Error in createNewProject: " + err});
        }
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
                console.log("Succesfull deletion of directory " + projectPath);
                if (!responseSent) {
                    sendResponse({hasError: false, data: "Succesfull deletion of project " + projectName});
                    responseSent = true;
                }
            }
            else {
                console.log("Error in deletion of directory " + projectPath);
                console.log("Error deleting project: " + error);
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
            console.log("Renaming Project from " + oldName + " to " + newName );

            var exec = require('child_process').exec;
            var respond = sendResponse;

            function resultCommand(error, stdout, stderr) {
                console.log("stdout: " + stdout);
                console.log("stderr: " + stderr);
                if (error)
                {
                    console.log("error: " + error);
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
                var command = "rename " + vars.globals.rootWorkspacePath +
                                          vars.globals.fileSeparator +
                                          oldName +
                              " " + newName;
            }
            console.log("Command: " + command);
            exec(command, resultCommand);
        }
        catch(err) {
            console.log("Error in renameProject(" + oldname + ", " + newName + "): " + err);
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
        if(typeof sendResponse !== 'function') return false;

        var self = this;

        var weinreDebug;
        console.log("-----------------------------------------------");
        console.log("-                 R e l o a d                 -");
        console.log("-----------------------------------------------");
        if( typeof debug !== "boolean" || typeof debug === "undefined") {
            weinreDebug = false;
        }
        else {
            weinreDebug = debug;
        }

        console.log("Weinre Enabled:" + weinreDebug);

        sendResponse({hasError: false, data: ""});

        // Bundle the app.
        this.bundleApp(projectPath, weinreDebug, function (actualPath) {


            // We will send the file size information together with the command as
            // an extra level of integrity checking.
            console.log("---------- S e n d i n g   B u n d l e --------");
            console.log("actualPath: " + actualPath);
            var data = fs.readFileSync(actualPath);
            var url = projectPath.replace("LocalFiles.html", "LocalFiles.bin").replace(' ', '%20');

            //send the new bundle URL to the device clients
            vars.globals.clientList.forEach(function (client){

                console.log("url       : " + url + "?filesize=" + data.length);
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

                    console.log("message   : " + self.toHex8Byte( vars.globals.commandMap['JSONMessage'] )        +
                                                 self.toHex8Byte(JSON.stringify(jsonMessage).length) +
                                                 JSON.stringify(jsonMessage));

                    var result = client.write(  self.toHex8Byte( vars.globals.commandMap['JSONMessage'] )        +
                                                self.toHex8Byte(JSON.stringify(jsonMessage).length) +
                                                JSON.stringify(jsonMessage), "ascii");

                    console.log("-----------------------------------------------");
                }
                catch(err) {
                    console.log("error     : " + err)
                    var index = vars.globals.clientList.indexOf(client);
                    if(index != -1)
                    {
                        vars.globals.clientList.splice(index, 1);
                    }
                }
            });
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

        ncp.ncp(pathToLocalFiles, pathToTempBundle, function (err){

            if (err) {
                console.log('Copy Process      : Error-' + err);
            }
            console.log('Copy Process      : Successfull');

            //self.debugInjection(projectDir, function (){

                try {
                    // WEINRE injection
                    // The script is injected only in the bundle.
                    // The user is unaware of the injection in his source files
                    //Checking if weinreDebug is enabled
                    if(weinreDebug) {
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
                    }

                    console.log("----------- C r e a t e   B u n d l e ---------");
                    var exec = require('child_process').exec;

                    function puts(error, stdout, stderr)
                    {
                        console.log("stdout: " + stdout);
                        console.log("stderr: " + stderr);
                        console.log("error : " + error);
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
                                }
                catch(err)
                {
                    console.log("Error in bundleApp: " + err);
                }
            //});
        });
    },

    /**
     * (RPC): Open the project folderin a new window
     */
    openProjectFolder: function (projectFolder, sendResponse) {

        //check if parameter passing was correct
        if(typeof sendResponse !== 'function') return false;

        try {
            var exec = require('child_process').exec;
            function puts(error, stdout, stderr) {
                console.log("stdout: " + stdout);
                console.log("stderr: " + stderr);
                console.log("error: " + error);
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
            console.log("Error in openProjectFolder: " + err);
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

            console.log("Error in startDebugging: " + err);
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

    /**
     * (RPC): Changes the workspace directory to "newWorkspacePath"
     */
    changeWorkspacePath: function (newWorkspacePath, sendResponse) {

        //check if parameter passing was correct
        if(typeof sendResponse !== 'function') return false;

        var self = this;

        console.log("Changing workspace to " + newWorkspacePath);

        path.exists(newWorkspacePath, function(exists) {

            if(exists) {

                self.setRootWorkspacePath(newWorkspacePath);
                self.findProjects(function(){}, sendResponse);
            }
            else {

                console.log("workspace does not exist");
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

                        console.log("Error reading last workspace path, reverting to default");
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

            console.log("Error in getLatestPath: " + err);
        }
    },

    /**
     * (internal function) Setter function that sets the path global variable
     * and write the value to lastworkspace.dat
     */
    setRootWorkspacePath : function (path){

        vars.globals.rootWorkspacePath = path;
        console.log("Using workspace at :" + path);

        try {

            fs.writeFile('lastWorkspace.dat', path, function (err) { });
        }
        catch(err) {

            console.log("Error in setRootWorkspacePath: " + err);
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
            data 	= String(fs.readFileSync( indexHtmlPath.replace("TempBundle","LocalFiles"), "utf8")),
            jquery 	= String(fs.readFileSync( process.cwd() + vars.globals.fileSeparator +
            						  "lib" + vars.globals.fileSeparator + "jquery-1.8.3.min.js"));

        /**
         * Load the index.html file and parse it to a new window object
         * including jQuery for accessing and manipulating elements
         */
        jsdom.env({
        	html: data,
        	src: [jquery],
        	done: function (errors, win) {

                /**
                 * Get all embeded script tags
                 */
                var embededScriptTags = win.$("script:not([class='jsdom']):not([src])");
                console.log("--Debug Feature-- There was: " + embededScriptTags.length + " embeded JS scripts found.");
                for (var i = 0; i < embededScriptTags.length; i++) {

                    embededScriptTags[i].innerHTML = "try { \n eval(unescape(\"" +
                                                     escape(embededScriptTags[i].innerHTML) +
                                                     "\")); \n } catch (e) { \nmosync.rlog(escape(e.toString())); \n};";
                }


                /**
                 * Get all external js script files
                 */
                var externalScriptFiles = win.$("script[src]:not([class='jsdom'])");
                console.log("--Debug Feature-- There was: " + externalScriptFiles.length + " external JS scripts found.");

                for (var i = 0; i < externalScriptFiles.length; i++) {
                    if( externalScriptFiles[i].src !== "wormhole.js") {
                        var scriptPath = vars.globals.rootWorkspacePath +
                                         vars.globals.fileSeparator +
                                         projectName +
                                         vars.globals.fileSeparator + 'TempBundle' +
                                         vars.globals.fileSeparator + self.fixPathsUnix(externalScriptFiles[i].src);
                        try {

                            var s = fs.statSync(scriptPath);

                            if( s.isFile() ) {
                                var jsFileData = String(fs.readFileSync(scriptPath, "utf8"));

                                jsFileData = "try { \n eval(unescape(\"" + escape(jsFileData) +
                                              "\")); \n } catch (e) { \nmosync.rlog(escape(e.toString())); \n};";
                                fs.writeFileSync(scriptPath, jsFileData, "utf8");
                            }

                        } catch (e) {

                            console.log(e);
                        }
                    }
                }

                /**
                 * Get all elements that have inline js code
                 * To add more tag attributes:
                 *   - add the attribute name (lowercase in attrs)
                 *   - add the atribute in jquery selector
                 */

                 var attrs = ["onclick", "onevent"];	// Attribute list
                 var inlineJsCode = win.$("[onclick],[onEvent]"); // jQuery Selector


                 console.log("--Debug Feature-- There was: " + inlineJsCode.length + " inline JS scripts found.");

                 for( var i = 0; i < inlineJsCode.length; i++) {

                 	for( var j = 0; j < attrs.length; j++) {

                 		var inlineCode = inlineJsCode[i].getAttribute(attrs[j]);
                 		if( inlineCode !== "" ) {
                 			inlineJsCode[i].setAttribute(attrs[j],  "try { \n eval(unescape(\"" +
                                                            escape(inlineCode) +
                                                            "\")); \n } catch (e) { \nmosync.rlog(escape(e.toString())); \n};");
                 		}
                 	}
                 }

                 /**
                  * Write index.html file
                  */
                fs.writeFileSync(indexHtmlPath, win.document.outerHTML, "utf8");

                callback();
            }
        });
	}
};

// These functions are called for initialization
rpcFunctions.getLatestPath();
rpcFunctions.getNetworkIP();

rpc.exposeModule('manager', rpcFunctions);
