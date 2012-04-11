/*    MoSync Reload
   Copyright (C) 2012  MoSync AB

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU Affero General Public License as
   published by the Free Software Foundation, either version 3 of the
   License, or (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU Affero General Public License for more details.

   You should have received a copy of the GNU Affero General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
var localAddress;
var http = require('http');
var net = require('net');
var fs = require('fs');
var os = require('os');
var path = require('path');
var http = require('http');
var currentWorkingPath = process.cwd();

//Sets debug mode for the server
var debug = false;

/**
 * This function will only print on the console if
 * debbuging is on.
 */
function debugLog(log)
{
	if(debug == true)
	{
		console.log("DEBUG:" + log);
	}
}

console.log("Starting Reload server.");
console.log("Current working path: "  + currentWorkingPath);

//Global Variables
var clientList = []; //List of TCP mobile clients
var localPlatform = os.platform();
var homeDir;

debugLog("Platform: " + localPlatform);

//Platform specific considerations for getting the home directory
if((localPlatform.indexOf("darwin") >= 0) ||(localPlatform.indexOf("linux") >=0))
{
	homeDir = process.env.HOME;
}
else
{
	homeDir = process.env.USERPROFILE;
}

//Platform specific considerations for getting the directory separator
var fileSeparator = ((localPlatform.indexOf("darwin") >=0) ||(localPlatform.indexOf("linux") >=0))?"/" : "\\";

/**
 * Will return a JSON string of the project names and URLs
 * that is sent to the editing page
 */
function generateProjectListJSON(projects)
{
	var projectListJSON = [];

	projects.forEach(function(p){
		var projectInfo = {
			url: "http://localhost:8282/" + p + "/LocalFiles.html",
			name: p
		}
		projectListJSON.push(projectInfo);
	});
	return JSON.stringify(projectListJSON);
}

/**
 * Generates a small HTML page that redirects to the real
 * HTML editing interface
 */
function generateHTML(projects) {
	var html = " \
	<!DOCTYPE HTML PUBLIC '-//W3C//DTD HTML 4.0 Transitional//EN'>\
	<html>\
	<head> \
	<title>Your Page Title</title>\
	<meta http-equiv='REFRESH' content='0;url=http://localhost:8282/UI/index.html'></HEAD>\
	<BODY> \
	Optional page text here.\
	</BODY>\
	</HTML>";

	return html;
}

/**
 * Opens a mock TCP connection to find out this server's IP,
 * supplied to the callback
 */
function getNetworkIP(callback) {
  var socket = net.createConnection(80, "www.google.com");
  socket.on('connect', function() {
    callback(undefined, socket.address().address);
    socket.end();
  });
  socket.on('error', function(e) {
    callback(e, 'error');
  });


}

getNetworkIP(function (error, ip) {
 console.log("My IP address is: " + ip);
 localAddress = ip;

});

/**
 * Opens the lastWorkspace.dat file to find out the last used
 * workspace. If the file does not exist, sets the workspace
 * to the default one at the user's home directory
 */
function getLatestPath() {
	try{
		path.exists('lastWorkspace.dat', function(exists){
			if(exists)
			{
				var data = fs.readFileSync('lastWorkspace.dat', "utf8");
				setRootWorkspacePath(String(data));
			}
			else
			{
				setRootWorkspacePath(homeDir + fileSeparator  + "MoSync_Reload_Projects");
			}
		});
	}
	catch(err)
	{
		console.log(err);
	}
}

/**
 * Sets the current workspace for projects, and saves it to lastWorkspace.dat
 */
function setRootWorkspacePath(path) {
	rootWorkspacePath = path;
	console.log("Using workspace at :" + path);
	try{
		fs.writeFile('lastWorkspace.dat', path, function (err) {
		});
	}
	catch(err)
	{
		console.log(err);
	}
}

/**
 * Bundles the project's files into a LocalFiles.bin file,
 * and returns it to the callback.
 * Uses the Bundle program provided with the Reload package,
 * which is also used by the MoSync build system.
 */
function bundleApp(projectDir, callback) {
	try{
		var exec = require('child_process').exec;
		function puts(error, stdout, stderr) {
			console.log(stdout);
			console.log(stderr);
			console.log(error);
			callback(rootWorkspacePath + fileSeparator + projectDir + "/LocalFiles.bin");
		}
		var bundleCommand = "bin\\win\\Bundle.exe";
		if(localPlatform.indexOf("darwin") >=0)
		{
		  bundleCommand = "bin/mac/Bundle";
		}
		else if(localPlatform.indexOf("linux") >=0)
		{
		  bundleCommand = "bin/linux/Bundle";
		}
		var command =  bundleCommand + " -in "  + rootWorkspacePath +
					fileSeparator + projectDir + fileSeparator + "LocalFiles -out " +
					rootWorkspacePath + fileSeparator + projectDir  + fileSeparator + "LocalFiles.bin";
		exec(command, puts);
	}
	catch(err)
	{
		console.log(err);
	}
}


// Check if project dir exists, otherwise create it
getLatestPath();

/**
 * Goes through the workspace directory and returns a list
 * of the project names to the callback
 */
function findProjects(callback) {
	try{
		path.exists(rootWorkspacePath, function(exist) {
			if(!exist)
			{
				console.log("Creating the workspace directory " + rootWorkspacePath);
				fs.mkdirSync(rootWorkspacePath, 0755);
			}

			// Now, check for projects in it
			files = fs.readdirSync(rootWorkspacePath);
			var projects = [];
			for (var key in files)
			{
				var file = files[key];
				var stat = fs.statSync(rootWorkspacePath + fileSeparator +  file);
				if(stat && stat.isDirectory()) {
					try
					{
						var LocalfileStat = fs.lstatSync(rootWorkspacePath + fileSeparator +  file + "/LocalFiles");
						if(LocalfileStat && LocalfileStat.isDirectory())
						{
							projects.push(file);
						}
					}
					catch(e)
					{
					//do nothing
					}
				}

			}
		callback(projects);
		});
	}
	catch(err)
	{
		console.log(err);
	}
}

/**
 * Uses the platform specific directory browser to open the
 * project folder
 */
function openProjectFolder(projectFolder)
{
	try{
		var exec = require('child_process').exec;
		function puts(error, stdout, stderr) {
			console.log(stdout);
			console.log(stderr);
		}
		if((localPlatform.indexOf("darwin") >= 0))
		{
			var command = "open " + rootWorkspacePath + fileSeparator + projectFolder + "/LocalFiles";
		}
		else if ((localPlatform.indexOf("linux") >=0))
		{
			var fs = require("fs");
			var commandStat = fs.statSync("/usr/bin/nautilus");
			if(commandStat.isFile())
			{
			  var command = "nautilus " + rootWorkspacePath + fileSeparator + projectFolder + "/LocalFiles &";
			}
			else
			{
			  var command = "dolphin " + rootWorkspacePath + fileSeparator + projectFolder + "/LocalFiles &";
			}
		}
		else
		{
			var command = "explorer " + rootWorkspacePath + fileSeparator + projectFolder + "\\LocalFiles";
		}
		exec(command, puts);
	}
	catch(err)
	{
		console.log(err);
	}
}

function fixPathsUnix(path)
{
	return path.replace(" ", "\\ ");
}

/**
 * Copies the appropriate template for the project type to the new project's folder, and replaces
 * the project info to that template (specifically, the project name in the .project file)
 */
function createNewProject(projectName, projectType)
{
	try{
		console.log("Creating new project: " + projectName + ", of type " + projectType);
		var templateName = "ReloadTemplate";
		if(projectType)
		{
			if(projectType == "native")
			{
				templateName = "NativeUITemplate";
			}
			else
			{
				templateName = "ReloadTemplate";
			}
		}
		var exec = require('child_process').exec;
		function resultCommand(error, stdout, stderr) {
			console.log(stdout);
			console.log(stderr);
			if(error)
			{
				console.log(error);
			}
			var file = require("fs");
			var projectData = file.readFileSync(rootWorkspacePath + fileSeparator + projectName + fileSeparator + ".project", 'utf8');
			var newData = projectData.replace(templateName, projectName);
			file.writeFileSync(rootWorkspacePath + fileSeparator + projectName + fileSeparator + ".project", newData	, 'utf8');
 		}
		if((localPlatform.indexOf("darwin") >= 0) ||(localPlatform.indexOf("linux") >=0))
		{
			var command = "cp -r " + fixPathsUnix(currentWorkingPath) + "/templates/" + fixPathsUnix(templateName) +
							" " + fixPathsUnix(rootWorkspacePath) + fixPathsUnix(fileSeparator) + fixPathsUnix(projectName);
		}
		else
		{
			var command = "xcopy /e /I \"" + currentWorkingPath + "\\templates\\" + templateName +
							"\" \"" + rootWorkspacePath + fileSeparator + projectName + "\"";
		}
		console.log(command);
		exec(command, resultCommand);
	}
	catch(err)
	{
		console.log(err);
	}
}



var adb; //The Android adb tool used for debugging on Android clients
var clearData = false;
//We are using two buffers in order to avoid any problems
//when we are trying to stringify the log
var logCatData = [];
var logCatData2 = [];
var useSecondaryBuffer = false;
var isDebuggingStarted = false;

process.on('exit', function(){
	adb.kill("-9"); //Kill adb when the server dies
});

/**
 * Starts the adb tool and saves the debug info from android clients
 * to the appropriate buffers
 */
function startDebugging() {
	try{
	isDebuggingStarted = true;
	var util = require('util');
	var spawn = require('child_process').spawn;
	if((localPlatform.indexOf("darwin") >= 0))
	{
	    adb = spawn('bin/mac/android/adb', ['logcat']);
	}
	else if((localPlatform.indexOf("linux") >=0))
	{
	    adb = spawn('bin/linux/android/adb', ['logcat']);
	}
	else
	{
	    adb = spawn('bin\\win\\android\\adb.exe', ['logcat']);
	}
	adb.stdout.setEncoding("utf8");
	adb.stdout.on('data', function (data) {
		if(useSecondaryBuffer)
		{
	  		logCatData.push(data);
		}
		else
		{
	  		logCatData2.push(data);
		}
	});
	}
	catch(err)
	{
		console.log(err);
	}
}

/**
 * Returns a JSON string with the contents of the log buffer,
 * then empties the buffer. This will also switch the currently active buffer.
 */
function getDebugData()
{
	if(!isDebuggingStarted)
	{
		//Initialize debugging
		startDebugging();
		return "";
	}
	else
	{
		if(clearData == false) {
			if(useSecondaryBuffer)
			{
				useSecondaryBuffer = false;
				var dataString  = JSON.stringify(logCatData);
				logCatData = [];
				return dataString;
			}
			else
			{
				useSecondaryBuffer = true;
				var dataString  = JSON.stringify(logCatData2);
				logCatData2 = [];
				return dataString;
			}
		}
		else
		{
			return "";
		}
	}
}

//This variable always keeps the latest info about all connected devices
var deviceInfoListJSON = "[]";

/**
 * Called by the TCP library whenever a new TCP lient connects to the server.
 * It saves and initializes the client socket.
 */
function saveClient(socket) {
	try{
	clientList.push(socket);
	socket.setEncoding('utf8'); //We only transfer text messages over the TCP connection
	socket.on('close',function (had_error) //Executed then the client closes the connection
					{
						var address = "-unknown address-";
						if(socket.deviceInfo != undefined)
						{
							address = socket.deviceInfo.address;
						}
						console.log("Client " + address + " (" + socket.deviceInfo.name + ") has disconnected." )
						for(var i = 0; i < clientList.length ; i++)
						{
							if(clientList[i].remoteAddress == socket.remoteAddress)
							{
								clientList.splice(i,1);
								generateDeviceInfoListJSON();
								break;
							}
						}
					});
	socket.on('data',function(jsonString) //Executed when the client sends data to the server
					{
						message = JSON.parse(jsonString); //The data is always in JSON format
						if(message != undefined);
						{
							if(message.type == "deviceInfo") //The device sent it's info upon connecting
							{
								//platform, name, uuid, version, phonegap
								message.type == null;
								socket.deviceInfo = message;
								socket.deviceInfo.address = socket.remoteAddress;
								generateDeviceInfoListJSON();
								console.log("Client " + socket.remoteAddress +
										" (" + socket.deviceInfo.name + ") has connected." )
							}
						}
					});
	}
	catch(err)
	{
		console.log(err);
	}
}

/**
 * Generates the JSON string with all the client devices information
 */
function generateDeviceInfoListJSON()
{
	var infoListJSON = [];

	clientList.forEach(function(c){
		infoListJSON.push(c.deviceInfo);
	});
	deviceInfoListJSON = JSON.stringify(infoListJSON);
}

/**
 * Function that handles HTTP requests.
 * Jumbo sized for your convenience.
 */
function handleHTTPGet(req, res)
{
	try{
		var page = req.url.replace("%20", " ");
		//A device client requested an app bundle
		if(page.slice(page.length-14, page.length) == "LocalFiles.bin")
		{
			var pageSplit = page.split("/");
			var path = pageSplit[pageSplit.length -2]; //Path to the project folder
			//Bundle the app
			bundleApp(path, function(actualPath){
				//Send the .bin file when bundling is complete
				var data = fs.readFileSync(actualPath);
				res.writeHead(200, {
				  'Content-Length': data.length,
				  'Content-Type': '	binary'
				});
				res.write(data);
				res.end("");
			});
		}
		//Browser requesting the default page
		else if((page == "/"))
		{
			console.log("Sending interface to browser");
			findProjects(function(projects){
				//Sending the page that redirects to the real interface
				var html = generateHTML(projects);
				res.writeHead(200, {
				  'Content-Length': html.length,
				  'Content-Type': '	text/html'
				});
				res.write(html);
				res.end("");

			});
		}
		//Editing page is polling for adb debug logs
		else if(page == "/getDebugData")
		{
			var data = getDebugData();
			res.writeHead(200, {
			  'Content-Length': data.length,
			  'Content-Type': '	text/JSON'
			});
			res.end(data);
		}
		//Editing page polls for the project list
		else if(page == "/getProjects.JSON")
		{
			findProjects(function(projects){
				var html = generateProjectListJSON(projects);
				res.writeHead(200, {
				  'Content-Length': html.length,
				  'Content-Type': '	text/html'
				});
				res.write(html);
				res.end("");
			});

		}
		//Editing page polls for mobile devices info
		else if(page == "/getClientsInfo.JSON")
		{
			res.writeHead(200, {
			  'Content-Length': deviceInfoListJSON.length,
			  'Content-Type': '	text/html'
			});
			res.write(deviceInfoListJSON);
			res.end("");
		}
		//Editing page asks the server to open a project folder
		else if (page.indexOf("openProjectFolder") != -1)
		{
			res.writeHead(302, {
	  			'Location': '/UI/index.html'
			});
			res.end();
			var pageSplit = page.split("?");
			console.log("Openning project folder " + pageSplit[pageSplit.length - 1]);
			openProjectFolder(pageSplit[pageSplit.length - 1]);
		}
		//Editing page asks the server to change the workspace path
		else if (page.indexOf("changeWorkspace") != -1)
		{
			res.writeHead(200, {
			});
			res.end();
			var pageSplit = page.split("?");
			var newWorkspacePath = pageSplit[pageSplit.length - 1];
			console.log("Changing workspace to " + newWorkspacePath);
			var path = require('path');
			path.exists(newWorkspacePath, function(exists){
				if(exists) {
					setRootWorkspacePath(newWorkspacePath);
					findProjects(function(){});
				}
				else
				{
					console.log("workspace does not exist");
					fs.mkdirSync(newWorkspacePath);
					setRootWorkspacePath(newWorkspacePath);
					findProjects(function(){});
				}
			});
		}
		//Editing page asks the server for his local address
		else if(page == "/getAddress")
		{
			if(localAddress == undefined)
			{
				localAddress = "127.0.0.1";
			}
			console.log("RequestURL:" + page);
			res.writeHead(200, {
			  'Content-Length': localAddress.length,
			  'Content-Type': '	text/html'
			});
			res.end(String(localAddress) + ":7000");

		}
		
		//Editing page asks the server for the version information
		else if(page == "/getVersionInfo")
		{
			var versionInfo = fs.readFileSync("build.dat", "ascii").split("\n");
			
			var versionInfoJSON = JSON.stringify({"version":versionInfo[0], "timestamp": versionInfo[1]});
			console.log(versionInfoJSON)
			res.writeHead(200, {
			  'Content-Length': versionInfoJSON.length,
			  'Content-Type': '	text/html'
			});
			res.write(versionInfoJSON);
			res.end("");
		}
		//Editing page asks the server for the workspace path
		else if(page == "/getWorkSpacePath")
		{
			var workspaceJSON = JSON.stringify({"path":rootWorkspacePath})
			res.writeHead(200, {
			  'Content-Length': workspaceJSON.length,
			  'Content-Type': '	text/html'
			});
			res.write(workspaceJSON);
			res.end("");
		}
		//Editing page asks the server to create a new project
		else if (page.indexOf("createProject") != -1)
		{
			res.writeHead(302, {
	  			'Location': '/UI/index.html'
			});
			res.end();

			var pageSplit = page.split("?");
			createNewProject(pageSplit[1], pageSplit[2]);
		}
		//Editing page asks the server to reload a project
		else if(page.slice(page.length-15, page.length) == "LocalFiles.html")
		{
			console.log("Reloading project");
			res.writeHead(200, {
			});
			res.end();

			//send the new bundle URL to the device clients
			clientList.forEach(function(client){
				var url = page.replace("LocalFiles.html", "LocalFiles.bin");
				console.log(url);
				try
				{
					var result = client.write(url, "ascii");
				}
				catch(err)
				{
					console.log("could not send data because : " + err)
					var index = clientList.indexOf(client);
					if(index != -1)
					{
						clientList.splice(index, 1);
					}
				}
			});
		}
		//Default HTTP request, used for sending over UI files to the page
		else
		{
			try
			{
				var fileStatus = fs.statSync("." + page);
			}
			catch(err)
			{
				//file not found on the server
				res.writeHead(400);
				res.end("");
				return;
			}
			if(fileStatus.isDirectory())
			{
				try
				{
					//default page is index.html
					var indexFileStatus = fs.statSync('.' + page + "/index.html");
				}
				catch(err)
				{
					res.writeHead(404);
					res.end("");
				}
				if(indexFileStatus.isFile())
				{
					var data = fs.readFileSync("." + page + "/index.html");
					res.writeHead(200, {
					  'Content-Length': data.length,
					  'Content-Type': 'html'
					});
					res.write(data);
					res.end("");
				}
				else
				{
					res.writeHead(404);
					res.end("");
				}
			}
			else if(fileStatus.isFile())
			{
				try
				{
					if(page.indexOf(".css") >=0)
					{
						contentType = "text/css"
					}
					else if((page.indexOf(".html") >=0) ||(page.indexOf(".htm") >=0))
					{
						contentType = "text/html"
					}

					var data = fs.readFileSync("." + page);
					res.writeHead(200, {
					  'Content-Length': data.length,
					  'Content-type': contentType
					});
					res.write(data);
					res.end("");
				}
				catch(err)
				{
					res.writeHead(404);
					res.end("");

				}
			}
		}
	}
	catch(err)
	{
		console.log(err);
	}
}

/**
 * Not actually used, but we are too close to release
 * to change ANYTHING in the code
 */
function handleHTTPPost(req, res)
{
	var page = req.url;
	if(page == "/setRootWorkspacePath")
	{
		req.on('data',function(data){
			setRootWorkspacePath(data);
		});
	}
	else if (page == "/createNewProject")
	{
		req.on('data',function(data){
			createNewProject(data);
		});
	}
}

console.log("Opening TPC socket...");
var server = net.createServer(saveClient);
server.listen(7000);

console.log("Starting HTTP server...");
http.createServer(function (req, res) {
	if(req.method == 'GET')
	{
		handleHTTPGet(req, res);
	}
	else if (req.method == 'POST')
	{
		handleHTTPPost(req,res);
	}
}).listen(8282);
