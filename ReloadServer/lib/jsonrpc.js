/**
* JSON RPC library for communicating over websockets in nodejs.
*
* https://github.com/enix/node-jsonrpc-ws
* 
* Licensed under the MIT license:
* http://www.opensource.org/licenses/mit-license.php
*
*/
var sys = require('sys');


var JSONRPC = {
    
    functions: {},

    modules: {},

	/**
	* Opens a JSON rpc server on the given websocket by listening to messages.
	*
	* @name listen
	* @param Socket socket The websocket object to observe.
	*
	* @type void
	*/  
	listen : function(message, response){

		/*var self = this;
		this.response = response;*/
		resObj = response;

		this.handleMessage(message, function(processingResult) {
			
			//console.log(processingResult);

			var responseObject = {
				'id': 0,
	        	'result': null,
	        	'error': null
	      	};

	      	if( processingResult.hasError ) {
	      		responseObject.error = processingResult.data;
	      	}
	      	else {
	      		responseObject.result = processingResult.data;
	      	}
	      	
	      	// using id attribute for sending response in binary format
	      	if((message.id == 1) && (!processingResult.hasError)) {
	      		response.writeHead(200, {
						  'Content-Length': processingResult.data.length,
						  'Content-Type': 'binary',
						  'Pragma': 'no-cache',
						  'Cache-Control': 'no-cache',
						  'Expires': '-1'
						});
				response.write( processingResult.data );
				response.end("");
	      	}
	      	else {
				console.dlog("SENDING RESPONSE: " + JSON.stringify(responseObject));
				response.writeHead(200, {
							  'Content-Length': JSON.stringify(responseObject).length,
							  'Content-Type': 'application/json',
							  'Pragma': 'no-cache',
							  'Cache-Control': 'no-cache',
							  'Expires': '-1'
							});
				response.write( JSON.stringify(responseObject) );
				response.end("");
			}
		});
	},


    /**
    * Finds all function entries defined in the given model to exposes them via rpc.
    *
    * @example 
    *    var TestModule = {
    *      add: function (a, b) { return a + b }
    *    }
    *    rpc.exposeModule('rpc', TestModule);
    *
    * @result Exposes the given module with the given prefix. Remote functioname 'rpc.add'
    *
    * @name exposeModule
    * @param String mod The function prefix.
    * @param Object object The module to expose. 
    *
    * @type void
    */
    exposeModule: function(mod, object) {
        var funcs = [];
        for(var funcName in object) {
            var funcObj = object[funcName];
            if(typeof(funcObj) == 'function') {
                this.functions[mod + '.' + funcName] = funcObj;
                funcs.push(funcName);
            }
        }
        this.modules[mod] = object;

        JSONRPC.trace('***', 'exposing module: ' + mod + ' [funcs: ' + funcs.join(', ') + ']');
    },

    /**
    * Exposes the given function via rpc.
    *
    * @example 
    *    function add(a, b) { return a + b }
    *    rpc.expose('add', add);
    *
    * @result Exposes the given function under the given name . Remote functioname 'add'
    *
    * @name expose
    * @param String mod The function name.
    * @param Object object The function to expose. 
    *
    * @type void
    */   
    expose: function(name, func) {
        JSONRPC.trace('***', 'exposing: ' + name);
        this.functions[name] = func;
    },

    trace: function(direction, message) {
        sys.puts('   ' + direction + '   ' + message);
    },

    handleMessage: function( message, callback ) {
		//JSONRPC.trace('-->', 'response (id ' + message.id + '): ');

	    // Check for the required fields, and if they aren't there, then
	    // dispatch to the handleInvalidRequest function.
	    if(!(message.method && message.params)) {
	    	var responseObject = {
	    		'id': message.id,
	    		'result': null,
	        	'error': 'Invalid Request'
	      	};

	      	resObj.writeHead(200, {
						  'Content-Length': JSON.stringify(responseObject).length,
						  'Content-Type': 'application/json',
						  'Pragma': 'no-cache',
						  'Cache-Control': 'no-cache',
						  'Expires': '-1'
						});
			resObj.write( JSON.stringify(responseObject) );
			resObj.end("");

	    	return this;
	    }

	    if(!this.functions.hasOwnProperty(message.method)) {

	    	var responseObject = {
				'id': message.id,
	        	'result': null,
	        	'error': 'Function not found'
	      	};

	      	resObj.writeHead(200, {
						  'Content-Length': JSON.stringify(responseObject).length,
						  'Content-Type': 'application/json',
						  'Pragma': 'no-cache',
						  'Cache-Control': 'no-cache',
						  'Expires': '-1'
						});
			resObj.write( JSON.stringify(responseObject) );
			resObj.end("");

			return this;
	    }

	    // Build our success handler
	    var onSuccess = function(funcResp) {
	    	//JSONRPC.trace('SUCCESS-->', 'response (id ' + message.id + '): ' + funcResp);

	      	return {
				'id': message.id,
	        	'result': funcResp,
	        	'error': null
	      	};
	    };

	    // Build our failure handler (note that error must not be null)
	    var onFailure = function(failure) {
	    	JSONRPC.trace('-->', 'failure: ' + failure);

	      	return {
	         	'id': message.id,
		    	'result': null,
			 	'error': failure || 'Unspecified Failure'
	      	};
	    };

	    JSONRPC.trace('<--', 'request (id ' + message.id + '): ' + message.method + '(' + message.params.join(', ') + ')');

	    // Try to call the method, but intercept errors and call our onFailure handler.
	    var method = this.functions[message.method];

	    try {
	    	// Check for the function module to set the appropriate 
	    	// context to apply
	    	var functionCall = message.method.split('.');
	    	var moduleName = functionCall[0];

	    	message.params.push(callback);

	    	var executionResult = method.apply(this.modules[moduleName], message.params);

	    	if( executionResult === false) {
	    		var responseObject = {
					'id': message.id,
		        	'result': null,
		        	'error': 'Invalid Parameters passed to function'
		      	};

		      	resObj.writeHead(200, {
							  'Content-Length': JSON.stringify(responseObject).length,
							  'Content-Type': 'application/json',
							  'Pragma': 'no-cache',
							  'Cache-Control': 'no-cache',
							  'Expires': '-1'
							});
				resObj.write( JSON.stringify(responseObject) );
				resObj.end("");
	    	}

	    }
	    catch(err) {
	    	return onFailure(err);
	    }
    }
}

module.exports = JSONRPC;
