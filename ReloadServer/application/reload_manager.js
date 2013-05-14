var rpc     = require('../lib/jsonrpc');
var net     = require('net');
var fs      = require('fs');
var path    = require('path');
var ncp     = require('../node_modules/ncp');
var cheerio = require('cheerio');
var http    = require('http');
var url     = require('url');
var zip     = require('unzip');
var request = require('request');


/**
 * The functions that are available for remote calling
 */

var vars = require('./globals');

/**
 * (internal function) Converts a decimal value to 8byte length Hex
 */
var toHex8Byte = function(decimal) {
    var finalHex  = decimal.toString(16);
    while (finalHex.length < 8)
        finalHex = "0"+finalHex;

    return finalHex;
}


/**
 * Send a given message to an optional client list.
 * @param jsonMessage Message in JSON format.
 * @param clientsToSend optional if not provided send message to all
 *        connected clients
 * The message must contain a field named 'message'
 * with the message name.
 */
var sendToClients = function(jsonMessage, clientsToSend) {

    // TODO: What about a client list object that has a send
    // method in it and other methods for managing the client list.
    // And a client object instaed of using bare socket objects.
    if (clientsToSend == undefined) {
        var cList = vars.globals.clientList;
    } else {
        var cList = clientsToSend;
    }

    cList.forEach(function (client) {

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
            var fullMessage = "RELOADMSG" + toHex8Byte(message.length) + message;

            // Send the message.
            // TODO: Perhaps make client object that wraps the base socket and
            // put a send/write method in there.
            var result = client.write(fullMessage, "ascii");
        }
        catch (err) {
            console.log("@@@ reload_manager.js: sendToClients error: " + err, 0)

            // Remove this client from the list since we have problems with it.
            var index = vars.globals.clientList.indexOf(client);
            if (index != -1)
            {
                vars.globals.clientList.splice(index, 1);
            }
        }
    });
};

var sendToClient = function(client, jsonMessage) {
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
        var fullMessage = "RELOADMSG" + toHex8Byte(message.length) + message;

        // Send the message.
        // TODO: Perhaps make client object that wraps the base socket and
        // put a send/write method in there.
        var result = client.write(fullMessage, "ascii");
    } catch (err) {
        console.log("@@@ reload_manager.js: sendToClient error: " + err)
    }
};
// TODO: Move non-RPC functions out of this object to make the code
// mode clean and make rpcFunctions contain only the RPC functions.
var rpcFunctions = {
    disconnectDevice: function (address, sendResponse) {
        var response = null;
        var i, len;
        len = vars.globals.clientList.length;

        for (i = 0; i < len; i++) {
            var client = vars.globals.clientList[i];
            if (client !== undefined && address === client.deviceInfo.address) {
                response = address + ' closed';

                console.log('!!! sent Disconnect msg to client');
                sendToClient(client, { message: 'Disconnect' });
                //client.end();
                break;

            } else {
                response = address + ' was not in the list';
            }
        }

        sendResponse({
            success: true,
            data: response
        });
    },

    /**
     * (internal function) Used to acquire the server ip address
     */
    getIpFromSocket: function (sendResponse) {
        var socket = net.createConnection(80, "www.example.com");
        socket.on('connect', function () {
            vars.globals.ip = socket.address().address;
            console.log('got ip from socket ' + vars.globals.ip );
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
        if ( (typeof sendResponse !== 'function') &&
            (sendResponse !== undefined) ) return false;

        if ( !vars.globals.ip ) {
            this.getIpFromSocket(sendResponse);
        } else {
            if ( sendResponse !== undefined ) {
                sendResponse({hasError: false, data: vars.globals.ip});
            }
        }
    },

    /**
     * (RPC): Returns the version information of Reload
     */
    getVersionInfo: function (sendResponse) {
        var file = fs.readFileSync("build.dat", "ascii");
        vars.globals.versionInfo = JSON.parse(file);
        vars.globals.protocolVersion = JSON.parse(file).protocolVersion;

        console.log('version info');
        console.log(vars.globals.versionInfo);

        if (typeof sendResponse === 'function') {
            sendResponse({hasError: false, data: JSON.stringify(vars.globals.versionInfo)});
        }
    },

    /**
     * (RPC): Read a remote list of example projects.
     */
    getExampleList: function (sendResponse) {
        if(typeof sendResponse !== 'function') {
            return false;
        }

        var feed = [];

        var params = {
            url: vars.globals.sampleProjectsFeedUrl
            , headers: {
                'User-Agent': 'MoSync Reload ' + JSON.stringify(vars.globals.versionInfo)
            }
        };
        request(params, function(error, response, body){
            if (!error && response.statusCode == 200) {
                var res = JSON.parse(body);
                res.forEach(function(p){
                    console.log(p);
                    var archive_url = p.html_url+'/archive/master.zip';
                    feed.push({
                        "url": archive_url
                        , "name": p.name
                        , "description": p.description
                        , "screenshot": "screenshot"
                    });
                });

                sendResponse({
                    hasError: false,
                    data: feed
                });
            } else {
                console.log(error);
                console.log(vars.globals.sampleProjectsFeedUrl);
                console.log(response.statusCode);
            }
        });
    },

    reloadExample: function (options, sendResponse) {
        if(typeof sendResponse !== 'function') {
            return false;
        }

        var self           = this
            , options      = JSON.parse(options) // Options string is expected to contain JSON.
            , home_dir     = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME']
            , DS           = vars.globals.fileSeparator
            , download_dir = home_dir + DS + '.reload' + DS + 'examples'
            , file_name    = url.parse(options.url).pathname.split('/').pop()
            ;

        // Options object to encapsulate parameters passed between
        // functions.
        var o = {
            home_dir       : home_dir
            , DS           : DS
            , download_dir : download_dir
            , options      : options
            , file_name    : file_name
        };

        // Create download directory if it does not exist.
        fs.exists(o.download_dir, function(exists) {
            if (!exists) {
                console.log('Download dir does not exist. Create it!');
                fs.mkdir(o.home_dir + o.DS + '.reload', 0755, function(e) {
                    if (!e) {
                        fs.mkdir(o.home_dir + o.DS + '.reload' + o.DS + 'examples', 0755, function(e) {
                            if (!e) {
                                console.log('Done creating ' + o.home_dir + o.DS + '.reload' + o.DS + 'examples' + o.DS);
                                self.sendExample(o, sendResponse);
                            }
                        });
                    }
                });
            } else {
                self.sendExample(o, sendResponse);
            }
        });
    },

    // Helper function for reloadExample()
    sendExample: function (options, sendResponse)  {
        var self          = this
            , o           = options
            , file        = o.download_dir + o.DS + o.file_name
            , writeStream = fs.createWriteStream(file)
            ;

        // Stream to file.
        writeStream.on('close', function() {
            console.log('prepare to unzip');
            // Unpack when file is written.
            self.unzip(file, o.download_dir + o.DS, function() {
                var url = o.download_dir + o.DS + o.options.name + '-master'; // Github adds prefix to the folder
                console.log('URL is ');
                console.log(url);
                self.bundleApp(url, false, function(actualPath) {
                    fs.stat(actualPath, function(err, stat) {
                        console.log('Datasize: ' + stat.size);

                        console.log("---------- S e n d i n g   B u n d l e --------");
                        console.log("actualPath: " + actualPath);
                        console.log("url: " + url);

                        sendToClients({
                            message: 'ReloadBundle',
                            url: escape(url),
                            fileSize: stat.size
                        });

                        sendResponse({
                            success: true,
                            error: null
                        });
                    });
                });
            });
        });

        writeStream.on('error', function(e){
            console.log('Error: ' + e);
        });

        // Download file and pipe it to the writeStream
        request(o.options.url).pipe(writeStream);
    },

    /*
     * (RPC) Copies a project to current workspace directory.
     * If a project is not in $HOME/.reload/examples/ it's downloaded to
     * current workspace dir and unpacked there.
     */
    copyExample: function (opts, sendResponse) {
        if(typeof sendResponse !== 'function') {
            return false;
        }

        var self, opts, home_dir, DS, download_dir;

        self = this;
        home_dir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
        DS = vars.globals.fileSeparator;
        download_dir = home_dir + DS + '.reload' + DS + 'examples';
        opts = JSON.parse(opts);
        file_name    = url.parse(opts.url).pathname.split('/').pop();

        var file = fs.createWriteStream(download_dir + DS + file_name);
        file.on('close', function(){
            self.unzip(download_dir + DS + file_name, vars.globals.rootWorkspacePath, function(resp){
                console.log('Unzip successful');

                // Remove downloaded zip.
                fs.unlink(download_dir + DS + file_name, function(){
                    console.log(download_dir + DS + file_name + ' removed');
                    // Notify callee.
                    sendResponse({
                        success: true,
                        error: null
                    });
                });
            });
        });
        file.on('error', function(e){
            console.log('Error: ' + e, 0);
        });
        request(opts.url).pipe(file);
    },
    /*
     * Copies a file.
     * @src         
     * @dest        
     * @callback    
     */
    copy: function (src, dest, callback) {
        console.log('copy() called');
        console.log('src ' + src );
        console.log('dst ' + dest );
        var cbCalled = false;

        var rd = fs.createReadStream(src);
        rd.on('error', function(err){
            done(err);
        });

        var wr = fs.createWriteStream(dest);
        wr.on('err', function(err){
            done(err);
        });
        wr.on('close', function(){
            done();
        });
        rd.pipe(wr);

        function done(err) {
            if (!cbCalled) {
                callback(err);
                cbCalled = true;
            }
        }
    },

    /*
     * Unzip a file to a destination directory.
     * @file        Zip file name including full path.
     * @dest        Destination directory of unzipped files.
     * @callback    Called upon completion of unzip.
     */
    unzip: function (file, dest, callback) {
        var res = {};
        fs.createReadStream(file)
        .pipe(zip.Extract({ path: dest }))
        .on('close', function(){
            console.log('Finished extraction.');
            res.file = file;
            callback(res);
        });
    },

     /*
      * Internal method to download a file from a specified URL.
      *
      * @location   url pointing to wanted file.
      * @dest       download directory (no file name at the end)
      * @callback   Callback is returned with a {file: 'filepath' } object passed.
      */
    download: function (location, dest, callback) {
        var request, options, file, fileName, DS, res;

        fileName = location.split('/').pop();
        res = {};
        DS = vars.globals.fileSeparator;

        // Stream to file.
        file = fs.createWriteStream(dest + DS + fileName);
        options = {
            host:    url.parse(location).hostname,
            port:    url.parse(location).port,
            path:    url.parse(location).pathname,
            method:  'GET'
        };

        request = http.request(options, function (res) {
            res.on('data', function(chunk){
                file.write(chunk);
            });

            res.on('end', function(){
                file.end();
                res.file = dest + DS + fileName;
                callback(res);
            });
        });

        request.on('error', function(e) {
            console.log('Could not establish connection with '
                        + location
                        + ' : '
                        + e.message);
        });
        request.end();
    },

    /**
     * (RPC): Returns the Project list with 
     * attributes: url, name, path
     */
    getProjectList: function (sendResponse) {
        // Check if parameter passing was correct.
        if (typeof sendResponse !== 'function') return false;

        // Refresh list of projects.
        this.findProjects();

        // Send the list of projects.
        sendResponse({
            hasError: false,
            data: vars.globals.projectListJSON
        });
    },

    /**
     * (internal function) Searches the current workspace path, finds
     * and creates a list of projects exist in tha directory
     */
    findProjects: function () {
        var WP   = vars.globals.rootWorkspacePath,
            DS   = vars.globals.fileSeparator,
            HOST = vars.globals.ip + ':' + vars.globals.port;

        try {
            var files    = fs.readdirSync( WP ),
                projects = [];

            for (var key in files) {
                var file = files[ key ],
                    stat = fs.statSync( WP + DS + file );

                if ( stat && stat.isDirectory() ) {
                    try {
                        // If we see a folder called LocalFiles we
                        // assume it's a project.
                        var LocalfileStat = fs.lstatSync( WP + DS + file + DS + 'LocalFiles' );
                        if (LocalfileStat && LocalfileStat.isDirectory()) {
                            // Add to the list of projcts
                            projects.push({
                                url:   'http://' + HOST + '/' + file + '/LocalFiles.html',
                                name:  file,
                                path:  WP + DS + file
                            });
                        }
                    } catch(e) {
                        //do nothing
                    }
                }
            }

            // Make project list available globally
            vars.globals.projectListJSON = projects;
            console.log(vars.globals.projectListJSON);

        } catch (err) {
            console.log('ERROR in findProjects: ' + err, 0);
        }
    },

    /**
     * (RPC): Creates a new Project "projectName" of type "projectType"
     *        which can be NativeUI or Web based
     */
    createNewProject: function (projectName, projectType, sendResponse) {

        // Check if parameter passing was correct.
        if(typeof sendResponse !== 'function') return false;

        var self = this;

        // Check if directory exists.
        var dir = vars.globals.rootWorkspacePath
                + vars.globals.fileSeparator
                + projectName;

        fs.exists( dir, function (exists) {
            if (exists) {
                sendResponse({hasError: true, data: "Error in createNewProject: Project already exists."});
            } else {
                try {
                    console.log( "Creating new project: " + projectName + ", of type " + projectType , 0);

                    var templateName = "ReloadTemplate";
                    if (projectType && projectType == "native") {
                        templateName = "NativeUITemplate";
                    }

                    var exec = require('child_process').exec;

                    function resultCommand(error, stdout, stderr) {
                        console.log("stdout: " + stdout, 2);
                        if (error) {
                            console.log("ERROR stderr: " + stderr, 0);
                            console.log("ERROR error: "  + error, 0);
                        }

                        var projectData =
                            fs.readFileSync(
                                vars.globals.rootWorkspacePath
                                + vars.globals.fileSeparator
                                + projectName
                                + vars.globals.fileSeparator
                                + ".project"
                                , 'utf8'
                        );

                        var re = /<name>(.+?)<\/name>/;
                        var substitute = '<name>' + projectName + '<\/name>';
                        var newData = projectData.replace(re, substitute);
                        var projectFile =
                            vars.globals.rootWorkspacePath
                            + vars.globals.fileSeparator
                            + projectName
                            + vars.globals.fileSeparator
                            + ".project"
                            ;
                        fs.writeFileSync(projectFile, newData , 'utf8');

                        sendResponse({hasError: false, data: projectName});
                    }

                    var darwin = vars.globals.localPlatform.indexOf("darwin") >= 0;
                    var linux = vars.globals.localPlatform.indexOf("linux") >=0;
                    if ( darwin || linux ) {
                        var command = "cp -r "
                        + self.fixPathsUnix(vars.globals.currentWorkingPath)
                        + "/templates/"
                        + self.fixPathsUnix(templateName)
                        + " "
                        + self.fixPathsUnix(vars.globals.rootWorkspacePath)
                        + self.fixPathsUnix(vars.globals.fileSeparator)
                        + self.fixPathsUnix(projectName)
                        ;
                    } else {
                        var command = "xcopy /e /I \""
                        + vars.globals.currentWorkingPath
                        + "\\templates\\"
                        + templateName
                        + "\" \""
                        + vars.globals.rootWorkspacePath
                        + vars.globals.fileSeparator
                        + projectName
                        + "\""
                        ;
                    }

                    console.log("Command: " + command, 2);
                    exec(command, resultCommand);
                } catch(err) {
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

        var projectPath =
            vars.globals.rootWorkspacePath
            + vars.globals.fileSeparator
            + projectName
            ;

        // Delete directory
        this.removeRecursive(projectPath, function (error, status) {
            if(!error) {
                console.log("Succesfull deletion of directory " + projectPath, 0);
                if (!responseSent) {
                    sendResponse({hasError: false, data: "Succesfull deletion of project " + projectName});
                    responseSent = true;
                }
            } else {
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
                    } else {
                        cb(null,true);
                    }
                    return;
                });

            } else if (stats.isDirectory()) {

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
                                } else {
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
                                    } else {
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

                var projectFile =
                    vars.globals.rootWorkspacePath
                    + vars.globals.fileSeparator
                    + newName
                    + vars.globals.fileSeparator
                    + ".project"
                    ;
                var projectData = fs.readFileSync(projectFile, 'utf8');

                var re = /<name>(.+?)<\/name>/;
                var substitute = '<name>' + newName + '<\/name>';
                var newData = projectData.replace(re, substitute);

                    projectFile =
                    vars.globals.rootWorkspacePath
                    + vars.globals.fileSeparator
                    + newName
                    + vars.globals.fileSeparator
                    + ".project"
                    ;

                fs.writeFileSync(projectFile, newData , 'utf8');
                respond({hasError: false, data: newName});
            }

            var darwin = vars.globals.localPlatform.indexOf("darwin") >= 0;
            var linux = vars.globals.localPlatform.indexOf("linux") >=0;
            if( darwin || linux ) {
                var command =
                    "mv "
                    + this.fixPathsUnix(vars.globals.rootWorkspacePath)
                    + this.fixPathsUnix(vars.globals.fileSeparator)
                    + this.fixPathsUnix(oldName)
                    + " "
                    + this.fixPathsUnix(vars.globals.rootWorkspacePath)
                    + this.fixPathsUnix(vars.globals.fileSeparator)
                    + this.fixPathsUnix(newName)
                    ;
            } else {
                var command =
                    "rename \""
                    + vars.globals.rootWorkspacePath
                    + vars.globals.fileSeparator
                    + oldName
                    + "\" \""
                    + newName
                    + "\""
                    ;
            }

            console.log("Command: " + command, 2);
            exec(command, resultCommand);

        } catch(err) {
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
    reloadProject: function (projectName, debug, sendResponse, clientList) {

        //check if parameter passing was correct
        if (typeof sendResponse !== 'function') return false;

        var self = this;
        var weinreDebug = (typeof debug === "boolean")? debug : false;

        console.log("-----------------------------------------------");
        console.log("-                 R e l o a d                 -");
        console.log("-----------------------------------------------");

        console.log("Weinre Enabled:" + weinreDebug);

        // Bundle the app.
        var projectPath =
            vars.globals.rootWorkspacePath
            + vars.globals.fileSeparator
            + projectName
            ;

        this.bundleApp(projectPath, weinreDebug, function(actualPath) {
            try {
                // Collect Stats
                if (vars.globals.statistics === true) {
                    var indexPath =
                        projectPath
                        + vars.globals.fileSeparator
                        + "LocalFiles"
                        + vars.globals.fileSeparator
                        + "index.html"
                        ;

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

                // We will send the file size information together with
                // the command as an extra level of integrity checking.
                var data = fs.readFileSync(actualPath),
                    url  = vars.globals.rootWorkspacePath
                           + vars.globals.fileSeparator
                           + projectName;

                console.log("---------- S e n d i n g   B u n d l e --------");
                console.log("actualPath: " + actualPath);
                console.log("url: " + url + "?filesize=" + data.length);

                // Send the new bundle URL to the device clients.
                sendToClients({
                    message: 'ReloadBundle',
                    url: escape(url),
                    fileSize: data.length
                }, clientList);

                sendResponse({hasError: false, data: "Bundle sent to clients."});

            } catch (e) {
                sendResponse({hasError: true, data: "Error in reloadProject: " + e});
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
        sendToClients({
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
            pathToLocalFiles = projectDir + vars.globals.fileSeparator + "LocalFiles",
            pathToTempBundle = projectDir + vars.globals.fileSeparator + "TempBundle";
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

                                callback(projectDir + "/LocalFiles.bin");

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
                                projectDir  +
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

                    callback(projectDir + "/LocalFiles.bin");
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
                    projectDir  +
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


            function puts(error, stdout, stderr) {
                console.log("stdout: " + stdout);
                console.log("ERROR stderr: " + stderr);
                console.log("ERROR error: " + error);
            }

            var darwin = vars.globals.localPlatform.indexOf("darwin") >= 0;
            var linux = vars.globals.localPlatform.indexOf("linux") >=0;
            if (darwin) {
                var command =
                    "open "
                    + this.fixPathsUnix(vars.globals.rootWorkspacePath)
                    + vars.globals.fileSeparator
                    + this.fixPathsUnix(projectFolder)
                    + "/LocalFiles"
                    ;
            } else if (linux) {
                var commandStat = fs.statSync("/usr/bin/nautilus");
                if(commandStat.isFile()) {
                  var command =
                      "nautilus "
                      + this.fixPathsUnix(vars.globals.rootWorkspacePath)
                      + vars.globals.fileSeparator
                      + this.fixPathsUnix(projectFolder)
                      + "/LocalFiles &"
                      ;
                } else {
                  var command =
                      "dolphin "
                      + this.fixPathsUnix(vars.globals.rootWorkspacePath)
                      + vars.globals.fileSeparator
                      + this.fixPathsUnix(projectFolder)
                      + "/LocalFiles &"
                      ;
                }
            } else {
                var command =
                    "explorer \""
                    + vars.globals.rootWorkspacePath
                    + vars.globals.fileSeparator
                    + projectFolder
                    + "\\LocalFiles\"";
            }
            exec(command, puts);
            sendResponse({hasError: false, data: "Project folder opened."});
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

        var data, error;

        if(!vars.globals.isDebuggingStarted) {
            //Initialize debugging
            this.startDebugging();
            sendResponse({hasError: false, data: "Debugging started."});
            error = false;
            data = "Debugging started.";
        } else {
            if (vars.globals.clearData == false) {
                if (vars.globals.useSecondaryBuffer) {
                    vars.globals.useSecondaryBuffer = false;
                    var dataString = JSON.stringify(vars.globals.logCatData);
                    vars.globals.logCatData = [];

                    error = false;
                    data = dataString;
                } else {
                    vars.globals.useSecondaryBuffer = true;
                    var dataString  = JSON.stringify(vars.globals.logCatData2);
                    vars.globals.logCatData2 = [];

                    error = false;
                    data = dataString;
                }
            } else {
                    error = false;
                    data = '';
            }
        }

        sendResponse({hasError: error, data: data});
    },

    /**
     * (internal function) Starts the adb for android
     */
    startDebugging: function () {
        try {

            vars.globals.isDebuggingStarted = true;

            var util = require('util');
            var spawn = require('child_process').spawn;

            var darwin = vars.globals.localPlatform.indexOf("darwin") >= 0;
            var linux = vars.globals.localPlatform.indexOf("linux") >=0;

            if(darwin) {
                adb = spawn('bin/mac/android/adb', ['logcat']);
            } else if (linux) {
                adb = spawn('bin/linux/android/adb', ['logcat']);
            } else {
                adb = spawn('bin\\win\\android\\adb.exe', ['logcat']);
            }

            adb.stdout.setEncoding("utf8");
            adb.stdout.on('data', function (data) {
                if(vars.globals.useSecondaryBuffer) {
                    vars.globals.logCatData.push(data);
                } else {
                    vars.globals.logCatData2.push(data);
                }
            });
        } catch(err) {
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

        sendResponse({
            hasError: false,
            data: { "path" : vars.globals.rootWorkspacePath }
        });
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
     * (RPC): Changes workspace directory. Creates it if it doesn't
     * exist.
     */
    changeWorkspacePath: function (path, sendResponse) {
        console.log('changeWorkspace');
        //check if parameter passing was correct
        if(typeof sendResponse !== 'function') return false;

        var self = this;
        vars.methods.setRootWorkspacePath(path, function(err, result){
            if (err) {
                console.log('ERROR: ' + err, 0);
            } else {
                self.findProjects();
                sendResponse({hasError: false, data: path});
            }
        });
    },

    /**
     * (RPC): Removes a workspace directory.
     */
    removeWorkspace: function (workspacePath, sendResponse) {
        var self
            , responseSent
            , error
            , data
            ;

        self         = this;
        responseSent = false;
        error        = false;
        data         = workspacePath;

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
                        error = false;
                        data = "Succesfull deletion of " + workspacePath;
                    } else {
                        console.log("ERROR in deletion of " + workspacePath, 0);
                        error = true;
                        data = "ERROR deleting project: " + error;
                    }
                });
            } else {
                console.log('ERROR ' + workspacePath + ' does not exist', 0);
            }

            if(sendResponse !== undefined && !responseSent) {
                sendResponse({hasError: error, data: data});
                responseSent = true;
            }
        });

    },

    /**
     * (RPC): Sets a configuration option to specified value
     */
    setConfig: function (option, value, sendResponse ) {
        //check if parameter passing was correct
        var config = {};
        if(typeof sendResponse !== 'function') return false;

        var configFile =
            process.cwd()
            + vars.globals.fileSeparator
            + "config.dat"
            ;

        fs.exists(configFile, function (exists) {
            if(exists) {
                fs.readFile(configFile, "utf8", function(err, data){
                    if (err) throw err;

                    config = JSON.parse(data);
                    config[option] = value;

                    fs.writeFile(configFile, JSON.stringify(config), "utf8", function(err, data) {
                        if (err) throw err;

                        //set the configuration var
                        vars.globals[option] = value;

                        sendResponse({hasError: false, data: true});
                    });
                });
            } else {
                config[option] = value;

                fs.writeFile( configFile, JSON.stringify(config), "utf8", function(err, data) {
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
     * (internal function) Setter function that sets the path global variable
     * and write the value to lastworkspace.dat
     */
    setRootWorkspacePath : function (path){
        vars.globals.rootWorkspacePath = path;
        console.log("Using workspace at: " + path, 0);

        try {
            fs.writeFileSync(vars.globals.lastWorkspaceFile, path);
        } catch(err) {
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
     * (internal function) injects evaluation code for error capturing
     * in the javascript code
     */
    debugInjection: function (projectName, callback) {

        var self = this,

            indexHtmlPath =
                projectName
                + vars.globals.fileSeparator + 'TempBundle'
                + vars.globals.fileSeparator + 'index.html'
                ,

            data = String(fs.readFileSync( indexHtmlPath.replace("TempBundle","LocalFiles"), "utf8"))
                ,

            debugNotice =
                "/**\n"
                + " * NOTICE: The try catch statement is automaticaly added\n"
                + " * when the project is reloaded in debug mode.\n"
                + " */\n"
                ;

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
                var scriptPath =
                    vars.globals.fileSeparator
                    + 'TempBundle'
                    + vars.globals.fileSeparator
                    + self.fixPathsUnix(element.attribs.src)
                    ;

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
vars.methods.loadConfig(function () {
    if(vars.globals.statistics === true) {
        rpcFunctions.sendStats();
    }
});

rpc.exposeModule('manager', rpcFunctions);
exports.toHex8Byte = toHex8Byte;
exports.send = sendToClients;
exports.rpc = rpcFunctions;
