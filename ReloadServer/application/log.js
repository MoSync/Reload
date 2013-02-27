/**
 * Log Module used to overide console.log
 */
var sys = require('sys'),
	vars = require('./globals.js');


var log = function (logText, level) {
	
	function colorize (logText) {
		var red = '\u001b[31m', 
			blue = '\u001b[34m', 
			reset = '\u001b[0m';

		if (typeof logText === "string" && logText.indexOf("ERROR") >= 0) {

			console.dlog( red + logText + reset);
		} else {

			console.dlog(logText);
		}
	}
	

	if (typeof level === 'undefined') {
		
		if (vars.globals.logLevel == 2) {
			colorize(logText);
		}
	} else {

		if (level <= vars.globals.logLevel) {
			colorize(logText);
		}
	}	
}

exports.log = log;