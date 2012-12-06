var server = require("./lib/jsonrpc_server");
var manager = require("./application/reload_manager");
var client = require("./application/client_manager");

webUI = server.create(8282);
client = server.create(8283);