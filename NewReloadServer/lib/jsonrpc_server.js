var http = require('http'),
	rpc  = require('./jsonrpc');
	url  = require('url');

var debug = true;

var emptyRPCRequest = "?jsonRPC={}";
/**
 * We do not override console.log because it can 
 * be used for normal server output.
 */
console.dlog = function (logOutput) {
	if( debug ) {
		console.log( logOutput );
	}
}

var errorResponse = function (response, content) {
	response.writeHead(404);
	response.end(content);
}

var create = function() {

	var server = http.createServer(function(request, response) {

		console.dlog("SERVER: Request Received.");
		console.dlog("SERVER: Request Path: " + url.parse(request.url).pathname);

		var message = "";
		/**
		 * GET JSON-rpc request handling
		 * path format: <server address, port>/proccess?jsonRPC={}
		 * eg. 
		 * localhost:8283/something?jsonRPC={"id":1302294821045,"method":"rpc.add","params":[10,20]}
		 */
		if(request.method == "GET") {

			/** 
			 * Check if request has query string
			 */
			if(! (query = url.parse(request.url).search) )
				query = emptyRPCRequest;
			/** 
			 * Check if request is an RPC Request
			 */
			console.dlog("REQUEST TYPE: " + request.method);
			console.dlog("REQUEST  URL: " + query);

			var queryClean = unescape( query.substr(query.indexOf("?jsonRPC=") + "?jsonRPC=".length) );
			var rpcObject = {};
			try {
				rpcObject = JSON.parse(queryClean);
			}
			catch(error) {
				console.log("ERROR: Invalid json format in request");
			}

			/**
			 * Check if the request is an json-RPC
			 * The format of the RPC is checked within listen method
			 */
			if( rpcObject.id && rpcObject.method && rpcObject.params ) {
				rpc.listen(rpcObject, response);
			}
			else {
				/**
				 * Handling other kind of requests maybe throw an exception
				 */
			} 	
			
		}
		else if (request.method == "POST") {
			
			console.dlog("REQUEST TYPE: " + request.method);
			console.dlog("REQUEST  URL: " + url.parse(request.url).pathname);

			var postData = "";
			var pathname = url.parse(request.url).pathname;

			request.setEncoding("utf8");

			request.addListener("data", function(postDataChunk) {

	      		postData += postDataChunk;
	    	});

	    	request.addListener("end", function() {

				console.dlog("REQUEST POST: " + postData);
	    		
	    		try {
					message = JSON.parse( postData );
				}
				catch(error) {
					console.log("ERROR: Invalid json format in request");
				}
	    		
	    		rpc.listen(message, response);
	    	});

		}
		else {
			errorResponse(response, "The request method is not supported.");
			console.log(request.method + " type of request is not supported.");
		}
	});

	return server;
};

exports.create = create;

