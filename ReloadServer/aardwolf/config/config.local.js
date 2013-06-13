var config = require('../config/config.defaults.js');

config.serverHost = '192.168.0.108';
config.serverPort = 8501;
//config.fileServerBaseDir = 'C:\\Users\\KOSTAS\\MoSync_Reload_Projects\\Aardwolf\\LocalFiles';
//config.jsFileServerBaseDir = 'C:\\Users\\KOSTAS\\MoSync_Reload_Projects\\Aardwolf\\LocalFiles'; 
config.verbose = true;

/* Run the offline rewriter process or not */
//config.runOfflineRewriter = true;

/* Output folder in which to put debugging-enabled files */
//config.outputDir = 'C:\\Users\\KOSTAS\\MoSync_Reload_Projects\\Aardwolf\\DebugLocalFiles';
console.log(config);