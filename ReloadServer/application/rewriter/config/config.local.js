var config = require('../config/config.defaults.js');

// FIXME: Change all Hardcoded configuration to ones that should be created 
// during runtime
config.fileServerBaseDir = 'C:\\WorkingDir\\AardwolfRewriter\\project';
config.outputDir = 'C:\\WorkingDir\\AardwolfRewriter\\ouput';

// TODO: Probabbly is not needed since the scripts src attribute is being set to 
// relative path instead being served by the server
config.serverHost = '192.168.0.108';
config.serverPort = 8000;
config.fileServerPort = 8500;
config.verbose = true;