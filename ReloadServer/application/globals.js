var fs = require('fs');

var globals = {
	versionInfo : [],

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
		ConnectRequest 	: 1,
		JSONMessage		: 2
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
};

var methods = {

	loadStats: function (callback) {
		var self = this;

		function createNewStatsFile() {
			var startTS = new Date().getTime();
				statistics = JSON.parse('{ "serverPlatform" : "' + globals.localPlatform + '",' +
										'"reloadVersion" : "'+ globals.versionInfo[0].trim() + '",'+
										'"buildID": "' + globals.versionInfo[1].trim()+'",' +
										'"serverStartTS": ' + startTS + ',' +
										'"lastActivityTS": ' + startTS + ',' +
										'"totalReloadsNative" : 0,' +
										'"totalReloadsHTML" : 0,' +
										'"clients" : []}');
				self.saveStats(statistics);

				return statistics;
		}

		fs.exists( process.cwd() + globals.fileSeparator + globals.statsFile, function (exists){
			if(exists) {
				try {
					statistics = JSON.parse(fs.readFileSync( process.cwd() + 
											 globals.fileSeparator + globals.statsFile,
											 "utf8"));
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

		fs.exists( process.cwd() + globals.fileSeparator + globals.statsFile, function (exists){

			fs.writeFile(process.cwd() + globals.fileSeparator + globals.statsFile,
						 data, function (err) {} );
		});
	},
	/**
	 * Loads Configuration settings from the config file if it exists
	 * into globals variable. If the file does not exists it uses the 
	 * defaultConfig to set the globals var and create new config file
	 */
	loadConfig: function (callback) {
		fs.exists(process.cwd() + globals.fileSeparator + "config.dat", function (exists){
			if(exists){
				fs.readFile(process.cwd() + globals.fileSeparator + "config.dat", 
                    "utf8", 
                    function(err, data){
						console.log(data);
                        if (err) throw err;

                        var config = JSON.parse(data);
                        
                        for(var i in config) {
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

				fs.writeFile(process.cwd() + globals.fileSeparator + "config.dat", 
						     JSON.stringify(defaultConfig), function (err) {

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
        var exec = require('child_process').exec,
            command = "";
        function puts(error, stdout, stderr) {

        	if (error) {
        		console.log("stdout: " + stdout, 0);
	            console.log("stderr: " + stderr, 0);
	            console.log("error: " + error, 0);
        	}
        }

        if((globals.localPlatform.indexOf("darwin") >= 0)) {

            command = "open http://localhost:8283";
        }
        else {

            command = "start http://localhost:8283";
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
