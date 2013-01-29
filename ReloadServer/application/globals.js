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

	statistics: undefined,

	statsFile : "stats.dat",

	// Server configs for Collection of statistics
	statsRequestOptions: {
        host: 'mosyncdev.devcloud.acquia-sites.com',
        port: '80',
        path: '/reload_stats',
        method: 'POST'
    },

    // Server configs for Feedback
    feedbackRequestOptions: {
        host: ' mosyncdev.devcloud.acquia-sites.com',
        port: '80',
        path: '/1eojc8e1',
        method: 'POST'
    }
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

	loadConfig: function (callback) {
		fs.exists(process.cwd() + globals.fileSeparator + "config.dat", function (exists){
			if(exists){
				fs.readFile(process.cwd() + globals.fileSeparator + "config.dat", 
                    "utf8", 
                    function(err, data){
                        console.log(data);
                        if (err) throw err;

                        config = JSON.parse(data);
                        
                        for(var i in config) {
                            globals[i] = config[i];
                        }

                        if(typeof callback === "function") {
                        	callback();
                        }
                    });
			} else {
				fs.writeFile(process.cwd() + globals.fileSeparator + "config.dat", 
						     JSON.stringify({statistics: "undefined"}), function (err) {} );
			}
		});
        
    },
};

exports.globals = globals;
exports.methods = methods;
