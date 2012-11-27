var server = require("./lib/jsonrpc_server");
var manager = require("./application/reload_manager");

var rpcServer = server.create().listen(8283);
