var vars = require('../application/globals'),
	fs = require('fs'),
    sendToClients = require('../application/reload_manager');

/**
 * Object that accumulates data sent over a streaming
 * protocol (TCP).
 *
 * A message starts with the magic header "RELOADMSG".
 * Then follows a hex size header (8 characters) that
 * encodes the length of the message.
 */
var accumulator = (function()
{
    var self = {};
    var mMessageLength = 0;
    var mMessageData = null;
    var mAccumulatedData = "";
    var mMagicHeader = "RELOADMSG";
    var mHeaderSize = 9 + 8; // Magic header +  message size.

    /**
     * Reset the accumulator to read next message.
     */
    self.next = function()
    {
        mMessageData = null;
    };

    /**
     * Add data to the accumulator.
     */
    self.add = function(data)
    {
        mAccumulatedData += data;
        //console.log("accumulator.add data.length: " + data.length);
        //console.log("accumulator.add mAccumulatedData.length: " + mAccumulatedData.length);
    };

    /**
     * Get message.
     * @return String with message data, null if there
     * is no complete message.
     */
    self.getMessage = function()
    {
        // Do we have a message?
        if (mMessageData)
        {
            // Yes we have, return it.
            return mMessageData;
        }

        // Are there any data?
        if (mAccumulatedData.length < mHeaderSize)
        {
            // Not enough data yet.
            return null;
        }

        // Do we have a data length?
        if (0 === mMessageLength)
        {
            // No data length, get the length from the
            // accumulated data. First scan to the end of
            // the magic header.
            var index = mAccumulatedData.indexOf(mMagicHeader);
            if (index < 0)
            {
                // TODO: Add some error/recovery handling
                // in case the data is garbled and header
                // not found.
                console.log("tcp_server.js/accumulator: cannot find magic header", 0);
                console.log("ERROR probably you are using incompatible Client and Server versions", 0);

                return null;
            }

            // Get message size.
            // TODO: Check that message length is a number.
            mAccumulatedData = mAccumulatedData.substr(mMagicHeader.length);
            var dataLength = mAccumulatedData.substr(0, 8);
            mMessageLength = parseInt(dataLength, 16);

            //console.log("accumulator.getMessage: dataLength: " + dataLength);
            //console.log("accumulator.getMessage: mMessageLength: " + mMessageLength);

            // Point to the start of actual message data.
            mAccumulatedData = mAccumulatedData.substr(8);
        }

        // Have we got the whole message?
        if (mAccumulatedData.length >= mMessageLength)
        {
            // Yes we have, set message data.
            mMessageData = mAccumulatedData.substr(0, mMessageLength);

            // Set accumulated data to whatever is left.
            mAccumulatedData = mAccumulatedData.substr(mMessageLength);

            //console.log("accumulator.getMessage: got a new message");
            //console.log("accumulator.getMessage: mAccumulatedData left.length: " + mAccumulatedData.length);

            // Reset message length.
            mMessageLength = 0;

            // Return the message.
            return mMessageData;
        }

        // Wee need more data to get a whole message.
        return null;
    };

    return self;
})();

var create = function (port) {

    var net = require('net');

    function generateDeviceInfoListJSON() {

        console.log('--- tcp_server.js: generateDeviceInfoListJSON() ---');
        console.log(vars.globals.clientList);
        var infoListJSON = [];

        vars.globals.clientList.forEach(function(c){

            infoListJSON.push(c.deviceInfo);
        });

        vars.globals.deviceInfoListJSON = JSON.stringify(infoListJSON);

        // Dispatch list of clients to WebUI through WebSockets.
        var md = vars.MsgDispatcher;
        md.dispatch({
            target: 'devices',
            msg: infoListJSON
        });
    }

    /**
     * TODO: The socket object is used to store device info.
     * We should update this to use a client object that in turn
     * has the socket object. It can cause problems to add custom
     * properties to the socket object.
     */
    function processMessage(jsonString, socket)
    {
        // The data is always in JSON format.
        console.log(jsonString);
        var message = JSON.parse(jsonString);

        if (message != undefined);
        {
            // The device sent info upon connecting.
            if (message.message == "clientConnectRequest")
            {
                // Platform, name, uuid, os version, phonegap version.
                //message.type == null;
                
                // Check for protocol compatibility
                console.log("client version: " + message.params.protocolVersion);
                console.log("server version: " + vars.globals.protocolVersion);
                if( (typeof message.params.protocolVersion === 'undefined') ||
                    (message.params.protocolVersion != vars.globals.protocolVersion) ) {

                    console.log("ERROR client version is not compatible with server version.", 0);
                    // Send client disconnection command
                    try {
                        // Construct message with proper header.
                        var message = JSON.stringify( { message: "Disconnect",
                                                        data: "Incompatible Client and Server versions"} );
                        var fullMessage = "RELOADMSG" + self.toHex8Byte(message.length) + message;

                        var result = socket.write(fullMessage, "ascii");
                    }
                    catch (err) {
                        console.log("ERROR tcp_server.js: processMessage: " + err, 0)
                    }

                } else {
                    
                    if(vars.globals.statistics === true) {

                        // Statistics Collection
                        vars.methods.loadStats(function (statistics) {

                            var actionTS = new Date().getTime();
                            
                            var client = {
                                localIP: socket.remoteAddress,
                                platform: message.params.platform,
                                version: message.params.version,
                                action: "connect",
                                actionTS : actionTS
                            };

                            statistics.clients.push(client);
                            
                            vars.methods.saveStats(statistics);
                        });
                    }
                    // Save the socket on the list of connected clients.
                    vars.globals.clientList.push(socket);

                    socket.deviceInfo = message.params;
                    socket.deviceInfo.address = socket.remoteAddress;
                    generateDeviceInfoListJSON();
                    console.log("Client " + socket.remoteAddress +
                        " (" + socket.deviceInfo.name + ") has connected.", 0 );
                }
            }
            // The device sent a log message.
            else if (message.message == "remoteLogRequest")
            {
                // Add log message to queue.
                // TODO: Use a function for this rather than
                // accessing global data directly.
                vars.globals.gRemoteLogData.push(message.params);

                // Dispatch log message to WebUI through WebSockets.
                var md = vars.MsgDispatcher;
                md.dispatch({
                    target: 'log',
                    msg: unescape(unescape(message.params)).replace("\n","</br>")
                });
            }
            else if (message.message === "getProjectList") {
                console.log("Generate and send Project List to the Client");
                console.log("Total Projects sent: " + vars.globals.projectListJSON.length);

                // send client the project list (internal use)
                sendToClients.send({ 
                                message: "projectList",
                                data: {
                                    projectsCount: vars.globals.projectListJSON.length,
                                    projects: vars.globals.projectListJSON
                                }
                            }, [socket]);
                }
        }
    }

    function saveClient(socket)
    {
        try
        {
            // Use ascii encoding.
            socket.setEncoding('ascii');

            // Executed then the client closes the connection.
            socket.on('close', function (had_error)
            {
                var address = "-unknown address-";
                if (socket.deviceInfo != undefined)
                {
                    address = socket.deviceInfo.address;

                    // Statistics Collection
                    if(vars.globals.statistics === true) {
                        vars.methods.loadStats(function (statistics) {

                            var actionTS = new Date().getTime();

                            var disconnectedClient = {
                                localIP: address,
                                platform: socket.deviceInfo.platform,
                                version: socket.deviceInfo.version,
                                action: "disconnect",
                                actionTS : actionTS
                            };

                            statistics.clients.push(disconnectedClient);
                            //console.log(statistics);
                            vars.methods.saveStats(statistics);
                        });
                    }
                    console.log(
                        "Client " +
                        address + " (" +
                        socket.deviceInfo.name +
                        ") has disconnected.", 0);
                    for (var i = 0; i < vars.globals.clientList.length; i++)
                    {
                        if (vars.globals.clientList[i].remoteAddress ==
                            socket.remoteAddress)
                        {

                            vars.globals.clientList.splice(i,1);
                            generateDeviceInfoListJSON();
                            break;
                        }
                    }
                } else {
                    console.log("Unsupported Client was disconnected from the server.", 0);
                    console.log(vars.globals.clientList);
                }

            });

            // Executed when the client sends data to the server.
            socket.on('data', function(data)
            {
                // Accumulate data recieved.
                accumulator.add(data);

                while (accumulator.getMessage())
                {
                    // Handle the message.
                    processMessage(accumulator.getMessage(), socket);

                    // Get the next message.
                    accumulator.next();
                }
            });
        }
        catch(err)
        {
            console.log("Error in saveClient: " + err, 0);
        }
    }
    console.log("Opening TCP socket on port: " + port, 0);
    var server = net.createServer(saveClient);
    server.listen(7000);

    return server;
}

exports.create = create;
