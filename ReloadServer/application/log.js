/**
 * Log Module used to overide console.log
 */
var sys = require('sys'),
	vars = require('./globals.js');


var log = function (logText, level) {
	/*if (arguments.length > 2){
		sys.puts("Error console.log invalid number parameters: " + arguments.length +
				 "instead of 2.");
		return;
	}*/

	if (typeof level === 'undefined') {
		
		if (vars.globals.logLevel == 2) {
			console.dlog(logText);
			//sys.inspect(logText);
		}
	} else {

		//sys.puts(vars.globals.logLevel);
		if (level <= vars.globals.logLevel) {
			console.dlog(logText);
			//sys.puts(sys.inspect(logText));
		}
	}	
}

exports.log = log;