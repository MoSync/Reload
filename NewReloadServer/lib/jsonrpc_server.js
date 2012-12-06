var http    = require('http'),
    rpc     = require('./jsonrpc'),
    url     = require('url'),
    express = require('../express/');
    path    = require('path');

var debug           = true,
    app             = express(),
    emptyRPCRequest = "?jsonRPC={}";

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
};


create = function(port) {
    console.log(path.resolve(__dirname, '../UI'));

    //console.log(express.json());
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.cookieParser('foobar'));
    app.use(express.session());
    app.use(express.bodyParser());
    app.use('/', express.static(path.resolve(__dirname, '../UI')));

    app.get('/', function(request, response){

		//console.log(request.query.jsonRPC);
		rpc.listen(JSON.parse(request.query.jsonRPC), response);
	});

    app.post('/', function( request, response ){

        console.dlog("REQUEST TYPE: " + request.method);

        console.log(request.body);
        console.log("request.body: " + request.body);
        rpc.listen(request.body, response);
    });

    app.listen(port);
    console.log('Server started listening on port: ' + port);
}

exports.create = create;

