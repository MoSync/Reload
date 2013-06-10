var rpc     = require('../lib/jsonrpc');
var net     = require('net');
var fs      = require('fs');
var path    = require('path');
var ncp     = require('../node_modules/ncp');
var cheerio = require('cheerio');
var http    = require('http');
var url     = require('url');
var request = require('request');
var esprima = require('esprima');
var domtosource   = require('domtosource');
var debugRewriter = require('./rewriter/rewriter-server');


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

        var self = this
            , feed = []
            ;

        var params = {
            url: vars.globals.sampleProjectsFeedUrl
            , headers: {
                'User-Agent': 'MoSync Reload ' + JSON.stringify(vars.globals.versionInfo)
            }
        };
        request(params, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                var res = JSON.parse(body)
                    , counter = 0
                    ;
                res.forEach(function(p) {
                    var screenshot    = p.html_url + '/raw/master/screenshot.png'
                        , archive_url = 'https://codeload.github.com/MoSyncSamples/' + p.name + '/zip/master'
                        ;

                    self.confirmScreenshot(screenshot, function(error, screenshot) {
                        console.log(screenshot);
                        feed.push({
                            'url'           : archive_url
                            , 'name'        : p.name
                            , 'description' : p.description
                            , 'screenshot'  : screenshot
                        });
                        counter++;
                        // Send response only when all array items are analyzed.
                        if (counter === res.length) {
                            sendResponse({
                                hasError : false,
                                data     : feed
                            });
                        }
                    });
                });
            } else {
                console.log(error);
                console.log(vars.globals.sampleProjectsFeedUrl);
                console.log(response.statusCode);
            }
        });
    },

    /**
     * Helper function. Check if the screenshot image is in the repo.
     * Add a default image if the screenshot.png is not in the root of
     * the repo.
     */
    confirmScreenshot: function (img_url, callback) {
        var params = {
            url: img_url
            , headers: {
                'User-Agent': 'MoSync Reload ' + JSON.stringify(vars.globals.versionInfo)
            }
        };

        request(params, function(error, response, body){
            // Default image for a screenshot.
            var e = true
                , r = 'http://www.mosync.com/sites/all/themes/mosync/css/img/reload3.png'
                ;
            // Image confirmed.
            if (!error && response.statusCode === 200) {
                e = false;
                r = img_url;
            }
            callback(e, r);
        });
    },

    /**
     * (RPC) Reload an example app.
     * @param {...*} options Expected to contain name and zip url of the
     * project.
     * @param {function(...)} sendResponse Callback from
     * jsonrpc.js:handleMessage() used to send response to the socket.
     */
    reloadExample: function (options, sendResponse) {
        if(typeof sendResponse !== 'function') {
            return false;
        }

        if (vars.globals.deviceInfoListJSON.length === 0) {
            sendResponse({
                hasError: true,
                data: 'No clients connected.'
            });
            return;
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

    /**
     * Helper function for reloadExample
     * Download the zip file, unzip it and bundle the contents.
     * @param {...*} options
     * @param {function(...)} callback
     */
    sendExample: function (options, sendResponse)  {
        var self          = this
            , o           = options
            , file        = o.download_dir + o.DS + o.file_name
            , writer
            ;

        // Internal shortcut to bundleApp
        var bundle = function(url) {
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
        };

        fs.exists(o.download_dir + o.DS + o.options.name + '-master', function(exists) {
            if (exists) {
                console.log('File was already extracted.');
                bundle(o.download_dir + o.DS + o.options.name + '-master');
                return;
            }

            writer = fs.createWriteStream(file);
            // Download file and pipe it to the writeStream
            writer.on('open', function() {
                request(o.options.url).pipe(writer);
            });

            // Stream to file.
            writer.on('close', function() {
                // Unpack when file is written.
                self.unzip(file, o.download_dir, function() {
                    // Github adds prefix to the folder
                    bundle(o.download_dir + o.DS + o.options.name + '-master');

                    // Remove downloaded zip.
                    fs.unlink(file, function() {
                        console.log(file + ' removed');
                    });
                });
            });

            writer.on('error', function(e){
                console.log('Error: ' + e, 0);
            });

        });
    },

    /**
     * (RPC) Copies a project to current workspace directory.
     * If a project is not in $HOME/.reload/examples/ it's downloaded to
     * current workspace dir and unpacked there.
     * @param {...*} opts Parameter object.
     * @param {function(...)} sendResponse Callback for response
     * handling.
     */
    copyExample: function (opts, sendResponse) {
        if(typeof sendResponse !== 'function') {
            return false;
        }

        var self, opts, home_dir, DS, file_name, download_dir, zipFile, writer;

        self            = this;
        home_dir        = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
        DS              = vars.globals.fileSeparator;
        opts            = JSON.parse(opts);
        download_dir    = home_dir + DS + '.reload' + DS + 'examples';
        file_name       = url.parse(opts.url).pathname.split('/').pop();
        zipFile         = download_dir + DS + file_name;

        // Check if workspace already has the unzipped file.
        var path = vars.globals.rootWorkspacePath + DS + opts.name + '-master';
        fs.exists(path, function(exists) {
            if (exists) {
                console.log('Project already exists in the workspace.');
                sendResponse({
                    success: false,
                    error: true
                });
                return;
            }

            // Download only if not already there.
            request(opts.url).pipe((function() {
                writer = fs.createWriteStream(zipFile);

                writer.on('close', function(){
                    console.log('Writestream closed');

                    self.unzip(zipFile, vars.globals.rootWorkspacePath, function(error, result) {
                        if (error) {
                            console.log('Unzip did not succeed.');
                            sendResponse({
                                success: false,
                                error: true
                            });
                            return;
                        }

                        // Remove downloaded zip.
                        fs.unlink(zipFile, function() {
                            console.log(zipFile + ' removed');
                            sendResponse({
                                success: true,
                                error: null
                            });
                        });
                    });
                });

                writer.on('error', function(e) {
                    console.log('Error: ' + e, 0);
                });

                // Pass writeStream object to the pipe.
                return writer;
            })());
        });

    },

    /**
     * Copies a file.
     * @param {} src Source
     * @param {} dest Destination
     * @param {function(...)} callback Function to be called when
     * completed.
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

    /**
     * Unzip a file to a destination directory.
     * @param {String} file Zip file name including full path.
     * @param {String} dest Destination directory of unzipped files.
     * @param {function(...)} callback Called upon completion of unzip.
     */
    unzip: function (file, dest, callback) {
        var exec    = require('child_process').exec;
        var darwin  = vars.globals.localPlatform.indexOf("darwin") >= 0;
        var linux   = vars.globals.localPlatform.indexOf("linux") >= 0;
        var command;

        if (darwin || linux) {
            command = 'unzip ' + file + ' -d ' + dest;
        } else {
            command = 'bin\\win\\unzip.exe "' + file + '" -d ' + '"' + dest + '"';
        }

        exec(command, function(error, stdout, stderr) {
            var e = false, r = {};

            if (error) {
                console.log("stdout: " + stdout, 0);
                console.log("stderr: " + stderr, 0);
                console.log("error: "  + error , 0);
                e = true;
            }

            callback(e, r);
        });
    },

     /**
      * Internal method to download a file from a specified URL.
      * @param {String} location Url pointing to wanted file.
      * @param {String} dest Download directory (no file name at the end)
      * @param {function(...)} callback Callback is returned with a {file: 'filepath' } object passed.
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
     * options:
     *      - empty: if true empty the directory without deleting it
     */
    // FIXME: Fix this function so it can support options parameter
    // options:
    //      - empty (true,false) Empty the directory without deleting 

    removeRecursive: function (pathToDelete, cb, options) {
        var self = this,
            initialPath = pathToDelete;

        // parameter check
        if( !(options && typeof options === "object") ) {
            options = new Object();
            options.empty = false;
        }

        function remove(pathToDelete, cb, options) {

            fs.stat(pathToDelete, function (err, stats) {

                if (err) {
                    cb(err, stats);
                    return;
                }

                if (stats.isFile()) {

                    fs.unlink(pathToDelete, function (err) {
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
                    fs.readdir(pathToDelete, function (err, files) {
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

                                if (!(options.empty) || 
                                     ((options.empty) && 
                                     (pathToDelete !== initialPath))) {
                                    console.log(path.dirname(pathToDelete));
                                    console.log(initialPath);
                                    fs.rmdir(pathToDelete, function(err) {
                                        if (err) {
                                            cb("1" + err,null);
                                        } else {
                                            cb(null,true);
                                        }
                                    });
                                } else {
                                    cb(null,true);
                                    return true;   
                                }
                                
                            }
                            return false;
                        };

                        if (!checkStatus()) {

                            for (var i = 0; i < f_length; i++) {

                                // Create a local scope for filePath
                                // Not really needed, but just good practice
                                // (as strings arn't passed by reference)
                                (function(){
                                    var filePath = path.join(pathToDelete, files[i]);
                                    // Add a named function as callback
                                    // just to enlighten debugging
                                    remove(filePath, function removeRecursiveCB(err, status) {
                                        if (!err) {

                                            f_delete_index ++;
                                            checkStatus();
                                        } else {
                                            cb(err,null);
                                            return;
                                        }
                                    }, options);
                                })()
                            }
                        }
                    });
                }
            });    
        };

        remove(pathToDelete, cb, options);
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
            var command;
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
                command =
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
                command =
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
            console.log("ERROR in renameProject(" + oldName + ", " + newName + "): " + err, 0);
            sendResponse({hasError: true, data: "Error in renameProject(" + oldName + ", " + newName + "): " + err});
        }
    },

    /**
     * (RPC): - Makes a copy of the project
     *        - Modifies the data weinre and Js debuging
     *        - Bundles the project folder
     *        - Request the mobile device to "Reload" the project.
     */
    reloadProject: function (projectName, debug, sendResponse, clientList) {

        function sendToAardwolfServer(error, file) {

            var options = {
                hotsname: 'http://' + vars.globals.ip,
                port : 8501,
                path : '/mobile/console',
                method: 'POST',
                headers: {
                    'Content-Type' : 'application/json'
                }
            };

            var req = http.request(options, function (res) {
                console.log('STATUS: ' + res.statusCode);
                console.log('HEADERS: ' + JSON.stringify(res.headers));
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    console.log('BODY: ' + chunk);
                });
            });

            req.on('error', function(e) {
                console.log('Error with request ot Aardwolf: ' + e.message);
            });

            var syntaxErrorData = {
                command: 'report-syntax',
                message: error.message,
                file: file,
                line: error.lineNumber,
                column: error.column
            }

            req.write(JSON.stringify(syntaxErrorData));
            req.end();
        }

        //check if parameter passing was correct
        if (typeof sendResponse !== 'function') {
            return false;
        }

        if (vars.globals.clientList.length === 0) {
            sendResponse({
                hasError: true,
                data: 'No clients connected',
            });
            return;
        }

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
        
        // Find all javascript files 
        // Parsing and checking for syntax errors
        console.log("-------------------------------------------");
        console.log("Checking javascript files for syntax errors");
        var applicationPath = projectPath + vars.globals.fileSeparator + "LocalFiles";
        //console.log("Application Path: " + applicationPath);
        //var files = fs.readdirSync(applicationPath);
        //console.log("Files found in the app:");
        //console.log(files);
        var syntaxCheckingStatus = true;
        function readDir(directoryPath) {
            var files = fs.readdirSync(directoryPath);
            for (i in files) {

                var checkFile = directoryPath + 
                                vars.globals.fileSeparator +
                                files[i];

                var fileStats = fs.statSync(checkFile);
                if(fileStats.isFile() && files[i].match(/\b[\w-.]+\.js\b/g) ) {
                    var fileData = fs.readFileSync(checkFile);
                    try {

                        var results = esprima.parse(fileData,
                                                    { startLineNumber : 0 });
                        console.log(checkFile.replace(applicationPath,"") + " No Syntax Errors");
                        if (syntaxCheckingStatus !== false) {
                            syntaxCheckingStatus = true;
                        }
                    } catch (e) {

                        console.log(checkFile.replace(applicationPath,"") + "  " + e );
                        
                        sendToAardwolfServer(e, checkFile.replace(applicationPath,""));
                        
                        syntaxCheckingStatus = false;
                    }
                } else if (fileStats.isDirectory()){
                    readDir(checkFile);
                }
            }
        }
        readDir(applicationPath);

        if( !syntaxCheckingStatus ) {

            sendResponse({
                hasError: true,
                data: 'Javascript errors',
            });
            return;
        }

        // Check javascript in script tags of index.html
        var applicationEntryPoint = projectPath + 
                                    vars.globals.fileSeparator + 
                                    "LocalFiles" + 
                                    vars.globals.fileSeparator + 
                                    "index.html";

        var indexFileData = fs.readFileSync(applicationEntryPoint, 'utf8');

        var embededScriptTags = domtosource.find(indexFileData, 'script:not([src])', true);

        for (i in embededScriptTags) {
            
            var script = cheerio.load(embededScriptTags[i].html);
            
            try {
                var result = esprima.parse(
                                script('script').html(), 
                                { startLineNumber : embededScriptTags[i].line-1 }
                            );
                console.log("\u001b[32m No syntax errors in embedded script \u001b[0m");
            } catch (e) {

                console.log(applicationEntryPoint.replace(applicationPath,"") + "  " + e);
                sendToAardwolfServer(e, applicationEntryPoint.replace(applicationPath,""));
                sendResponse({
                    hasError: true,
                    data: e,
                });
                return;
            }
        }
        console.log("-------------------------------------------");

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
        if(typeof sendResponse !== 'function') {
            return false;
        }

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

        if(weinreDebug === true) {

            try {
                self.debugInjection(projectDir, function (){

                //=============================== Inject the WEINRE Inspection script =========================
                var injectedScript = "<script src=\"http://" + vars.globals.ip +
                                     ":8080/target/target-script-min.js\"></script>";

                var pathOfIndexHTML =   path.join(pathToTempBundle, "index.html");

                console.log("Path to index.html: " + pathOfIndexHTML);
                var originalIndexHTMLData = fs.readFileSync( pathOfIndexHTML, "utf8" );

                var injectedIndexHTML = originalIndexHTMLData.replace( "<head>","<head>" + injectedScript );

                fs.writeFileSync(pathOfIndexHTML ,injectedIndexHTML, "utf8" );

                console.log("WEINRE Injection  : Successfull");
                //=============================================================================================

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
                
            } catch(err) {
                console.log("ERROR in bundleApp: " + err, 0);
            }
        } else {
            console.log("DEBUGGIN IS DISABLED");
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

            projectSourceFolder = projectName
                + vars.globals.fileSeparator + 'LocalFiles',

            projectOuputFolder = projectName
                + vars.globals.fileSeparator + 'TempBundle',

            debugerFiles = path.resolve("aardwolf","samples");

        console.log("\u001b[32m[SOURCE] " + projectSourceFolder + "\u001b[0m");
        console.log("\u001b[32m[DESTIN] " + projectOuputFolder + "\u001b[0m");
        console.log("\u001b[32m[DEBUGS] " + debugerFiles + "\u001b[0m");

        // Remove Old directory from aardwolf server
        this.removeRecursive(debugerFiles, function () {

            console.log(arguments);
            // Copy project source files on aardwolf server
            ncp.ncp(projectSourceFolder, debugerFiles, function (error) {
                
                if(error) {
                    console.log("ERROR: in debugInjection " + error, 0);
                } else {
                    debugRewriter.run(
                        {
                            "fileServerBaseDir" : projectSourceFolder,
                            "outputDir"         : projectOuputFolder,
                            "serverHost"        : vars.globals.ip,
                        });

                    callback();    
                }
            });
        }, { "empty": true });
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
