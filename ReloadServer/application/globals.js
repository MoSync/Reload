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

	statsFile : "stats.dat",

	// Server configs for Cellection of statistics
	statsRequestOptions: {
        host: 'requestb.in',
        port: '80',
        path: '/1eojc8e1',
        method: 'POST'
    },

    // Server configs for Feedback
    feedbackRequestOptions: {
        host: 'requestb.in',
        port: '80',
        path: '/1eojc8e1',
        method: 'POST'
    }
};

var methods = {

	loadStats: function (callback) {
		var self = this;
		
		fs.stat(process.cwd() + globals.fileSeparator + globals.statsFile, function (error, s) {
			
			var statistics = {};
			if(error) {
				statistics = JSON.parse('{"reloadVersion" : "'+ globals.versionInfo[0].trim() + '","reloadTimestamp": "' + globals.versionInfo[1].trim()+'","reloads" : 0,"ip" : "","clients" : []}');
				self.saveStats(statistics);
			} else {
				statistics = JSON.parse(fs.readFileSync( process.cwd() + 
											 globals.fileSeparator + globals.statsFile,
											 "utf8"));
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
