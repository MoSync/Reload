var fs = require('fs');

var globals = {
    versionInfo : {},
    rootWorkspacePath : "",
    gRemoteLogData : [],
    ip : null,
    localPlatform: "",
    currentWorkingPath: "",
    fileSeparator: "",
    // List of node.js sockets for connected clients.
    clientList: [],
    deviceInfoListJSON: "[]",
    //Debuging globals
    adb: {},
    clearData : false,
    logCatData : [],
    logCatData2: [],
    useSecondaryBuffer: false,
    isDebuggingStarted: false,
    commandMap: {
        ConnectRequest  : 1,
        JSONMessage     : 2
    },
    homeDir: "",
    statistics: "undefined",
    statsFile : "stats.dat",
    // Server configs for Collection of statistics
    statsRequestOptions: {
        host: 'www.mosync.com',
        port: '80',
        path: '/reload_stats',
        method: 'POST'
    },
    // Server configs for Feedback
    feedbackRequestOptions: {
        host: 'www.mosync.com',
        port: '80',
        path: '/reload_feedback',
        method: 'POST'
    },
    openBrowser: true,
    logLevel: 0,
    protocolVersion: "",
    sampleProjectsFeedUrl: "https://api.github.com/orgs/MoSyncSamples/repos",
    lastWorkspaceFile: 'lastWorkspace.dat',
    configFile: 'config.dat',
    port: 8283
};

var methods = {
    /**
     * Setter function that sets the path global variable
     * and write the value to lastWorkspace.dat
     *
     * @param {string}
     * @param {function(..., string)}
     * @return void
     */
    setRootWorkspacePath : function (path, callback) {
        var configFile = globals.lastWorkspaceFile;

        fs.exists(path, function(exists){
            if (!exists) {
                try {
                    fs.mkdirSync(path, 0755); // Create it
                    globals.rootWorkspacePath = path; // Make it available to the rest of the script
                    fs.writeFileSync(configFile, path); // Remember it after server shuts down
                    console.log("Using workspace at: " + path, 0);
                    callback(null, path); // Response with success
                } catch (err) {
                    console.log('ERROR in setRootWorkspacePath: ' + e , 0);
                    callback(e, null); // Response with error
                }
            } else {
                globals.rootWorkspacePath = path;
                fs.writeFileSync(configFile, path);
                console.log("Using workspace at: " + globals.rootWorkspacePath, 0);
                callback(null, path);
            }
        });
    },

    loadStats: function (callback) {
        var self = this,
            statistics;

        function createNewStatsFile() {
            var startTS = new Date().getTime(),
                statistics = {
                    serverPlatform :      globals.localPlatform,
                    reloadVersion :       globals.versionInfo.version,
                    buildID :             globals.versionInfo.timestamp,
                    serverStartTS :       startTS,
                    lastActivityTS :      startTS,
                    totalReloadsNative :  0,
                    totalReloadsHTML :    0,
                    clients :             []
                };
                self.saveStats(statistics);

                return statistics;
        }

        fs.exists( process.cwd() + globals.fileSeparator + globals.statsFile, function (exists){
            if(exists) {
                try {
                    var file = fs.readFileSync( process.cwd() + globals.fileSeparator + globals.statsFile, "utf8");

                    statistics = JSON.parse(file);
                } catch (e) {
                    statistics = createNewStatsFile();
                }

            } else {
                statistics = createNewStatsFile();
            }
            callback(statistics);
        });
    },

    saveStats: function (statistics) {
        var data = JSON.stringify(statistics);

        var statsFile = process.cwd() + globals.fileSeparator + globals.statsFile;
        fs.exists( statsFile, function (exists){
            fs.writeFile(statsFile, data, function (err) {} );
        });
    },

    /**
     * Loads Configuration settings from the config file if it exists
     * into globals variable. If the file does not exists it uses the 
     * defaultConfig to set the globals var and create new config file
     */
    loadConfig: function (callback) {
        var configFile = process.cwd() + globals.fileSeparator + globals.configFile;
        fs.exists(configFile, function (exists) {
            if (exists) {
                fs.readFile(configFile, "utf8", function(err, data) {
                        console.log(data);
                        if (err) throw err;

                        var config = JSON.parse(data);

                        for (var i in config) {
                            globals[i] = config[i];
                        }

                        //console.log("STATISTICS: " + globals.statistics);

                        if(typeof callback === "function") {
                            callback();
                        }
                    });
            } else {
                var defaultConfig = {
                    statistics: "undefined"
                }

                fs.writeFile(configFile, JSON.stringify(defaultConfig), function (err) {
                    if(err) throw err;

                    for(var i in defaultConfig) {
                        globals[i] = defaultConfig[i];
                    }

                    //console.log("STATISTICS: " + globals.statistics);
                    if(typeof callback === "function") {
                        callback();
                    }
                });
            }
        });
    },

    startWebUI: function () {
        var exec    = require('child_process').exec,
            command = "";

        function puts(error, stdout, stderr) {
            if (error) {
                console.log("stdout: " + stdout, 0);
                console.log("stderr: " + stderr, 0);
                console.log("error: "  + error , 0);
            }
        }

        var darwin = globals.localPlatform.indexOf("darwin") >= 0;
        var address = 'http://' + ((globals.ip) ? globals.ip : 'localhost') + ':' + globals.port;
        if (darwin) {
            command = 'open ' + address;
        } else {
            command = 'start ' + address;
        }
        exec(command, puts);

        return;
    }
};

var MsgDispatcher = function() {
    return {
        fns: [],
        message: null,

        subscribe: function (fn) {
            this.fns.push(fn);
        },

        unsubscribe : function(fn) {
            this.fns = this.fns.filter(
                function(el) {
                if ( el !== fn ) {
                    return el;
                }}
            );
        },

        // Notifies observers.
        notifyAll: function () {
            var self = this;
            this.fns.forEach( function(fn) {
                fn(self.message);
            });
        },

        dispatch: function (message) {
            this.message = message;
            this.notifyAll();
        }
    };
};

exports.globals = globals;
exports.methods = methods;
exports.MsgDispatcher = new MsgDispatcher();
