//===============================================
//This wormhole.js is compatible with
// MoSync 3.2.1
//===============================================

// =============================================================
//
// File: mosync-bridge.js

/*
Copyright (C) 2011-2013 MoSync AB

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License,
version 2, as published by the Free Software Foundation.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
MA 02110-1301, USA.
*/

/*
 * @file mosync-bridge.js
 * @author Mikael Kindborg, Ali Sarrafi
 *
 * Library for JavaScript to C++ communication on the MoSync platform.
 */

/**
 * Create a global instance of the library.
 */
var mosync = (function()
{
	// The main object of the library.
	var mosync = {};

	// This variable keeps track of the time out for our
	// HTML "Toasts", so that they display sequentially.
	var HTMLToastTimeOut = 0;

	// Detect platform.

	mosync.isAndroid =
		navigator.userAgent.indexOf("Android") != -1;

	mosync.isIOS =
		(navigator.userAgent.indexOf("iPod") != -1) ||
		(navigator.userAgent.indexOf("iPhone") != -1) ||
		(navigator.userAgent.indexOf("iPad") != -1);

	mosync.isWindowsPhone =
		navigator.userAgent.indexOf("Windows Phone OS") != -1;

	// Logging support.

	/**
	 * Write log output using maWriteLog in the MoSync C++ API.
	 * @param s Log message string.
	 */
	mosync.log = function(s)
	{
		mosync.bridge.send(["MoSync", "SysLog", s]);
	};

	// Application functions.

	mosync.app = {};

	/**
	 * Exit the application.
	 * Supported on Android. Not supported on iOS.
	 */
	mosync.app.exit = function()
	{
		mosync.bridge.send(["MoSync", "ExitApplication"]);
	};

	/**
	 * Send application to background.
	 */
	mosync.app.sendToBackground = function()
	{
		mosync.bridge.send(["MoSync", "SendToBackground"]);
	};

	mosync.SCREEN_ORIENTATION_DYNAMIC = "dynamic";
	mosync.SCREEN_ORIENTATION_PORTRAIT = "portrait";
	mosync.SCREEN_ORIENTATION_LANDSCAPE = "landscape";

	/**
	 * Set the screen orientation of the device.
	 *
	 * @param orientation The desired screen orientation.
	 * Can be one of the constants:
	 *   mosync.SCREEN\_ORIENTATION\_DYNAMIC
	 *   mosync.SCREEN\_ORIENTATION\_PORTRAIT
	 *   mosync.SCREEN\_ORIENTATION\_LANDSCAPE
	 *
	 * Example:
	 *   mosync.app.screenSetOrientation(mosync.SCREEN\_ORIENTATION\_DYNAMIC);
	 */
	mosync.app.screenSetOrientation = function(orientation)
	{
		mosync.bridge.send(["MoSync", "ScreenSetOrientation", orientation]);
	};

	/**
	 * Opens a url in an external browser. Supported url
	 * schemas are are "http:" to open a web page and
	 * "tel:" to dial a number. See examples below.
	 *
	 * @param url The url to be opened.
	 *
	 * Example of opening a web page in an external browser:
	 *   mosync.app.openExternalURL("http://maps.google.com/");
	 *
	 * Example of dialing a number:
	 *   mosync.app.openExternalURL("tel:046850510300");
	 *
	 * Note that your app needs phone permissions to be set for
	 * dialing a phone number. This is set in the MoSync SDK.
	 * Note that MoSync Reload does not have phone permissions set.
	 *
	 * This function calls the MoSync syscall maPlatformRequest.
	 */
	mosync.app.openExternalURL = function(url)
	{
		mosync.bridge.send(["MoSync", "OpenExternalURL", url]);
	};

	// Alerts and logging.

	mosync.notification = {};

	/**
	 * Displays a "toast" message box using HTML,
	 * similar to a Toast on Android. Can be used
	 * as a replacement for alert on platforms that
	 * do not support it.
	 *
	 * @param message String with message to show.
	 * @param durationInMilliseconds Optional parameter
	 * that specifies the time the message will be shown,
	 * defaults to 3000 (three seconds) if omitted.
	 *
	 * Note: This function works less well together with
	 * JavaScript libraries that manipulate the DOM at
	 * the same time.
	 */
	mosync.notification.HTMLToast = function(message, durationInMilliseconds)
	{
		var toast = document.createElement("div");
		var width = window.innerWidth - 40;
		toast.style.width = width + "px";
		toast.style.position = "absolute";
		toast.style.left = "10px";
		toast.style.top = "10px";
		toast.style.padding = "10px";
		toast.style.borderRadius = '8px';
		toast.style.MozBorderRadius = '8px';
		toast.style.WebkitBorderRadius = '8px';
		toast.style.background = "#FFFFFF";
		toast.style.border = "1px solid #000000";
		toast.style.fontFamily = "sans-serif";
		toast.style.fontSize = "18px";
		toast.style.fontWeight = "bold";
		toast.style.color = "#000000";
		toast.style.visibility = "visible";
		toast.style.zIndex = "10000";
		toast.innerHTML = message;

		// Default value of toast display time.
		var duration = 3000;
		if (durationInMilliseconds)
		{
			duration = durationInMilliseconds;
		}

		// Time duration until time to display this toast.
		var timeToDisplayToast = 0;
		var timeNow = new Date().getTime();
		var timeToNextTimeout = HTMLToastTimeOut - timeNow;
		if (timeToNextTimeout > 0)
		{
			timeToDisplayToast = timeToNextTimeout;
		}

		// Update time point for accumulated time out.
		HTMLToastTimeOut = timeNow + timeToDisplayToast + duration;

		setTimeout(
			function()
			{
				document.body.appendChild(toast);
				setTimeout(
					function()
					{
						document.body.removeChild(toast);
					},
					duration);
			},
			timeToDisplayToast);
	};

	/**
	 * Displays a native message box.
	 *
	 * @param title String with message box title.
	 * @param message String with message to show.
	 */
	mosync.notification.messageBox = function(title, message)
	{
		mosync.bridge.sendJSON({
			messageName:"PhoneGap",
			service:"mosync",
			action:"mosync.notification.messageBox",
			title:title,
			message:message});
	};

	// console.log does not work on WP7.
	// Define console if undefined.
	if (typeof console === "undefined")
	{
		console = {}
	}

	// Define console.log if undefined.
	if (typeof console.log === "undefined")
	{
		console.log = function(s)
		{
			mosync.log(s);
		};
	}

	// alert does not work on WP7, replace with
	// call to maMessageBox.
	if (mosync.isWindowsPhone)
	{
		window.alert = function(message) {
			mosync.notification.messageBox("Message", message);
		};
	}

	// The encoder submodule.

	mosync.encoder = (function()
	{
		var encoder = {};
		var firstChar = 33;
		var lastChar = 126;
		var base = lastChar - firstChar;

		encoder.itox = function(i)
		{
			var n = i;
			var digits = [];

			while (n > base)
			{
				digits.push((n % base) + firstChar);
				n = (n / base) >> 0;
			}
			digits.push(n + firstChar);

			return String.fromCharCode.apply(null, digits);
		};

		encoder.xtoi = function(s)
		{
			var n = 0;
			var length = s.length;

			for (var i = 0; i < length; ++i)
			{
				n += Math.pow(base, i) * (s.charCodeAt(i) - firstChar);
			}

			return n;
		};

		// Thanks to: http://jsfromhell.com/geral/utf-8
		// Author: Jonas Raoni Soares Silva
		// Note: Function not used.
		encoder.encodeUTF8 = function(s){
			for(var c, i = -1, l = (s = s.split("")).length, o = String.fromCharCode; ++i < l;
				s[i] = (c = s[i].charCodeAt(0)) >= 127 ? o(0xc0 | (c >>> 6)) + o(0x80 | (c & 0x3f)) : s[i]
			);
			return s.join("");
		};

		// Thanks to: http://jsfromhell.com/geral/utf-8
		// Author: Jonas Raoni Soares Silva
		// Note: Function not used.
		encoder.decodeUTF8 = function(s){
			for(var a, b, i = -1, l = (s = s.split("")).length, o = String.fromCharCode, c = "charCodeAt"; ++i < l;
				((a = s[i][c](0)) & 0x80) &&
				(s[i] = (a & 0xfc) == 0xc0 && ((b = s[i + 1][c](0)) & 0xc0) == 0x80 ?
				o(((a & 0x03) << 6) + (b & 0x3f)) : o(128), s[++i] = "")
			);
			return s.join("");
		};

		/**
		 * @return The length in bytes of the string encoded
		 * as UTF8.
		 */
		encoder.lengthAsUTF8 = function(s)
		{
			var length = 0;
			for (var i = 0; i < s.length; ++i)
			{
				var c = s.charCodeAt(i);

				if (c < 128)
				{
					length += 1;
				}
				else if ((c > 127) && (c < 2048))
				{
					length += 2;
				}
				else
				{
					length += 3;
				}
			}
			return length;
		};

		/**
		 * Encode a string with a length value followed by string data.
		 */
		encoder.encodeString = function(s)
		{
			// On all current platforms (Android, iOS, Windows Phone)
			// strings are converted to UTF8 strings when passed from JS
			// to the underlying layer (Java, Objective-C, C#). Therefore
			// we need to calculate the length of the UTF8 encoded string
			// data and use that as the length of the message string.
			var length = encoder.lengthAsUTF8(s);
			var encodedString = "";
			return encodedString.concat(encoder.itox(length), " ", s, " ");
		};

		return encoder;
	}
	)();

	// The bridge submodule.

	mosync.bridge = (function()
	{
		var bridge = {};
		var callbackTable = {};
		var callbackIdCounter = 0;
		var messageQueue = [];
		var messageSender = null;
		var messageQueueJSON = [];
		var messageSenderJSON = null;
		var rawMessageQueue = [];

		/**
		 * Send message strings to C++. If a callback function is
		 * supplied, a callbackId parameter will be added to
		 * the message, this id can be used when sending a reply
		 * back to JavaScript from C++.
		 *
		 * Example: mosync.bridge.send(["Custom", "Vibrate", "500"]);
		 *
		 * See this page for a tutorial: http://www.mosync.com/documentation/manualpages/how-communicate-between-javascript-and-c-mosync
		 *
		 * The project template "HTML5/JS/C++ Hybrid Project" is a
		 * good starting point for leaning how to add custom C++ code
		 * to your JavaScript application. Look at the files index.html
		 * and main.cpp in the project generated from the template.
		 *
		 * This method queues messages and can be called multiple
		 * times in sequential JS code. When the sequential code executes,
		 * a timer will be activated and wil send all messages
		 * in the queue in one chunk. This enhances performance of
		 * message sending.
		 *
		 * Note: the "close" message is deprecated. To close the application, use "mosync.app.exit" instead.
		 * \code
		 *    //Deprecated method:
		 *    mosync.bridge.send(["close"]);
		 *
		 *    //Preferred method:
		 *    mosync.app.exit();
		 *
		 * \endcode
		 *
		 * @param message An array of message strings.
		 *
		 * @param callbackFun An optional function to receive the
		 * result of the message asynchronosly. The ID of the
		 * callback function is added after the strings in the
		 * messageStrings array.
		 */
		bridge.send = function(messageStrings, callbackFun)
		{
			var callbackId = null;

			// If there is a callback function supplied, create
			// a callbackId and add it to the callback table.
			if (callbackFun)
			{
				callbackIdCounter = callbackIdCounter + 1;
				callbackTable[callbackIdCounter] = callbackFun;
				callbackId = callbackIdCounter;
			}

			// Add message strings to queue.

			var length = messageStrings.length;
			for (var i = 0; i < length; ++i)
			{
				messageQueue.push(messageStrings[i]);
			}

			// If we have a callbackId, push that too, as a string value.
			if (null != callbackId)
			{
				messageQueue.push(String(callbackId));
			}


			// Start timer for sender function.
			// This will get called once sequential
			// execution of JS code is done.
			if (null == messageSender)
			{
				messageSender = setTimeout(function()
				{
					messageSender = null;
					bridge.sendAll();
				},
				1);
			}
		};

		/**
		 * Send a JSON message to C++. If a callback function is
		 * supplied, a callbackId parameter will be added to
		 * the message, this id can be used when sending a reply
		 * back to JavaScript from C++.
		 *
		 * This method queues a message and can be called multiple
		 * times in sequential JS code. When execution of sequential
		 * code is done, a timer will is activated and sends all messages
		 * in the queue in one chunk. This enhances performance of
		 * message sending.
		 *
		 * @param message A dictionary with the message parameters.
		 * The parameter "messageName" specifies the name of the
		 * message selector (the "command name") and must always be
		 * included.
		 *
		 * @param callbackFun An optional function to receive the
		 * result of the message asynchronosly.
		 */
		bridge.sendJSON = function(message, callbackFun)
		{
			// If there is a callback function supplied, create
			// a callbackId and add it to the callback table.
			if (callbackFun)
			{
				callbackIdCounter = callbackIdCounter + 1;
				callbackTable[callbackIdCounter] = callbackFun;
				message["callbackId"] = callbackIdCounter;
			}

			// Add message to queue.
			messageQueueJSON.push(message);

			// Start timer for sender function.
			// This will get called once sequential
			// execution of JS code is done.
			if (null == messageSenderJSON)
			{
				messageSenderJSON = setTimeout(function()
				{
					messageSenderJSON = null;
					bridge.sendAllJSON();
				},
				1);
			}
		};

		/**
		 * Send all queued message strings.
		 */
		bridge.sendAll = function()
		{
			// Check that messageQueue is not empty!
			var length = messageQueue.length;
			if (length > 0)
			{
				// Add the "ms:" token to the beginning of the data
				// to signify that this as a message stream. This is
				// used by the C++ message parser to handle different
				// types of message formats.
				var data = "ms:";
				for (var i = 0; i < length; ++i)
				{
					data = data.concat(mosync.encoder.encodeString(String(messageQueue[i])));
				}

				messageQueue = [];
				bridge.sendRaw(data);
			}
		};

		/**
		 * Send all queued JSON messages.
		 */
		bridge.sendAllJSON = function()
		{
			// Check that messageQueue is not empty!
			if (messageQueueJSON.length > 0)
			{
				// Add the "ma:" token to the beginning of the data
				// to signify that this as a message array. This is
				// used by the C++ message parser to handle different
				// types of message formats.
				var data = "ma:" + JSON.stringify(messageQueueJSON);
				messageQueueJSON = [];
				bridge.sendRaw(data);
			}
		};

		/**
		 * Send raw data to the C++ side.
		 */
		bridge.sendRaw = function(data)
		{
			if (mosync.isAndroid)
			{
				prompt(data, "");
			}
			else if (mosync.isIOS)
			{
				rawMessageQueue.push(data);
				window.location = "mosync://DataAvailable";
			}
			else if (mosync.isWindowsPhone)
			{
				window.external.notify(data);
			}
			else
			{
				alert("mosync.bridge.sendRaw: unknown platform");
			}
		};

		/**
		 * Called from iOS runtime to get message.
		 */
		bridge.getMessageData = function()
		{
			if (rawMessageQueue.length == 0)
			{
				// Return an empty string so the iOS runtime
				// knows we don't have any message.
				return "";
			}
			var message = rawMessageQueue.pop();
			return message;
		};

		/**
		 * This function is meant to be used to call back from C++ to
		 * JavaScript. The function takes a variable number of parameters.
		 *
		 * For example, to return the value 'Hello World' to the callback
		 * with ID 82, you can use this code in a WebAppMoblet:
		 *
		 *   callJS("mosync.bridge.reply(82, 'Hello World')");
		 *
		 * You can obtain the callbackId from the C++ WebViewMessage
		 * object, if you use that class to parse the message.
		 *
		 * @param callBackId The first parameter is the ID of the
		 * callback function. Remaning parameters are applied to the
		 * function refered to by the callbackId.
		 */
		bridge.reply = function(callbackId)
		{
			var callbackFun = callbackTable[callbackId];
			if (callbackFun)
			{
				// Remove the first param, the callbackId.
				var args = Array.prototype.slice.call(arguments);
				args.shift();

				// Call the function.
				callbackFun.apply(null, args);
			}
		};

		return bridge;
	})();

	// Return the library object.
	return mosync;
})();

// Send OpenWormhole message to C++ when document is loaded.
document.addEventListener(
	"DOMContentLoaded",
	function()
	{
		// This signals that the document is loaded and Wormhole
		// is ready be initialized.
		mosync.bridge.send(["MoSync", "OpenWormhole"]);
	},
	false);

// =============================================================
//
// File: phonegap-bridge.js

/*
Copyright (C) 2011 MoSync AB

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License,
version 2, as published by the Free Software Foundation.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
MA 02110-1301, USA.
*/

/**
 * @file phonegap-bridge.js
 * @author Ali Sarrafi
 *
 * Glue between PhoneGap and the MoSync Wormhole bridge.
 */

mosync.bridge.PhoneGap = {};

// TODO: Is this needed? Remove?
//mosync.bridge.PhoneGap.CallBackTable = {};

/**
 * sends a message through bridge as a PhoneGap message
 *
 * @param callbackId ID of the PhoneGap Callback to be used
 * @param service name of the PhoneGap Service
 * @param action action name for the specified service
 * @param args extra arguments as JSON
 */
mosync.bridge.PhoneGap.send = function(callbackId, service, action, args)
{
	//Generate a MoSync Message from the phonegap command
	var command = {
		"messageName": "PhoneGap",
		"service": service,
		"action": action,
		"args": args,
		"PhoneGapCallBackId": callbackId
	};

    // Call into Mosync C++ through bridge library.
	mosync.bridge.sendJSON(command, null);
};

/**
 * Add support for location services if the platform does not support it by default
 */
if(navigator.geolocation == undefined)
{
	navigator.geolocation = {};

	/**
	 * Starts watching the phone position and listening to the GPS events
	 * Overrides the original geolocation api
	 * to use MoSync Location API.
	 *
	 * @param success the callback function for returning the success result
	 * @param fail callback function for failure
	 */
	navigator.geolocation.watchPosition = function(success, fail)
	{
		var callbackId = "GeoLocation" + PhoneGap.callbackId++;
	    if (typeof success == "function" || typeof fail == "function")
		{
	        PhoneGap.callbacks[callbackId] = {success:success, fail:fail};
	    }
	    mosync.bridge.PhoneGap.send(callbackId, "GeoLocation", "watchPosition");
	};

	/**
	 * Gets the current GPS position once
	 * Overrides the original geolocation api
	 * to use MoSync Location API.
	 *
	 * @param success the callback function for returning the success result
	 * @param fail callback function for failure
	 */
	navigator.geolocation.getCurrentPosition = function(success, fail)
	{
		var callbackId = "GeoLocation" + PhoneGap.callbackId++;
	    if (typeof success == "function" || typeof fail == "function")
		{
	        PhoneGap.callbacks[callbackId] = {success:success, fail:fail};
	    }
	    mosync.bridge.PhoneGap.send(callbackId, "GeoLocation", "getCurrentPosition");
	};

	/**
	 * Stops watching the phone position and listening to the GPS events
	 * Overrides the original geolocation api
	 * to use MoSync Location API.
	 *
	 * @param success the callback function for returning the success result
	 * @param fail callback function for failure
	 */
	navigator.geolocation.clearWatch = function(success, fail)
	{
		var callbackId = "GeoLocation" + PhoneGap.callbackId++;
	    if (typeof success == "function" || typeof fail == "function")
		{
	        PhoneGap.callbacks[callbackId] = {success:success, fail:fail};
	    }
	    mosync.bridge.PhoneGap.send(callbackId, "GeoLocation", "clearWatch");
	};

}

// =============================================================
//
// File: phonegap-1.2.0.js

/*
PhoneGap
========

PhoneGap is available under *either* the terms of the modified BSD license *or* the
MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.

 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010-2011, IBM Corporation
 * Copyright (c) 2011, Microsoft Corporation
 * Copyright (c) 2012, MoSync AB
 */

/**
 * The order of events during page load and PhoneGap startup is as follows:
 *
 * onDOMContentLoaded         Internal event that is received when the web page is loaded and parsed.
 * window.onload              Body onload event.
 * onNativeReady              Internal event that indicates the PhoneGap native side is ready.
 * onPhoneGapInit             Internal event that kicks off creation of all PhoneGap JavaScript objects (runs constructors).
 * onPhoneGapReady            Internal event fired when all PhoneGap JavaScript objects have been created
 * onPhoneGapInfoReady        Internal event fired when device properties are available
 * onDeviceReady              User event fired to indicate that PhoneGap is ready
 * onResume                   User event fired to indicate a start/resume lifecycle event
 * onPause                    User event fired to indicate a pause lifecycle event
 * onDestroy                  Internal event fired when app is being destroyed (User should use window.onunload event, not this one).
 *
 * The only PhoneGap events that user code should register for are:
 *      onDeviceReady
 *      onResume
 *
 * Listeners can be registered as:
 *      document.addEventListener("deviceready", myDeviceReadyListener, false);
 *      document.addEventListener("resume", myResumeListener, false);
 *      document.addEventListener("pause", myPauseListener, false);
 */

/**
 * We override the JSON.parse function because it does not work properly on all phones.
 */
JSON.parse = function(JSONDocument)
{
	var parsedObject = eval('(' + JSONDocument + ')');
	return parsedObject;
};

 if (typeof(DeviceInfo) !== 'object') {
    var DeviceInfo = {};
}

var PhoneGap = {
        queue: {
        ready: true,
        commands: [],
        timer: null
    },
    available:false,
    callbackId:0,
    callbacks:{},
    resources:{}
};

PhoneGap.callbackStatus = {
    NO_RESULT: 0,
    OK: 1,
    CLASS_NOT_FOUND_EXCEPTION: 2,
    ILLEGAL_ACCESS_EXCEPTION: 3,
    INSTANTIATION_EXCEPTION: 4,
    MALFORMED_URL_EXCEPTION: 5,
    IO_EXCEPTION: 6,
    INVALID_ACTION: 7,
    JSON_EXCEPTION: 8,
    ERROR: 9
};

/**
 * Determine if resource has been loaded by PhoneGap
 *
 * @param name
 * @return
 */
PhoneGap.hasResource = function(name) {
    return PhoneGap.resources[name];
};

/**
 * Add a resource to list of loaded resources by PhoneGap
 *
 * @param name
 */
PhoneGap.addResource = function(name) {
    PhoneGap.resources[name] = true;
};

PhoneGap.exec = function(success, fail, service, action, args)
{
    var callbackId = service + PhoneGap.callbackId++;
    if (typeof success == "function" || typeof fail == "function")
    {
        PhoneGap.callbacks[callbackId] = {success:success, fail:fail};
    }

    // MOSYNC: Use the bridge library to send the message to C++.
    mosync.bridge.PhoneGap.send(callbackId, service, action, args);
};

// MOSYNC: We currently only call this function for key, pause and resume events
//We call PhoneGap.CallbackSuccess and PhoneGap.CallbackError directly  from C++.
PhoneGapCommandResult = function(status,callbackId,args,cast)
{
    if(status === "backbutton") {

        PhoneGap.fireEvent(document,"backbutton");
        return "true";

    } else if(status === "resume") {

        PhoneGap.onResume.fire();
        return "true";

    } else if(status === "pause") {

        PhoneGap.onPause.fire();
        return "true";
    }

    var safeStatus = parseInt(status);
    if(safeStatus === PhoneGap.callbackStatus.NO_RESULT ||
       safeStatus === PhoneGap.callbackStatus.OK) {
        PhoneGap.CallbackSuccess(callbackId,args,cast);
    }
    else
    {
        PhoneGap.CallbackError(callbackId,args,cast);
    }
};

/**
 * Called by native code when returning successful result from an action.
 *
 * @param callbackId
 * @param args
 * @param cast
 */
PhoneGap.CallbackSuccess = function(callbackId, args, cast)
{
    var commandResult;
    try
    {
        commandResult = JSON.parse(args);

        if (typeof cast !== 'undefined')
        {
            eval('commandResult = ' + cast + '(commandResult);');
        }
    }
    catch(exception)
    {
        console.log("PhoneGap.CallbackSuccess Exception: " + exception.message);
        return exception.message;
    }

    if (PhoneGap.callbacks[callbackId] ) {

        // If result is to be sent to callback
        if (commandResult.status === PhoneGap.callbackStatus.OK) {
            try {
                if (PhoneGap.callbacks[callbackId].success) {
                    result = PhoneGap.callbacks[callbackId].success(commandResult.message);
                }
            }
            catch (e) {
                console.log("Error in success callback with id: "+callbackId+": " + e.message);
            }
        }

        // Clear callback if not expecting any more results
        if (!commandResult.keepCallback) {
            delete PhoneGap.callbacks[callbackId];
        }
    }

    // Note that in WP7, this method can return a value to the native calling code
    return "";
};

/**
 * Called by native code when returning error result from an action.
 *
 * @param callbackId
 * @param args
 * @param cast - not supported
 */
PhoneGap.CallbackError = function (callbackId, args, cast) {

    var commandResult;
    try
    {
        commandResult = JSON.parse(args);
    }
    catch(exception)
    {
        console.log("PhoneGap.CallbackError Exception: " + exception.message);
        return exception.message;
    }

    if (PhoneGap.callbacks[callbackId]) {
        try {
            if (PhoneGap.callbacks[callbackId].fail) {
                PhoneGap.callbacks[callbackId].fail(commandResult.message);
            }
        }
        catch (e) {
            console.log("Error in error callback: "+callbackId+" = "+e);
        }

        // Clear callback if not expecting any more results
        if (!args.keepCallback) {
            delete PhoneGap.callbacks[callbackId];
        }
    }
};

/**
 * Create a UUID
 *
 * @return {String}
 */
PhoneGap.createUUID = function() {
    return PhoneGap.UUIDcreatePart(4) + '-' +
        PhoneGap.UUIDcreatePart(2) + '-' +
        PhoneGap.UUIDcreatePart(2) + '-' +
        PhoneGap.UUIDcreatePart(2) + '-' +
        PhoneGap.UUIDcreatePart(6);
};

PhoneGap.UUIDcreatePart = function(length) {
    var uuidpart = "";
    var i, uuidchar;
    for (i=0; i<length; i++) {
        uuidchar = parseInt((Math.random() * 256),0).toString(16);
        if (uuidchar.length === 1) {
            uuidchar = "0" + uuidchar;
        }
        uuidpart += uuidchar;
    }
    return uuidpart;
};

/**
 * Does a deep clone of the object.
 *
 * @param obj
 * @return {Object}
 */
PhoneGap.clone = function(obj) {
    var i, retVal;
    if(!obj) {
        return obj;
    }

    if(obj instanceof Array){
        retVal = [];
        for(i = 0; i < obj.length; ++i){
            retVal.push(PhoneGap.clone(obj[i]));
        }
        return retVal;
    }

    if (typeof obj === "function") {
        return obj;
    }

    if(!(obj instanceof Object)){
        return obj;
    }

    if (obj instanceof Date) {
        return obj;
    }

    retVal = {};
    for(i in obj){
        if(!(i in retVal) || retVal[i] !== obj[i]) {
            retVal[i] = PhoneGap.clone(obj[i]);
        }
    }
    return retVal;
};

/*Clones object, but catches exception*/
PhoneGap.safeClone = function(obj)
{
    try
    {
        return PhoneGap.clone(obj);
    }
    catch(e)
    {
        console.log("CloneError::" + e.message);
    }
    return null;
};


/**
 * Custom pub-sub channel that can have functions subscribed to it
 * @constructor
 */
PhoneGap.Channel = function(type)
{
    this.type = type;
    this.handlers = {};
    this.guid = 0;
    this.fired = false;
    this.enabled = true;
};

/**
 * Subscribes the given function to the channel. Any time that
 * Channel.fire is called so too will the function.
 * Optionally specify an execution context for the function
 * and a guid that can be used to stop subscribing to the channel.
 * Returns the guid.
 */
PhoneGap.Channel.prototype.subscribe = function(f, c, g) {
    // need a function to call
    if (f === null) { return; }

    var func = f;
    if (typeof c === "object" && typeof f === "function") { func = PhoneGap.close(c, f); }

    g = g || func.observer_guid || f.observer_guid || this.guid++;
    func.observer_guid = g;
    f.observer_guid = g;
    this.handlers[g] = func;
    return g;
};

/**
 * Like subscribe but the function is only called once and then it
 * auto-unsubscribes itself.
 */
PhoneGap.Channel.prototype.subscribeOnce = function(f, c) {
    var g = null;
    var _this = this;
    var m = function() {
        f.apply(c || null, arguments);
        _this.unsubscribe(g);
    };
    if (this.fired) {
        if (typeof c === "object" && typeof f === "function") { f = PhoneGap.close(c, f); }
        f.apply(this, this.fireArgs);
    } else {
        g = this.subscribe(m);
    }
    return g;
};

/**
 * Unsubscribes the function with the given guid from the channel.
 */
PhoneGap.Channel.prototype.unsubscribe = function(g) {
    if (typeof g === "function") { g = g.observer_guid; }
    this.handlers[g] = null;
    delete this.handlers[g];
};

/**
 * Calls all functions subscribed to this channel.
 */
PhoneGap.Channel.prototype.fire = function(e) {
    if (this.enabled) {
        var fail = false;
        var item, handler, rv;
        for (item in this.handlers) {
            if (this.handlers.hasOwnProperty(item)) {
                handler = this.handlers[item];
                if (typeof handler === "function") {
                    rv = (handler.apply(this, arguments) === false);
                    fail = fail || rv;
                }
            }
        }
        this.fired = true;
        this.fireArgs = arguments;
        return !fail;
    }
    return true;
};

/**
 * Calls the provided function only after all of the channels specified
 * have been fired.
 */
PhoneGap.Channel.join = function(h, c) {
    var i = c.length;
    var f = function() {
        if (!(--i)) {
            h();
        }
    };
    var len = i;
    var j;
    for (j=0; j<len; j++) {
        if (!c[j].fired) {
            c[j].subscribeOnce(f);
        }
        else {
            i--;
        }
    }
    if (!i) {
        h();
    }
};

/**
 * Boolean flag indicating if the PhoneGap API is available and initialized.
 */ // TODO: Remove this, it is unused here ... -jm
PhoneGap.available = DeviceInfo.uuid !== undefined;

/**
 * Add an initialization function to a queue that ensures it will run and initialize
 * application constructors only once PhoneGap has been initialized.
 * @param {Function} func The function callback you want run once PhoneGap is initialized
 */
PhoneGap.addConstructor = function(func)
{
    PhoneGap.onPhoneGapInit.subscribeOnce(function() {
        try {
            func();
        } catch(e) {
            console.log("Failed to run constructor: " + e);
        }
    });
};

/*
 * Plugins object
 */
if (!window.plugins) {
    window.plugins = {};
};

/**
 * Adds a plugin object to window.plugins.
 * The plugin is accessed using window.plugins.<name>
 *
 * @param name          The plugin name
 * @param obj           The plugin object
 */
PhoneGap.addPlugin = function(name, obj) {
    if (!window.plugins[name]) {
        window.plugins[name] = obj;
    }
    else {
        console.log("Error: Plugin "+name+" already exists.");
    }
};

/**
 * onDOMContentLoaded channel is fired when the DOM content
 * of the page has been parsed.
 */
PhoneGap.onDOMContentLoaded = new PhoneGap.Channel('onDOMContentLoaded');

/**
 * onNativeReady channel is fired when the PhoneGap native code
 * has been initialized.
 */
PhoneGap.onNativeReady = new PhoneGap.Channel('onNativeReady');

/**
 * onPhoneGapInit channel is fired when the web page is fully loaded and
 * PhoneGap native code has been initialized.
 */
PhoneGap.onPhoneGapInit = new PhoneGap.Channel('onPhoneGapInit');

/**
 * onPhoneGapReady channel is fired when the JS PhoneGap objects have been created.
 */
PhoneGap.onPhoneGapReady = new PhoneGap.Channel('onPhoneGapReady');

/**
 * onPhoneGapInfoReady channel is fired when the PhoneGap device properties
 * has been set.
 */
PhoneGap.onPhoneGapInfoReady = new PhoneGap.Channel('onPhoneGapInfoReady');

/**
 * onPhoneGapConnectionReady channel is fired when the PhoneGap connection properties
 * has been set.
 */
PhoneGap.onPhoneGapConnectionReady = new PhoneGap.Channel('onPhoneGapConnectionReady');

/**
 * onResume channel is fired when the PhoneGap native code
 * resumes.
 */
PhoneGap.onResume = new PhoneGap.Channel('onResume');

/**
 * onPause channel is fired when the PhoneGap native code
 * pauses.
 */
PhoneGap.onPause = new PhoneGap.Channel('onPause');

/**
 * onDestroy channel is fired when the PhoneGap native code
 * is destroyed.  It is used internally.
 * Window.onunload should be used by the user.
 */
PhoneGap.onDestroy = new PhoneGap.Channel('onDestroy');
PhoneGap.onDestroy.subscribeOnce(function() {
    PhoneGap.shuttingDown = true;
});
PhoneGap.shuttingDown = false;

// _nativeReady is global variable that the native side can set
// to signify that the native code is ready. It is a global since
// it may be called before any PhoneGap JS is ready.
if (typeof _nativeReady !== 'undefined') { PhoneGap.onNativeReady.fire(); }

/**
 * onDeviceReady is fired only after all PhoneGap objects are created and
 * the device properties are set.
 */
PhoneGap.onDeviceReady = new PhoneGap.Channel('onDeviceReady');


// Array of channels that must fire before "deviceready" is fired
// MOSYNC: Added PhoneGap.onNativeReady to channels array to fix
// bug that caused onDeviceReady to fire too early.
PhoneGap.deviceReadyChannelsArray = [
	PhoneGap.onPhoneGapReady,
	//PhoneGap.onPhoneGapInfoReady,
	PhoneGap.onPhoneGapConnectionReady,
	PhoneGap.onNativeReady];

// This is hack to overcome the problems with iOs6 devices, should be removed when that is fixed
if(!mosync.isIOS)
{
  PhoneGap.deviceReadyChannelsArray.push(PhoneGap.onPhoneGapInfoReady);  
}
// Hashtable of user defined channels that must also fire before "deviceready" is fired
PhoneGap.deviceReadyChannelsMap = {};

/**
 * Indicate that a feature needs to be initialized before it is ready to be used.
 * This holds up PhoneGap's "deviceready" event until the feature has been initialized
 * and PhoneGap.initComplete(feature) is called.
 *
 * @param feature {String}     The unique feature name
 */
PhoneGap.waitForInitialization = function(feature) {
    if (feature) {
        var channel = new PhoneGap.Channel(feature);
        PhoneGap.deviceReadyChannelsMap[feature] = channel;
        PhoneGap.deviceReadyChannelsArray.push(channel);
    }
};

/**
 * Indicate that initialization code has completed and the feature is ready to be used.
 *
 * @param feature {String}     The unique feature name
 */
PhoneGap.initializationComplete = function(feature) {
    var channel = PhoneGap.deviceReadyChannelsMap[feature];
    if (channel) {
        channel.fire();
    }
};

/*
 * Create all PhoneGap objects once page has fully loaded and native side is ready.
 */
PhoneGap.Channel.join(
    function()
    {
        setTimeout(function()
        {

            PhoneGap.UsePolling = false;
            //PhoneGap.JSCallback();
        },1);

        // Run PhoneGap constructors
        PhoneGap.onPhoneGapInit.fire();

        // Fire event to notify that all objects are created
        PhoneGap.onPhoneGapReady.fire();

        // Fire onDeviceReady event once all constructors have run and PhoneGap info has been
        // received from native side, and any user defined initialization channels.
        PhoneGap.Channel.join(function() {
            PhoneGap.onDeviceReady.fire();

            // Fire the onresume event, since first one happens before JavaScript is loaded
            PhoneGap.onResume.fire();
        }, PhoneGap.deviceReadyChannelsArray);

    },
    [ PhoneGap.onDOMContentLoaded ]);



// Listen for DOMContentLoaded and notify our channel subscribers
document.addEventListener('DOMContentLoaded', function() {
    PhoneGap.onDOMContentLoaded.fire();
}, false);

PhoneGap.m_document_addEventListener = document.addEventListener;
document.addEventListener = function(evt, handler, capture)
{
    console.log("document.addEventListener event named " + evt);

    var e = evt.toLowerCase();
    if (e === 'deviceready')
    {
        PhoneGap.onDeviceReady.subscribeOnce(handler);
    }
    else if (e === 'resume')
    {
        PhoneGap.onResume.subscribe(handler);
        if (PhoneGap.onDeviceReady.fired)
        {
            PhoneGap.onResume.fire();
        }
    }
    else if (e === 'pause')
    {
        PhoneGap.onPause.subscribe(handler);
    }
    else
    {

        if (e === 'backbutton')
        {
            PhoneGap.exec(null, null, "CoreEvents", "overrideBackbutton", [true]);
        }
        PhoneGap.m_document_addEventListener.call(document, evt, handler, capture);
    }
};

PhoneGap.m_document_removeEventListener = document.removeEventListener;
document.removeEventListener = function(evt, handler, capture)
{
    console.log("document.removeEventListener event named " + evt);

    var e = evt.toLowerCase();

    if (e === 'backbutton')
    {
        PhoneGap.exec(null, null, "CoreEvents", "overrideBackbutton", [false]);
    }
    PhoneGap.m_document_removeEventListener.call(document, evt, handler, capture);

}


PhoneGap.fireEvent = function(_targ,evtName)
{
    var target = _targ || window;
    var eventObj = document.createEvent('MouseEvents');
    eventObj.initEvent( evtName, true, false );
    target.dispatchEvent( eventObj );
}

/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) 2005-2011, Nitobi Software Inc.
 * Copyright (c) 2010-2011, IBM Corporation
 * Copyright (c) 2011, Microsoft Corporation
 */

if (!PhoneGap.hasResource("accelerometer"))
{
PhoneGap.addResource("accelerometer");

/**
 * @constructor
 */
var Acceleration = function(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.timestamp = new Date().getTime();
};

/**
 * This class provides access to device accelerometer data.
 * @constructor
 */
var Accelerometer = function() {

    /**
     * The last known acceleration.  type=Acceleration()
     */
    this.lastAcceleration = null;

    /**
     * List of accelerometer watch timers
     */
    this.timers = {};
};

Accelerometer.ERROR_MSG = ["Not running", "Starting", "", "Failed to start"];

/**
 * Asynchronously aquires the current acceleration.
 *
 * @param {Function} successCallback    The function to call when the acceleration data is available
 * @param {Function} errorCallback      The function to call when there is an error getting the acceleration data. (OPTIONAL)
 * @param {AccelerationOptions} options The options for getting the accelerometer data such as timeout. (OPTIONAL)
 \code
 function onSuccess(acceleration) {
    alert('Acceleration X: ' + acceleration.x + '\n' +
          'Acceleration Y: ' + acceleration.y + '\n' +
          'Acceleration Z: ' + acceleration.z + '\n' +
          'Timestamp: '      + acceleration.timestamp + '\n');
};

function onError() {
    alert('onError!');
};

navigator.accelerometer.getCurrentAcceleration(onSuccess, onError);
 \endcode
 */
Accelerometer.prototype.getCurrentAcceleration = function(successCallback, errorCallback, options) {

    // successCallback required
    if (typeof successCallback !== "function") {
        console.log("Accelerometer Error: successCallback is not a function");
        return;
    }

    // errorCallback optional
    if (errorCallback && (typeof errorCallback !== "function")) {
        console.log("Accelerometer Error: errorCallback is not a function");
        return;
    }

    var self = this;

    var onSuccess = function(result)
    {
        var accResult = JSON.parse(result);
        self.lastAcceleration = new Acceleration(accResult.x,accResult.y,accResult.z);
        successCallback(self.lastAcceleration);
    }

    var onError = function(err)
    {
        errorCallback(err);
    }

    // Get acceleration
    PhoneGap.exec(onSuccess, onError, "Accelerometer", "getAcceleration",options);
};


/**
 * Asynchronously aquires the acceleration repeatedly at a given interval.
 *
 * @param {Function} successCallback    The function to call each time the acceleration data is available
 * @param {Function} errorCallback      The function to call when there is an error getting the acceleration data. (OPTIONAL)
 * @param {AccelerationOptions} options The options for getting the accelerometer data such as timeout. (OPTIONAL)
 * @return String                       The watch id that must be passed to #clearWatch to stop watching.
 \code
 function onSuccess(acceleration) {
    alert('Acceleration X: ' + acceleration.x + '\n' +
          'Acceleration Y: ' + acceleration.y + '\n' +
          'Acceleration Z: ' + acceleration.z + '\n' +
          'Timestamp: '      + acceleration.timestamp + '\n');
};

function onError() {
    alert('onError!');
};

navigator.accelerometer.getCurrentAcceleration(onSuccess, onError);
 \endcode
 */
Accelerometer.prototype.watchAcceleration = function(successCallback, errorCallback, options)
{

    // successCallback required
    if (typeof successCallback !== "function") {
        console.log("Accelerometer Error: successCallback is not a function");
        return;
    }

    // errorCallback optional
    if (errorCallback && (typeof errorCallback !== "function")) {
        console.log("Accelerometer Error: errorCallback is not a function");
        return;
    }

    var onSuccess = function (result) {
        var accResult = JSON.parse(result);
        self.lastAcceleration = new Acceleration(accResult.x, accResult.y, accResult.z);
        successCallback(self.lastAcceleration);
    }

    var onError = function (err) {
        errorCallback(err);
    }

    var id = PhoneGap.createUUID();

    var params = new Object();
    params.id = id;
    // Default interval (10 sec)
    params.frequency = (options && options.frequency) ? options.frequency : 10000;

    PhoneGap.exec(onSuccess, onError, "Accelerometer", "startWatch", params);

    return id;
};

/**
 * Clears the specified accelerometer watch.
 *
 * @param {String} id       The id of the watch returned from #watchAcceleration.
 \code
 var watchID = navigator.accelerometer.watchAcceleration(onSuccess, onError, options);

// ... later on ...

navigator.accelerometer.clearWatch(watchID);
 \endcode
 */
Accelerometer.prototype.clearWatch = function(id) {

    PhoneGap.exec(null, null, "Accelerometer", "stopWatch", { id: id });
};

PhoneGap.addConstructor(
function()
{
    if (!navigator.accelerometer)
    {
        console.log("Installing accelerometer");
        navigator.accelerometer = new Accelerometer();
    }
});
}
/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010-2011, IBM Corporation
 * Copyright (c) 2011, Microsoft Corporation
 */

if (!PhoneGap.hasResource("camera")) {
PhoneGap.addResource("camera");

/**
 * This class provides access to the device camera.
 *
 * @constructor
 */
var Camera = function() {
    this.successCallback = null;
    this.errorCallback = null;
    this.options = null;
};

/**
 * Format of image that returned from getPicture.
 *
 * Example: navigator.camera.getPicture(success, fail,
 *              { quality: 80,
 *                destinationType: Camera.DestinationType.DATA_URL,
 *                sourceType: Camera.PictureSourceType.PHOTOLIBRARY})
 \code
 navigator.camera.getPicture(onSuccess, onFail, { quality: 50 });

function onSuccess(imageData) {
    var image = document.getElementById('myImage');
    image.src = "data:image/jpeg;base64," + imageData;
}

function onFail(message) {
    alert('Failed because: ' + message);
}
 \endcode
 */
Camera.DestinationType = {
    DATA_URL: 0,                // Return base64 encoded string
    FILE_URI: 1                 // Return file uri (content://media/external/images/media/2 for Android)
};
Camera.prototype.DestinationType = Camera.DestinationType;

/**
 * Encoding of image returned from getPicture.
 *
 * Example: navigator.camera.getPicture(success, fail,
 *              { quality: 80,
 *                destinationType: Camera.DestinationType.DATA_URL,
 *                sourceType: Camera.PictureSourceType.CAMERA,
 *                encodingType: Camera.EncodingType.PNG})
*/
Camera.EncodingType = {
    JPEG: 0,                    // Return JPEG encoded image
    PNG: 1                      // Return PNG encoded image
};
Camera.prototype.EncodingType = Camera.EncodingType;

/**
 * Source to getPicture from.
 *
 * Example: navigator.camera.getPicture(success, fail,
 *              { quality: 80,
 *                destinationType: Camera.DestinationType.DATA_URL,
 *                sourceType: Camera.PictureSourceType.PHOTOLIBRARY})
 */
Camera.PictureSourceType = {
    PHOTOLIBRARY : 0,           // Choose image from picture library (same as SAVEDPHOTOALBUM for Android)
    CAMERA : 1,                 // Take picture from camera
    SAVEDPHOTOALBUM : 2         // Choose image from picture library (same as PHOTOLIBRARY for Android)
};
Camera.prototype.PictureSourceType = Camera.PictureSourceType;

/**
 * Gets a picture from source defined by "options.sourceType", and returns the
 * image as defined by the "options.destinationType" option.

 * The defaults are sourceType=CAMERA and destinationType=DATA_URL.
 *
 * @param {Function} successCallback
 * @param {Function} errorCallback
 * @param {Object} options
 \code
 navigator.camera.getPicture(onSuccess, onFail, { quality: 50 });

function onSuccess(imageData) {
    var image = document.getElementById('myImage');
    image.src = "data:image/jpeg;base64," + imageData;
}

function onFail(message) {
    alert('Failed because: ' + message);
}
 \endcode
 */
Camera.prototype.getPicture = function(successCallback, errorCallback, options) {
    console.log("Camera.prototype.getPicture");
    // successCallback required
    if (typeof successCallback !== "function") {
        console.log("Camera Error: successCallback is not a function");
        return;
    }

    // errorCallback optional
    if (errorCallback && (typeof errorCallback !== "function")) {
        console.log("Camera Error: errorCallback is not a function");
        return;
    }

    this.options = options;

// TODO: This is duplicate - default values initialization exists in native C# code
//    var quality = 80;
//    if (options.quality) {
//        quality = this.options.quality;
//    }
//
//    var maxResolution = 0;
//    if (options.maxResolution) {
//        maxResolution = this.options.maxResolution;
//    }
//
//    var destinationType = Camera.DestinationType.DATA_URL;
//    if (this.options.destinationType) {
//        destinationType = this.options.destinationType;
//    }
//    var sourceType = Camera.PictureSourceType.CAMERA;
//    if (typeof this.options.sourceType === "number") {
//        sourceType = this.options.sourceType;
//    }
//    var encodingType = Camera.EncodingType.JPEG;
//    if (typeof options.encodingType == "number") {
//        encodingType = this.options.encodingType;
//    }
//
//    var targetWidth = -1;
//    if (typeof options.targetWidth == "number") {
//        targetWidth = options.targetWidth;
//    } else if (typeof options.targetWidth == "string") {
//        var width = new Number(options.targetWidth);
//        if (isNaN(width) === false) {
//            targetWidth = width.valueOf();
//        }
//    }

//    var targetHeight = -1;
//    if (typeof options.targetHeight == "number") {
//        targetHeight = options.targetHeight;
//    } else if (typeof options.targetHeight == "string") {
//        var height = new Number(options.targetHeight);
//        if (isNaN(height) === false) {
//            targetHeight = height.valueOf();
//        }
//    }

    PhoneGap.exec(successCallback, errorCallback, "Camera", "getPicture", this.options);
};

PhoneGap.addConstructor(function() {
    if (typeof navigator.camera === "undefined") {
        navigator.camera = new Camera();
    }
});
}
/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010-2011, IBM Corporation
 * Copyright (c) 2011, Microsoft Corporation
 */

if (!PhoneGap.hasResource("capture")) {
PhoneGap.addResource("capture");

/**
 * Represents a single file.
 *
 * name {DOMString} name of the file, without path information
 * fullPath {DOMString} the full path of the file, including the name
 * type {DOMString} mime type
 * lastModifiedDate {Date} last modified date
 * size {Number} size of the file in bytes
 */
var MediaFile = function(name, fullPath, type, lastModifiedDate, size){
    this.name = name || null;
    this.fullPath = fullPath || null;
    this.type = type || null;
    this.lastModifiedDate = lastModifiedDate || null;
    this.size = size || 0;
};

/**
 * Get file meta information
 *
 * @param {Function} successCB
 * @param {Function} errorCB
 */
MediaFile.prototype.getFormatData = function(successCallback, errorCallback){
    PhoneGap.exec(successCallback, errorCallback, "Capture", "getFormatData", {fullPath: this.fullPath, type: this.type});
};


/**
 * Open file in device media player
 *
 * @param {Function} successCB
 * @param {Function} errorCB
 */
MediaFile.prototype.play = function(successCallback, errorCallback){
    PhoneGap.exec(successCallback, errorCallback, "Capture", "play", this);
};


/**
 * MediaFileData encapsulates format information of a media file.
 *
 * @param {DOMString} codecs
 * @param {long} bitrate
 * @param {long} height
 * @param {long} width
 * @param {float} duration
 */
var MediaFileData = function(codecs, bitrate, height, width, duration){
    this.codecs = codecs || null;
    this.bitrate = bitrate || 0;
    this.height = height || 0;
    this.width = width || 0;
    this.duration = duration || 0;
};

/**
 * The CaptureError interface encapsulates all errors in the Capture API.
 */
var CaptureError = function(){
    this.code = null;
};

// Capture error codes
CaptureError.CAPTURE_INTERNAL_ERR = 0;
CaptureError.CAPTURE_APPLICATION_BUSY = 1;
CaptureError.CAPTURE_INVALID_ARGUMENT = 2;
CaptureError.CAPTURE_NO_MEDIA_FILES = 3;
CaptureError.CAPTURE_NOT_SUPPORTED = 20;

/**
 * The Capture interface exposes an interface to the camera and microphone of the hosting device.
 */
var Capture = function(){
    this.supportedAudioModes = [];
    this.supportedImageModes = [];
    this.supportedVideoModes = [];
};

/**
 * Launch audio recorder application for recording audio clip(s).
 *
 * @param {Function} successCB
 * @param {Function} errorCB
 * @param {CaptureAudioOptions} options
 \code
 // capture callback
var captureSuccess = function(mediaFiles) {
    var i, path, len;
    for (i = 0, len = mediaFiles.length; i < len; i += 1) {
        path = mediaFiles[i].fullPath;
        // do something interesting with the file
    }
};

// capture error callback
var captureError = function(error) {
    navigator.notification.alert('Error code: ' + error.code, null, 'Capture Error');
};

// start audio capture
navigator.device.capture.captureAudio(captureSuccess, captureError, {limit:2});
 \endcode
 */
Capture.prototype.captureAudio = function(successCallback, errorCallback, options){
    PhoneGap.exec(successCallback, errorCallback, "Capture", "captureAudio", options);
};

/**
 * Launch camera application for taking image(s).
 *
 * @param {Function} successCB
 * @param {Function} errorCB
 * @param {CaptureImageOptions} options
 \code
 // capture callback
var captureSuccess = function(mediaFiles) {
    var i, path, len;
    for (i = 0, len = mediaFiles.length; i < len; i += 1) {
        path = mediaFiles[i].fullPath;
        // do something interesting with the file
    }
};

// capture error callback
var captureError = function(error) {
    navigator.notification.alert('Error code: ' + error.code, null, 'Capture Error');
};

// start image capture
navigator.device.capture.captureImage(captureSuccess, captureError, {limit:2});
\endcode
 */
Capture.prototype.captureImage = function (successCallback, errorCallback, options) {
	PhoneGap.exec(	function(mediaFiles)
			{
				successCallback(Capture.prototype._castMediaFile(mediaFiles).message);
			},
			function(error)
			{
				errorCallback({code:CaptureError[error.code]});
			}, "Capture", "captureImage", options);
};

/**
 * Launch device camera application for recording video(s).
 *
 * @param {Function} successCB
 * @param {Function} errorCB
 * @param {CaptureVideoOptions} options
 \code
 // capture callback
var captureSuccess = function(mediaFiles) {
    var i, path, len;
    for (i = 0, len = mediaFiles.length; i < len; i += 1) {
        path = mediaFiles[i].fullPath;
        // do something interesting with the file
    }
};

// capture error callback
var captureError = function(error) {
    navigator.notification.alert('Error code: ' + error.code, null, 'Capture Error');
};

// start video capture
navigator.device.capture.captureVideo(captureSuccess, captureError, {limit:2});
 \endcode
 */
Capture.prototype.captureVideo = function(successCallback, errorCallback, options){
	PhoneGap.exec(	function(mediaFiles)
			{
				successCallback(Capture.prototype._castMediaFile(mediaFiles).message);
			},
			function(error)
			{
				errorCallback({code:CaptureError[error.code]});
			}, "Capture", "captureVideo", options);
};

/**
* This function returns and array of MediaFiles.  It is required as we need to convert raw
* JSON objects into MediaFile objects.
*/
Capture.prototype._castMediaFile = function(pluginResult){
    var mediaFiles = [];
    var i;
    for (i = 0; i < pluginResult.message.length; i++) {
        var mediaFile = new MediaFile();
        mediaFile.name = pluginResult.message[i].name;
        mediaFile.fullPath = pluginResult.message[i].fullPath;
        mediaFile.type = pluginResult.message[i].type;
        mediaFile.lastModifiedDate = pluginResult.message[i].lastModifiedDate;
        mediaFile.size = pluginResult.message[i].size;
        mediaFiles.push(mediaFile);
    }
    pluginResult.message = mediaFiles;
    return pluginResult;
};

/**
 * Encapsulates a set of parameters that the capture device supports.
 */
var ConfigurationData = function(){
    // The ASCII-encoded string in lower case representing the media type.
    this.type = null;
    // The height attribute represents height of the image or video in pixels.
    // In the case of a sound clip this attribute has value 0.
    this.height = 0;
    // The width attribute represents width of the image or video in pixels.
    // In the case of a sound clip this attribute has value 0
    this.width = 0;
};

/**
 * Encapsulates all image capture operation configuration options.
 */
var CaptureImageOptions = function(){
    // Upper limit of images user can take. Value must be equal or greater than 1.
    this.limit = 1;
    // The selected image mode. Must match with one of the elements in supportedImageModes array.
    this.mode = null;
};

/**
 * Encapsulates all video capture operation configuration options.
 */
var CaptureVideoOptions = function(){
    // Upper limit of videos user can record. Value must be equal or greater than 1.
    this.limit = 1;
    // Maximum duration of a single video clip in seconds.
    this.duration = 0;
    // The selected video mode. Must match with one of the elements in supportedVideoModes array.
    this.mode = null;
};

/**
 * Encapsulates all audio capture operation configuration options.
 */
var CaptureAudioOptions = function(){
    // Upper limit of sound clips user can record. Value must be equal or greater than 1.
    this.limit = 1;
    // Maximum duration of a single sound clip in seconds.
    this.duration = 0;
    // The selected audio mode. Must match with one of the elements in supportedAudioModes array.
    this.mode = null;
};

PhoneGap.addConstructor(function () {
    if (typeof navigator.device === "undefined") {
        navigator.device = window.device = new Device();
    }
    if (typeof navigator.device.capture === "undefined") {
        console.log("Installing capture");
        navigator.device.capture = window.device.capture = new Capture();
    }
});
}

/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010-2011, IBM Corporation
 * Copyright (c) 2011, Microsoft Corporation
 */

if (!PhoneGap.hasResource("compass")) {
PhoneGap.addResource("compass");

/**
 * This class provides access to device Compass data.
 * @constructor
 */
var Compass = function() {
    /**
     * The last known Compass position.
     */
    this.lastHeading = null;
    this.isCompassSupported = true; // default assumption
};

Compass.ERROR_MSG = ["Not running", "Starting", "", "Failed to start", "Not Supported"];

/**
 * Asynchronously aquires the current heading.
 *
 * @param {Function} successCallback The function to call when the heading data is available
 * @param {Function} errorCallback The function to call when there is an error getting the heading data. (OPTIONAL)
 * @param {PositionOptions} options The options for getting the heading data such as timeout. (OPTIONAL)
 \code
 function onSuccess(heading) {
    alert('Heading: ' + heading.magneticHeading);
};

function onError(error) {
    alert('CompassError: ' error.code);
};

navigator.compass.getCurrentHeading(onSuccess, onError);
\endcode
 */
Compass.prototype.getCurrentHeading = function(successCallback, errorCallback, options) {

    // successCallback required
    if (typeof successCallback !== "function") {
        console.log("Compass Error: successCallback is not a function");
        return;
    }

    // errorCallback optional
    if (errorCallback && (typeof errorCallback !== "function")) {
        console.log("Compass Error: errorCallback is not a function");
        //return;

        errorCallback = function(){};
    }

    if(this.isCompassSupported)
    {
        var self = this;
        var onSuccess = function(result)
        {
            var compassResult = JSON.parse(result);
            //console.log("compassResult = " + compassResult);
            self.lastHeading = compassResult;
            successCallback(self.lastHeading);
        }

        var onError = function(err)
        {
            if(err == 4)
            {
                self.isCompassSupported = false;
            }
            errorCallback(err);
        }

        // Get heading
        PhoneGap.exec(onSuccess, onError, "Compass", "getHeading", []);
    }
    else
    {
        var funk = function()
        {
            errorCallback(4);
        };
        window.setTimeout(funk,0);
    }
};

/**
 * Asynchronously aquires the heading repeatedly at a given interval.
 *
 * @param {Function} successCallback    The function to call each time the heading data is available
 * @param {Function} errorCallback      The function to call when there is an error getting the heading data. (OPTIONAL)
 * @param {HeadingOptions} options      The options for getting the heading data such as timeout and the frequency of the watch. (OPTIONAL)
 * @return String                       The watch id that must be passed to #clearWatch to stop watching.
 \code
 function onSuccess(heading) {
    var element = document.getElementById('heading');
    element.innerHTML = 'Heading: ' + heading.magneticHeading;
};

function onError(compassError) {
        alert('Compass error: ' + compassError.code);
};

var options = { frequency: 3000 };  // Update every 3 seconds

var watchID = navigator.compass.watchHeading(onSuccess, onError, options);
 \endcode
 */
Compass.prototype.watchHeading= function(successCallback, errorCallback, options) {

    // successCallback required
    if (typeof successCallback !== "function") {
        console.log("Compass Error: successCallback is not a function");
        return -1; // in case caller later calls clearWatch with this id
    }

    // errorCallback optional
    if (errorCallback && (typeof errorCallback !== "function")) {
        console.log("Compass Error: errorCallback is not a function");
        return -1; // in case caller later calls clearWatch with this id
    }

    var id;
    if(this.isCompassSupported)
	{
		id = PhoneGap.createUUID();
		var onSuccess = function(result)
        {
            var compassResult = JSON.parse(result);
            //console.log("compassResult = " + compassResult);
            self.lastHeading = compassResult;
            successCallback(self.lastHeading);
        }

        var onError = function(err)
        {
            if(err == 4)
            {
                self.isCompassSupported = false;
            }
            errorCallback(err);
        }
		PhoneGap.exec(onSuccess, onError, "Compass", "startWatch", {id: id});
    }
    else
    {
        var funk = function()
        {
            errorCallback(4);
        };
        window.setTimeout(funk,0);
        return -1;
    }
    return id;
};


/**
 * Clears the specified heading watch.
 *
 * @param {String} id       The ID of the watch returned from #watchHeading.
 \code
 var watchID = navigator.compass.watchHeading(onSuccess, onError, options);

// ... later on ...

navigator.compass.clearWatch(watchID);
 \endcode
 */
Compass.prototype.clearWatch = function(id) {

    PhoneGap.exec(null, null, "Compass", "stopWatch", {id: id});

};

PhoneGap.addConstructor(
function()
{
    if (!navigator.compass)
    {
        navigator.compass = new Compass();
    }
});
}
/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010-2011, IBM Corporation
 * Copyright (c) 2011, Microsoft Corporation
 */

if (!PhoneGap.hasResource("contact")) {
PhoneGap.addResource("contact");

/**
* Contains information about a single contact.
* @constructor
* @param {DOMString} id unique identifier
* @param {DOMString} displayName
* @param {ContactName} name
* @param {DOMString} nickname
* @param {Array.<ContactField>} phoneNumbers array of phone numbers
* @param {Array.<ContactField>} emails array of email addresses
* @param {Array.<ContactAddress>} addresses array of addresses
* @param {Array.<ContactField>} ims instant messaging user ids
* @param {Array.<ContactOrganization>} organizations
* @param {DOMString} birthday contact's birthday
* @param {DOMString} note user notes about contact
* @param {Array.<ContactField>} photos
* @param {Array.<ContactField>} categories
* @param {Array.<ContactField>} urls contact's web sites
*/
var Contact = function (id, displayName, name, nickname, phoneNumbers, emails, addresses,
    ims, organizations, birthday, note, photos, categories, urls) {
    this.id = id || null;
    this.rawId = null;
    this.displayName = displayName || null;
    this.name = name || null; // ContactName
    this.nickname = nickname || null;
    this.phoneNumbers = phoneNumbers || null; // ContactField[]
    this.emails = emails || null; // ContactField[]
    this.addresses = addresses || null; // ContactAddress[]
    this.ims = ims || null; // ContactField[]
    this.organizations = organizations || null; // ContactOrganization[]
    this.birthday = birthday || null;
    this.note = note || null;
    this.photos = photos || null; // ContactField[]
    this.categories = categories || null; // ContactField[]
    this.urls = urls || null; // ContactField[]
};

/**
 *  ContactError.
 *  An error code assigned by an implementation when an error has occurreds
 * @constructor
 */
var ContactError = function(errCode) {
    this.code=errCode;
};

/**
 * Error codes
 */
ContactError.UNKNOWN_ERROR = 0;
ContactError.INVALID_ARGUMENT_ERROR = 1;
ContactError.TIMEOUT_ERROR = 2;
ContactError.PENDING_OPERATION_ERROR = 3;
ContactError.IO_ERROR = 4;
ContactError.NOT_SUPPORTED_ERROR = 5;
ContactError.PERMISSION_DENIED_ERROR = 20;

/**
* Removes contact from device storage.
* @param successCB success callback
* @param errorCB error callback
*/
Contact.prototype.remove = function(successCB, errorCB)
{
    if (!this.id)
    {
        var errorObj = new ContactError(ContactError.UNKNOWN_ERROR);
        setTimeout(function(){
        errorCB(errorObj);
        },0);
        return ContactError.UNKNOWN_ERROR;
    }
    else
    {
        PhoneGap.exec(successCB, errorCB, "Contacts", "remove",this.id);
    }
};

/**
* Creates a deep copy of this Contact.
* With the contact ID set to null.
* @return copy of this Contact
*/
Contact.prototype.clone = function() {
    var clonedContact = PhoneGap.safeClone(this);
    var i;
    clonedContact.id = null;
    clonedContact.rawId = null;
    // Loop through and clear out any id's in phones, emails, etc.
    var myArrayProps = ["phoneNumbers","emails","addresses","ims","organizations","tags","photos","urls"];

    for(var n=0, pLen=myArrayProps.length;n < pLen; n++)
    {
        var arr = clonedContact[myArrayProps[n]];
        if (arr && arr.length)
        {
            for(var i=0,len=arr.length; i<len;i++)
            {
                arr[i].id = null;
            }
        }
    }
    return clonedContact;
};

/**
* Persists contact to device storage.
* @param successCB success callback
* @param errorCB error callback
*/
Contact.prototype.save = function(successCB, errorCB)
{
    var self = this;
    function onSuccess(res)
    {
        setTimeout(function()
        {
            successCB(self);
        },0);
    }
    PhoneGap.exec(onSuccess, errorCB, "Contacts", "save", this);
};

/**
* Contact name.
* @constructor
* @param formatted
* @param familyName
* @param givenName
* @param middle
* @param prefix
* @param suffix
*/
var ContactName = function(formatted, familyName, givenName, middle, prefix, suffix) {
    this.formatted = formatted || null;
    this.familyName = familyName || null;
    this.givenName = givenName || null;
    this.middleName = middle || null;
    this.honorificPrefix = prefix || null;
    this.honorificSuffix = suffix || null;
};

/**
* Generic contact field.
* @constructor
* @param {DOMString} id unique identifier, should only be set by native code
* @param type
* @param value
* @param pref
*/
var ContactField = function(type, value, pref) {
    this.id = null;
    this.type = type || null;
    this.value = value || null;
    this.pref = pref || null;
};

/**
* Contact address.
* @constructor
* @param {DOMString} id unique identifier, should only be set by native code
* @param formatted
* @param streetAddress
* @param locality
* @param region
* @param postalCode
* @param country
*/
var ContactAddress = function(pref, type, formatted, streetAddress, locality, region, postalCode, country) {
    this.id = null;
    this.pref = pref || null;
    this.type = type || null;
    this.formatted = formatted || null;
    this.streetAddress = streetAddress || null;
    this.locality = locality || null;
    this.region = region || null;
    this.postalCode = postalCode || null;
    this.country = country || null;
};

/**
* Contact organization.
* @constructor
* @param {DOMString} id unique identifier, should only be set by native code
* @param name
* @param dept
* @param title
* @param startDate
* @param endDate
* @param location
* @param desc
*/
var ContactOrganization = function(pref, type, name, dept, title) {
    this.id = null;
    this.pref = pref || null;
    this.type = type || null;
    this.name = name || null;
    this.department = dept || null;
    this.title = title || null;
};

/**
* Represents a group of Contacts.
* @constructor
*/
var Contacts = function() {
    this.inProgress = false;
    this.records = [];
};
/**
* Returns an array of Contacts matching the search criteria.
* @param fields that should be searched
* @param successCB success callback
* @param errorCB error callback
* @param {ContactFindOptions} options that can be applied to contact searching
* @return array of Contacts matching search criteria
\code
function onSuccess(contacts) {
    alert('Found ' + contacts.length + ' contacts.');
};

function onError(contactError) {
    alert('onError!');
};

// find all contacts with 'Bob' in any name field
var options = new ContactFindOptions();
options.filter="Bob";
var fields = ["displayName", "name"];
navigator.contacts.find(fields, onSuccess, onError, options);
\endcode
*/
Contacts.prototype.find = function(fields, successCB, errorCB, options) {
    if (successCB === null) {
        throw new TypeError("You must specify a success callback for the find command.");
    }
    if (fields === null || fields === "undefined" || fields.length === "undefined" || fields.length <= 0) {
        if (typeof errorCB === "function")
        {
            // escape this scope before we call the errorCB
            setTimeout(function() {
            errorCB({"code": ContactError.INVALID_ARGUMENT_ERROR});
            },0);
        }
        console.log("Contacts.find::ContactError::INVALID_ARGUMENT_ERROR");
    }
    else
    {
        var onSuccess = function(res)
        {
            setTimeout(function()
            {
                successCB(res);
            },0);
        }
        PhoneGap.exec(onSuccess, errorCB, "Contacts", "search", {"fields":fields,"options":options});
    }
};

/**
* This function creates a new contact, but it does not persist the contact
* to device storage. To persist the contact to device storage, invoke
* contact.save().
* @param properties an object who's properties will be examined to create a new Contact
* @returns new Contact object
\code
var myContact = navigator.contacts.create({"displayName": "Test User"});
\endcode
*/
Contacts.prototype.create = function(properties) {
    var i;
    var contact = new Contact();
    for (i in properties) {
        if (contact[i] !== 'undefined') {
            contact[i] = properties[i];
        }
    }
    return contact;
};

/**
* This function returns and array of contacts.  It is required as we need to convert raw
* JSON objects into concrete Contact objects.  Currently this method is called after
* navigator.contacts.find but before the find methods success call back.
*
* @param jsonArray an array of JSON Objects that need to be converted to Contact objects.
* @returns an array of Contact objects
*/
Contacts.prototype.cast = function(pluginResult) {
    var contacts = [];
    var i;
    for (i=0; i<pluginResult.message.length; i++) {
        contacts.push(navigator.contacts.create(pluginResult.message[i]));
    }
    pluginResult.message = contacts;
    return pluginResult;
};

/**
 * ContactFindOptions.
 * @constructor
 * @param filter used to match contacts against
 * @param multiple boolean used to determine if more than one contact should be returned
 */
var ContactFindOptions = function(filter, multiple) {
    this.filter = filter || '';
    this.multiple = multiple || false;
};

/*
 * Add the contact interface into the browser.
 */
PhoneGap.addConstructor(function() {
    if(typeof navigator.contacts === "undefined") {
        navigator.contacts = new Contacts();
    }
});
}
/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010-2011, IBM Corporation
 * Copyright (c) 2011, Microsoft Corporation
 */

if (!PhoneGap.hasResource("device")) {
PhoneGap.addResource("device");

/**
 * This represents the mobile device, and provides properties for inspecting the model, version, UUID of the
 * phone, etc.
 * @constructor
 */
var Device = function() {
    this.available = PhoneGap.available;
    this.platform = null;
    this.version = null;
    this.name = null;
    this.uuid = null;
    this.phonegap = null;

    var me = this;
    this.getInfo(
        function (res) {
            // MOSYNC: We send in device info as an object,
            // it is already parsed.
            //var info = JSON.parse(res); // Line kept for reference.
            var info = res;
            console.log("GotDeviceInfo: " + info.version);
            me.available = true;
            me.platform = info.platform;
            me.version = info.version;
            me.name = info.name;
            me.uuid = info.uuid;
            me.phonegap = info.phonegap;

            PhoneGap.onPhoneGapInfoReady.fire();
        },
        function(e) {
            me.available = false;
            console.log("Error initializing PhoneGap: " + e);
        });
};

/**
 * Get device info
 *
 * @param {Function} successCallback The function to call when the heading data is available
 * @param {Function} errorCallback The function to call when there is an error getting the heading data. (OPTIONAL)
 */
Device.prototype.getInfo = function(successCallback, errorCallback) {

    // successCallback required
    if (typeof successCallback !== "function") {
        console.log("Device Error: successCallback is not a function");
        return;
    }

    // errorCallback optional
    if (errorCallback && (typeof errorCallback !== "function")) {
        console.log("Device Error: errorCallback is not a function");
        return;
    }

    // Get info
    PhoneGap.exec(successCallback, errorCallback, "Device", "Get");
};

PhoneGap.addConstructor(function() {
    if (typeof navigator.device === "undefined") {
        navigator.device = window.device = new Device();
    }
});
}

// this is a WP7 Only implementation of the Storage API for use in webpages loaded from the local file system
// inside phonegap application.
// there is a native implementation which is backing this and providing the persistance of values.
// webpages loaded from a domain will not need to use this as IE9 has support for WebStorage
// Javascript Interface is as defined here : http://dev.w3.org/html5/webstorage/#storage-0
//

//TODO: Replace it with another platform for MoSync
if(!window.localStorage)
{(function()
{
    "use strict";

    var DOMStorage = function(type)
    {
        // default type is local
        if(type == "sessionStorage")
        {
            this._type = type;
        }
        Object.defineProperty( this, "length",
        {
            configurable: true,
            get: function(){ return this.getLength() }
        });

    };

    DOMStorage.prototype =
    {
        _type:"localStorage",
        _result:null,
        keys:null,

        onResult:function(key,valueStr)
        {
            if(!this.keys)
            {
                this.keys = [];
            }
            this._result = valueStr;
        },

        onKeysChanged:function(jsonKeys)
        {
            this.keys = JSON.parse(jsonKeys);

            var key;
            for(var n = 0,len =this.keys.length; n < len; n++)
            {
                key = this.keys[n];
                if(!this.hasOwnProperty(key))
                {
                    console.log("didn't have a prop, now we do ...");
                    Object.defineProperty( this, key,
                    {

                        configurable: true,
                        get: function(){ return this.getItem(key); },
                        set: function(val){ return this.setItem(key,val); }
                    });
                }
            }

        },

        initialize:function()
        {
            window.external.Notify("DOMStorage/" + this._type + "/load/keys");
        },

    /*
        The length attribute must return the number of key/value pairs currently present in the list associated with the object.
    */
        getLength:function()
        {
            if(!this.keys)
            {
                this.initialize();
            }
            return this.keys.length;
        },

    /*
        The key(n) method must return the name of the nth key in the list.
        The order of keys is user-agent defined, but must be consistent within an object so long as the number of keys doesn't change.
        (Thus, adding or removing a key may change the order of the keys, but merely changing the value of an existing key must not.)
        If n is greater than or equal to the number of key/value pairs in the object, then this method must return null.
    */
        key:function(n)
        {
            if(!this.keys)
            {
                this.initialize();
            }

            if(n >= this.keys.length)
            {
                return null;
            }
            else
            {
                return this.keys[n];
            }
        },

    /*
        The getItem(key) method must return the current value associated with the given key.
        If the given key does not exist in the list associated with the object then this method must return null.
    */
        getItem:function(key)
        {
            if(!this.keys)
            {
                this.initialize();
            }

            var retVal = null;
            if(this.keys.indexOf(key) > -1)
            {
                window.external.Notify("DOMStorage/" + this._type + "/get/" + key);
                retVal = this._result;
                this._result = null;
            }
            return retVal;
        },
    /*
        The setItem(key, value) method must first check if a key/value pair with the given key already exists
        in the list associated with the object.
        If it does not, then a new key/value pair must be added to the list, with the given key and with its value set to value.
        If the given key does exist in the list, then it must have its value updated to value.
        If it couldn't set the new value, the method must raise an QUOTA_EXCEEDED_ERR exception.
        (Setting could fail if, e.g., the user has disabled storage for the site, or if the quota has been exceeded.)
    */
        setItem:function(key,value)
        {
            if(!this.keys)
            {
                this.initialize();
            }
            window.external.Notify("DOMStorage/" + this._type + "/set/" + key + "/" + value);
        },

    /*
        The removeItem(key) method must cause the key/value pair with the given key to be removed from the list
        associated with the object, if it exists.
        If no item with that key exists, the method must do nothing.
    */
        removeItem:function(key)
        {
            if(!this.keys)
            {
                this.initialize();
            }
            var index = this.keys.indexOf(key);
            if(index > -1)
            {
                this.keys.splice(index,1);
                // TODO: need sanity check for keys ? like 'clear','setItem', ...
                window.external.Notify("DOMStorage/" + this._type + "/remove/" + key);
                delete this[key];
            }

        },

    /*
        The clear() method must atomically cause the list associated with the object to be emptied of all
        key/value pairs, if there are any.
        If there are none, then the method must do nothing.
    */
        clear:function()
        {
            if(!this.keys)
            {
                this.initialize();
            }

            for(var n=0,len=this.keys.length; n < len;n++)
            {
                // TODO: do we need a sanity check for keys ? like 'clear','setItem', ...
                delete this[this.keys[n]];
            }
            this.keys = [];
          //  window.external.Notify("DOMStorage/" + this._type + "/clear/");
        }
    };
})();};

/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010-2011, IBM Corporation
 * Copyright (c) 2011, Microsoft Corporation
 */

if (!PhoneGap.hasResource("file")) {
PhoneGap.addResource("file");

/**
 * Represents a single file.
 *
 * @constructor
 * @param name {DOMString} name of the file, without path information
 * @param fullPath {DOMString} the full path of the file, including the name
 * @param type {DOMString} mime type
 * @param lastModifiedDate {Date} last modified date
 * @param size {Number} size of the file in bytes
 */
var File = function(name, fullPath, type, lastModifiedDate, size) {
    this.name = name || null;
    this.fullPath = fullPath || null;
    this.type = type || null;
    this.lastModifiedDate = lastModifiedDate || null;
    this.size = size || 0;
};

/** @constructor */
var FileError = function() {
   this.code = null;
};

// File error codes
// Found in DOMException
FileError.NOT_FOUND_ERR = 1;
FileError.SECURITY_ERR = 2;
FileError.ABORT_ERR = 3;

// Added by this specification
FileError.NOT_READABLE_ERR = 4;
FileError.ENCODING_ERR = 5;
FileError.NO_MODIFICATION_ALLOWED_ERR = 6;
FileError.INVALID_STATE_ERR = 7;
FileError.SYNTAX_ERR = 8;
FileError.INVALID_MODIFICATION_ERR = 9;
FileError.QUOTA_EXCEEDED_ERR = 10;
FileError.TYPE_MISMATCH_ERR = 11;
FileError.PATH_EXISTS_ERR = 12;

//-----------------------------------------------------------------------------
// File manager
//-----------------------------------------------------------------------------

/**
 * @constructor
 */
var FileMgr = function() {
};

FileMgr.prototype.getFileBasePaths = function() {
};

FileMgr.prototype.testFileExists = function(fileName, successCallback, errorCallback) {
    return PhoneGap.exec(successCallback, errorCallback, "File", "testFileExists", {fileName: fileName});
};

FileMgr.prototype.testDirectoryExists = function(dirName, successCallback, errorCallback) {
    return PhoneGap.exec(successCallback, errorCallback, "File", "testDirectoryExists", {dirName: dirName});
};

FileMgr.prototype.getFreeDiskSpace = function(successCallback, errorCallback) {
    return PhoneGap.exec(successCallback, errorCallback, "File", "getFreeDiskSpace");
};

FileMgr.prototype.write = function(fileName, data, position, successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "write", {fileName: fileName, data: data, position: position});
};

FileMgr.prototype.truncate = function(fileName, size, successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "truncate", {fileName: fileName, size: size});
};

FileMgr.prototype.readAsText = function(fileName, encoding, successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "readAsText", {fileName: fileName, encoding: encoding});
};

FileMgr.prototype.readAsDataURL = function(fileName, successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "readAsDataURL", {fileName: fileName});
};

PhoneGap.addConstructor(function() {
    if (typeof navigator.fileMgr === "undefined") {
        navigator.fileMgr = new FileMgr();
    }
});

//-----------------------------------------------------------------------------
// File Reader
//-----------------------------------------------------------------------------
// TODO: All other FileMgr function operate on the SD card as root.  However,
//       for FileReader & FileWriter the root is not SD card.  Should this be changed?

/**
 * This class reads the mobile device file system.
 *
 * For Android:
 *      The root directory is the root of the file system.
 *      To read from the SD card, the file name is "sdcard/my_file.txt"
 * @constructor
 */
var FileReader = function() {
    this.fileName = "";

    this.readyState = 0;

    // File data
    this.result = null;

    // Error
    this.error = null;

    // Event handlers
    this.onloadstart = null;    // When the read starts.
    this.onprogress = null;     // While reading (and decoding) file or fileBlob data, and reporting partial file data (progess.loaded/progress.total)
    this.onload = null;         // When the read has successfully completed.
    this.onerror = null;        // When the read has failed (see errors).
    this.onloadend = null;      // When the request has completed (either in success or failure).
    this.onabort = null;        // When the read has been aborted. For instance, by invoking the abort() method.
};

// States
FileReader.EMPTY = 0;
FileReader.LOADING = 1;
FileReader.DONE = 2;

/**
 * Abort reading file.
 */
FileReader.prototype.abort = function() {
    var evt;
    this.readyState = FileReader.DONE;
    this.result = null;

    // set error
    var error = new FileError();
    error.code = error.ABORT_ERR;
    this.error = error;

    // If error callback
    if (typeof this.onerror === "function") {
        this.onerror({"type":"error", "target":this});
    }
    // If abort callback
    if (typeof this.onabort === "function") {
        this.onabort({"type":"abort", "target":this});
    }
    // If load end callback
    if (typeof this.onloadend === "function") {
        this.onloadend({"type":"loadend", "target":this});
    }
};

/**
 * Read text file.
 *
 * @param file          {File} File object containing file properties
 * @param encoding      [Optional] (see http://www.iana.org/assignments/character-sets)
 */
FileReader.prototype.readAsText = function(file, encoding) {
    this.fileName = "";
    if (typeof file.fullPath === "undefined") {
        this.fileName = file;
    } else {
        this.fileName = file.fullPath;
    }

    // LOADING state
    this.readyState = FileReader.LOADING;

    // If loadstart callback
    if (typeof this.onloadstart === "function") {
        this.onloadstart({"type":"loadstart", "target":this});
    }

    // Default encoding is UTF-8
    var enc = encoding ? encoding : "UTF-8";

    var me = this;

    // Read file
    navigator.fileMgr.readAsText(this.fileName, enc,

        // Success callback
        function(r) {
            var evt;

            // If DONE (cancelled), then don't do anything
            if (me.readyState === FileReader.DONE) {
                return;
            }

            // Save result
            me.result = r;

            // If onload callback
            if (typeof me.onload === "function") {
                me.onload({"type":"load", "target":me});
            }

            // DONE state
            me.readyState = FileReader.DONE;

            // If onloadend callback
            if (typeof me.onloadend === "function") {
                me.onloadend({"type":"loadend", "target":me});
            }
        },

        // Error callback
        function(e) {
            var evt;
            // If DONE (cancelled), then don't do anything
            if (me.readyState === FileReader.DONE) {
                return;
            }

            // Save error
            me.error = e;

            // If onerror callback
            if (typeof me.onerror === "function") {
                me.onerror({"type":"error", "target":me});
            }

            // DONE state
            me.readyState = FileReader.DONE;

            // If onloadend callback
            if (typeof me.onloadend === "function") {
                me.onloadend({"type":"loadend", "target":me});
            }
        }
        );
};


/**
 * Read file and return data as a base64 encoded data url.
 * A data url is of the form:
 *      data:[<mediatype>][;base64],<data>
 *
 * @param file          {File} File object containing file properties
 */
FileReader.prototype.readAsDataURL = function(file) {
    this.fileName = "";
    if (typeof file.fullPath === "undefined") {
        this.fileName = file;
    } else {
        this.fileName = file.fullPath;
    }

    // LOADING state
    this.readyState = FileReader.LOADING;

    // If loadstart callback
    if (typeof this.onloadstart === "function") {
        this.onloadstart({"type":"loadstart", "target":this});
    }

    var me = this;

    // Read file
    navigator.fileMgr.readAsDataURL(this.fileName,

        // Success callback
        function(r) {
            var evt;

            // If DONE (cancelled), then don't do anything
            if (me.readyState === FileReader.DONE) {
                return;
            }

            // Save result
            me.result = r;

            // If onload callback
            if (typeof me.onload === "function") {
                me.onload({"type":"load", "target":me});
            }

            // DONE state
            me.readyState = FileReader.DONE;

            // If onloadend callback
            if (typeof me.onloadend === "function") {
                me.onloadend({"type":"loadend", "target":me});
            }
        },

        // Error callback
        function(e) {
            var evt;
            // If DONE (cancelled), then don't do anything
            if (me.readyState === FileReader.DONE) {
                return;
            }

            // Save error
            me.error = e;

            // If onerror callback
            if (typeof me.onerror === "function") {
                me.onerror({"type":"error", "target":me});
            }

            // DONE state
            me.readyState = FileReader.DONE;

            // If onloadend callback
            if (typeof me.onloadend === "function") {
                me.onloadend({"type":"loadend", "target":me});
            }
        }
        );
};

/**
 * Read file and return data as a binary data.
 *
 * @param file          {File} File object containing file properties
 */
FileReader.prototype.readAsBinaryString = function(file) {
    // TODO - Can't return binary data to browser.
    this.fileName = file;
};

/**
 * Read file and return data as a binary data.
 *
 * @param file          {File} File object containing file properties
 */
FileReader.prototype.readAsArrayBuffer = function(file) {
    // TODO - Can't return binary data to browser.
    this.fileName = file;
};

//-----------------------------------------------------------------------------
// File Writer
//-----------------------------------------------------------------------------

/**
 * This class writes to the mobile device file system.
 *
 * For Android:
 *      The root directory is the root of the file system.
 *      To write to the SD card, the file name is "sdcard/my_file.txt"
 *
 * @constructor
 * @param file {File} File object containing file properties
 * @param append if true write to the end of the file, otherwise overwrite the file
 */
var FileWriter = function (file) {
    this.fileName = "";
    this.length = 0;
    if (file) {
        this.fileName = file.fullPath || file;
        this.length = file.size || 0;
    }
    // default is to write at the beginning of the file
    this.position = 0;

    this.readyState = 0; // EMPTY

    this.result = null;

    // Error
    this.error = null;

    // Event handlers
    this.onwritestart = null; // When writing starts
    this.onprogress = null;     // While writing the file, and reporting partial file data
    this.onwrite = null;     // When the write has successfully completed.
    this.onwriteend = null;     // When the request has completed (either in success or failure).
    this.onabort = null;     // When the write has been aborted. For instance, by invoking the abort() method.
    this.onerror = null;     // When the write has failed (see errors).
};

// States
FileWriter.INIT = 0;
FileWriter.WRITING = 1;
FileWriter.DONE = 2;

/**
 * Abort writing file.
 */
FileWriter.prototype.abort = function() {
    // check for invalid state
    if (this.readyState === FileWriter.DONE || this.readyState === FileWriter.INIT) {
        throw FileError.INVALID_STATE_ERR;
    }

    // set error
    var error = new FileError(), evt;
    error.code = error.ABORT_ERR;
    this.error = error;

    // If error callback
    if (typeof this.onerror === "function") {
        this.onerror({"type":"error", "target":this});
    }
    // If abort callback
    if (typeof this.onabort === "function") {
        this.onabort({"type":"abort", "target":this});
    }

    this.readyState = FileWriter.DONE;

    // If write end callback
    if (typeof this.onwriteend == "function") {
        this.onwriteend({"type":"writeend", "target":this});
    }
};

/**
 * Writes data to the file
 *
 * @param text to be written
 */
FileWriter.prototype.write = function (text) {
    // Throw an exception if we are already writing a file
    if (this.readyState === FileWriter.WRITING) {
        throw FileError.INVALID_STATE_ERR;
    }

    // WRITING state
    this.readyState = FileWriter.WRITING;

    var me = this;

    // If onwritestart callback
    if (typeof me.onwritestart === "function") {
        me.onwritestart({ "type": "writestart", "target": me });
    }

    // Write file
    navigator.fileMgr.write(this.fileName, text, this.position,

    // Success callback
        function (r) {
            var evt;
            // If DONE (cancelled), then don't do anything
            if (me.readyState === FileWriter.DONE) {
                return;
            }

            // position always increases by bytes written because file would be extended
            me.position += r;
            // The length of the file is now where we are done writing.
            me.length = me.position;

            // If onwrite callback
            if (typeof me.onwrite === "function") {
                me.onwrite({ "type": "write", "target": me });
            }

            // DONE state
            me.readyState = FileWriter.DONE;

            // If onwriteend callback
            if (typeof me.onwriteend === "function") {
                me.onwriteend({ "type": "writeend", "target": me });
            }
        },

    // Error callback
        function (e) {
            var evt;

            // If DONE (cancelled), then don't do anything
            if (me.readyState === FileWriter.DONE) {
                return;
            }

            // Save error
            me.error = e;

            // If onerror callback
            if (typeof me.onerror === "function") {
                me.onerror({ "type": "error", "target": me });
            }

            // DONE state
            me.readyState = FileWriter.DONE;

            // If onwriteend callback
            if (typeof me.onwriteend === "function") {
                me.onwriteend({ "type": "writeend", "target": me });
            }
        }
        );

};

/**
 * Moves the file pointer to the location specified.
 *
 * If the offset is a negative number the position of the file
 * pointer is rewound.  If the offset is greater than the file
 * size the position is set to the end of the file.
 *
 * @param offset is the location to move the file pointer to.
 */
FileWriter.prototype.seek = function(offset) {
    // Throw an exception if we are already writing a file
    if (this.readyState === FileWriter.WRITING) {
        throw FileError.INVALID_STATE_ERR;
    }
    //console.log("================== seek - offset: " + offset);
    //console.log("================== seek - this.length: " + this.length);
    if (!offset) {
        return;
    }

    // See back from end of file.
    if (offset < 0) {
        this.position = Math.max(offset + this.length, 0);
    }
    // Offset is bigger then file size so set position
    // to the end of the file.
    else if (offset > this.length) {
        this.position = this.length;
    }
    // Offset is between 0 and file size so set the position
    // to start writing.
    else {
        this.position = offset;
    }
};

/**
 * Truncates the file to the size specified.
 *
 * @param size to chop the file at.
 */
FileWriter.prototype.truncate = function(size) {
    // Throw an exception if we are already writing a file
    if (this.readyState === FileWriter.WRITING) {
        throw FileError.INVALID_STATE_ERR;
    }

    // WRITING state
    this.readyState = FileWriter.WRITING;

    var me = this;

    // If onwritestart callback
    if (typeof me.onwritestart === "function") {
        me.onwritestart({"type":"writestart", "target":this});
    }

    // Write file
    navigator.fileMgr.truncate(this.fileName, size,

        // Success callback
        function(r) {
            var evt;
            // If DONE (cancelled), then don't do anything
            if (me.readyState === FileWriter.DONE) {
                return;
            }

            // Update the length of the file
            me.length = r;
            me.position = Math.min(me.position, r);

            // If onwrite callback
            if (typeof me.onwrite === "function") {
                me.onwrite({"type":"write", "target":me});
            }

            // DONE state
            me.readyState = FileWriter.DONE;

            // If onwriteend callback
            if (typeof me.onwriteend === "function") {
                me.onwriteend({"type":"writeend", "target":me});
            }
        },

        // Error callback
        function(e) {
            var evt;
            // If DONE (cancelled), then don't do anything
            if (me.readyState === FileWriter.DONE) {
                return;
            }

            // Save error
            me.error = e;

            // If onerror callback
            if (typeof me.onerror === "function") {
                me.onerror({"type":"error", "target":me});
            }

            // DONE state
            me.readyState = FileWriter.DONE;

            // If onwriteend callback
            if (typeof me.onwriteend === "function") {
                me.onwriteend({"type":"writeend", "target":me});
            }
        }
    );
};

/**
 * Information about the state of the file or directory
 *
 * @constructor
 * {Date} modificationTime (readonly)
 */
var Metadata = function() {
    this.modificationTime=null;
};

/**
 * Supplies arguments to methods that lookup or create files and directories
 *
 * @constructor
 * @param {boolean} create file or directory if it doesn't exist
 * @param {boolean} exclusive if true the command will fail if the file or directory exists
 */
var Flags = function(create, exclusive) {
    this.create = create || false;
    this.exclusive = exclusive || false;
};

/**
 * An interface representing a file system
 *
 * @constructor
 * {DOMString} name the unique name of the file system (readonly)
 * {DirectoryEntry} root directory of the file system (readonly)
 */
var FileSystem = function() {
    this.name = null;
    this.root = null;
};

/**
 * An interface that lists the files and directories in a directory.
 * @constructor
 */
var DirectoryReader = function(fullPath){
    this.fullPath = fullPath || null;
};

/**
 * Returns a list of entries from a directory.
 *
 * @param {Function} successCallback is called with a list of entries
 * @param {Function} errorCallback is called with a FileError
 \code
 function success(entries) {
    var i;
    for (i=0; i<entries.length; i++) {
        console.log(entries[i].name);
    }
}

function fail(error) {
    alert("Failed to list directory contents: " + error.code);
}

// Get a directory reader
var directoryReader = dirEntry.createReader();

// Get a list of all the entries in the directory
directoryReader.readEntries(success,fail);
 \endcode
 */
DirectoryReader.prototype.readEntries = function(successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "readEntries", {fullPath: this.fullPath});
};

/**
 * An interface representing a directory on the file system.
 *
 * @constructor
 * {boolean} isFile always false (readonly)
 * {boolean} isDirectory always true (readonly)
 * {DOMString} name of the directory, excluding the path leading to it (readonly)
 * {DOMString} fullPath the absolute full path to the directory (readonly)
 * {FileSystem} filesystem on which the directory resides (readonly)
 */
var DirectoryEntry = function() {
    this.isFile = false;
    this.isDirectory = true;
    this.name = null;
    this.fullPath = null;
    this.filesystem = null;
};

/**
 * Copies a directory to a new location
 *
 * @param {DirectoryEntry} parent the directory to which to copy the entry
 * @param {DOMString} newName the new name of the entry, defaults to the current name
 * @param {Function} successCallback is called with the new entry
 * @param {Function} errorCallback is called with a FileError
 \code
 function win(entry) {
    console.log("New Path: " + entry.fullPath);
}

function fail(error) {
    alert(error.code);
}

function copyDir(entry) {
    var parent = document.getElementById('parent').value,
        newName = document.getElementById('newName').value,
        parentEntry = new DirectoryEntry({fullPath: parent});

    // copy the directory to a new directory and rename it
    entry.copyTo(parentEntry, newName, success, fail);
}
 \endcode
 */
DirectoryEntry.prototype.copyTo = function(parent, newName, successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "copyTo", {fullPath: this.fullPath, parent:parent, newName: newName});
};

/**
 * Looks up the metadata of the entry
 *
 * @param {Function} successCallback is called with a Metadata object
 * @param {Function} errorCallback is called with a FileError
 \code
 function success(metadata) {
    console.log("Last Modified: " + metadata.modificationTime);
}

function fail(error) {
    alert(error.code);
}

// Request the metadata object for this entry
entry.getMetadata(success, fail);
\endcode
 */
DirectoryEntry.prototype.getMetadata = function(successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "getMetadata", {fullPath: this.fullPath});
};

/**
 * Gets the parent of the entry
 *
 * @param {Function} successCallback is called with a parent entry
 * @param {Function} errorCallback is called with a FileError
 \code
 function success(parent) {
    console.log("Parent Name: " + parent.name);
}

function fail(error) {
    alert('Failed to get parent directory: ' + error.code);
}

// Get the parent DirectoryEntry
entry.getParent(success, fail);
\endcode
 */
DirectoryEntry.prototype.getParent = function(successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "getParent", {fullPath: this.fullPath});
};

/**
 * Moves a directory to a new location
 *
 * @param {DirectoryEntry} parent the directory to which to move the entry
 * @param {DOMString} newName the new name of the entry, defaults to the current name
 * @param {Function} successCallback is called with the new entry
 * @param {Function} errorCallback is called with a FileError
 \code
 function success(entry) {
    console.log("New Path: " + entry.fullPath);
}

function fail(error) {
    alert(error.code);
}

function moveDir(entry) {
    var parent = document.getElementById('parent').value,
        newName = document.getElementById('newName').value,
        parentEntry = new DirectoryEntry({fullPath: parent});

    // move the directory to a new directory and rename it
    entry.moveTo(parentEntry, newName, success, fail);
}
 \endcode
 */
DirectoryEntry.prototype.moveTo = function(parent, newName, successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "moveTo", {fullPath: this.fullPath, parent: parent, newName: newName});
};

/**
 * Removes the entry
 *
 * @param {Function} successCallback is called with no parameters
 * @param {Function} errorCallback is called with a FileError
 \code
 function success(entry) {
    console.log("Removal succeeded");
}

function fail(error) {
    alert('Error removing directory: ' + error.code);
}

// remove this directory
entry.remove(success, fail);
\endcode
 */
DirectoryEntry.prototype.remove = function(successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "remove", {fullPath: this.fullPath});
};

/**
 * Returns a URI that can be used to identify this entry.
 *
 * @param {DOMString} mimeType for a FileEntry, the mime type to be used to interpret the file, when loaded through this URI.
 * @return uri
 \code
 // Get the URI for this directory
var uri = entry.toURI();
console.log(uri);
\endcode
 */
DirectoryEntry.prototype.toURI = function(mimeType) {

    return encodeURI("file://" + this.fullPath);
};

/**
 * Creates a new DirectoryReader to read entries from this directory
 \code
 // create a directory reader
var directoryReader = entry.createReader();
 \endcode
 */
DirectoryEntry.prototype.createReader = function(successCallback, errorCallback) {
    return new DirectoryReader(this.fullPath);
};

/**
 * Creates or looks up a directory
 *
 * @param {DOMString} path either a relative or absolute path from this directory in which to look up or create a directory
 * @param {Flags} options to create or excluively create the directory
 * @param {Function} successCallback is called with the new entry
 * @param {Function} errorCallback is called with a FileError
 \code
 function success(parent) {
    console.log("Parent Name: " + parent.name);
}

function fail(error) {
    alert("Unable to create new directory: " + error.code);
}

// Retrieve an existing directory, or create it if it does not already exist
entry.getDirectory("newDir", {create: true, exclusive: false}, success, fail);
\endcode
 */
DirectoryEntry.prototype.getDirectory = function (path, options, successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "getDirectory", { fullPath: this.fullPath, path: path, options: options });
};

/**
 * Creates or looks up a file
 *
 * @param {DOMString} path either a relative or absolute path from this directory in which to look up or create a file
 * @param {Flags} options to create or excluively create the file
 * @param {Function} successCallback is called with the new entry
 * @param {Function} errorCallback is called with a FileError
 \code
function success(parent) {
    console.log("Parent Name: " + parent.name);
}

function fail(error) {
    alert("Failed to retrieve file: " + error.code);
}

// Retrieve an existing file, or create it if it does not exist
entry.getFile("newFile.txt", {create: true, exclusive: false}, success, fail);
\endcode
 */
DirectoryEntry.prototype.getFile = function (path, options, successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "getFile", { fullPath: this.fullPath, path: path, options: options });
};

/**
 * Deletes a directory and all of it's contents
 *
 * @param {Function} successCallback is called with no parameters
 * @param {Function} errorCallback is called with a FileError
 \code
 function success(parent) {
    console.log("Remove Recursively Succeeded");
}

function fail(error) {
    alert("Failed to remove directory or it's contents: " + error.code);
}

// remove the directory and all it's contents
entry.removeRecursively(success, fail);
 \endcode
 */
DirectoryEntry.prototype.removeRecursively = function(successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "removeRecursively", {fullPath: this.fullPath});
};

/**
 * An interface representing a directory on the file system.
 *
 * @constructor
 * {boolean} isFile always true (readonly)
 * {boolean} isDirectory always false (readonly)
 * {DOMString} name of the file, excluding the path leading to it (readonly)
 * {DOMString} fullPath the absolute full path to the file (readonly)
 * {FileSystem} filesystem on which the directory resides (readonly)
 */
var FileEntry = function() {
    this.isFile = true;
    this.isDirectory = false;
    this.name = null;
    this.fullPath = null;
    this.filesystem = null;
};

/**
 * Copies a file to a new location
 *
 * @param {DirectoryEntry} parent the directory to which to copy the entry
 * @param {DOMString} newName the new name of the entry, defaults to the current name
 * @param {Function} successCallback is called with the new entry
 * @param {Function} errorCallback is called with a FileError
 */
FileEntry.prototype.copyTo = function(parent, newName, successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "copyTo", {fullPath: this.fullPath, parent: parent, newName: newName});
};

/**
 * Looks up the metadata of the entry
 *
 * @param {Function} successCallback is called with a Metadata object
 * @param {Function} errorCallback is called with a FileError
 */
FileEntry.prototype.getMetadata = function(successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "getMetadata", {fullPath: this.fullPath});
};

/**
 * Gets the parent of the entry
 *
 * @param {Function} successCallback is called with a parent entry
 * @param {Function} errorCallback is called with a FileError
 */
FileEntry.prototype.getParent = function(successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "getParent", {fullPath: this.fullPath});
};

/**
 * Moves a directory to a new location
 *
 * @param {DirectoryEntry} parent the directory to which to move the entry
 * @param {DOMString} newName the new name of the entry, defaults to the current name
 * @param {Function} successCallback is called with the new entry
 * @param {Function} errorCallback is called with a FileError
 */
FileEntry.prototype.moveTo = function(parent, newName, successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "moveTo", {fullPath: this.fullPath, parent: parent, newName: newName});
};

/**
 * Removes the entry
 *
 * @param {Function} successCallback is called with no parameters
 * @param {Function} errorCallback is called with a FileError
 */
FileEntry.prototype.remove = function(successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "remove", {fullPath: this.fullPath});
};

/**
 * Returns a URI that can be used to identify this entry.
 *
 * @param {DOMString} mimeType for a FileEntry, the mime type to be used to interpret the file, when loaded through this URI.
 * @return uri
 */
FileEntry.prototype.toURI = function(mimeType) {
    return encodeURI("file://" + this.fullPath);
};

/**
 * Creates a new FileWriter associated with the file that this FileEntry represents.
 *
 * @param {Function} successCallback is called with the new FileWriter
 * @param {Function} errorCallback is called with a FileError
 */
FileEntry.prototype.createWriter = function (successCallback, errorCallback) {
    this.file(function (filePointer) {
        var writer = new FileWriter(filePointer);

        if (writer.fileName === null || writer.fileName === "") {
            if (typeof errorCallback == "function") {
                errorCallback({
                    "code": FileError.INVALID_STATE_ERR
                });
            }
        }

        if (typeof successCallback == "function") {
            successCallback(writer);
        }
    }, errorCallback);
};

/**
 * Returns a File that represents the current state of the file that this FileEntry represents.
 *
 * @param {Function} successCallback is called with the new File object
 * @param {Function} errorCallback is called with a FileError
 */
FileEntry.prototype.file = function(successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "getFileMetadata", {fullPath: this.fullPath});
};

/**
 * @constructor
 */
var LocalFileSystem = function() {
};

// File error codes
LocalFileSystem.TEMPORARY = 0;
LocalFileSystem.PERSISTENT = 1;
LocalFileSystem.RESOURCE = 2;
LocalFileSystem.APPLICATION = 3;

/**
 * Requests a filesystem in which to store application data.
 *
 * @param {int} type of file system being requested
 * @param {Function} successCallback is called with the new FileSystem
 * @param {Function} errorCallback is called with a FileError
 \code
 function onSuccess(fileSystem) {
    console.log(fileSystem.name);
}

// request the persistent file system
window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onSuccess, onError);
 \endcode
 */
LocalFileSystem.prototype.requestFileSystem = function(type, size, successCallback, errorCallback) {
    if (type < 0 || type > 3) {
        if (typeof errorCallback == "function") {
            errorCallback({
                "code": FileError.SYNTAX_ERR
            });
        }
    }
    else {
        PhoneGap.exec(successCallback, errorCallback, "File", "requestFileSystem", {type: type, size: size});
    }
};

/**
 *
 * @param {DOMString} uri referring to a local file in a filesystem
 * @param {Function} successCallback is called with the new entry
 * @param {Function} errorCallback is called with a FileError
 \code
 function onSuccess(fileEntry) {
    console.log(fileEntry.name);
}

window.resolveLocalFileSystemURI("file:///example.txt", onSuccess, onError);
 \endcode
 */
LocalFileSystem.prototype.resolveLocalFileSystemURI = function(uri, successCallback, errorCallback) {
    PhoneGap.exec(successCallback, errorCallback, "File", "resolveLocalFileSystemURI", {uri: uri});
};

/**
* TODO: MOSYNC The following comment is misplaced (copy/paste error). The function is used
* by the file system API. Update with proper comment.
*
* This function returns and array of contacts.  It is required as we need to convert raw
* JSON objects into concrete Contact objects.  Currently this method is called after
* navigator.service.contacts.find but before the find methods success call back.
*
* @param a JSON Objects that need to be converted to DirectoryEntry or FileEntry objects.
* @returns an entry
*/
LocalFileSystem.prototype._castFS = function (pluginResult) {
    var entry = null;
    entry = new DirectoryEntry();
    entry.isDirectory = pluginResult.message.root.isDirectory;
    entry.isFile = pluginResult.message.root.isFile;
    entry.name = pluginResult.message.root.name;
    entry.fullPath = pluginResult.message.root.fullPath;
    pluginResult.message.root = entry;
    return pluginResult;
};

LocalFileSystem.prototype._castEntry = function(pluginResult) {
    var entry = null;
    if (pluginResult.message.isDirectory) {
        entry = new DirectoryEntry();
    }
    else if (pluginResult.message.isFile) {
        entry = new FileEntry();
    }
    entry.isDirectory = pluginResult.message.isDirectory;
    entry.isFile = pluginResult.message.isFile;
    entry.name = pluginResult.message.name;
    entry.fullPath = pluginResult.message.fullPath;
    pluginResult.message = entry;
    return pluginResult;
};

LocalFileSystem.prototype._castEntries = function(pluginResult) {
    var entries = pluginResult.message;
    var retVal = [];
    for (var i=0; i<entries.length; i++) {
        retVal.push(window.localFileSystem._createEntry(entries[i]));
    }
    pluginResult.message = retVal;
    return pluginResult;
};

LocalFileSystem.prototype._createEntry = function(castMe) {
    var entry = null;
    if (castMe.isDirectory) {
        entry = new DirectoryEntry();
    }
    else if (castMe.isFile) {
        entry = new FileEntry();
    }
    entry.isDirectory = castMe.isDirectory;
    entry.isFile = castMe.isFile;
    entry.name = castMe.name;
    entry.fullPath = castMe.fullPath;
    return entry;
};

/**
 * This function casts a File object, or a Date. The name is
 * confusing.
 * TODO: Rename?
 */
LocalFileSystem.prototype._castDate = function (pluginResult) {
    if (pluginResult.message.modificationTime) {
        var modTime = new Date(pluginResult.message.modificationTime);
        pluginResult.message.modificationTime = modTime;
    }
    else if (pluginResult.message.lastModifiedDate) {
        var file = new File();
        file.size = pluginResult.message.size;
        file.type = pluginResult.message.type;
        file.name = pluginResult.message.name;
        file.fullPath = pluginResult.message.fullPath;
        file.lastModifiedDate = new Date(pluginResult.message.lastModifiedDate);
        pluginResult.message = file;
    }
    return pluginResult;
};

/*
 * Add the FileSystem interface into the browser.
 */
PhoneGap.addConstructor(function () {
    var pgLocalFileSystem = new LocalFileSystem();
    // Needed for cast methods
    if(typeof window.localFileSystem == "undefined") window.localFileSystem  = pgLocalFileSystem;
    if(typeof window.requestFileSystem == "undefined") window.requestFileSystem  = pgLocalFileSystem.requestFileSystem;
    if(typeof window.resolveLocalFileSystemURI == "undefined") window.resolveLocalFileSystemURI = pgLocalFileSystem.resolveLocalFileSystemURI;
});
}
/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010-2011, IBM Corporation
 * Copyright (c) 2011, Microsoft Corporation
 */

if (!PhoneGap.hasResource("filetransfer")) {
PhoneGap.addResource("filetransfer");

/**
 * FileTransfer uploads a file to a remote server.
 * @constructor
 */
var FileTransfer = function() {};

/**
 * FileUploadResult
 * @constructor
 */
var FileUploadResult = function() {
    this.bytesSent = 0;
    this.responseCode = null;
    this.response = null;
};

/**
 * FileTransferError
 * @constructor
 */
var FileTransferError = function() {
    this.code = null;
};

FileTransferError.FILE_NOT_FOUND_ERR = 1;
FileTransferError.INVALID_URL_ERR = 2;
FileTransferError.CONNECTION_ERR = 3;

/**
* Given an absolute file path, uploads a file on the device to a remote server
* using a multipart HTTP request.
* @param filePath {String}           Full path of the file on the device
* @param server {String}             URL of the server to receive the file
* @param successCallback (Function}  Callback to be invoked when upload has completed
* @param errorCallback {Function}    Callback to be invoked upon error
* @param options {FileUploadOptions} Optional parameters such as file name and mimetype
\code
// !! Assumes variable fileURI contains a valid URI to a  text file on the device

var win = function(r) {
    console.log("Code = " + r.responseCode);
    console.log("Response = " + r.response);
    console.log("Sent = " + r.bytesSent);
}

var fail = function(error) {
    alert("An error has occurred: Code = " = error.code);
}

var options = new FileUploadOptions();
options.fileKey="file";
options.fileName=fileURI.substr(fileURI.lastIndexOf('/')+1);
options.mimeType="text/plain";

var params = new Object();
params.value1 = "test";
params.value2 = "param";

options.params = params;

var ft = new FileTransfer();
ft.upload(fileURI, "http://some.server.com/upload.php", win, fail, options);
\endcode
*/
FileTransfer.prototype.upload = function(filePath, server, successCallback, errorCallback, options, debug) {

    // check for options
    var params = null;
    if (options) {
        if (options.params) {
            var dict=new Array();
            var idx = 0;

            for (var key in options.params) {
                if (options.params.hasOwnProperty(key)) {
                    var value = options.params[key];
                    var item = new Object();
                    item.Key = key;
                    item.Value = value;
                    dict[idx] = item;
                    idx++;
                }
            }

            options.params = dict;
        }
    } else {
        options = new FileUploadOptions();
    }

    options.filePath = filePath;
    options.server = server;

    PhoneGap.exec(successCallback, errorCallback, 'FileTransfer', 'upload', options);
};

/**
 * Options to customize the HTTP request used to upload files.
 * @constructor
 * @param fileKey {String}   Name of file request parameter.
 * @param fileName {String}  Filename to be used by the server. Defaults to image.jpg.
 * @param mimeType {String}  Mimetype of the uploaded file. Defaults to image/jpeg.
 * @param params {Object}    Object with key: value params to send to the server.
 */
var FileUploadOptions = function(fileKey, fileName, mimeType, params) {
    this.fileKey = fileKey || null;
    this.fileName = fileName || null;
    this.mimeType = mimeType || null;
    this.params = params || null;
};
}
/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010-2011, IBM Corporation
 * Copyright (c) 2011, Microsoft Corporation
 */

if (!PhoneGap.hasResource("media")) {
PhoneGap.addResource("media");

/**
 * This class provides access to the device media, interfaces to both sound and video
 *
 * @constructor
 * @param src                   The file name or url to play
 * @param successCallback       The callback to be called when the file is done playing or recording.
 *                                  successCallback() - OPTIONAL
 * @param errorCallback         The callback to be called if there is an error.
 *                                  errorCallback(int errorCode) - OPTIONAL
 * @param statusCallback        The callback to be called when media status has changed.
 *                                  statusCallback(int statusCode) - OPTIONAL
 * @param positionCallback      The callback to be called when media position has changed.
 *                                  positionCallback(long position) - OPTIONAL
 */
var Media = function(src, successCallback, errorCallback, statusCallback, positionCallback) {

    // successCallback optional
    if (successCallback && (typeof successCallback !== "function")) {
        console.log("Media Error: successCallback is not a function");
        return;
    }

    // errorCallback optional
    if (errorCallback && (typeof errorCallback !== "function")) {
        console.log("Media Error: errorCallback is not a function");
        return;
    }

    // statusCallback optional
    if (statusCallback && (typeof statusCallback !== "function")) {
        console.log("Media Error: statusCallback is not a function");
        return;
    }

    // statusCallback optional
    if (positionCallback && (typeof positionCallback !== "function")) {
        console.log("Media Error: positionCallback is not a function");
        return;
    }

    this.id = PhoneGap.createUUID();
    PhoneGap.mediaObjects[this.id] = this;
    this.src = src;
    this.successCallback = successCallback;
    this.errorCallback = errorCallback;
    this.statusCallback = statusCallback;
    this.positionCallback = positionCallback;
    this._duration = -1;
    this._position = -1;
};

// Media messages
Media.MEDIA_STATE = 1;
Media.MEDIA_DURATION = 2;
Media.MEDIA_POSITION = 3;
Media.MEDIA_ERROR = 9;

// Media states
Media.MEDIA_NONE = 0;
Media.MEDIA_STARTING = 1;
Media.MEDIA_RUNNING = 2;
Media.MEDIA_PAUSED = 3;
Media.MEDIA_STOPPED = 4;
Media.MEDIA_MSG = ["None", "Starting", "Running", "Paused", "Stopped"];

// TODO: Will MediaError be used?
/**
 * This class contains information about any Media errors.
 * @constructor
 */
var MediaError = function() {
    this.code = null;
    this.message = "";
};

MediaError.MEDIA_ERR_PLAY_MODE_SET = 1;
MediaError.MEDIA_ERR_ALREADY_RECORDING = 2;
MediaError.MEDIA_ERR_STARTING_RECORDING = 3;
MediaError.MEDIA_ERR_RECORD_MODE_SET = 4;
MediaError.MEDIA_ERR_STARTING_PLAYBACK = 5;
MediaError.MEDIA_ERR_RESUME_STATE = 6;
MediaError.MEDIA_ERR_PAUSE_STATE = 7;
MediaError.MEDIA_ERR_STOP_STATE = 8;

/**
 * Start or resume playing audio file.
 \code
 // Play audio
//
function playAudio(url) {
    // Play the audio file at url
    var my_media = new Media(url,
        // success callback
        function() {
            console.log("playAudio():Audio Success");
        },
        // error callback
        function(err) {
            console.log("playAudio():Audio Error: "+err);
    });

    // Play audio
    my_media.play();
}
 \endcode
 */
Media.prototype.play = function() {
    PhoneGap.exec(null, null, "Media", "startPlayingAudio", {id: this.id, src: this.src});
};

/**
 * Stop playing audio file.
 \code
 // Play audio
//
function playAudio(url) {
    // Play the audio file at url
    var my_media = new Media(url,
        // success callback
        function() {
            console.log("playAudio():Audio Success");
        },
        // error callback
        function(err) {
            console.log("playAudio():Audio Error: "+err);
    });

    // Play audio
    my_media.play();

    // Pause after 10 seconds
    setTimeout(function() {
        my_media.stop();
    }, 10000);
}
\endcode
 */
Media.prototype.stop = function() {
    return PhoneGap.exec(null, null, "Media", "stopPlayingAudio", {id: this.id});
};

/**
 * Seek or jump to a new time in the track..
 \code
// Audio player
    //
    var my_media = new Media(src, onSuccess, onError);
    my_media.play();
    // SeekTo to 10 seconds after 5 seconds
    setTimeout(function() {
        my_media.seekTo(10000);
    }, 5000);
 \endcode
 */
Media.prototype.seekTo = function(milliseconds) {
    PhoneGap.exec(null, null, "Media", "seekToAudio", {id: this.id, milliseconds: milliseconds});
};

/**
 * Pause playing audio file.
 \code
 // Play audio
//
function playAudio(url) {
    // Play the audio file at url
    var my_media = new Media(url,
        // success callback
        function() {
            console.log("playAudio():Audio Success");
        },
        // error callback
        function(err) {
            console.log("playAudio():Audio Error: "+err);
    });

    // Play audio
    my_media.play();

    // Pause after 10 seconds
    setTimeout(function() {
        media.pause();
    }, 10000);
}
 \endcode
 */
Media.prototype.pause = function() {
    PhoneGap.exec(null, null, "Media", "pausePlayingAudio", {id: this.id});
};

/**
 * Get duration of an audio file.
 * The duration is only set for audio that is playing, paused or stopped.
 *
 * @return      duration or -1 if not known.
 \code
 // Audio player
    //
    var my_media = new Media(src, onSuccess, onError);

    // Get duration
    var counter = 0;
    var timerDur = setInterval(function() {
        counter = counter + 100;
        if (counter > 2000) {
            clearInterval(timerDur);
        }
        var dur = my_media.getDuration();
        if (dur > 0) {
            clearInterval(timerDur);
            document.getElementById('audio_duration').innerHTML = (dur) + " sec";
        }
   }, 100);
 \endcode
 */
Media.prototype.getDuration = function() {
    return this._duration;
};

/**
 * Get position of audio.
 \code
     // Audio player
    //
    var my_media = new Media(src, onSuccess, onError);

    // Update media position every second
    var mediaTimer = setInterval(function() {
        // get media position
        my_media.getCurrentPosition(
            // success callback
            function(position) {
                if (position > -1) {
                    console.log((position) + " sec");
                }
            },
            // error callback
            function(e) {
                console.log("Error getting pos=" + e);
            }
        );
    }, 1000);
 \endcode
 */
Media.prototype.getCurrentPosition = function(success, fail) {
    PhoneGap.exec(success, fail, "Media", "getCurrentPositionAudio", {id: this.id});
};

/**
 * Start recording audio file.
 \code
 // Record audio
//
function recordAudio() {
    var src = "myrecording.mp3";
    var mediaRec = new Media(src,
        // success callback
        function() {
            console.log("recordAudio():Audio Success");
        },

        // error callback
        function(err) {
            console.log("recordAudio():Audio Error: "+ err.code);
        });

    // Record audio
    mediaRec.startRecord();
}
 \endcode
 */
Media.prototype.startRecord = function() {
    PhoneGap.exec(null, null, "Media", "startRecordingAudio", {id: this.id, src: this.src});
};

/**
 * Stop recording audio file.
 \code
 // Record audio
//
function recordAudio() {
    var src = "myrecording.mp3";
    var mediaRec = new Media(src,
        // success callback
        function() {
            console.log("recordAudio():Audio Success");
        },

        // error callback
        function(err) {
            console.log("recordAudio():Audio Error: "+ err.code);
        });

    // Record audio
    mediaRec.startRecord();

    // Stop recording after 10 seconds
    setTimeout(function() {
        mediaRec.stopRecord();
    }, 10000);
}
\endcode
 */
Media.prototype.stopRecord = function() {
    PhoneGap.exec(null, null, "Media", "stopRecordingAudio", {id: this.id});
};

/**
 * Release the resources.
 \code
     // Audio player
    //
    var my_media = new Media(src, onSuccess, onError);

    my_media.play();
    my_media.stop();
    my_media.release();
 \endcode
 */
Media.prototype.release = function() {
    PhoneGap.exec(null, null, "Media", "release", {id: this.id});
};

/**
 * List of media objects.
 * PRIVATE
 */
PhoneGap.mediaObjects = {};

/**
 * Object that receives native callbacks.
 * PRIVATE
 * @constructor
 */
PhoneGap.Media = function() {};

/**
 * Get the media object.
 * PRIVATE
 *
 * @param id            The media object id (string)
 */
PhoneGap.Media.getMediaObject = function(id) {
    return PhoneGap.mediaObjects[id];
};

/**
 * Audio has status update.
 * PRIVATE
 *
 * @param id            The media object id (string)
 * @param status        The status code (int)
 * @param msg           The status message (string)
 */
PhoneGap.Media.onStatus = function(id, msg, value) {
    var media = PhoneGap.mediaObjects[id];
    // If state update
    if (msg === Media.MEDIA_STATE) {
        if (value === Media.MEDIA_STOPPED) {
            if (media.successCallback) {
                media.successCallback();
            }
        }
        if (media.statusCallback) {
            media.statusCallback(value);
        }
    }
    else if (msg === Media.MEDIA_DURATION) {
        media._duration = value;
    }
    else if (msg === Media.MEDIA_ERROR) {
        if (media.errorCallback) {
            media.errorCallback(value);
        }
    }
    else if (msg == Media.MEDIA_POSITION) {
        media._position = value;
    }
};

// We need special proxy to invoke PhoneGap.Media.onStatus (method is not visible in other case)
// http://stackoverflow.com/questions/7322420/calling-javascript-object-method-using-webbrowser-document-invokescript
PhoneGapMediaonStatus = function (args) {
    var res = JSON.parse(args);
    PhoneGap.Media.onStatus(res.id, res.msg, res.value);
}

}
/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) 2005-2010, Nitobi Software Inc.
 * Copyright (c) 2010-2011, IBM Corporation
 * Copyright (c) 2011, Microsoft Corporation
 */

if (!PhoneGap.hasResource("network")) {
PhoneGap.addResource("network");

/**
 * This class contains information about the current network Connection.
 * @constructor
 */
var Connection = function()
{
    this.type = null;
    this._firstRun = true;
    this._timer = null;
    this.timeout = 500;

    var me = this;
    this.getInfo(
        function(type) {
            console.log("PhoneGap: Connection getInfo type: " + type);
            // Need to send events if we are on or offline
            if (type == "none") {
                // set a timer if still offline at the end of timer send the offline event
                me._timer = setTimeout(function(){
                    me.type = type;
                    console.log("PhoneGap.fireEvent::offline");
                    PhoneGap.fireEvent(document,'offline');
                    me._timer = null;
                    }, me.timeout);
            } else {
                // If there is a current offline event pending clear it
                if (me._timer != null) {
                    clearTimeout(me._timer);
                    me._timer = null;
                }
                me.type = type;
                console.log("PhoneGap.fireEvent::online " + me.type);
                PhoneGap.fireEvent(document,'online');
            }

            // should only fire this once
            if (me._firstRun)
            {
                me._firstRun = false;
                console.log("onPhoneGapConnectionReady");
                PhoneGap.onPhoneGapConnectionReady.fire();
            }
        },
        function(e) {
            console.log("Error initializing Network Connection: " + e);
        });
};

Connection.UNKNOWN = "unknown";
Connection.ETHERNET = "ethernet";
Connection.WIFI = "wifi";
Connection.CELL_2G = "2g";
Connection.CELL_3G = "3g";
Connection.CELL_4G = "4g";
Connection.NONE = "none";

/**
 * Get connection info
 *
 * @param {Function} successCallback The function to call when the Connection data is available
 * @param {Function} errorCallback The function to call when there is an error getting the Connection data. (OPTIONAL)
 */
Connection.prototype.getInfo = function(successCallback, errorCallback) {
    // Get info
    PhoneGap.exec(successCallback, errorCallback, "Connection", "getConnectionInfo", []);
};


PhoneGap.addConstructor(function() {
    if (typeof navigator.network === "undefined") {
        navigator.network = new Object();
    }
    if (typeof navigator.network.connection === "undefined") {
        navigator.network.connection = new Connection();
    }
});
}
/*
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) 2005-2011, Nitobi Software Inc.
 * Copyright (c) 2010-2011, IBM Corporation
 * Copyright (c) 2011, Microsoft Corporation
 */

if (!PhoneGap.hasResource("notification")) {
PhoneGap.addResource("notification");

/**
 * This class provides access to notifications on the device.
 * @constructor
 */
var Notification = function() {
};

/**
 * Open a native alert dialog, with a customizable title and button text.
 *
 * @param {String} message              Message to print in the body of the alert
 * @param {Function} completeCallback   The callback that is called when user clicks on a button.
 * @param {String} title                Title of the alert dialog (default: Alert)
 * @param {String} buttonLabel          Label of the close button (default: OK)
 \code
 // Android / BlackBerry WebWorks (OS 5.0 and higher) / iPhone
//
function alertDismissed() {
    // do something
}

navigator.notification.alert(
    'You are the winner!',  // message
    alertDismissed,         // callback
    'Game Over',            // title
    'Done'                  // buttonName
);

// BlackBerry (OS 4.6) / webOS
//
navigator.notification.alert('You are the winner!');
\endcode
 */
Notification.prototype.alert = function(message, completeCallback, title, buttonLabel)
{
    var _title = (title || "Alert");
    var _buttonLabels = (buttonLabel || "OK");
    PhoneGap.exec(completeCallback, null, "Notification", "alert",{"message":message,"title":_title,"buttonLabels":_buttonLabels});
};

/**
 * Open a native confirm dialog, with a customizable title and button text.
 * The result that the user selects is returned to the result callback.
 *
 * @param {String} message              Message to print in the body of the alert
 * @param {Function} resultCallback     The callback that is called when user clicks on a button.
 * @param {String} title                Title of the alert dialog (default: Confirm)
 * @param {String} buttonLabels         Comma separated list of the labels of the buttons (default: 'OK,Cancel')
 \code
 // process the confirmation dialog result
function onConfirm(button) {
    alert('You selected button ' + button);
}

// Show a custom confirmation dialog
//
function showConfirm() {
    navigator.notification.confirm(
        'You are the winner!',  // message
        onConfirm,              // callback to invoke with index of button pressed
        'Game Over',            // title
        'Restart,Exit'          // buttonLabels
    );
}
\endcode
 */
Notification.prototype.confirm = function(message, resultCallback, title, buttonLabels)
{
    var _title = (title || "Confirm");
    var _buttonLabels = (buttonLabels || "OK,Cancel");
    PhoneGap.exec(resultCallback, null, "Notification", "confirm", {'message':message,"title":_title,"buttonLabels":_buttonLabels});
};

/**
 * Start spinning the activity indicator on the statusbar
 */
Notification.prototype.activityStart = function() {
    PhoneGap.exec(null, null, "Notification", "activityStart", ["Busy","Please wait..."]);
};

/**
 * Stop spinning the activity indicator on the statusbar, if it's currently spinning
 */
Notification.prototype.activityStop = function() {
    PhoneGap.exec(null, null, "Notification", "activityStop", []);
};

/**
 * Display a progress dialog with progress bar that goes from 0 to 100.
 *
 * @param {String} title        Title of the progress dialog.
 * @param {String} message      Message to display in the dialog.
 */
Notification.prototype.progressStart = function(title, message) {
    PhoneGap.exec(null, null, "Notification", "progressStart", [title, message]);
};

/**
 * Set the progress dialog value.
 *
 * @param {Number} value         0-100
 */
Notification.prototype.progressValue = function(value) {
    PhoneGap.exec(null, null, "Notification", "progressValue", [value]);
};

/**
 * Close the progress dialog.
 */
Notification.prototype.progressStop = function() {
    PhoneGap.exec(null, null, "Notification", "progressStop", []);
};

/**
 * Causes the device to blink a status LED.
 *
 * @param {Integer} count       The number of blinks.
 * @param {String} colour       The colour of the light.
 */
Notification.prototype.blink = function(count, colour) {
    // NOT IMPLEMENTED
};

/**
 * Causes the device to vibrate.
 *
 * @param {Integer} mills       The number of milliseconds to vibrate for.
 \code
 // Vibrate for 2.5 seconds
//
navigator.notification.vibrate(2500);
\endcode
 */
Notification.prototype.vibrate = function(mills)
{
    PhoneGap.exec(null, null, "Notification", "vibrate", {duration:mills});
};

/**
 * Causes the device to beep.
 * A packaged resource is played "repeatCount" times.
 *
 * @param {Integer} repeatCount       The number of beeps. default 1
 \code
 // Beep twice!
navigator.notification.beep(2);
\endcode
 */
Notification.prototype.beep = function(repeatCount)
{
    var count = repeatCount|| 1;
    PhoneGap.exec(null, null, "Notification", "beep", count);
};

PhoneGap.addConstructor(function() {
    if (typeof navigator.notification === "undefined") {
        navigator.notification = new Notification();
    }
});
} // End of notification API

// =============================================================
//
// File: mosync-constants.js

// File: mosync-constants.js.
// This is a generated file, do not edit.

// Start of JavaScript constants.

/**
* @brief Sets if the indicator is still on or off.
* If set to false, it doesn't delete the widget just dismisses it.
* @validvalue A boolean string 'true' or 'false'.
*
* @setonly
*
* @par Example
* \code
*	// The activity is done. Now this widget is dismissed.
*	maWidgetSetProperty(activityIndicatorHandle, MAW_ACTIVITY_INDICATOR_IN_PROGRESS, "false");
* \endcode
*/
mosync.MAW_ACTIVITY_INDICATOR_IN_PROGRESS = "inProgress";

/**
* @brief Sets or gets the text that is displayed in the label.
*
* @validvalue A null-terminated string.
*
* @setandget
*
* @par Example set
* \code
*	maWidgetSetProperty(buttonHandle, MAW_BUTTON_TEXT, "My button");
* \endcode
*
* @par Example get
* \code
*	char textBuffer[BUFFER_SIZE];
*	int result = maWidgetGetProperty(buttonHandle, MAW_BUTTON_TEXT, textBuffer, BUFFER_SIZE);
*	if (result > 0)
*	{
*	// Do something with the label text.
*	}
* \endcode
*/
mosync.MAW_BUTTON_TEXT = "text";

/**
* @brief Sets the vertical alignment of the text inside the button. If the widget's height is WRAP_CONTENT this property has no effect.
*
* @validvalue One of the constants #MAW_ALIGNMENT_TOP, #MAW_ALIGNMENT_CENTER or #MAW_ALIGNMENT_BOTTOM.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(buttonHandle, MAW_BUTTON_TEXT_VERTICAL_ALIGNMENT, MAW_ALIGNMENT_CENTER);
* \endcode
*/
mosync.MAW_BUTTON_TEXT_VERTICAL_ALIGNMENT = "textVerticalAlignment";

/**
* @brief Sets the horizontal alignment of the text inside the button. If the widget's width is WRAP_CONTENT this property has no effect.
*
* @validvalue Takes one of the constants #MAW_ALIGNMENT_LEFT, #MAW_ALIGNMENT_CENTER or #MAW_ALIGNMENT_RIGHT.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(buttonHandle, MAW_BUTTON_TEXT_HORIZONTAL_ALIGNMENT, MAW_ALIGNMENT_CENTER);
* \endcode
*/
mosync.MAW_BUTTON_TEXT_HORIZONTAL_ALIGNMENT = "textHorizontalAlignment";

/**
* @brief Sets the font color of the button's text.
*
* @validvalue A hexadecimal value 0xRRGGBB, where R, G and B are the red, green and blue components respectively.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(buttonHandle, MAW_BUTTON_FONT_COLOR, "0xff0000");
* \endcode
*/
mosync.MAW_BUTTON_FONT_COLOR = "fontColor";

/**
* @brief Sets the font size in points of the button's text.
*
* @validvalue A float that specifies the number of pixels on Android
* and WP7, and number of points on iOS.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(buttonHandle, MAW_BUTTON_FONT_SIZE, "13.0");
* \endcode
*/
mosync.MAW_BUTTON_FONT_SIZE = "fontSize";

/**
* @brief Sets the typeface and style in which the text should be displayed.
*
* @validvalue A font handle received from loading fonts using
* #maFontGetName and #maFontLoadWithName syscalls.
*
* @setonly
*
* @par Example
* \code
*	int nrFonts = maFontGetCount();
*	 char buf[256];
*	 // Get first font name.
*	 maFontGetName(1, buf, 256);
*	 // Load that font for size 10.
*	 int fontHandle = maFontLoadWithName(buf, 10);
*	 // Set that font to the label.
*	maWidgetSetProperty(buttonHandle, MAW_BUTTON_FONT_HANDLE, toString(fontHandle));
* \endcode
*/
mosync.MAW_BUTTON_FONT_HANDLE = "fontHandle";

/**
* @brief Set or get the checked state of the checkbox.
*
* @validvalue A boolean string 'true' or 'false'.
*
* @par Example
* \code
*	maWidgetSetProperty(checkBoxHandle, MAW_CHECK_BOX_CHECKED, "true");
* \endcode
*/
mosync.MAW_CHECK_BOX_CHECKED = "checked";

/**
* @deprecated use MAX_DATE_YEAR, MAX_DATE_MONTH and MAX_DATE_DAY instead
* @brief Sets or gets  maximal date supported by this DatePicker in seconds since January 1, 1970 00:00:00.
* NOTE: On Android the default maximal date is 12/31/2100.
* NOTE: The property can be set on iOS only.
* @validvalue A long int that specifies the upper range of this date picker.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(datePickerHandle, MAW_DATE_PICKER_MAX_DATE, "1291939200");
*	// Now the maximum date isthe 10th of December 2010.
* \endcode
*/
mosync.MAW_DATE_PICKER_MAX_DATE = "maxDate";

/**
* @brief Sets or gets the year of the maximal date supported by this DatePicker.
* Note: On Android the default maximal date year is 2100.
* Note: On Windows Phone 7 and iOS the default maximal date year is 9999.
* @validvalue An int that specifies the value of the year of the maximal date
* for this date picker.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(datePickerHandle, MAW_DATE_PICKER_MAX_DATE_YEAR, "2999");
* \endcode
*/
mosync.MAW_DATE_PICKER_MAX_DATE_YEAR = "maxdateyear";

/**
* @brief Sets or gets the month of the maximal date supported by this DatePicker.
* @validvalue An int that specifies the value of the month of the maximal date for
* this date picker. The value must be a number between 1 and 12.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(datePickerHandle, MAW_DATE_PICKER_MAX_DATE_MONTH, "12");
* \endcode
*/
mosync.MAW_DATE_PICKER_MAX_DATE_MONTH = "maxdatemonth";

/**
* @brief Sets or gets the day of the maximal date supported by this DatePicker.
* @validvalue An int that specifies the value of the day of the maximal date for
* this date picker. This number must be a valid day of the month specified with
* the MAX_DATE_MONTH property.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(datePickerHandle, MAW_DATE_PICKER_MAX_DATE_DAY, "31");
* \endcode
*/
mosync.MAW_DATE_PICKER_MAX_DATE_DAY = "maxdateday";

/**
* @deprecated use MIN_DATE_YEAR, MIN_DATE_MONTH and MIN_DATE_DAY instead
* @brief Sets or gets  minimal date supported by this DatePicker in seconds since January 1, 1970 00:00:00
* Note: On Android the default minimal date is 01/01/1900.
* @validvalue A long int that specifies the minimal supported date.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(datePickerHandle, MAW_DATE_PICKER_MIN_DATE, "946684800");
*	// Now the minimum date is the 1st of January 2000.
* \endcode
*/
mosync.MAW_DATE_PICKER_MIN_DATE = "minDate";

/**
* @brief Sets or gets the year of the minimal date supported by this DatePicker.
* Note: On Android the default minimal date year  is 1900.
* Note: On Windows Phone 7 and iOS the default minimal date year is 1.
* @validvalue An int that specifies the value of the year of the minimal date
* for this date picker.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(datePickerHandle, MAW_DATE_PICKER_MIN_DATE_YEAR, "1830");
* \endcode
*/
mosync.MAW_DATE_PICKER_MIN_DATE_YEAR = "mindateyear";

/**
* @brief Sets or gets the month of the minimal date supported by this DatePicker.
* @validvalue An int that specifies the value of the month of the minimal date for
* this date picker. The value must be a number between 1 and 12.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(datePickerHandle, MAW_DATE_PICKER_MIN_DATE_MONTH, "1");
* \endcode
*/
mosync.MAW_DATE_PICKER_MIN_DATE_MONTH = "mindatemonth";

/**
* @brief Sets or gets the day of the minimal date supported by this DatePicker.
* @validvalue An int that specifies the value of the day of the minimal date for
* this date picker. This number must be a valid day of the month specified with
* the MIN_DATE_MONTH property.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(datePickerHandle, MAW_DATE_PICKER_MIN_DATE_DAY, "1");
* \endcode
*/
mosync.MAW_DATE_PICKER_MIN_DATE_DAY = "mindateday";

/**
* @brief Sets or gets the currently displayed year.
*
* @validvalue An int that specifies a valid year.
*
* @setandget
*
* @par Example
* \code
*	char yearBuffer[BUFFER_SIZE];
*	int getStatus = maWidgetGetProperty(datePickerHandle, MAW_DATE_PICKER_YEAR, yearBuffer, BUFFER_SIZE);
*	if(getStatus == MAW_RES_OK)
*	{
*	// Do something with the year.
*	}
* \endcode
*/
mosync.MAW_DATE_PICKER_YEAR = "year";

/**
* @brief Sets or gets the currently displayed month.
*
* @validvalue An int that specifies a valid month.
*
* @setandget
*
* @par Example
* \code
*	char monthBuffer[BUFFER_SIZE];
*	int getStatus = maWidgetGetProperty(datePickerHandle, MAW_DATE_PICKER_MONTH, monthBuffer, BUFFER_SIZE);
*	if(getStatus == MAW_RES_OK)
*	{
*	// Do something with the month.
*	}
* \endcode
*/
mosync.MAW_DATE_PICKER_MONTH = "month";

/**
* @brief Sets or gets the currently displayed day of month.
*
* @validvalue An int that specifies a valid day of month.
*
* @setandget
*
* @par Example
* \code
*	char dayBuffer[BUFFER_SIZE];
*	int getStatus = maWidgetGetProperty(datePickerHandle, MAW_DATE_PICKER_DAY_OF_MONTH, dayBuffer, BUFFER_SIZE);
*	if(getStatus == MAW_RES_OK)
*	{
*	// Do something with the day.
*	}
* \endcode
*/
mosync.MAW_DATE_PICKER_DAY_OF_MONTH = "dayOfMonth";

/**
* The input text will be single line.
* Default value.
* Platform: iOS.
*/
mosync.MAW_EDIT_BOX_MODE_SINGLE_LINE = 0;

/**
* The input text will be multi line.
* Platform: iOS.
*/
mosync.MAW_EDIT_BOX_MODE_MULTI_LINE = 1;

/**
* The user is allowed to enter any text, including line breaks.
* On iOS platform the #MAW_EDIT_BOX_MODE property must be set to
* #MAW_EDIT_BOX_MODE_MULTI_LINE in order to have a multi line edit box.
*/
mosync.MAW_EDIT_BOX_TYPE_ANY = 0;

/**
* The user is allowed to enter an e-mail address.
*/
mosync.MAW_EDIT_BOX_TYPE_EMAILADDR = 1;

/**
* The user is allowed to enter an integer value.
*/
mosync.MAW_EDIT_BOX_TYPE_NUMERIC = 2;

/**
* The user is allowed to enter a phone number.
*/
mosync.MAW_EDIT_BOX_TYPE_PHONENUMBER = 3;

/**
* The user is allowed to enter a URL.
*/
mosync.MAW_EDIT_BOX_TYPE_URL = 4;

/**
* The user is allowed to enter a real number value.
* This extends #MAW_EDIT_BOX_TYPE_NUMERIC by allowing a decimal point.
*/
mosync.MAW_EDIT_BOX_TYPE_DECIMAL = 5;

/**
* The user is allowed to enter any text, except for line breaks.
* Unavailable on some platforms.
*/
mosync.MAW_EDIT_BOX_TYPE_SINGLE_LINE = 6;

/**
* Indicates that the text entered is confidential data that should be
* obscured whenever possible. This implies #MAW_EDIT_BOX_FLAG_SENSITIVE.
* On iOS this flag works only if edit box mode is #MAW_EDIT_BOX_MODE_SINGLE_LINE.
*/
mosync.MAW_EDIT_BOX_FLAG_PASSWORD = 0;

/**
* Indicates that the text entered is sensitive data that the implementation
* must never store into a dictionary or table for use in predictive, auto-completing,
* or other accelerated input schemes. A credit card number is an example of sensitive data.
* Only for Android platform.
*/
mosync.MAW_EDIT_BOX_FLAG_SENSITIVE = 1;

/**
* This flag is a hint to the implementation that during text editing,
* the initial letter of each word should be capitalized.
* Not available on Windows Phone 7.1.
*/
mosync.MAW_EDIT_BOX_FLAG_INITIAL_CAPS_WORD = 2;

/**
* This flag is a hint to the implementation that during text editing,
* the initial letter of each sentence should be capitalized.
* Input flag not available on Windows Phone 7.1 but the edit box
* type 'ANY' does this by default.
*/
mosync.MAW_EDIT_BOX_FLAG_INITIAL_CAPS_SENTENCE = 3;

/**
* Capitalize all characters automatically.
* Not available on Windows Phone 7.1.
*/
mosync.MAW_EDIT_BOX_FLAG_INITIAL_CAPS_ALL_CHARACTERS = 4;

/**
* System's default value.
* Usually, this value it can be turned on/off from settings.
* Default value.
* Platform: iOS.
*/
mosync.MAW_EDIT_BOX_AUTOCORRECTION_TYPE_DEFAULT = 0;

/**
* Enable auto-correction behavior.
* Platform: iOS.
*/
mosync.MAW_EDIT_BOX_AUTOCORRECTION_TYPE_ENABLE = 1;

/**
* Disable auto-correction behavior.
* Platform: iOS.
*/
mosync.MAW_EDIT_BOX_AUTOCORRECTION_TYPE_DISABLE = 2;

/**
* @brief Set or get the text entered in the edit box.
*
* @validvalue A null-terminated string.
*
* @setandget
*
* @par Example set
* \code
*	maWidgetSetProperty(editBoxHandle, MAW_EDIT_BOX_TEXT, "My label");
* \endcode
*
* @par Example get
* \code
*	char textBuffer[BUFFER_SIZE];
*	int result = maWidgetGetProperty(editBoxHandle, MAW_EDIT_BOX_TEXT, textBuffer, BUFFER_SIZE);
*	if (result > 0)
*	{
*	// Do something with the edit box text
*	}
* \endcode
*/
mosync.MAW_EDIT_BOX_TEXT = "text";

/**
* @brief Set a text in the edit box that acts as a placeholder when an edit box is empty.
*
* @validvalue A null-terminated string.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(editBoxHandle, MAW_EDIT_BOX_PLACEHOLDER, "Enter text...");
* \endcode
*/
mosync.MAW_EDIT_BOX_PLACEHOLDER = "placeholder";

/**
* @brief Shows or hides the virtual keyboard. If shown the focus will be set to this widget.
*
* @validvalue A boolean string 'true' or 'false'.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(editBoxHandle, MAW_EDIT_BOX_SHOW_KEYBOARD, "true");
* \endcode
*/
mosync.MAW_EDIT_BOX_SHOW_KEYBOARD = "showKeyboard";

/**
* @brief Specifies what editing mode the edit box should have.
* On iOS this property works only if check box mode is #MAW_EDIT_BOX_MODE_SINGLE_LINE.
* @deprecated use #MAW_EDIT_BOX_INPUT_FLAG instead.
* @validvalue Either 'password' or 'text'.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(editBoxHandle, MAW_EDIT_BOX_EDIT_MODE, "password");
* \endcode
*/
mosync.MAW_EDIT_BOX_EDIT_MODE = "editMode";

/**
* @brief Specifies what editing mode the edit box should have.
* Those flags are mutual exclusive, so the previous value is always ignored.
*
* @validvalue One of the values #MAW_EDIT_BOX_TYPE_ANY, #MAW_EDIT_BOX_TYPE_EMAILADDR,
* #MAW_EDIT_BOX_TYPE_NUMERIC, #MAW_EDIT_BOX_TYPE_PHONENUMBER, #MAW_EDIT_BOX_TYPE_URL,
* #MAW_EDIT_BOX_TYPE_DECIMAL, #MAW_EDIT_BOX_TYPE_SINGLELINE.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(editBoxHandle, MAW_EDIT_BOX_INPUT_MODE, toString(MAW_EDIT_BOX_NUMERIC);
* \endcode
*/
mosync.MAW_EDIT_BOX_INPUT_MODE = "inputMode";

/**
* @brief Specifies the editing flags applied to the edit box.
* Those flags are mutual exclusive, so the previous value is always ignored.
*
* @validvalue One of the values #MAW_EDIT_BOX_FLAG_PASSWORD,
* #MAW_EDIT_BOX_FLAG_SENSITIVE, #MAW_EDIT_BOX_FLAG_INITIAL_CAPS_ALL_CHARACTERS,
* #MAW_EDIT_BOX_FLAG_INITIAL_CAPS_WORD, #MAW_EDIT_BOX_FLAG_INITIAL_CAPS_SENTENCE.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(editBoxHandle, MAW_EDIT_BOX_INPUT_FLAG, toString(MAW_EDIT_BOX_FLAG_PASSWORD));
* \endcode
*/
mosync.MAW_EDIT_BOX_INPUT_FLAG = "inputFlag";

/**
* @brief Sets the font color of the edit box's text.
*
* @validvalue A hexadecimal value 0xRRGGBB, where R, G and B are the red, green and blue components respectively.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(editBoxHandle, MAW_EDIT_BOX_FONT_COLOR, "0xff0000");
* \endcode
*/
mosync.MAW_EDIT_BOX_FONT_COLOR = "fontColor";

/**
* @brief Set the number of lines.
* Makes the edit box exactly this many lines tall. Note that setting this value
* overrides any other (minimum / maximum) number of lines or height setting.
* A single line edit box will set this value to 1.
* This property will automatically set MAW_EDIT_BOX_TYPE_ANY input mode, so that
* the edit box will become multiline.
* Available on Android only.
*
* @validvalue A positive integer.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(editBoxHandle, MAW_EDIT_BOX_LINES_NUMBER, "2");
* \endcode
*/
mosync.MAW_EDIT_BOX_LINES_NUMBER = "linesNumber";

/**
* @brief Makes the edit box at most this many lines tall.
* Setting this value overrides any other (maximum) height setting.
* Available on Android only.
*
* @validvalue A positive integer.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(editBoxHandle, MAW_EDIT_BOX_MAX_LINES, "2");
* \endcode
*/
mosync.MAW_EDIT_BOX_MAX_LINES = "maxLines";

/**
* @brief Makes the edit box at least this many lines tall.
* Setting this value overrides any other (minimum) height setting.
* Available on Android only.
*
* @validvalue A positive integer.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(editBoxHandle, MAW_EDIT_BOX_MIN_LINES, "1");
* \endcode
*/
mosync.MAW_EDIT_BOX_MIN_LINES = "minLines";

/**
* @brief Sets or gets the maximum input lenght of the edit box.
* Setting this value enables multiline input mode by default.
* Available on Android, iOS and Windows Phone.
*
* @validvalue A positive integer.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(editBoxHandle, MAW_EDIT_BOX_MAX_LENGTH, "10");
* \endcode
*/
mosync.MAW_EDIT_BOX_MAX_LENGTH = "maxLength";

/**
* @brief Sets the font color of the placeholder text when an edit box is empty.
*
* @validvalue A hexadecimal value 0xRRGGBB, where R, G and B are the red, green and blue components respectively.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(editBoxHandle, MAW_EDIT_BOX_PLACEHOLDER_FONT_COLOR, "0xff0000");
* \endcode
*/
mosync.MAW_EDIT_BOX_PLACEHOLDER_FONT_COLOR = "placeholderFontColor";

/**
* @brief Sets or gets the edit box mode.
* Changing this value on iOS platform will reset all widget's properties, because
* the widget will be replaced with a new one.
* It is recommended to set this value after creating the widget, and before adding it
* to a layout.
* Platform: iOS.
*
* @validvalue #MAW_EDIT_BOX_MODE_SINGLE_LINE will set the mode to single line, or
* MAW_EDIT_BOX_MULTI_LINE will set the mode to multi line.
*
* @setandget
*
* @par Example
* \code
*   char buffer[BUFFER_SIZE];
*   sprintf(buffer, "%d", MAW_EDIT_BOX_MODE_MULTI_LINE);
*	maWidgetSetProperty(editBoxHandle, MAW_EDIT_BOX_MODE, buffer);
* \endcode
*/
mosync.MAW_EDIT_BOX_MODE = "mode";

/**
* @brief Sets or gets the autocorrection type.
* Enable/disable the auto correction during typing. With auto correction enabled,
* the text object tracks unknown words and suggests a more suitable replacement candidate to the user,
* replacing the typed text automatically unless the user explicitly overrides the action.
* The default value is #MAW_EDIT_BOX_AUTOCORRECTION_TYPE_DEAFULT.
* Platform: iOS.
*
* @validvalue #MAW_EDIT_BOX_AUTOCORRECTION_TYPE_DEFAULT, #MAW_EDIT_BOX_AUTOCORRECTION_TYPE_ENABLE
* or #MAW_EDIT_BOX_AUTOCORRECTION_TYPE_DISABLE.
*
* @setandget
*
* @par Example
* \code
*   char buffer[BUFFER_SIZE];
*   sprintf(buffer, "%d", MAW_EDIT_BOX_AUTOCORRECTION_TYPE_YES;
*	maWidgetSetProperty(editBoxHandle, MAW_EDIT_BOX_AUTOCORRECTION_TYPE, buffer);
* \endcode
*/
mosync.MAW_EDIT_BOX_AUTOCORRECTION_TYPE = "autoCorrectionType";

/**
* @brief Sets or gets the horizontal alignment of the text inside the edit box.
* The default value is #MAW_ALIGNMENT_LEFT.
* Platform: iOS.
*
* @validvalue #MAW_ALIGNMENT_LEFT, #MAW_ALIGNMENT_CENTER or #MAW_ALIGNMENT_RIGHT.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(editBoxHandle, MAW_EDIT_BOX_TEXT_HORIZONTAL_ALIGNMENT,
*                       MAW_ALIGNMENT_RIGHT);
* \endcode
*/
mosync.MAW_EDIT_BOX_TEXT_HORIZONTAL_ALIGNMENT = "textHorizontalAlignment";

/**
* @brief Property that tells the gl view that it should be redrawn.
*
* @validvalue The value isn't taken into account.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(glViewHandle, MAW_GL_VIEW_INVALIDATE, "");
* \endcode
*/
mosync.MAW_GL_VIEW_INVALIDATE = "invalidate";

/**
* @brief Property that tells the gl view that all following gl calls will apply to this view.
*
* @validvalue The value isn't taken into account.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(glViewHandle, MAW_GL_VIEW_BIND, "");
* \endcode
*/
mosync.MAW_GL_VIEW_BIND = "bind";

/**
* @brief Sets how the children in the layout should be aligned in the vertical axis.
*
* @validvalue One of the constants #MAW_ALIGNMENT_TOP, #MAW_ALIGNMENT_CENTER or #MAW_ALIGNMENT_BOTTOM.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(horizontalLayoutHandle, MAW_HORIZONTAL_LAYOUT_CHILD_VERTICAL_ALIGNMENT, MAW_ALIGNMENT_CENTER);
* \endcode
*/
mosync.MAW_HORIZONTAL_LAYOUT_CHILD_VERTICAL_ALIGNMENT = "childVerticalAlignment";

/**
* @brief Sets how the children in the layout should be aligned in the horizontal axis.
*
* @validvalue One of the constants #MAW_ALIGNMENT_LEFT, #MAW_ALIGNMENT_CENTER or #MAW_ALIGNMENT_RIGHT.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(horizontalLayoutHandle, MAW_HORIZONTAL_LAYOUT_CHILD_HORIZONTAL_ALIGNMENT, MAW_ALIGNMENT_CENTER);
* \endcode
*/
mosync.MAW_HORIZONTAL_LAYOUT_CHILD_HORIZONTAL_ALIGNMENT = "childHorizontalAlignment";

/**
* @brief Sets the top padding.
*
* @validvalue The top padding in pixels.
*
* @setonly
*
* @par Example
* \code
*  // Set a 50px top padding.
*	maWidgetSetProperty(horizontalLayoutHandle, MAW_HORIZONTAL_LAYOUT_PADDING_TOP, "50");
* \endcode
*/
mosync.MAW_HORIZONTAL_LAYOUT_PADDING_TOP = "paddingTop";

/**
* @brief Sets the left padding.
*
* @validvalue The left padding in pixels.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(horizontalLayoutHandle, MAW_HORIZONTAL_LAYOUT_PADDING_LEFT, "50");
* \endcode
*/
mosync.MAW_HORIZONTAL_LAYOUT_PADDING_LEFT = "paddingLeft";

/**
* @brief Sets the right padding.
*
* @validvalue The right padding in pixels.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(horizontalLayoutHandle, MAW_HORIZONTAL_LAYOUT_PADDING_RIGHT, "50");
* \endcode
*/
mosync.MAW_HORIZONTAL_LAYOUT_PADDING_RIGHT = "paddingRight";

/**
* @brief Sets the bottom padding.
*
* @validvalue The bottom padding in pixels.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(horizontalLayoutHandle, MAW_HORIZONTAL_LAYOUT_PADDING_BOTTOM, "50");
* \endcode
*/
mosync.MAW_HORIZONTAL_LAYOUT_PADDING_BOTTOM = "paddingBottom";

/**
* Sets the image that will be displayed.
*
* @validvalue MoSync handle to an uncompressed image resource.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(buttonHandle, MAW_IMAGE_IMAGE, toString(R_MY_IMAGE));
* \endcode
*/
mosync.MAW_IMAGE_IMAGE = "image";

/**
* @brief Specifies what type of scaling should be applied to the image.
*
* @validvalue Either 'none', 'scaleXY' or 'scalePreserveAspect'. Default 'none'.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(imageHandle, MAW_IMAGE_SCALE_MODE, "scaleXY");
* \endcode
*/
mosync.MAW_IMAGE_SCALE_MODE = "scaleMode";

/**
* @brief Sets or gets the text that is displayed in the label.
* Note: It is not available on Android, as native image buttons do not have text attached.
* @validvalue A null-terminated string.
*
* @setandget
*
* @par Example set
* \code
*	maWidgetSetProperty(imageButtonHandle, MAW_IMAGE_BUTTON_TEXT, "My button");
* \endcode
*
* @par Example get
* \code
*	char textBuffer[BUFFER_SIZE];
*	int result = maWidgetGetProperty(imageButtonHandle, MAW_IMAGE_BUTTON_TEXT, textBuffer, BUFFER_SIZE);
*	if (result > 0)
*	{
*	// Do something with the label text.
*	}
* \endcode
*/
mosync.MAW_IMAGE_BUTTON_TEXT = "text";

/**
* @brief Sets the vertical alignment of the text inside the button. If the widget's height is WRAP_CONTENT this property has no effect.
*
* @validvalue One of the constants #MAW_ALIGNMENT_TOP, #MAW_ALIGNMENT_CENTER or #MAW_ALIGNMENT_BOTTOM.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(imageButtonHandle, MAW_IMAGE_BUTTON_TEXT_VERTICAL_ALIGNMENT, MAW_ALIGNMENT_CENTER);
* \endcode
*/
mosync.MAW_IMAGE_BUTTON_TEXT_VERTICAL_ALIGNMENT = "textVerticalAlignment";

/**
* @brief Sets the horizontal alignment of the text inside the button. If the widget's height is WRAP_CONTENT this property has no effect.
*
* @validvalue Takes one of the constants #MAW_ALIGNMENT_TOP, #MAW_ALIGNMENT_CENTER or #MAW_ALIGNMENT_BOTTOM.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(imageButtonHandle, MAW_IMAGE_BUTTON_TEXT_HORIZONTAL_ALIGNMENT, MAW_ALIGNMENT_CENTER);
* \endcode
*/
mosync.MAW_IMAGE_BUTTON_TEXT_HORIZONTAL_ALIGNMENT = "textHorizontalAlignment";

/**
* @brief Sets the font color of the button's text.
*
* @validvalue A hexadecimal value 0xRRGGBB, where R, G and B are the red, green and blue components respectively.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(imageButtonHandle, MAW_IMAGE_BUTTON_FONT_COLOR, "0xff0000");
* \endcode
*/
mosync.MAW_IMAGE_BUTTON_FONT_COLOR = "fontColor";

/**
* @brief Sets the font size in points of the button's text.
*
* @validvalue A float that specifies the number of pixels on Android
* and WP7, and number of points on iOS.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(imageButtonHandle, MAW_IMAGE_BUTTON_FONT_SIZE, "13.0");
* \endcode
*/
mosync.MAW_IMAGE_BUTTON_FONT_SIZE = "fontSize";

/**
* Sets the background image. This will be scaled to fit the whole widget (not keeping the aspect).
*
* @validvalue MoSync handle to an uncompressed image resource.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(imageButtonHandle, MAW_IMAGE_BUTTON_BACKGROUND_IMAGE, toString(R_MY_IMAGE));
* \endcode
*/
mosync.MAW_IMAGE_BUTTON_BACKGROUND_IMAGE = "backgroundImage";

/**
* Sets the foreground image of the button. This won't be scaled at all.
*
* @validvalue MoSync handle to an uncompressed image resource.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(imageButtonHandle, MAW_IMAGE_BUTTON_IMAGE, toString(R_MY_IMAGE));
* \endcode
*/
mosync.MAW_IMAGE_BUTTON_IMAGE = "image";

/**
* @brief Sets the typeface and style in which the text should be displayed.
*
* @validvalue A font handle received from loading fonts using
* #maFontGetName and #maFontLoadWithName syscalls.
* Note: It is not available on Android, as native image buttons do not have text attached.
* @setonly
*
* @par Example
* \code
*	int nrFonts = maFontGetCount();
*	 char buf[256];
*	 // Get first font name.
*	 maFontGetName(1, buf, 256);
*	 // Load that font for size 10.
*	 int fontHandle = maFontLoadWithName(buf, 10);
*	 // Set that font to the label.
*	maWidgetSetProperty(imageButtonHandle, MAW_IMAGE_BUTTON_FONT_HANDLE, toString(fontHandle));
* \endcode
*/
mosync.MAW_IMAGE_BUTTON_FONT_HANDLE = "fontHandle";

/**
* @brief Sets or gets the text that is displayed in the label.
*
* @validvalue A null-terminated string.
*
* @setandget
*
* @par Example set
* \code
*	maWidgetSetProperty(labelHandle, MAW_LABEL_TEXT, "My label");
* \endcode
*
* @par Example get
* \code
*	char textBuffer[BUFFER_SIZE];
*	int result = maWidgetGetProperty(labelHandle, MAW_LABEL_TEXT, textBuffer, BUFFER_SIZE);
*	if (result > 0)
*	{
*	// Do something with the label text.
*	}
* \endcode
*/
mosync.MAW_LABEL_TEXT = "text";

/**
* @brief Sets the vertical alignment of the text inside the label. If the widget's height is WRAP_CONTENT this property has no effect.
*
* @validvalue One of the constants #MAW_ALIGNMENT_TOP, #MAW_ALIGNMENT_CENTER or #MAW_ALIGNMENT_BOTTOM.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(labelHandle, MAW_LABEL_TEXT_VERTICAL_ALIGNMENT, MAW_ALIGNMENT_CENTER);
* \endcode
*/
mosync.MAW_LABEL_TEXT_VERTICAL_ALIGNMENT = "textVerticalAlignment";

/**
* @brief Sets the horizontal alignment of the text inside the label. If the widget's height is WRAP_CONTENT this property has no effect.
*
* @validvalue Takes one of the constants #MAW_ALIGNMENT_TOP, #MAW_ALIGNMENT_CENTER or #MAW_ALIGNMENT_BOTTOM.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(labelHandle, MAW_LABEL_TEXT_HORIZONTAL_ALIGNMENT, MAW_ALIGNMENT_CENTER);
* \endcode
*/
mosync.MAW_LABEL_TEXT_HORIZONTAL_ALIGNMENT = "textHorizontalAlignment";

/**
* @brief Sets the font color of the label's text.
*
* @validvalue A hexadecimal value 0xRRGGBB, where R, G and B are the red, green and blue components respectively.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(labelHandle, MAW_LABEL_FONT_COLOR, "0xff0000");
* \endcode
*/
mosync.MAW_LABEL_FONT_COLOR = "fontColor";

/**
* @brief Sets the font size in points of the label's text.
*
* @validvalue A float that specifies the number of pixels on Android
* and WP7, and number of points on iOS.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(labelHandle, MAW_LABEL_FONT_SIZE, "13.0");
* \endcode
*/
mosync.MAW_LABEL_FONT_SIZE = "fontSize";

/**
* @brief Sets the typeface and style in which the text should be displayed.
*
* @validvalue A font handle received from loading fonts using
* #maFontGetName and #maFontLoadWithName syscalls.
*
* @setonly
*
* @par Example
* \code
*	int nrFonts = maFontGetCount();
*	 char buf[256];
*	 // Get first font name.
*	 maFontGetName(1, buf, 256);
*	 // Load that font for size 10.
*	 int fontHandle = maFontLoadWithName(buf, 10);
*	 // Set that font to the label.
*	maWidgetSetProperty(labelHandle, MAW_LABEL_FONT_HANDLE, toString(fontHandle));
* \endcode
*/
mosync.MAW_LABEL_FONT_HANDLE = "fontHandle";

/**
* @brief Sets the maximum number of lines used for rendering text.
* To remove any maximum limit, and use as many lines as needed, set the value of this property to 0.
*
* @validvalue An integer that specifies the maximum number of lines.
*
* @setandget.
*
* @par Example
* \code
*	maWidgetSetProperty(labelHandle, MAW_LABEL_MAX_NUMBER_OF_LINES, "3");
* \endcode
*/
mosync.MAW_LABEL_MAX_NUMBER_OF_LINES = "maxNumberOfLines";

/**
* @brief A plain table view.
* All section headers or footers are not displayed.
* Platform: Android, iOS and Windows Phone 7.
* Default value for list view.
*/
mosync.MAW_LIST_VIEW_TYPE_DEFAULT = 0;

/**
* @brief A plain table view.
* Any section headers or footers are displayed as inline separators.
* On iOS section headers or footers float when the table view is scrolled.
* Platform: iOS, Android and Windows Phone 7.
*/
mosync.MAW_LIST_VIEW_TYPE_ALPHABETICAL = 1;

/**
* @brief A table view whose sections present distinct groups of rows.
* The section headers and footers do not float.
* Platform: iOS, Android and Windows Phone 7.
*/
mosync.MAW_LIST_VIEW_TYPE_SEGMENTED = 2;

/**
* @brief List items cannot be edited.
* Platform: iOS.
* Default value for the list view.
*/
mosync.MAW_LIST_VIEW_MODE_DISPLAY = 0;

/**
* @brief List items can be edited.
* For more information see \link #WidgetListViewItemProperties
* List View Item Properties \endlink.
* Platform: iOS.
*/
mosync.MAW_LIST_VIEW_MODE_EDIT = 1;

/**
* @brief Every list view item will contain an image, a title and a subtitle.
* Platform: Windows Phone 7.
* Default value for list view.
*/
mosync.MAW_LIST_VIEW_STYLE_SUBTITLE = 0;

/**
* @brief Every list view item will contain an image and a title.
* Platform: Windows Phone 7.
*/
mosync.MAW_LIST_VIEW_STYLE_NO_SUBTITLE = 1;

/**
* @brief Set or get the list type.
* Set this property before adding the list to the screen/layout.
* Platform: Android, iOS and Windows Phone 7.
*
* @validvalue One of the \link #MAW_LIST_VIEW_TYPE_DEFAULT MAW_LIST_VIEW_TYPE \endlink constants.
* Default value is \link #MAW_LIST_VIEW_TYPE_DEFAULT MAW_LIST_VIEW_TYPE_DEFAULT \endlink.
*
* @setandget
*
* @par Example
* \code
*	char buffer[124];
*	sprintf(buffer, "%d", MAW_LIST_VIEW_TYPE_ALPHABETICAL);
*	maWidgetSetProperty(listHandle, MAW_LIST_VIEW_TYPE, buffer);
* \endcode
*/
mosync.MAW_LIST_VIEW_TYPE = "type";

/**
* @brief Set or get the list style.
* This property should be set before the list contains any children.
* Platform: Windows Phone 7.
*
* @validvalue One of the \link #MAW_LIST_VIEW_STYLE MAW_LIST_VIEW_STYLE \endlink constants.
* Default value is \link #MAW_LIST_VIEW_STYLE_SUBTITLE MAW_LIST_VIEW_STYLE_SUBTITLE \endlink.
*
* @setandget
*
* @par Example
* \code
*	char buffer[124];
*	sprintf(buffer, "%d", MAW_LIST_VIEW_STYLE_NO_SUBTITLE);
*	maWidgetSetProperty(listHandle, MAW_LIST_VIEW_STYLE, buffer);
* \endcode
*/
mosync.MAW_LIST_VIEW_STYLE = "style";

/**
* @brief Set or get the list mode.
* Platform: iOS.
*
* @validvalue One of the \link #MAW_LIST_VIEW_MODE_DISPLAY
* MAW_LIST_VIEW_MODE \endlink constants.
* Default value is \link #MAW_LIST_VIEW_MODE_DISPLAY MAW_LIST_VIEW_MODE_DISPLAY \endlink.
*
* @setandget
*
* @par Example
* \code
*	char buffer[124];
*	sprintf(buffer, "%d", MAW_LIST_VIEW_MODE_EDIT);
*	maWidgetSetProperty(listHandle, MAW_LIST_VIEW_MODE, buffer);
* \endcode
*/
mosync.MAW_LIST_VIEW_MODE = "mode";

/**
* @brief Reload all its items.
* Platform: iOS, Android and Windows Phone 7.
*
* @validvalue Empty string.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(listHandle, MAW_LIST_VIEW_RELOAD_DATA, "");
* \endcode
*/
mosync.MAW_LIST_VIEW_RELOAD_DATA = "reload_data";

/**
* @brief Enable/disable item selection.
* If you don't want to allow the user to select any item set this property to false.
* Platform: iOS, Android and Windows Phone 7.
*
* @validvalue "true" or "false".
* Default value is "true".
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(listHandle, MAW_LIST_VIEW_ALLOW_SELECTION, "false");
* \endcode
*/
mosync.MAW_LIST_VIEW_ALLOW_SELECTION = "allowselection";

/**
* @brief Enforces the focus on the list. Generally needed when for some reason the list looses it's focus.
*
* @validvalue None needed.
*
* Platform: Android.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(listViewHandle, MAW_LIST_VIEW_REQUEST_FOCUS, "");
* \endcode
*/
mosync.MAW_LIST_VIEW_REQUEST_FOCUS = "requestFocus";

/**
* @brief The item does not have any accessory type.
* This is the default value.
* Platform: iOS.
*/
mosync.MAW_LIST_VIEW_ITEM_ACCESSORY_TYPE_NONE = 0;

/**
* @brief The item has an accessory control shaped like a regular chevron.
* It is intended as a disclosure indicator.
* Platform: iOS.
*/
mosync.MAW_LIST_VIEW_ITEM_ACCESSORY_TYPE_DISCLOSURE = 1;

/**
* @brief The item has an accessory control that is a blue button with a chevron image as content.
* It is intended for configuration purposes.
* Platform: iOS.
*/
mosync.MAW_LIST_VIEW_ITEM_ACCESSORY_TYPE_DETAIL = 2;

/**
* @brief The cell has a check mark on its right side.
* Platform: iOS.
*/
mosync.MAW_LIST_VIEW_ITEM_ACCESSORY_TYPE_CHECKMARK = 3;

/**
* @brief The item has no editing control.
* This is the default value.
* Platform: iOS.
*/
mosync.MAW_LIST_VIEW_ITEM_EDIT_STYLE_NONE = 0;

/**
* @brief The item has the delete editing control.
* This control is a red circle enclosing a minus sign.
* Platform: iOS.
*/
mosync.MAW_LIST_VIEW_ITEM_EDIT_STYLE_DELETE = 1;

/**
* @brief The item has the insert editing control.
* This control is a green circle enclosing a plus sign.
* Platform: iOS.
*/
mosync.MAW_LIST_VIEW_ITEM_EDIT_STYLE_INSERT = 2;

/**
* @brief The item has no distinct style for when it is selected.
* Platform: iOS.
*/
mosync.MAW_LIST_VIEW_ITEM_SELECTION_STYLE_NONE = 0;

/**
* @brief The item has a blue background for selected state.
* This is the default value.
* Platform: iOS.
*/
mosync.MAW_LIST_VIEW_ITEM_SELECTION_STYLE_BLUE = 1;

/**
* @brief Then item has a gray background for selected state.
* Platform: iOS.
*/
mosync.MAW_LIST_VIEW_ITEM_SELECTION_STYLE_GRAY = 2;

/**
* @brief Sets the text part of the list view item. If there is an icon the text will be placed to the right of it, otherwise near the left edge.
*
* @validvalue A null-terminated string.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(listViewItemHandle, MAW_LIST_VIEW_ITEM_TEXT, "My label");
* \endcode
*/
mosync.MAW_LIST_VIEW_ITEM_TEXT = "text";

/**
* @brief Sets the subtitle part of the list view item. The subtitle will be placed bellow the item text.
*
* Platform: Windows Phone 7.
*
* @validvalue A null-terminated string.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(listViewItemHandle, MAW_LIST_VIEW_ITEM_SUBTITLE, "subtitle");
* \endcode
*/
mosync.MAW_LIST_VIEW_ITEM_SUBTITLE = "subtitle";

/**
* @brief Sets an icon of the list view item that is placed to the left of the text.
*
* @validvalue MoSync handle to an uncompressed image resource.
*
* @par Example
* \code
*	maWidgetSetProperty(listViewItemHandle, MAW_LIST_VIEW_ITEM_ICON, toString(R_MY_ICON));
* \endcode
*/
mosync.MAW_LIST_VIEW_ITEM_ICON = "icon";

/**
* @brief Sets the type of list item displayed. Provides the corresponding icon in the right side of the list view.
*
* @note Only available for iOS.
*
* @validvalue One of "none", "hasChildren", "hasDetails" or "isChecked".
*
* @par Example
* \code
*	maWidgetSetProperty(listViewItemHandle, MAW_LIST_VIEW_ITEM_ACCESSORY_TYPE, "hasChildren");
* \endcode
*/
mosync.MAW_LIST_VIEW_ITEM_ACCESSORY_TYPE = "accessoryType";

/**
* @brief Sets the font color of the text part.
*
* @validvalue  A hexadecimal value 0xRRGGBB, where R, G and B are the red, green and blue components respectively.
*
* @setonly
*
* @par Example set the font color to red.
* \code
*	maWidgetSetProperty(listViewItemHandle, MAW_LIST_VIEW_ITEM_FONT_COLOR, "0xFF0000");
* \endcode
*/
mosync.MAW_LIST_VIEW_ITEM_FONT_COLOR = "fontColor";

/**
* @brief Sets the font size in points of the text part.
*
* @validvalue A float that specifies the number of pixels on Android
* and WP7, and number of points on iOS.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(listViewItemHandle, MAW_LIST_VIEW_ITEM_FONT_SIZE, "13.0");
* \endcode
*/
mosync.MAW_LIST_VIEW_ITEM_FONT_SIZE = "fontSize";

/**
* @brief Sets the typeface and style in which the text should be displayed.
*
* @validvalue A font handle received from loading fonts using
* #maFontGetName and #maFontLoadWithName syscalls.
*
* @setonly
*
* @par Example
* \code
*	int nrFonts = maFontGetCount();
*	 char buf[256];
*	 // Get first font name.
*	 maFontGetName(1, buf, 256);
*	 // Load that font for size 10.
*	 int fontHandle = maFontLoadWithName(buf, 10);
*	 // Set that font to the list view item.
*	maWidgetSetProperty(listViewItemHandle, MAW_LIST_VIEW_ITEM_FONT_HANDLE, toString(fontHandle));
* \endcode
*/
mosync.MAW_LIST_VIEW_ITEM_FONT_HANDLE = "fontHandle";

/**
* @brief Set or get the edit value.
* If an item is editable it means that the user can insert or delete a cell.
* In order to have those options the segmented list must be in edit mode.
*
* Platform: iOS.
*
* @validvalue "false" or "true" string values.
* Default value is "true".
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(listItemHandle, MAW_LIST_VIEW_ITEM_EDIT, "true");
* \endcode
*/
mosync.MAW_LIST_VIEW_ITEM_EDIT = "edit";

/**
* @brief Set the title of the delete-confirmation button.
* The table view displays the "Delete" button when the user attempts to delete a row,
* either by swiping the row or tapping the red minus icon in editing mode.
*
* Platform: iOS.
*
* @validvalue A string.
* Default value is "Delete".
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(listItemHandle, MAW_LIST_VIEW_ITEM_DELETE_BUTTON_TITLE, "Remove");
* \endcode
*/
mosync.MAW_LIST_VIEW_ITEM_DELETE_BUTTON_TITLE = "deleteButtonTitle";

/**
* @brief Check if the item is currently showing the delete-confirmation button.
* When users tap the deletion control (the red circle to the left of the cell),
* the cell displays a "Delete" button on the right side of the cell.
*
* Platform: iOS.
*
* @validvalue "true" of "false".
*
* @getonly
*
* @par Example
* \code
*	char buffer[BUFFER_SIZE];
*	maWidgetGetProperty(listItemHandle, MAW_LIST_VIEW_ITEM_IS_SHOWING_DELETE_CONFIRMATION,
*	buffer, BUFFER_SIZE);
* \endcode
*/
mosync.MAW_LIST_VIEW_ITEM_IS_SHOWING_DELETE_CONFIRMATION = "isShowingDeleteConfirmation";

/**
* @brief Set the selected state of the item.
*
* Platform: iOS.
*
* @validvalue "true" to animate the transition between selected states,
* "false" to make the transition immediate.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(listItemHandle, MAW_LIST_VIEW_ITEM_SET_SELECTED, "true");
* \endcode
*/
mosync.MAW_LIST_VIEW_ITEM_SET_SELECTED = "setSelected";

/**
* @brief Set the unselected state of the item.
*
* Platform: iOS.
*
* @validvalue "true" to animate the transition between selected states,
* "false" to make the transition immediate.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(listItemHandle, MAW_LIST_VIEW_ITEM_SET_UNSELECTED, "true");
* \endcode
*/
mosync.MAW_LIST_VIEW_ITEM_SET_UNSELECTED = "setUnselected";

/**
* @brief Check if the item is selected.
*
* Platform: iOS and Android.
*
* @validvalue "true" if the item is selected, "false" otherwise.
*
* @getonly
*
* @par Example
* \code
*	char buffer[BUFFER_SIZE];
*	maWidgetGetProperty(listItemHandle, MAW_LIST_VIEW_ITEM_IS_SELECTED,
*	buffer, BUFFER_SIZE);
* \endcode
*/
mosync.MAW_LIST_VIEW_ITEM_IS_SELECTED = "isSelected";

/**
* @brief Set the highlighted state of the item.
*
* Platform: iOS.
*
* @validvalue "true" to animate the transition between highlighted states,
* "false" to make the transition immediate.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(listItemHandle, MAW_LIST_VIEW_ITEM_SET_HIGHLIGHTED, "true");
* \endcode
*/
mosync.MAW_LIST_VIEW_ITEM_SET_HIGHLIGHTED = "setHighlighted";

/**
* @brief Set the unhighlighted state of the item.
*
* Platform: iOS.
*
* @validvalue "true" to animate the transition between highlighted states,
* "false" to make the transition immediate.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(listItemHandle, MAW_LIST_VIEW_ITEM_SET_UNHIGHLIGHTED,
*	"true");
* \endcode
*/
mosync.MAW_LIST_VIEW_ITEM_SET_UNHIGHLIGHTED = "setUnhighlighted";

/**
* @brief Check if the item is highlighted.
*
* Platform: iOS.
*
* @validvalue "true" if the item is highlighted, "false" otherwise.
*
* @getonly
*
* @par Example
* \code
*	char buffer[BUFFER_SIZE];
*	maWidgetGetProperty(listItemHandle, MAW_LIST_VIEW_ITEM_IS_SELECTED,
*	buffer, BUFFER_SIZE);
* \endcode
*/
mosync.MAW_LIST_VIEW_ITEM_IS_HIGHLIGHTED = "isHighlighted";

/**
* @brief Set or get the type of standard accessory used by the item(normal state).
* The accessory view appears in the right side of the item in the table view’s normal state.
*
* Platform: iOS.
*
* @validvalue One of the \link MAW_LIST_VIEW_ITEM_ACCESSORY_TYPE
* MAW_LIST_VIEW_ITEM_ACCESSORY_TYPE_NONE \endlink values.
*
* @setandget
*
* @par Example
* \code
*	char buffer[BUFFER_SIZE];
*	sprintf(buffer, "%d", MAW_LIST_VIEW_ITEM_ACCESSORY_TYPE_CHECKMARK);
*	maWidgetSetProperty(listItemHandle, MAW_LIST_VIEW_ITEM_ACCESSORY_TYPE, buffer);
* \endcode
*/
mosync.MAW_LIST_VIEW_ITEM_ACCESSORY_TYPE_INT = "accessoryTypeInt";

/**
* @brief Set or get the type of standard accessory used by the item(editing state).
* The accessory view appears in the right side of the item in the table view’s editing state.
*
* Platform: iOS.
*
* @validvalue One of the \link MAW_LIST_VIEW_ITEM_ACCESSORY_TYPE
* MAW_LIST_VIEW_ITEM_ACCESSORY_TYPE_NONE \endlink values.
*
* @setandget
*
* @par Example
* \code
*	char buffer[BUFFER_SIZE];
*	sprintf(buffer, "%d", MAW_LIST_VIEW_ITEM_ACCESSORY_TYPE_CHECKMARK);
*	maWidgetSetProperty(listItemHandle,
*	   MAW_LIST_VIEW_ITEM_ACCESSORY_TYPE_EDIT_STATE buffer);
* \endcode
*/
mosync.MAW_LIST_VIEW_ITEM_ACCESSORY_TYPE_EDIT = "accessoryTypeEditState";

/**
* @brief Set or get the editing style of an item.
* This applies only for the editing state.
*
* Platform: iOS.
*
* @validvalue One of the \link MAW_LIST_VIEW_ITEM_EDIT_STYLE
* MAW_LIST_VIEW_ITEM_EDIT_STYLE_NONE \endlink values.
*
* @setandget
*
* @par Example
* \code
*	char buffer[BUFFER_SIZE];
*	sprintf(buffer, "%d", MAW_LIST_VIEW_ITEM_EDIT_STYLE_INSERT);
*	maWidgetSetProperty(listItemHandle,
*	   MAW_LIST_VIEW_ITEM_EDITING_STYLE, buffer);
* \endcode
*/
mosync.MAW_LIST_VIEW_ITEM_EDITING_STYLE = "editingStyle";

/**
* @brief Set or get the background color constant for an item when it's selected.
*
* Platform: iOS.
*
* @validvalue One of the \link MAW_LIST_VIEW_ITEM_SELECTION_STYLE
* MAW_LIST_VIEW_ITEM_SELECTION_STYLE_NONE \endlink values.
*
* @setandget
*
* @par Example
* \code
*	char buffer[BUFFER_SIZE];
*	sprintf(buffer, "%d", MAW_LIST_VIEW_ITEM_SELECTION_STYLE_GRAY);
*	maWidgetSetProperty(listItemHandle,
*	   MAW_LIST_VIEW_ITEM_SELECTION_STYLE, buffer);
* \endcode
*/
mosync.MAW_LIST_VIEW_ITEM_SELECTION_STYLE = "selectionStyle";

/**
* @brief A section that presents a group of rows, that correspond to the same #MAW_LIST_VIEW_SECTION_TITLE.
* Platform: iOS, Android and Windows Phone 7.
*/
mosync.MAW_LIST_VIEW_SECTION_TYPE_ALPHABETICAL = 1;

/**
* @brief A section that presents a group of rows, specifically list view items.
* Header and footer information can be set to segmented sections.
* Platform: iOS, Android and Windows Phone 7.
*/
mosync.MAW_LIST_VIEW_SECTION_TYPE_SEGMENTED = 2;

/**
* @brief Set or get the list section type.
* Set this property before adding list view items and adding it to the list.
* Platform: Android, iOS and Windows Phone 7.
*
* @validvalue One of the \link #MAW_LIST_VIEW_SECTION_TYPE_ALPHABETICAL MAW_LIST_VIEW_TYPE \endlink constants.
*
* @setandget
*
* @par Example
* \code
*   char buffer[124];
*   sprintf(buffer, "%d", MAW_LIST_VIEW_TYPE_SEGMENTED);
*   maWidgetSetProperty(listHandle, MAW_LIST_VIEW_TYPE, buffer);
*	sprintf(buffer, "%d", MAW_LIST_VIEW_SECTION_TYPE_SEGMENTED);
*	maWidgetSetProperty(listSectionHandle, MAW_LIST_VIEW_SECTION_TYPE, buffer);
*   maWidgetAddChild(listHandle, listSectionHandle);
* \endcode
*/
mosync.MAW_LIST_VIEW_SECTION_TYPE = "type";

/**
* @brief Set or get section title.
* Section title will appear on the right side of the list.
* This preview letter is available only for list views of alphabetical type.
*
* Platform: iOS, Android and Windows Phone 7.
*
* @validvalue A string.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(listSectionHandle, MAW_LIST_VIEW_SECTION_TITLE, "A");
* \endcode
*/
mosync.MAW_LIST_VIEW_SECTION_TITLE = "title";

/**
* @brief Set or get section header text.
* Section text will appear above the section items.
*
* Platform: iOS, Android and Windows Phone 7.
*
* @validvalue A string.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(listSectionHandle, MAW_LIST_VIEW_SECTION_HEADER, "Header text");
* \endcode
*/
mosync.MAW_LIST_VIEW_SECTION_HEADER = "header";

/**
* @brief Set or get section footer text.
* Section text will appear below the section items.
*
* Platform: iOS, Android and Windows Phone 7.
*
* @validvalue A string.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(listSectionHandle, MAW_LIST_VIEW_SECTION_FOOTER, "Footer text");
* \endcode
*/
mosync.MAW_LIST_VIEW_SECTION_FOOTER = "footer";

/**
* @brief Set the section header background color.
* Default value is 0xBEBEBE (grey).
*
* Platform: Android and Windows Phone 7.
*
* @validvalue A hexadecimal value 0xRRGGBB, where R, G and B are the red, green and blue components respectively.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(listSectionHandle, MAW_LIST_VIEW_SECTION_HEADER_BACKGROUND, "0xff0000");
* \endcode
*/
mosync.MAW_LIST_VIEW_SECTION_HEADER_BACKGROUND = "headerBackground";

/**
* @brief Set the section footer background color.
* Default value is 0xBEBEBE (grey).
*
* Platform: Android and Windows Phone 7.
*
* @validvalue A hexadecimal value 0xRRGGBB, where R, G and B are the red, green and blue components respectively.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(listSectionHandle, MAW_LIST_VIEW_SECTION_FOOTER_BACKGROUND, "0xff0000");
* \endcode
*/
mosync.MAW_LIST_VIEW_SECTION_FOOTER_BACKGROUND = "footerBackground";

/**
* @brief Sets the font color of the header.
*
* Platform: Android and Windows Phone 7.
*
* @validvalue A hexadecimal value 0xRRGGBB, where R, G and B are the red, green and blue components respectively.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(listSectionHandle, MAW_LIST_VIEW_SECTION_HEADER_FONT_COLOR, "0xff0000");
* \endcode
*/
mosync.MAW_LIST_VIEW_SECTION_HEADER_FONT_COLOR = "headerFontColor";

/**
* @brief Sets the font color of the footer.
*
* Platform: Android and Windows Phone 7.
*
* @validvalue A hexadecimal value 0xRRGGBB, where R, G and B are the red, green and blue components respectively.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(listSectionHandle, MAW_LIST_VIEW_SECTION_FOOTER_FONT_COLOR, "0xff0000");
* \endcode
*/
mosync.MAW_LIST_VIEW_SECTION_FOOTER_FONT_COLOR = "footerFontColor";

/**
* @brief Sets the font size in points of the header.
* Default value is 20.
*
* Platform: Android and Windows Phone 7.
*
* @validvalue A float that specifies the number of pixels on Android.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(listSectionHandle, MAW_LIST_VIEW_SECTION_HEADER_FONT_SIZE, "13.0");
* \endcode
*/
mosync.MAW_LIST_VIEW_SECTION_HEADER_FONT_SIZE = "headerFontSize";

/**
* @brief Sets the font size in points of the footer.
* Default value is 15.
*
* Platform: Android and Windows Phone 7.
*
* @validvalue A float that specifies the number of pixels on Android.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(listSectionHandle, MAW_LIST_VIEW_SECTION_FOOTER_FONT_SIZE, "13.0");
* \endcode
*/
mosync.MAW_LIST_VIEW_SECTION_FOOTER_FONT_SIZE = "footerFontSize";

/**
* @brief Sets the typeface and style in which the header should be displayed.
*
* @validvalue A font handle received from loading fonts using
* #maFontGetName and #maFontLoadWithName syscalls.
*
* Platform: Android and Windows Phone 7.
*
* @setonly
*
* @par Example
* \code
*	int nrFonts = maFontGetCount();
*	 char buf[256];
*	 // Get first font name.
*	 maFontGetName(1, buf, 256);
*	 // Load that font for size 10.
*	 int fontHandle = maFontLoadWithName(buf, 10);
*	 // Set that font to the header.
*	maWidgetSetProperty(listSectionHandle, MAW_LIST_VIEW_SECTION_HEADER_FONT_HANDLE, toString(fontHandle));
* \endcode
*/
mosync.MAW_LIST_VIEW_SECTION_HEADER_FONT_HANDLE = "headerFontHandle";

/**
* @brief Sets the typeface and style in which the footer should be displayed.
*
* @validvalue A font handle received from loading fonts using
* #maFontGetName and #maFontLoadWithName syscalls.
*
* Platform: Android and Windows Phone 7.
*
* @setonly
*
* @par Example
* \code
*	int nrFonts = maFontGetCount();
*	 char buf[256];
*	 // Get first font name.
*	 maFontGetName(1, buf, 256);
*	 // Load that font for size 10.
*	 int fontHandle = maFontLoadWithName(buf, 10);
*	 // Set that font to the header.
*	maWidgetSetProperty(listSectionHandle, MAW_LIST_VIEW_SECTION_FOOTER_FONT_HANDLE, toString(fontHandle));
* \endcode
*/
mosync.MAW_LIST_VIEW_SECTION_FOOTER_FONT_HANDLE = "footerFontHandle";

/**
* @brief Sets the horizontal alignment of the text inside the header.
*
* Platform: Android and Windows Phone 7.
*
* @validvalue Takes one of the constants #MAW_ALIGNMENT_TOP, #MAW_ALIGNMENT_CENTER or #MAW_ALIGNMENT_BOTTOM.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(listSectionHandle, MAW_LIST_VIEW_SECTION_HEADER_HORIZONTAL_ALIGNMENT, MAW_ALIGNMENT_CENTER);
* \endcode
*/
mosync.MAW_LIST_VIEW_SECTION_HEADER_HORIZONTAL_ALIGNMENT = "headerHorizontalAlignment";

/**
* @brief Sets the horizontal alignment of the text inside the footer.
*
* Platform: Android and Windows Phone 7.
*
* @validvalue Takes one of the constants #MAW_ALIGNMENT_TOP, #MAW_ALIGNMENT_CENTER or #MAW_ALIGNMENT_BOTTOM.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(listSectionHandle, MAW_LIST_VIEW_SECTION_FOOTER_HORIZONTAL_ALIGNMENT, MAW_ALIGNMENT_CENTER);
* \endcode
*/
mosync.MAW_LIST_VIEW_SECTION_FOOTER_HORIZONTAL_ALIGNMENT = "footerHorizontalAlignment";

/**
* @brief Sets the vertical alignment of the text inside the header.
*
* Platform: Android and Windows Phone 7.
*
* @validvalue One of the constants #MAW_ALIGNMENT_TOP, #MAW_ALIGNMENT_CENTER or #MAW_ALIGNMENT_BOTTOM.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(listSectionHandle, MAW_LIST_VIEW_SECTION_HEADER_VERTICAL_ALIGNMENT, MAW_ALIGNMENT_CENTER);
* \endcode
*/
mosync.MAW_LIST_VIEW_SECTION_HEADER_VERTICAL_ALIGNMENT = "headerVerticalAlignment";

/**
* @brief Sets the vertical alignment of the text inside the footer.
*
* Platform: Android and Windows Phone 7.
*
* @validvalue One of the constants #MAW_ALIGNMENT_TOP, #MAW_ALIGNMENT_CENTER or #MAW_ALIGNMENT_BOTTOM.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(listSectionHandle, MAW_LIST_VIEW_SECTION_FOOTER_VERTICAL_ALIGNMENT, MAW_ALIGNMENT_CENTER);
* \endcode
*/
mosync.MAW_LIST_VIEW_SECTION_FOOTER_VERTICAL_ALIGNMENT = "footerVerticalAlignment";

/**
* Road map type (landforms not visible).
*/
mosync.MAW_MAP_TYPE_ROAD = 0;

/**
* Sattelite map type (landforms visible).
*/
mosync.MAW_MAP_TYPE_SATELLITE = 1;

/**
* @brief The api key used to access the full features of the google map.
* The iOS platform doesn't require a key.
*
* @validvalue A string containing a google maps key. For further details on how to
* obtain this key go to "https://developers.google.com/maps/documentation/android/mapkey".
*
* @setonly
* @par Example
* \code
*	maWidgetSetProperty(mapHandle, MAW_MAP_API_KEY_GOOGLE, "a_valid_google_key");
* \endcode
*/
mosync.MAW_MAP_API_KEY_GOOGLE = "api_key_google";

/**
* @brief The api key used to access the full features of the bing map (on windows phone platform).
*
* @validvalue A string containing a bing maps key. For further details on how to
* obtain this key go to "http://msdn.microsoft.com/en-us/library/ff428642.aspx".
*
* @setonly
* @par Example
* \code
*	maWidgetSetProperty(mapHandle, MAW_MAP_API_KEY_BING, "a_valid_bing_key");
* \endcode
*/
mosync.MAW_MAP_API_KEY_BING = "api_key_bing";

/**
* @brief Set or get the map type.
*
* @validvalue One of the two values: MAW_MAP_TYPE_SATELLITE or MAW_MAP_TYPE_ROAD.
*
* @setandget
* @par Example
* \code
*	maWidgetSetProperty(mapHandle, MAW_MAP_TYPE, MAW_MAP_TYPE_SATELLITE);
*	char mapType[BUF_SIZE];
*	maWidgetGetProperty(mapHandle, MAW_MAP_TYPE, mapType, BUF_SIZE);
* \endcode
*/
mosync.MAW_MAP_TYPE = "type";

/**
* @brief Sets and gets the zoom level of the map.
*
* @validvalue A integer value between 0 and 21.
*
* @setandget
* @par Example
* \code
*	maWidgetSetProperty(mapHandle, MAW_MAP_ZOOM_LEVEL, "4");
*	maWidgetSetProperty(mapHandle, MAW_MAP_ZOOM_LEVEL);
*	char zoomLevel[BUF_SIZE];
*	maWidgetGetProperty(mapHandle, MAW_MAP_ZOOM_LEVEL, zoomLevel, BUF_SIZE);
* \endcode
*/
mosync.MAW_MAP_ZOOM_LEVEL = "zoom_level";

/**
* @brief Disables/enables the interaction between the user and the map.
*
* @validvalue A boolean string 'true' or 'false'.
*
* @setandget
* @par Example
* \code
*	maWidgetSetProperty(mapHandle, MAW_MAP_INTERRACTION_ENABLED, "true");
*	char interractionEnabled[BUF_SIZE];
*	maWidgetGetProperty(mapHandle, MAW_MAP_INTERRACTION_ENABLED, interractionEnabled, BUF_SIZE);
* \endcode
*/
mosync.MAW_MAP_INTERRACTION_ENABLED = "interraction_enabled";

/**
* @brief Set the map center latitude coordinate.
*
* @validvalue A double value between -90.0 and 90.0.
*
* @setonly
* @par Example
* \code
*	maWidgetSetProperty(mapHandle, MAW_MAP_CENTER_LATITUDE, "43.232544");
*	maWidgetSetProperty(mapHandle, MAW_MAP_CENTER_LATITUDE, "-12.42324");
* \endcode
*/
mosync.MAW_MAP_CENTER_LATITUDE = "center_latitude";

/**
* @brief Set the map center longitude coordinate.
*
* @validvalue A double value between -180.0 and 180.0.
*
* @setonly
* @par Example
* \code
*	maWidgetSetProperty(mapHandle, MAW_MAP_CENTER_LONGITUDE, "80.43352");
*	maWidgetSetProperty(mapHandle, MAW_MAP_CENTER_LONGITUDE, "-54.56442");
* \endcode
*/
mosync.MAW_MAP_CENTER_LONGITUDE = "center_longitude";

/**
* @brief Set the map zoom level value.
*
* @validvalue A double value between 0 and 21.
*
* @setonly
* @par Example
* \code
*	maWidgetSetProperty(mapHandle, MAW_MAP_CENTER_ZOOM_LEVEL, "12");
*	maWidgetSetProperty(mapHandle, MAW_MAP_CENTER_ZOOM_LEVEL, "3");
* \endcode
*/
mosync.MAW_MAP_CENTER_ZOOM_LEVEL = "center_zoom_level";

/**
 * @brief Property used to center the map.
 *
 * @validvalue A boolean string: "true" or "false".
 *
 * @setonly
 * @par Example
 * \code
 *	 maWidgetSetProperty(mapHandle, MAW_MAP_CENTERED, "true"); // centers the map on the already set map center
 * \endcode
 */
mosync.MAW_MAP_CENTERED = "centered";

/**
 * @brief Property used to specify the upper left corner latitude of the visible area.
 *
 * @validvalue A double value between -90.0 and 90.0.
 *
 * @setandget
 * @par Example
 * \code
 *	 maWidgetSetProperty(mapHandle, MAW_MAP_VISIBLE_AREA_UPPER_LEFT_CORNER_LATITUDE, "-34.34234");
 * \endcode
 */
mosync.MAW_MAP_VISIBLE_AREA_UPPER_LEFT_CORNER_LATITUDE = "visible_area_upper_left_corner_latitude";

/**
 * @brief Property used specify the upper left corner longitude of the visible area.
 *
 * @validvalue A double value between -180.0 and 180.0.
 *
 * @setandget
 * @par Example
 * \code
 *	 maWidgetSetProperty(mapHandle, MAW_MAP_VISIBLE_AREA_UPPER_LEFT_CORNER_LONGITUDE, "134.312");
 * \endcode
 */
mosync.MAW_MAP_VISIBLE_AREA_UPPER_LEFT_CORNER_LONGITUDE = "visible_area_upper_left_corner_longitude";

/**
 * @brief Property used specify the lower right corner latitude of the visible area.
 *
 * @validvalue A double value between -90.0 and 90.0.
 *
 * @setandget
 * @par Example
 * \code
 *	 maWidgetSetProperty(mapHandle, MAW_MAP_VISIBLE_AREA_LOWER_RIGHT_CORNER_LATITUDE, "43.2322");
 * \endcode
 */
mosync.MAW_MAP_VISIBLE_AREA_LOWER_RIGHT_CORNER_LATITUDE = "visible_area_lower_right_corner_latitude";

/**
 * @brief Property used specify the lower right corner longitude of the visible area.
 *
 * @validvalue A double value between -180.0 and 180.0.
 *
 * @setandget
 * @par Example
 * \code
 *	 maWidgetSetProperty(mapHandle, MAW_MAP_VISIBLE_AREA_LOWER_RIGHT_CORNER_LONGITUDE, "-100.2324");
 * \endcode
 */
mosync.MAW_MAP_VISIBLE_AREA_LOWER_RIGHT_CORNER_LONGITUDE = "visible_area_lower_right_corner_longitude";

/**
* @brief Used to center the map on a previously set visible area.
*
* @validvalue A boolean string 'true' or 'false'.
*
* @setonly
* @par Example
* \code
*	maWidgetSetProperty(mapHandle, MAP_CENTERED_ON_VISIBLE_AREA, "true");
* \endcode
*/
mosync.MAW_MAP_CENTERED_ON_VISIBLE_AREA = "centered_on_visible_area";

/**
* @brief Set the map pin latitude coordinate.
*
* @validvalue A double value between -90.0 and 90.0.
*
* @setonly
* @par Example
* \code
*	maWidgetSetProperty(mapHandle, MAW_MAP_PIN_LATITUDE, "43.232544");
*	maWidgetSetProperty(mapHandle, MAW_MAP_PIN_LATITUDE, "-12.42324");
* \endcode
*/
mosync.MAW_MAP_PIN_LATITUDE = "latitude";

/**
* @brief Set the map pin longitude coordinate.
*
* @validvalue A double value between -180.0 and 180.0.
*
* @setonly
* @par Example
* \code
*	maWidgetSetProperty(mapHandle, MAW_MAP_PIN_LONGITUDE, "80.43352");
*	maWidgetSetProperty(mapHandle, MAW_MAP_PIN_LONGITUDE, "-124.56442");
* \endcode
*/
mosync.MAW_MAP_PIN_LONGITUDE = "longitude";

/**
* @brief Set the map pin text.
*
* @validvalue A string value.
*
* @setandget
* @par Example
* \code
*	maWidgetSetProperty(mapHandle, MAW_MAP_PIN_TEXT, "Cluj");
* \endcode
*/
mosync.MAW_MAP_PIN_TEXT = "text";

/**
* @brief Sets or gets the title.
* If the property receives am empty string then the title bar becomes invisible.
* @validvalue A null-terminated string.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(dialogHandle, MAW_MODAL_DIALOG_TITLE, "MyDialog");
* \endcode
*/
mosync.MAW_MODAL_DIALOG_TITLE = "title";

/**
* @brief Sets the origin arrow position for a popover dialog.
* Note: This property is only available on the iPad.
*
* @validvalue One of the five MAW_CONSTANT_ARROW_ values, or a bitwise or combination of them.
*
* @setonly
*
* @par Example
* \code
*	// Allow the popover to use any arrow
*	maWidgetSetProperty(dialogHandle, MAW_MODAL_DIALOG_ARROW_POSITION, MAW_CONSTANT_ARROW_ANY);
* \endcode
*/
mosync.MAW_MODAL_DIALOG_ARROW_POSITION = "arrowPosition";

/**
* @brief Allow or prohibits the user from dismissing a popover dialog by tapping outside of it.
* Note: This property is only available on the iPad.
*
* @validvalue "true"or "false".
*
* @setonly
*
* @par Example
* \code
*	// Prohibit the user from dismissing the popover
*	maWidgetSetProperty(dialogHandle, MAW_MODAL_DIALOG_USER_CAN_DISMISS, "false");
* \endcode
*/
mosync.MAW_MODAL_DIALOG_USER_CAN_DISMISS = "userCanDismiss";

/**
* @brief Sets or gets the title.
*
* @validvalue A null-terminated string.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(navBarHandle, MAW_NAV_BAR_TITLE, "MyScreen");
* \endcode
*/
mosync.MAW_NAV_BAR_TITLE = "title";

/**
* Sets the icon of the nav bar. This won't be scaled at all.
*
* @validvalue MoSync handle to an uncompressed image resource. The size of the image should be small enough to fit in the nav bar.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(navBarHandle, MAW_NAV_BAR_ICON, toString(R_MY_IMAGE));
* \endcode
*/
mosync.MAW_NAV_BAR_ICON = "icon";

/**
* @brief Sets the text for the back button.
* This can be set only when the navigation bar was
* attached to a screen that is not part of a stack screen.
* Note: this is available only on iOS.
* On Android the back behavior is handled by the device's back button.
*
* @validvalue A null-terminated string.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(navBarHandle, MAW_NAV_BAR_BACK_BTN, "Home");
* \endcode
*/
mosync.MAW_NAV_BAR_BACK_BTN = "backBtn";

/**
* @brief Sets the font color of the title.
*
* @validvalue A hexadecimal value 0xRRGGBB, where R, G and B are the red, green and blue components respectively.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(navBarHandle, MAW_NAV_BAR_TITLE_FONT_COLOR, "0xff0000");
* \endcode
*/
mosync.MAW_NAV_BAR_TITLE_FONT_COLOR = "titleFontColor";

/**
* @brief Sets the font size in points of the title.
*
* @validvalue A float that specifies the number of pixels on Android
* and WP7, and number of points on iOS.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(navBarHandle, MAW_NAV_BAR_TITLE_FONT_SIZE, "13.0");
* \endcode
*/
mosync.MAW_NAV_BAR_TITLE_FONT_SIZE = "titleFontSize";

/**
* @brief Sets the typeface and style in which the title should be displayed.
*
* @validvalue A font handle received from loading fonts using
* #maFontGetName and #maFontLoadWithName syscalls.
*
* @setonly
*
* @par Example
* \code
*	int nrFonts = maFontGetCount();
*	 char buf[256];
*	 // Get first font name.
*	 maFontGetName(1, buf, 256);
*	 // Load that font for size 10.
*	 int fontHandle = maFontLoadWithName(buf, 10);
*	 // Set that font to the label.
*	maWidgetSetProperty(navBarHandle, MAW_NAV_BAR_TITLE_FONT_HANDLE, toString(fontHandle));
* \endcode
*/
mosync.MAW_NAV_BAR_TITLE_FONT_HANDLE = "titleFontHandle";

/**
* @brief Sets or gets the current value for the number picker.
* If the value is less than MAW_NUMBER_PICKER_MIN_VALUE property value, the current value is set to min.
* If the value is greater than MAW_NUMBER_PICKER_MAX_VALUE value, the current value is set to max.
*
* @validvalue A valid int.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(numberPickerHandle, MAW_NUMBER_PICKER_VALUE, "50");
* \endcode
*/
mosync.MAW_NUMBER_PICKER_VALUE = "value";

/**
* @brief Sets or gets the min value of the picker.
*
* @validvalue An int that specifies the minimum value.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(numberPickerHandle, MAW_NUMBER_PICKER_MIN_VALUE, "0");
* \endcode
*/
mosync.MAW_NUMBER_PICKER_MIN_VALUE = "minValue";

/**
* @brief Sets or gets the max value of the picker.
*
* @validvalue An int that specifies the maximum value.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(numberPickerHandle, MAW_NUMBER_PICKER_MAX_VALUE, "100");
* \endcode
*/
mosync.MAW_NUMBER_PICKER_MAX_VALUE = "maxValue";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_ADD = "17301555";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_AGENDA = "17301556";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_ALWAYS_LANDSCAPE_PORTRAIT = "17301557";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_CALL = "17301558";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_CAMERA = "17301559";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_CLOSE_CLEAR_CANCEL = "17301560";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_COMPASS = "17301561";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_CROP = "17301562";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_DAY = "17301563";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_DELETE = "17301564";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_DIRECTIONS = "17301565";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_EDIT = "17301566";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_GALLERY = "17301567";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_HELP = "17301568";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_INFO_DETAILS = "17301569";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_MANAGE = "17301570";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_MAPMODE = "17301571";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_MONTH = "17301572";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_MORE = "17301573";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_MY_CALENDAR = "17301574";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_MYLOCATION = "17301575";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_MYPLACES = "17301576";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_PREFERENCES = "17301577";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_RECENT_HISTORY = "17301578";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_REPORT_IMAGE = "17301579";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_REVERT = "17301580";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_ROTATE = "17301581";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_SAVE = "17301582";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_SEARCH = "17301583";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_SEND = "17301584";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_SET_AS = "17301585";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_SHARE = "17301586";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_SLIDESHOW = "17301587";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_SORT_ALPHABETICALLY = "17301660";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_SORT_BY_SIZE = "17301661";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_TODAY = "17301588";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_UPLOAD = "17301589";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_UPLOAD_YOU_TUBE = "17301590";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_VIEW = "17301591";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_WEEK = "17301592";

mosync.MAW_OPTIONS_MENU_ICON_CONSTANT_ZOOM = "17301593";

/**
* @copydoc #MAW_SCREEN_TITLE
*/
mosync.MAW_PANORAMA_VIEW_TITLE = "title";

/**
* @brief Sets or gets the currently shown screen to the screen with the given index.
*
* @validvalue A 0-indexed tab number.
*
* @setandget
*
* @par Example set
* \code
*	maWidgetSetProperty(panoramaViewHandle, MAW_PANORAMA_VIEW_CURRENT_SCREEN, "1");
* \endcode
*
* @par Example get
* \code
*	char currentScreenBuffer[BUFFER_SIZE];
*	int result = maWidgetGetProperty(
*	panoramaViewHandle,
*	MAW_PANORAMA_VIEW_CURRENT_SCREEN,
*	currentScreenBuffer,
*	BUFFER_SIZE);
*	if (result > 0)
*	{
*	// Do something with current screen.
*	}
* \endcode
*/
mosync.MAW_PANORAMA_VIEW_CURRENT_SCREEN = "currentScreen";

/**
 * @brief Sets the background image of the view
 *
 * @validvalue MoSync handle to an uncompressed image resource. The size of the image should be large enough to fill the space used by the panorama
 *
 * @setonly
 *
 * @par Example
 * \code
 *	maWidgetSetProperty(panoramaViewHandle, MAW_PANORAMA_VIEW_BACKGROUND_IMAGE, toString(R_MY_IMG));
 * \endcode
 */
mosync.MAW_PANORAMA_VIEW_BACKGROUND_IMAGE = "backgroundImage";

/**
* @brief Sets or gets the range of the progress bar to 0..max.
*
* @validvalue An positive integer that specifies the upper range of this progress bar.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(progressBarHandle, MAW_PROGRESS_BAR_MAX, "100");
* \endcode
*/
mosync.MAW_PROGRESS_BAR_MAX = "max";

/**
* @brief Set or gets the current progress to the specified value.
*
* @validvalue An int that specifies the new progress, between 0 and max value. See \ref MAW_PROGRESS_BAR_MAX.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(progressBarHandle, MAW_PROGRESS_BAR_PROGRESS, "10");
* \endcode
*/
mosync.MAW_PROGRESS_BAR_PROGRESS = "progress";

/**
* @brief Increase the progress bar's progress by the specified amount.
*
* @validvalue An int that specifies the amount by which the progress must be increased.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(progressBarHandle, MAW_PROGRESS_BAR_INCREMENT_PROGRESS, "20");
* \endcode
*/
mosync.MAW_PROGRESS_BAR_INCREMENT_PROGRESS = "incrementProgress";

/**
* @brief Get the checked state of the radio button.
*
* @validvalue A boolean string 'true' or 'false'.
*
* @getonly
*
* @par Example
* \code
*	char state[BUFFER_SIZE];
*	maWidgetGetProperty(radioButtonHandle, MAW_RADIO_BUTTON_CHECKED, state, BUFFER_SIZE);
* \endcode
*/
mosync.MAW_RADIO_BUTTON_CHECKED = "checked";

/**
* @brief Change the checked state of the view to the inverse of its current state.
* If the radio button is already checked, this method will not toggle the radio button.
*
* @validvalue No neccessary value needed.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(radioButtonHandle, MAW_RADIO_BUTTON_TOGGLE, "");
* \endcode
*/
mosync.MAW_RADIO_BUTTON_TOGGLE = "toggle";

/**
* @brief Set or get the text to display.
*
* @validvalue A null-terminated string.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(radioButtonHandle, MAW_RADIO_BUTTON_TEXT, "Option A");
* \endcode
*/
mosync.MAW_RADIO_BUTTON_TEXT = "text";

/**
* @brief Specifies the text color of the radio button.
*
* @validvalue A hexadecimal value 0xRRGGBB, where R, G and B are the red, green and blue components respectively.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(widgetHandle, MAW_RADIO_BUTTON_TEXT_COLOR, "0xff0000"); // Red
* \endcode
*/
mosync.MAW_RADIO_BUTTON_TEXT_COLOR = "textcolor";

/**
* @brief Add the radio buttons grouped in this widget.
* This is the only widget type that accepts Radio Buttons as children.
*
* @validvalue An int specifying the radio button handle.
*
* @setonly
*
* @par Example
* \code
*	// Attach two radio buttons to this group.
*	maWidgetSetProperty(radioGroupHandle, MAW_RADIO_GROUP_ADD_VIEW, "3");
*	maWidgetSetProperty(radioGroupHandle, MAW_RADIO_GROUP_ADD_VIEW, "4");
* \endcode
*/
mosync.MAW_RADIO_GROUP_ADD_VIEW = "addview";

/**
* @brief Clear the selection.
* When the selection is cleared, no radio button in this group is selected and
* #MAW_RADIO_GROUP_SELECTED returns -1.
*
* @validvalue No neccessary value needed.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(radioGroupHandle, MAW_RADIO_GROUP_CLEAR_CHECK, "");
* \endcode
*/
mosync.MAW_RADIO_GROUP_CLEAR_CHECK = "clearcheck";

/**
* @brief Set or get the selected radio button in this group.
* Upon empty selection, get property returns -1.
* Setting -1 as the selection identifier clears the selection; such an operation
* is equivalent to invoking #MAW_RADIO_GROUP_CLEAR_CHECK.
*
* @validvalue A valid radio button handle.
*
* @setandget
*
* @par Example
* \code
*	char buttonHandle[BUF_SIZE];
*	maWidgetGetProperty(radioGroupHandle, MAW_RADIO_GROUP_SELECTED, buttonHandle, BUF_SIZE);
* \endcode
*/
mosync.MAW_RADIO_GROUP_SELECTED = "selected";

/**
* @brief Set or get the number of stars to show.
* Usually, the default stars number is 5.
* @validvalue An int that specifies the number of stars to show.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(ratingBarHandle, MAW_RATING_BAR_NUM_STAR, "4");
* \endcode
*/
mosync.MAW_RATING_BAR_NUM_STAR = "numstar";

/**
* @brief Set or get the current rating (number of stars filled).
*
* @validvalue A float that specifies the number of stars filled.
*
* @setandget
* @par Example
* \code
*	maWidgetSetProperty(ratingBarHandle, MAW_RATING_BAR_RATING, "3.0");
* \endcode
*/
mosync.MAW_RATING_BAR_RATING = "rating";

/**
* @brief Set or get the step size (granularity) of this rating bar.
* By default the granularity is 0.5.
* @validvalue A float that specifies the step size.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(ratingBarHandle, MAW_RATING_BAR_GRANULARITY, "1.0");
* \endcode
*/
mosync.MAW_RATING_BAR_GRANULARITY = "granularity";

/**
* @brief Sets the isScrollable boolean
*
* @validvalue "true" or "false", for "true" the layout will become scrollable otherwise it will become unscrollable
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(verticalLayoutHandle, MAW_RELATIVE_LAYOUT_SCROLLABLE, "true");
* \endcode
*/
mosync.MAW_RELATIVE_LAYOUT_SCROLLABLE = "scrollable";

/**
* @brief Sets the content offset. The layout will be scrolled to the given coordinate.
* Platform: iOS.
*
* @validvalue Two int values separated by dash "-". The first int value represents the x coord and
* the second value represents the y coord.
* If the value is not as described the content offset will not be set and syscall will return
* #MAW_RES_INVALID_PROPERTY_VALUE.
* The default value is (0,0).
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(verticalLayoutHandle, MAW_RELATIVE_LAYOUT_SCROLLABLE, "30-30");
* \endcode
*/
mosync.MAW_RELATIVE_LAYOUT_CONTENT_OFFSET = "contentOffset";

/**
* @brief Sets the title of a screen. The screen title is used by tab screen to display a text on the tab indicator.
*
* @validvalue Null terminated string. The length of the string should be short enough to fit in a tab indicator.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(screenHandle, MAW_SCREEN_TITLE, "My title");
* \endcode
*/
mosync.MAW_SCREEN_TITLE = "title";

/**
* @brief Sets an icon for a screen. The icon is used by a tab screen to display an icon on the tab indicator.
*
* @validvalue MoSync handle to an uncompressed image resource. The size of the image should be small enough to fit in a tab indicator.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(screenHandle, MAW_SCREEN_ICON, toString(R_MY_ICON));
* \endcode
*/
mosync.MAW_SCREEN_ICON = "icon";

/**
* @brief Remove the options menu from this screen.
* The options menu can be added by calling \ref maWidgetScreenAddOptionsMenuItem for each item.
*
* @validvalue No value needed.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(screenHandle, MAW_SCREEN_REMOVE_OPTIONS_MENU, "");
* \endcode
*/
mosync.MAW_SCREEN_REMOVE_OPTIONS_MENU = "removeoptionsmenu";

/**
* @brief Set or get the current text of the search bar.
*
* @validvalue A null-terminated string.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(searchBarHandle, MAW_SEARCH_BAR_TEXT, "My search query");
* \endcode
*/
mosync.MAW_SEARCH_BAR_TEXT = "text";

/**
* @brief Set a text in the search bar that acts as a placeholder when an edit box is empty.
*
* @validvalue A null-terminated string.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(searchBarHandle, MAW_SEARCH_BAR_PLACEHOLDER, "Search...");
* \endcode
*/
mosync.MAW_SEARCH_BAR_PLACEHOLDER = "placeholder";

/**
* @brief Shows or hides the virtual keyboard. If shown the focus will be set to this widget.
*
* @validvalue A boolean string 'true' or 'false'.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(searchBarHandle, MAW_SEARCH_BAR_SHOW_KEYBOARD, "true");
* \endcode
*/
mosync.MAW_SEARCH_BAR_SHOW_KEYBOARD = "showKeyboard";

/**
* @brief Sets or gets the range of the slider to 0..max.
*
* @validvalue An positive integer that specifies the upper range of this slider.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(sliderHandle, MAW_SLIDER_MAX, "100");
* \endcode
*/
mosync.MAW_SLIDER_MAX = "max";

/**
* @brief Set or gets the current value to the slider.
*
* @validvalue An int that specifies the new value, between 0 and max value. See \ref MAW_SLIDER_MAX.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(sliderHandle, MAW_SLIDER_VALUE, "10");
* \endcode
*/
mosync.MAW_SLIDER_VALUE = "value";

/**
* @brief Increase the current value of the slider by the specified amount.
*
* @validvalue An int that specifies the amount by which the slider value must be increased.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(sliderHandle, MAW_SLIDER_INCREASE_VALUE, "20");
* \endcode
*/
mosync.MAW_SLIDER_INCREASE_VALUE = "increaseValue";

/**
* @brief Decreases the current value of the slider by the specified amount.
*
* @validvalue An int that specifies the amount by which the slider value must be decreased.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(sliderHandle, MAW_SLIDER_DECREASE_VALUE, "20");
* \endcode
*/
mosync.MAW_SLIDER_DECREASE_VALUE = "decreaseValue";

/**
* @copydoc #MAW_SCREEN_TITLE
*/
mosync.MAW_STACK_SCREEN_TITLE = "title";

/**
* @copydoc #MAW_SCREEN_ICON
*/
mosync.MAW_STACK_SCREEN_ICON = "icon";

/**
* @brief Specifies whether the back button automatically should pop the stack screen.
*
* This can have different behaviors on different platforms, on iPhone the UI back button is disabled, on Android the stack screen ignores back button events.
*
* @validvalue A boolean string 'true' or 'false'.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(stackScreenHandle, MAW_STACK_SCREEN_BACK_BUTTON_ENABLED, "false");
* \endcode
*/
mosync.MAW_STACK_SCREEN_BACK_BUTTON_ENABLED = "backButtonEnabled";

/**
* @copydoc MAW_SCREEN_TITLE
*/
mosync.MAW_TAB_SCREEN_TITLE = "title";

/**
* @copydoc MAW_SCREEN_ICON
*/
mosync.MAW_TAB_SCREEN_ICON = "icon";

/**
* @brief Sets or gets the currently open tab to the tab with the given index.
*
* @validvalue A 0-indexed tab number.
*
* @setandget
*
* @par Example set
* \code
*	maWidgetSetProperty(tabScreenHandle, MAW_TAB_SCREEN_CURRENT_TAB, "1");
* \endcode
*
* @par Example get
* \code
*	char currentTabBuffer[BUFFER_SIZE];
*	int result = maWidgetGetProperty(
*	tabScreenHandle,
*	MAW_WEB_VIEW_CURRENT_TAB,
*	currentTabBuffer,
*	BUFFER_SIZE);
*	if (result > 0)
*	{
*	// Do something with current tab.
*	}
* \endcode
*/
mosync.MAW_TAB_SCREEN_CURRENT_TAB = "currentTab";

/**
* @brief Sets or gets the current hour in 24h mode( in the range: 0-23 ).
*
* @validvalue An int that specifies the current hour.
*
* @setandget
*
* @par Example
* \code
*	// Set hour to 20, that is 8PM.
*	maWidgetSetProperty(timePickerHandle, MAW_TIME_PICKER_CURRENT_HOUR, "20");
* \endcode
*/
mosync.MAW_TIME_PICKER_CURRENT_HOUR = "currentHour";

/**
* @brief Sets or gets the current minute (0-59).
*
* @validvalue An int that specifies the current minute.
*
* @setandget
*
* @par Example
* \code
*	char buf[BUFFER_SIZE];
*	maWidgetGetProperty(timePickerHandle, MAW_TIME_PICKER_CURRENT_MINUTE, buf, BUFFER_SIZE);
*	// Do something with the minute.
* \endcode
*/
mosync.MAW_TIME_PICKER_CURRENT_MINUTE = "currentMinute";

/**
* @brief Set or get the checked state of the toggle button.
*
* @validvalue A boolean string 'true' or 'false'.
*
* @par Example
* \code
*	maWidgetSetProperty(toggleButtonHandle, MAW_TOGGLE_BUTTON_CHECKED, "true");
* \endcode
*/
mosync.MAW_TOGGLE_BUTTON_CHECKED = "checked";

/**
* @brief Sets how the children in the layout should be aligned in the vertical axis.
*
* @validvalue One of the constants #MAW_ALIGNMENT_TOP, #MAW_ALIGNMENT_CENTER or #MAW_ALIGNMENT_BOTTOM.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(verticalLayoutHandle, MAW_VERTICAL_LAYOUT_CHILD_VERTICAL_ALIGNMENT, MAW_ALIGNMENT_CENTER);
* \endcode
*/
mosync.MAW_VERTICAL_LAYOUT_CHILD_VERTICAL_ALIGNMENT = "childVerticalAlignment";

/**
* @brief Sets how the children in the layout should be aligned in the horizontal axis.
*
* @validvalue One of the constants #MAW_ALIGNMENT_LEFT, #MAW_ALIGNMENT_CENTER or #MAW_ALIGNMENT_RIGHT.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(verticalLayoutHandle, MAW_VERTICAL_LAYOUT_CHILD_HORIZONTAL_ALIGNMENT, MAW_ALIGNMENT_CENTER);
* \endcode
*/
mosync.MAW_VERTICAL_LAYOUT_CHILD_HORIZONTAL_ALIGNMENT = "childHorizontalAlignment";

/**
* @brief Sets the top padding.
*
* @validvalue The top padding in pixels.
*
* @setonly
*
* @par Example
* \code
*  // Set a 50px top padding.
*	maWidgetSetProperty(verticalLayoutHandle, MAW_VERTICAL_LAYOUT_PADDING_TOP, "50");
* \endcode
*/
mosync.MAW_VERTICAL_LAYOUT_PADDING_TOP = "paddingTop";

/**
* @brief Sets the left padding.
*
* @validvalue The left padding in pixels.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(verticalLayoutHandle, MAW_VERTICAL_LAYOUT_PADDING_LEFT, "50");
* \endcode
*/
mosync.MAW_VERTICAL_LAYOUT_PADDING_LEFT = "paddingLeft";

/**
* @brief Sets the right padding.
*
* @validvalue The right padding in pixels.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(verticalLayoutHandle, MAW_VERTICAL_LAYOUT_PADDING_RIGHT, "50");
* \endcode
*/
mosync.MAW_VERTICAL_LAYOUT_PADDING_RIGHT = "paddingRight";

/**
* @brief Sets the bottom padding.
*
* @validvalue The bottom padding in pixels.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(verticalLayoutHandle, MAW_VERTICAL_LAYOUT_PADDING_BOTTOM, "50");
* \endcode
*/
mosync.MAW_VERTICAL_LAYOUT_PADDING_BOTTOM = "paddingBottom";

/**
* @brief Sets the isScrollable boolean
*
* @validvalue "true" or "false", for "true" the layout will become scrollable otherwise it will become unscrollable
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(verticalLayoutHandle, MAW_VERTICAL_LAYOUT_SCROLLABLE, "true");
* \endcode
*/
mosync.MAW_VERTICAL_LAYOUT_SCROLLABLE = "scrollable";

/**
* @brief Play the video.
*/
mosync.MAW_VIDEO_VIEW_ACTION_PLAY = 1;

/**
* @brief Pause the video.
*/
mosync.MAW_VIDEO_VIEW_ACTION_PAUSE = 2;

/**
* @brief Stop the video.
*/
mosync.MAW_VIDEO_VIEW_ACTION_STOP = 3;

/**
* @brief The video is playing.
*/
mosync.MAW_VIDEO_VIEW_STATE_PLAYING = 1;

/**
* @brief The video is paused.
*/
mosync.MAW_VIDEO_VIEW_STATE_PAUSED = 2;

/**
* @brief The video is stopped.
*/
mosync.MAW_VIDEO_VIEW_STATE_STOPPED = 3;

/**
* @brief The video has finished playing.
*/
mosync.MAW_VIDEO_VIEW_STATE_FINISHED = 4;

/**
* @brief The source is ready to be played.
* NOTE: On Android this event is received after loading url/path.
*	On iOS this event is received after PLAYING event is received.
*	On WindowsPhone this event is received after media loding has finished
*/
mosync.MAW_VIDEO_VIEW_STATE_SOURCE_READY = 5;

/**
* @brief Playback is temporarily interruped(maybe there's no data in the buffer).
* NOTE: On WindowsPhone 7 this occurs when an error is encountered.
*/
mosync.MAW_VIDEO_VIEW_STATE_INTERRUPTED = 6;

/**
* @brief Sets the video path.
* Note: available on Android and Windows Phone.
* @validvalue Any valid path.
*
* @setonly
*
* @par Example
* \code
*	// Set the video path.
*	maWidgetSetProperty(videoViewHandle, MAW_VIDEO_VIEW_PATH, "\data\Video1.wav");
* \endcode
*/
mosync.MAW_VIDEO_VIEW_PATH = "path";

/**
* @brief Sets the video url.
*
* @validvalue Any valid streaming url.
*
* @setonly
*
* @par Example
* \code
*	// Set the video path.
*	maWidgetSetProperty(videoViewHandle, MAW_VIDEO_VIEW_URL, "www.example.com/play.m3u8");
* \endcode
*/
mosync.MAW_VIDEO_VIEW_URL = "url";

/**
* @brief Start,pause or stop the video playback.
*
* @validvalue MAW_VIDEO_WIDGET_ACTION_PLAY, MAW_VIDEO_WIDGET_ACTION_PAUSE or MAW_VIDEO_WIDGET_ACTION_STOP constants.
*
* @setonly
*
* @par Example
* \code
*	// Start the playback.
*	maWidgetSetProperty(videoViewHandle, MAW_VIDEO_WIDGET_ACTION, toString(MAW_VIDEO_WIDGET_ACTION_PLAY));
* \endcode
*/
mosync.MAW_VIDEO_VIEW_ACTION = "action";

/**
* @brief Seeks into the video.
*
* @validvalue A valid integer for milliseconds.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(videoViewHandle, MAW_VIDEO_VIEW_SEEK_TO, "10000");
* \endcode
*/
mosync.MAW_VIDEO_VIEW_SEEK_TO = "seekTo";

/**
* @brief Gets the video file duration.
*
* NOTE: On Android this value can be retrieved after MAW_VIDEO_VIEW_STATE_SOURCE_READY is received.
*	On iOS this value can be retrieved after MAW_VIDEO_STATE_PLAYING is received.
* @validvalue An integer representing the total media duration in milliseconds.
*
* @getonly
*
* @par Example
* \code
*	char buf[BUFFER_SIZE];
*	maWidgetGetProperty(videoViewHandle, MAW_VIDEO_VIEW_DURATION, buf, BUFFER_SIZE);
*	// Do something with the duration.
* \endcode
*/
mosync.MAW_VIDEO_VIEW_DURATION = "duration";

/**
* @brief Gets the buffer percentage of the played video file.
*
* @validvalue An int.
*
* @getonly
*
* @par Example
* \code
*	char buf[BUFFER_SIZE];
*	maWidgetGetProperty(videoViewHandle, MAW_VIDEO_VIEW_BUFFER_PERCENTAGE, buf, BUFFER_SIZE);
*	// Do something with the percentage.
* \endcode
*/
mosync.MAW_VIDEO_VIEW_BUFFER_PERCENTAGE = "bufferPercentage";

/**
* @brief Gets the current position in the video file.
*
* @validvalue An integer representing the current media position in seconds.
*
* @getonly
*
* @par Example
* \code
*	char buf[BUFFER_SIZE];
*	maWidgetGetProperty(videoViewHandle, MAW_VIDEO_VIEW_CURRENT_POSITION, buf, BUFFER_SIZE);
*	// Do something with the position.
* \endcode
*/
mosync.MAW_VIDEO_VIEW_CURRENT_POSITION = "currentPosition";

/**
* @brief Show/hide video control.
* Default value is "true"(video control is shown).
* Platform: iOS.
*
* @validvalue "true" show the video control, "false" hide the video control.
*
* @setandget
*
* @par Example
* \code
*	char buf[BUFFER_SIZE];
*	maWidgetGetProperty(videoViewHandle, MAW_VIDEO_VIEW_CONTROL, buf, BUFFER_SIZE);
* \endcode
*/
mosync.MAW_VIDEO_VIEW_CONTROL = "control";

/**
* @brief Set or get the currently displayed url in the web view.
*
* You can also use this property to evaluate JavaScript in the WebView,
* by using a url that starts with "javascript:" followed by the
* JavaScript code.
*
* Note that if the url is a non-local url that will cause data to
* be downloaded over the network, you need to set "Internet Access"
* permissions for the application.
*
* @validvalue Any valid URL.
*
* @setandget
*
* @par Example
* @code
*	maWidgetSetProperty(webViewHandle, MAW_WEB_VIEW_URL, "http://www.mosync.com/");
* @endcode
*
* @code
*	maWidgetSetProperty(
*	webViewHandle,
*	MAW_WEB_VIEW_URL,
*	"javascript:document.body.innerHTML= '<p>Hello World</p>'");
* @endcode
*/
mosync.MAW_WEB_VIEW_URL = "url";

/**
* @brief Set the currently displayed HTML data in the web view.
*
* @validvalue Any valid HTML data.
*
* @setonly
*
* @par Example
* @code
*	maWidgetSetProperty(webViewHandle, MAW_WEB_VIEW_HTML, "<h1>Hello World</h1>");
* @endcode
*/
mosync.MAW_WEB_VIEW_HTML = "html";

/**
* @brief Set the base URL used by the web-view when loading relative paths.
* The value of this URL is used when setting the #MAW_WEB_VIEW_URL and
* #MAW_WEB_VIEW_HTML properties. The default value for this property points to
* the Assets folder in the local file system ("file://pathToLocalFileSystem/Assets/").
*
* @note Use: #maGetSystemProperty ("mosync.path.local.url") to find the baseURL
* for the local file system.
*
* @validvalue Any valid URL schema.
*
* @setandget
*/
mosync.MAW_WEB_VIEW_BASE_URL = "baseUrl";

/**
* @brief Set the pattern used to "soft hook" urls, to get notified
* when pages are being loaded.
*
* When this pattern matches a url that is being requested
* to load in the WebView, event #MAW_EVENT_WEB_VIEW_HOOK_INVOKED
* is sent, and the page loads NORMALLY.
*
* Note that when receiving event #MAW_EVENT_WEB_VIEW_HOOK_INVOKED
* you MUST deallocate the urlData handle of the event by calling
* maDestroyPlaceholder on the handle. Destory the handle when you are
* done reading the url data, to avoid that memory will get used up.
*
* The pattern is a url pattern specified using regular expression
* syntax, according to the ICU regular expression standard, using
* complete match. For example, the ".*" matching expression is used
* to match any url string. To match all HTTP requests, use the
* pattern "http://.*". To match all requests for a specific domain,
* use a pattern like ".*google.com.*". For further infomation, see:
* http://userguide.icu-project.org/strings/regexp
* When typing a C-string with a pattern that contains a matching
* expression with a backslash, make sure to escape the backslash,
* for example "\B" should be "\\B".
*
* By setting the pattern to an empty string, the soft hook mechanism
* is turned off, and #MAW_EVENT_WEB_VIEW_HOOK_INVOKED is not sent.
*
* Both "soft" hooks and "hard" hooks can be enabled simultaneously,
* but only one hook pattern can be used for each type of hook. When
* setting a new hook pattern, the old hook is replaced.
*
* Note that urls opened using maWidgetSetProperty with the property
* MAW_WEB_VIEW_URL are NOT hooked. This way of loading a page is
* excluded from the hook mechanism to prevent "loops" when loading
* pages.
*
* @validvalue A string with a url pattern.
*
* @setonly
*
* @par Example
* @code
*	// Hook all urls.
*	maWidgetSetProperty(webViewHandle, MAW_WEB_VIEW_SOFT_HOOK, ".*");
*
*	// Hook no urls.
*	maWidgetSetProperty(webViewHandle, MAW_WEB_VIEW_SOFT_HOOK, "");
*
*	// Hook urls that start with "mosync:".
*	maWidgetSetProperty(webViewHandle, MAW_WEB_VIEW_SOFT_HOOK, "mosync://.*");
* @endcode
*/
mosync.MAW_WEB_VIEW_SOFT_HOOK = "softHook";

/**
* @brief Set the pattern used to "hard hook" urls, to get notified
* and prevent loading of pages.
*
* Hard hooks are useful for communicating events from a WebView,
* for example by setting document.location to a url string in
* JavaScript. Example: document.location = 'mosync://ExitApp'
* The application can then examine the url data and take action
* depending on the url content.
*
* When this pattern matches a url that is being requested
* to load in the WebView, event #MAW_EVENT_WEB_VIEW_HOOK_INVOKED
* is sent, and page loading is ABORTED.
*
* Note that when receiving event #MAW_EVENT_WEB_VIEW_HOOK_INVOKED
* you MUST deallocate the urlData handle of the event by calling
* maDestroyPlaceholder on the handle. Destory the handle when you are
* done reading the url data, to avoid that memory will get used up.
*
* The pattern is a url pattern specified using regular expression
* syntax, according to the ICU regular expression standard, using
* complete match. For example, the ".*" matching expression is used
* to match any url string. To match all HTTP requests, use the
* pattern "http://.*". To match all requests for a specific domain,
* use a pattern like ".*google.com.*". For further infomation, see:
* http://userguide.icu-project.org/strings/regexp
* When typing a C-string with a pattern that contains a matching
* expression with a backslash, make sure to escape the backslash,
* for example "\B" should be "\\B".
*
* By setting the pattern to an empty string, the soft hook mechanism
* is turned off, and #MAW_EVENT_WEB_VIEW_HOOK_INVOKED is not sent.
*
* Both "soft" hooks and "hard" hooks can be enabled simultaneously,
* but only one hook pattern can be used for each type of hook. When
* setting a new hook pattern, the old hook is replaced.
*
* The "hard" hook property takes precedence over the "soft" hook
* property. When both properties are set,
* #MAW_EVENT_WEB_VIEW_HOOK_INVOKED is sent once, for the
* "hard" hook type.
*
* Note that urls opened using maWidgetSetProperty with the property
* MAW_WEB_VIEW_URL are NOT hooked. This way of loading a page is
* excluded from the hook mechanism to prevent "loops" when loading
* pages.
*
* @validvalue A string with a url pattern.
*
* @setonly
*
* @par Example
* @code
*	// Hook urls that start with "mosync:".
*	maWidgetSetProperty(webViewHandle, MAW_WEB_VIEW_HARD_HOOK, "mosync://.*");
* @endcode
*/
mosync.MAW_WEB_VIEW_HARD_HOOK = "hardHook";

/**
* @brief Property to get a new url whenever the webview changes the url.
* See #MAW_EVENT_WEB_VIEW_URL_CHANGED.
*
* @deprecated Use event #MAW_EVENT_WEB_VIEW_HOOK_INVOKED
*
* @validvalue Any valid URL.
*
* @getonly
*
* @par Example
* @code
*	char urlBuffer[BUFFER_SIZE];
*	int result = maWidgetGetProperty(
*	  webViewHandle,
*	  MAW_WEB_VIEW_NEW_URL,
*	  urlBuffer,
*	  BUFFER_SIZE);
*	if (result > 0)
*	{
*	// Do something with URL.
*	}
* @endcode
*/
mosync.MAW_WEB_VIEW_NEW_URL = "newurl";

/**
* @brief Sets or gets whether the horizontal scrollbar should be drawn or not.
* Available only on Android for the moment.
*
* @validvalue A boolean string 'true' or 'false'.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(webViewHandle, MAW_WEB_VIEW_HORIZONTAL_SCROLLBAR_ENABLED, "true");
* \endcode
*/
mosync.MAW_WEB_VIEW_HORIZONTAL_SCROLL_BAR_ENABLED = "horizontalScrollBarEnabled";

/**
* @brief Sets or gets whether the vertical scrollbar should be drawn or not.
* The scrollbar is drawn by default.
* Available only on Android for the moment.
*
* @validvalue A boolean string 'true' or 'false'.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(webViewHandle, MAW_WEB_VIEW_VERTICAL_SCROLLBAR_ENABLED, "false");
* \endcode
*/
mosync.MAW_WEB_VIEW_VERTICAL_SCROLL_BAR_ENABLED = "verticalScrollBarEnabled";

/**
* @brief Enable or disable the zoom controls of the web view.
*
* @validvalue "true" to enable, "false" to disable.
*
* @setonly
*
* @par Example
* @code
*	maWidgetSetProperty(webViewHandle, MAW_WEB_VIEW_ENABLE_ZOOM, "true");
* @endcode
*/
mosync.MAW_WEB_VIEW_ENABLE_ZOOM = "enableZoom";

/**
* @brief Navigate forward or back the browsing history.
*
* @validvalue "back" or "forward".
*
* @setonly
*
* @par Example
* @code
*	maWidgetSetProperty(webViewHandle, MAW_WEB_VIEW_NAVIGATE, "back");
* @endcode
*/
mosync.MAW_WEB_VIEW_NAVIGATE = "navigate";

/**
* @brief Constant that represents a left aligned widget.
*/
mosync.MAW_ALIGNMENT_LEFT = "left";

/**
* @brief Constant that represents a right aligned widget.
*/
mosync.MAW_ALIGNMENT_RIGHT = "right";

/**
* @brief Constant that represents a center aligned widget.
*/
mosync.MAW_ALIGNMENT_CENTER = "center";

/**
* @brief Constant that represents a top aligned widget.
*/
mosync.MAW_ALIGNMENT_TOP = "top";

/**
* @brief Constant that represents a bottom aligned widget.
*/
mosync.MAW_ALIGNMENT_BOTTOM = "bottom";

/**
* @brief A handle to the MoSync canvas screen. Use maWidgetScreenShow with this handle to show the initial mosync canvas.
*/
mosync.MAW_CONSTANT_MOSYNC_SCREEN_HANDLE = 0;

/**
* @brief If set to the width or height of a widget and the parent is either a vertical or horizontal layout it tries to fill the available space in that dimension. If there are multiple widgets specified with this constant, the space will then be shared equally. If the parent isn't a horizontal or vertical layout it just resizes the child to the size of its parent.
*/
mosync.MAW_CONSTANT_FILL_AVAILABLE_SPACE = -1;

/**
* @brief If set to the width or height of a widget it will be as big as its content in that dimension.
*/
mosync.MAW_CONSTANT_WRAP_CONTENT = -2;

/**
* @brief Loading a page has started. Used in
* #MAW_EVENT_WEB_VIEW_CONTENT_LOADED.
*/
mosync.MAW_CONSTANT_STARTED = 1;

/**
* @brief Loading a page is done. Used in
* #MAW_EVENT_WEB_VIEW_CONTENT_LOADED.
*/
mosync.MAW_CONSTANT_DONE = 2;

/**
* @brief Loading a page has stopped (aborted). Used in
* #MAW_EVENT_WEB_VIEW_CONTENT_LOADED.
*/
mosync.MAW_CONSTANT_STOPPED = 3;

/**
* @brief Loading a page has failed. Used in
* #MAW_EVENT_WEB_VIEW_CONTENT_LOADED.
*/
mosync.MAW_CONSTANT_ERROR = -1;

/**
* @brief The hook type is a soft hook. Used in
* #MAW_EVENT_WEB_VIEW_HOOK_INVOKED.
*/
mosync.MAW_CONSTANT_SOFT = 5;

/**
* @brief The hook type is a hard hook. Used in
* #MAW_EVENT_WEB_VIEW_HOOK_INVOKED.
*/
mosync.MAW_CONSTANT_HARD = 6;

/**
* @brief The hook type is a message sendt from JavaScript.
* Used in #MAW_EVENT_WEB_VIEW_HOOK_INVOKED.
* This type of hook does not use any hook pattern, it is
* always sent from the browser, using a platform specific
* method (which is abstracted away in the libraries).
*/
mosync.MAW_CONSTANT_MESSAGE = 7;

/**
* @brief The popover arrow should point up. Used in
* #MAW_MODAL_DIALOG_ARROW_POSITION.
*/
mosync.MAW_CONSTANT_ARROW_UP = 1;

/**
* @brief The popover arrow should point down. Used in
* #MAW_MODAL_DIALOG_ARROW_POSITION.
*/
mosync.MAW_CONSTANT_ARROW_DOWN = 2;

/**
* @brief The popover arrow should point left. Used in
* #MAW_MODAL_DIALOG_ARROW_POSITION.
*/
mosync.MAW_CONSTANT_ARROW_LEFT = 4;

/**
* @brief The popover arrow should point right. Used in
* #MAW_MODAL_DIALOG_ARROW_POSITION.
*/
mosync.MAW_CONSTANT_ARROW_RIGHT = 8;

/**
* @brief The popover arrow can point anywhere. Used in
* #MAW_MODAL_DIALOG_ARROW_POSITION.
*/
mosync.MAW_CONSTANT_ARROW_ANY = 15;

/**
* @brief A pointer pressed event has occurred.
*/
mosync.MAW_EVENT_POINTER_PRESSED = 2;

/**
* @brief A pointer released event has occurred.
*/
mosync.MAW_EVENT_POINTER_RELEASED = 3;

/**
* @brief This event is not used and has been deprecated.
*
* @deprecated Use #MAW_EVENT_WEB_VIEW_CONTENT_LOADING.
*/
mosync.MAW_EVENT_CONTENT_LOADED = 4;

/**
* @brief Sent when something is clicked.
*/
mosync.MAW_EVENT_CLICKED = 5;

/**
* @brief Sent when an item in a list view is clicked.
*/
mosync.MAW_EVENT_ITEM_CLICKED = 6;

/**
* @brief Sent when a tab widget has changed to a new tab.
*/
mosync.MAW_EVENT_TAB_CHANGED = 7;

/**
* @brief Sent when an GLView has been initialized and is ready for setup.
*/
mosync.MAW_EVENT_GL_VIEW_READY = 8;

/**
 * @brief Sent when the URL of a web view changes
 * @deprecated Use event #MAW_EVENT_WEB_VIEW_HOOK_INVOKED.
 */
mosync.MAW_EVENT_WEB_VIEW_URL_CHANGED = 9;

/**
 * @brief Sent when a screen has been popped from a stack screen.
 */
mosync.MAW_EVENT_STACK_SCREEN_POPPED = 10;

/**
 * @brief Sent when the progress level has been changed.
 * This includes changes that were initiated by the user through a touch gesture,
 * or arrow key/trackball as well as changes that were initiated programmatically.
 */
mosync.MAW_EVENT_SLIDER_VALUE_CHANGED = 11;

/**
 * @brief Sent when the user changes\d the date in a Date Picker.
 */
mosync.MAW_EVENT_DATE_PICKER_VALUE_CHANGED = 12;

/**
 * @brief Sent when the user changes\d the time in a Time Picker.
 */
mosync.MAW_EVENT_TIME_PICKER_VALUE_CHANGED = 13;

/**
 * @brief Sent when the user changes\d the value in a Number Picker.
 */
mosync.MAW_EVENT_NUMBER_PICKER_VALUE_CHANGED = 14;

/**
 * @brief Sent from the Video View when the state of the video has changed.
 */
mosync.MAW_EVENT_VIDEO_STATE_CHANGED = 15;

/**
 * @brief Sent from the Edit box when it gains focus(the user selects the widget).
 * The virtual keyboard is shown.
 */
mosync.MAW_EVENT_EDIT_BOX_EDITING_DID_BEGIN = 16;

/**
 * @brief Sent from the Edit box when it loses focus.
 * The virtual keyboard is hidden.
 */
mosync.MAW_EVENT_EDIT_BOX_EDITING_DID_END = 17;

/**
 * @brief Sent from the Edit box when the text was changed.
 */
mosync.MAW_EVENT_EDIT_BOX_TEXT_CHANGED = 18;

/**
 * @brief Sent from the Edit box when the return button was pressed.
 * On iOS platform the virtual keyboard is not closed after receiving this event.
 * The virtual keyboard can be hided by setting the MAW_EDIT_BOX_SHOW_KEYBOARD to "false".
 * This event is send only if the edit box mode is #MAW_EDIT_BOX_SINGLE_LINE.
 * Not available on Windows Phone 7.1
 */
mosync.MAW_EVENT_EDIT_BOX_RETURN = 19;

/**
* @brief A WebView widget reports status of loading
* page content. Event parameter status is set to one
* of the following values:
*	#MAW_CONSTANT_STARTED
*	#MAW_CONSTANT_DONE
*	#MAW_CONSTANT_STOPPED
*	#MAW_CONSTANT_ERROR
*/
mosync.MAW_EVENT_WEB_VIEW_CONTENT_LOADING = 20;

/**
* @brief A web view hook has captured a url.
*
* The event parameter hookType is set to
* the type of hook, one of:
*	#MAW_CONSTANT_SOFT
*	#MAW_CONSTANT_HARD
*
* Event parameter urlData is a handle to the url that
* has been captured.
*
* Use syscall maGetDataSize to get the size of the url data
* and maReadData to access the data.
*
* NOTE: When you get this message you have ownership
* of the url data handle and you have the responsibility to
* deallocate it using maDestroyPlaceholder.
*
* To get this event, you need to register a hook pattern, using
* maWidgetSetProperty with the properties #MAW_WEB_VIEW_SOFT_HOOK
* and/or #MAW_WEB_VIEW_HARD_HOOK.
*/
mosync.MAW_EVENT_WEB_VIEW_HOOK_INVOKED = 21;

/**
* Send by a Dialog widget when when a user dismisses a popover by tapping outside of it.
* It will not be sent if it was dismissed by calling #maWidgetModalDialogHide().
* Available only on the iPad.
*/
mosync.MAW_EVENT_DIALOG_DISMISSED = 22;

/**
* Send by current screen just before it begins rotating.
* Platform: iOS.
*/
mosync.MAW_EVENT_SCREEN_ORIENTATION_WILL_CHANGE = 23;

/**
* Send by current screen after it finishes rotating.
* Platform: iOS, Android and Windows Phone 7.1
*/
mosync.MAW_EVENT_SCREEN_ORIENTATION_DID_CHANGE = 24;

/**
* @brief Send when the value in a Rating Bar.
*/
mosync.MAW_EVENT_RATING_BAR_VALUE_CHANGED = 25;

/**
* @brief Send when one of the radio buttons in a radio group is selected.
*/
mosync.MAW_EVENT_RADIO_GROUP_ITEM_SELECTED = 26;

/**
* @brief Send whenthe radio button state is changed.
*/
mosync.MAW_EVENT_RADIO_BUTTON_STATE_CHANGED = 27;

/**
* @brief Send when the Options Menu is being closed (either by the user canceling
* the menu with the back/menu button, or when an item is selected).
*/
mosync.MAW_EVENT_OPTIONS_MENU_CLOSED = 28;

/**
* @brief Send when an item in your options menu is selected.
*/
mosync.MAW_EVENT_OPTIONS_MENU_ITEM_SELECTED = 29;

/**
* @brief Sent when the zoom level of a map widget has changed (if the user zoomed in or out).
*/
mosync.MAW_EVENT_MAP_ZOOM_LEVEL_CHANGED = 30;

/**
* @brief Sent when the visible region on the map has changed (if the user scrolled/draged the map).
*/
mosync.MAW_EVENT_MAP_REGION_CHANGED = 31;

/**
 * @brief Sent when a map pin is clicked by the user.
 */
mosync.MAW_EVENT_MAP_PIN_CLICKED = 32;

/**
* @brief Sent by a ListView when an item is about to be selected.
* The listItemIndex member from MAWidgetEventData struct will contain the item index
* that is about to be selected.
* Available only on iOS.
*/
mosync.MAW_EVENT_ITEM_WILL_SELECT = 33;

/**
* @brief Sent by a Segmented or Alphabetical ListView when an item is selected.
* The event will contain the sectionIndex and the sectionItemIndex coresponding to the
* selected item.
* Available on Windows Phone 7, Android and iOS.
*/
mosync.MAW_EVENT_SEGMENTED_LIST_ITEM_CLICKED = 34;

/**
* @brief Sent by a Segmented ListViewItem when its insert button is clicked.
* The event will contain the sectionIndex and the sectionItemIndex coresponding of the
* item. Insert button is visible only in editing mode and if its editing style is
* #MAW_LIST_VIEW_ITEM_EDIT_STYLE_INSERT.
* Available on iOS.
*/
mosync.MAW_EVENT_SEGMENTED_LIST_ITEM_INSERT_BTN = 35;

/**
* @brief Sent by a Segmented ListViewItem when its delete button is clicked.
* The event will contain the sectionIndex and the sectionItemIndex coresponding of the
* item. The delete button is visible only in editing mode and if its editing style is
* #MAW_LIST_VIEW_ITEM_EDIT_STYLE_DELETE.
* Available on iOS.
*/
mosync.MAW_EVENT_SEGMENTED_LIST_ITEM_DELETE_BTN = 36;

/**
* The available widget properties for all widgets.
*/
/**
* @brief Sets or gets the horizontal distance from the parent widget in a RelativeLayout.
*
* @validvalue A positive integer in number of pixels.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(widgetHandle, MAW_WIDGET_LEFT, "100");
* \endcode
*/
mosync.MAW_WIDGET_LEFT = "left";

/**
* @brief Specifies the vertical distance from the parent widget in a RelativeLayout.
*
* @validvalue A positive integer in number of pixels.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(widgetHandle, MAW_WIDGET_TOP, "100");
* \endcode
*/
mosync.MAW_WIDGET_TOP = "top";

/**
* @brief Sets or gets the width of a widget.
*
* @validvalue A positive integer in pixles, or any of the constants #MAW_CONSTANT_FILL_AVAILABLE_SPACE, #MAW_CONSTANT_WRAP_CONTENT.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(widgetHandle, MAW_WIDGET_WIDTH, "100");
*	maWidgetSetProperty(widgetHandle, MAW_WIDGET_WIDTH, MAW_CONSTANT_FILL_AVAILABLE_SPACE);
* \endcode
*/
mosync.MAW_WIDGET_WIDTH = "width";

/**
* @brief Sets or gets the height of a widget.
*
* @validvalue A positive integer in pixles, or any of the constants #MAW_CONSTANT_FILL_AVAILABLE_SPACE, #MAW_CONSTANT_WRAP_CONTENT.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(widgetHandle, MAW_WIDGET_HEIGHT, "100");
*	maWidgetSetProperty(widgetHandle, MAW_WIDGET_HEIGHT, MAW_CONSTANT_FILL_AVAILABLE_SPACE);
* \endcode
*/
mosync.MAW_WIDGET_HEIGHT = "height";

/**
* @brief Sets the transparency of the widget background.
* On Android this property is available for the moment only on Layouts and ImageWidget widgets.
*
* @validvalue A float between 0.0 and 1.0, where 0.0 is fully transparent and 1.0 is opaque.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(widgetHandle, MAW_WIDGET_ALPHA, "0.0"); // Not visible
*	maWidgetSetProperty(widgetHandle, MAW_WIDGET_ALPHA, "0.5"); // Half visible
*	maWidgetSetProperty(widgetHandle, MAW_WIDGET_ALPHA, "1.0"); // Fully visible
* \endcode
*/
mosync.MAW_WIDGET_ALPHA = "alpha";

/**
* @brief Specifies the background color of a widget.
*
* @validvalue A hexadecimal value 0xRRGGBB, where R, G and B are the red, green and blue components respectively.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(widgetHandle, MAW_WIDGET_BACKGROUND_COLOR, "0xff0000"); // Red
* \endcode
*/
mosync.MAW_WIDGET_BACKGROUND_COLOR = "backgroundColor";

/**
* @brief Sets whether the widget is visible or not. Layouts ignore invisible widgets.
*
* @validvalue A boolean string 'true' or 'false', where true is visible and false is invisible.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(widgetHandle, MAW_WIDGET_VISIBLE, "false");
* \endcode
*/
mosync.MAW_WIDGET_VISIBLE = "visible";

/**
* @brief Sets whether the widget is enabled or not. If not, the widget is grayed out.
*
* Widgets are enabled by default.
*
* @validvalue A boolean string 'true' or 'false', where true is enabled and false is disabled.
*
* @setandget
*
* @par Example
* \code
*	maWidgetSetProperty(buttonHandle, MAW_WIDGET_ENABLED, "false");
* \endcode
*/
mosync.MAW_WIDGET_ENABLED = "enabled";

/**
* @brief Specifies the background gradient of a widget.
* Currently implemented only on Android.
*
* @validvalue Two hexadecimal values 0xRRGGBB, where R, G and B are the red, green and blue components respectively,
* separated by comma.
*
* @setonly
*
* @par Example
* \code
*	maWidgetSetProperty(widgetHandle, MAW_WIDGET_BACKGROUND_GRADIENT,  "0x27408B,0xCAE1FF");
* \endcode
*/
mosync.MAW_WIDGET_BACKGROUND_GRADIENT = "backgroundGradient";

/**
* @brief Indicates that the call to a widget syscall was successful.
*/
mosync.MAW_RES_OK = 0;

/**
* @brief Indicates that the call to a widget syscall was unsuccessful.
*/
mosync.MAW_RES_ERROR = -2;

/**
* @brief Indicates that the call to maWidgetSetProperty or maWidgetGetProperty received an invalid property name.
*/
mosync.MAW_RES_INVALID_PROPERTY_NAME = -2;

/**
* @brief Indicates that the call to maWidgetSetProperty or maWidgetGetProperty received an invalid property value.
*/
mosync.MAW_RES_INVALID_PROPERTY_VALUE = -3;

/**
* @brief Indicates that the call to a widget function received an invalid handle.
*/
mosync.MAW_RES_INVALID_HANDLE = -4;

/**
* @brief Indicates that the call maWidgetCreate received an invalid type name.
*/
mosync.MAW_RES_INVALID_TYPE_NAME = -5;

/**
* @brief Indicates that the call to maWidgetInsertChild received an invalid index.
*/
mosync.MAW_RES_INVALID_INDEX = -6;

/**
* @brief Indicates that the call maWidgetGetProperty needs a larger buffer.
*/
mosync.MAW_RES_INVALID_STRING_BUFFER_SIZE = -7;

/**
* @brief Indicates that maWidgetScreenShow received an invalid (non-screen) widget handle.
*/
mosync.MAW_RES_INVALID_SCREEN = -8;

/**
* @brief Indicates that the caller tried to add a widget to a non-layout.
*/
mosync.MAW_RES_INVALID_LAYOUT = -9;

/**
* @brief Indicates that the caller tried to remove a visible root widget (screen) and the MoSync view will become visible.
*/
mosync.MAW_RES_REMOVED_ROOT = -10;

/**
* @brief Indicates that a syscall tried to access a feature that is not supported by the current framework version.
*/
mosync.MAW_RES_FEATURE_NOT_AVAILABLE = -11;

/**
* @brief Indicates that a syscall tried to add a dialog to a parent, which cannot be done because dialogs are in fact
* containers for other widgets.
*/
mosync.MAW_RES_CANNOT_INSERT_DIALOG = -12;

/**
* @brief A screen is the root of all widgets currently visible on a screen. See \ref WidgetScreenProperties "Screen properties" for the properties available.
*/
mosync.MAW_SCREEN = "Screen";

/**
* @brief A tab screen is a special type of screen that can have any number of sub-screens each switchable using a tab bar. See \ref WidgetTabScreenProperties "Tab screen properties" for the properties available.
*/
mosync.MAW_TAB_SCREEN = "TabScreen";

/**
* @brief A stack screen is a special type of screen that manages navigation
* between a set of screens.
*
* The screen stack can be pushed or popped. Pushing a given screen will hide
* the current screen and display the pushed screen. Popping a screen hides
* the current screen and shows the previous screen in the stack. See
* maWidgetStackScreenPush() and maWidgetStackScreenPop().
*
* Navigation between the screens in the stack is handled according to the
* norm on the specific platform. On iPhone a navigation bar is added to each
* pushed screen that can be used to go back, while on Android there is no
* extra UI added and the back button is used to go back to the previous screen.
* See \ref WidgetStackScreenProperties "Stack screen properties" for the
* properties available.
*/
mosync.MAW_STACK_SCREEN = "StackScreen";

/**
* @brief A button is a widget that represent a physical button that can be pressed. See \ref WidgetButtonProperties "Button properties" for the properties available.
*/
mosync.MAW_BUTTON = "Button";

/**
* @brief An image is a widget that can be used to display an image. See \ref WidgetImageProperties "Image properties" for the properties available.
*/
mosync.MAW_IMAGE = "Image";

/**
* @brief An image button is a button that will also affect the appearance of the background image when pressed. See \ref WidgetImageButtonProperties "Image button properties" for the properties available.
*/
mosync.MAW_IMAGE_BUTTON = "ImageButton";

/**
* @brief A label is a widget that can be used to display static non-editable text. See \ref WidgetLabelProperties "Label properties" for the properties available.
*/
mosync.MAW_LABEL = "Label";

/**
* @brief An editbox is an editable label. See \ref WidgetEditBoxProperties "Editbox properties" for the properties available.
*/
mosync.MAW_EDIT_BOX = "EditBox";

/**
* @brief A list view is a vertical list of widgets that is also scrollable.
* When creating a list view object the #MAW_LIST_VIEW_TYPE property must be immediately set.
*/
mosync.MAW_LIST_VIEW = "ListView";

/**
* @brief A list view item is a special kind of layout compatible with the list view. That has a predefined common layout for adding text, an icon etc. See \ref WidgetListViewItemProperties "List view item properties" for the properties available.
*/
mosync.MAW_LIST_VIEW_ITEM = "ListViewItem";

/**
 * @brief A check box is a widget that acts like a physical switch. When pressed it will toggle its internal state that can either be checked or non-checked. See \ref WidgetCheckBoxProperties "Check box properties" for the properties available.
 * If you want to display it with a "light" indicator, as it is on iOS use a Toggle Button instead.

 */
mosync.MAW_CHECK_BOX = "CheckBox";

/**
 * @brief A horizontal layout is a layout that stacks widgets in the horizontal axis. See \ref WidgetHorizontalLayoutProperties "Horizontal layout properties" for the properties available.
 */
mosync.MAW_HORIZONTAL_LAYOUT = "HorizontalLayout";

/**
 * @brief A vertical layout is a layout that stacks widgets in the vertical axis. See \ref WidgetVerticalLayoutProperties "Vertical layout properties" for the properties available.
 */
mosync.MAW_VERTICAL_LAYOUT = "VerticalLayout";

/**
 * @brief A relative layout is a layout that layouts widgets relative to its coordinate system. See \ref WidgetRelativeLayoutProperties "Relative layout properties" for the properties available.
 */
mosync.MAW_RELATIVE_LAYOUT = "RelativeLayout";

/**
 * @brief A search bar is a special kind of edit box that is used for searching. See \ref WidgetSearchBarProperties "Search bar properties" for the properties available.
 */
mosync.MAW_SEARCH_BAR = "SearchBar";

/**
 * @brief A nav bar is an iphone specific widget that shows a nav bar with an optional title and back button. See \ref WidgetNavBarProperties "Nav bar properties" for the properties available.
 * See \ref WidgetNavBarProperties "Navigation Bar properties" for the properties available.
 */
mosync.MAW_NAV_BAR = "NavBar";

/**
 * @brief A GL view is a widget that is used to display graphics rendered by the GPU using OpenGL|ES 1.0/1.1 calls. See \ref WidgetGLViewProperties "GL view properties" for the properties available.
 */
mosync.MAW_GL_VIEW = "GLView";

/**
 * @brief A GL view is a widget that is used to display graphics rendered by the GPU using OpenGL|ES 2.0 calls. See \ref WidgetGLViewProperties "GL view properties" for the properties available.
 */
mosync.MAW_GL2_VIEW = "GL2View";

/**
 * @brief A Camera preview widget is a widget that can bound to a camera and contain the live veiw data from the camera.
 */
mosync.MAW_CAMERA_PREVIEW = "CameraPreview";

/**
 * @brief A web view is a widget used to render web pages. See \ref WidgetWebViewProperties "Web view properties" for the properties available.
 */
mosync.MAW_WEB_VIEW = "WebView";

/**
 * @brief A progress bar is a visual indicator of progress in some operation.
 * Displays a bar to the user representing how far the operation has progressed.
 * A progress bar can also be made indeterminate, when the length of the task is unknown.
 *
 * See \ref WidgetProgressBarProperties "Progress bar properties" for the properties available.
 */
mosync.MAW_PROGRESS_BAR = "ProgressBar";

/**
 * @brief An activity indicator is a visual indicator of progress in some operation.
 * It shows a cyclic animation without an indication of progress.
 * It is used when the length of the task is unknown.
 *
 * See \ref WidgetActivityIndicatorProperties "Activity Indicator properties" for the properties available.
 */
mosync.MAW_ACTIVITY_INDICATOR = "ActivityIndicator";

/**
 * @brief A Slider is an extension of ProgressBar that adds a draggable thumb.
 * The user can touch the thumb and drag left or right to set the current progress level.
 *
 * See \ref WidgetSliderProperties "Slider properties" for the properties available.
 */
mosync.MAW_SLIDER = "Slider";

/**
 * @brief A Date Picker is a widget for selecting a date. The date can be selected by a year, month, and day spinners.
 * The minimal and maximal date from which dates to be selected can be customized.
 * The picker is initialized with the current system date.
 *
 * See \ref WidgetDatePickerProperties "Date Picker properties" for the properties available.
 */
mosync.MAW_DATE_PICKER = "DatePicker";

/**
 * @brief A Time Picker is a widget for selecting time of day, in 24 hour mode.
 * The hour and each minute digit can be controlled by vertical spinners.
 * The hour can be entered by keyboard input.
 * Availabe only on iOS for the moment.
 * See \ref WidgetTimePickerProperties "Time Picker properties" for the properties available.
 */
mosync.MAW_TIME_PICKER = "TimePicker";

/**
 * @brief A Number Picker is a widget that enables the user to select a number from a predefined range.
 * Available on iOS, WindowsPhone and Android.
 * See \ref WidgetNumberPickerProperties "Number Picker properties" for the properties available.
 */
mosync.MAW_NUMBER_PICKER = "NumberPicker";

/**
 * @brief A Video View displays a video file.
 * By default, it has attached a controller view that typically contains the buttons like
 * "Play/Pause", "Rewind", "Fast Forward" and a progress slider.
 * See \ref WidgetVideoViewProperties "Video View properties" for the properties available.
 */
mosync.MAW_VIDEO_VIEW = "VideoView";

/**
 * @brief A Toggle Button is a widget that acts like a physical switch. Displays checked/unchecked states as a button with a "light" indicator and by default accompanied with the text "ON" or "OFF".
 * It is available on Android, iOS and Windows Phone 7.
 * When pressed it will toggle its internal state that can either be checked or non-checked. See \ref WidgetToggleButtonProperties "Toggle button properties" for the properties available.
 */
mosync.MAW_TOGGLE_BUTTON = "ToggleButton";

/**
* @brief A dialog is a sort of modal view, that can look different depending on the platform.
* A Dialog gets visible only after calling maWidgetModalDialogShow().
* On Android it is a modal alert dialog.
* On iPad it is a PopoverController, and on iPhone it is a modal view.
* On Windows Phone, it's a Popup having inside a StackPanel which contains all the controls added to the dialog view.
* When a Dialog widget is created it is empty, it has no content. Any type of widget can be added inside it via #maWidgetAddChild syscalls.
* To show a Dialog call #maWidgetModalDialogShow(), to dismiss it call: #maWidgetModalDialogHide(), and to delete it call #maWidgetDestroy.
* See \ref WidgetModalDialogProperties "Modal Dialog properties" for the properties available.
*/
mosync.MAW_MODAL_DIALOG = "ModalDialog";

/**
* @brief A panorama control is a Windows Phone 7 specific control. The paroramaView is a screen container
*	 which may contain more then one screen. A screen can spann over the hardware screen width.
*	 In order to enable this you will have to set the width property of a screen to a certain value.
*	 For more information regarding this control please check the following link:
*	 http://msdn.microsoft.com/en-us/library/ff941104(v=vs.92).aspx
*
* Available only on Windows Phone 7
* See \ref WidgetPanoramaViewProperties "Panorama View properties" for the properties available
*/
mosync.MAW_PANORAMA_VIEW = "PanoramaView";

/**
* @brief A radio button available only on Android. A radio button can only have a \ref MAW_RADIO_GROUP parent.
* Checking one radio button that belongs to a radio group unchecks any previously checked radio button within the same group.
* Initially, all of the radio buttons are unchecked.
* While it is not possible to uncheck a particular radio button, the radio group can be cleared to remove the checked state.
* See \ref WidgetRadioButtonProperties "Radio Button properties" for the properties available.
*/
mosync.MAW_RADIO_BUTTON = "RadioButton";

/**
* \brief A radio group is available only on Android.
* This class is used to create a multiple-exclusion scope for a set of the \link #MAW_RADIO_BUTTON RADIO_BUTTONS \endlink .
* See \ref WidgetRadioGroupProperties "Radio Group properties" for the properties available.
*/
mosync.MAW_RADIO_GROUP = "RadioGroup";

/**
* @brief A RatingBar is an extension of Slider and ProgressBar that shows a rating in stars.
* The user can touch/drag or use arrow keys to set the rating when using the default size RatingBar.
* When using a RatingBar that supports user interaction, placing widgets to the left or right of the
* RatingBar is discouraged.
* See \ref WidgetRatingBarProperties "Rating Bar properties" for the properties available.
*/
mosync.MAW_RATING_BAR = "RatingBar";

/**
* @brief The map widget will contain the google map (on iOS and Android) and the bing map (on Windows Phone)
* controls and will allow the user to interract with the map.
* See \ref WidgetMapProperties "Map properties" for the properties available.
*/
mosync.MAW_MAP = "Map";

/**
 * @brief A map pin can pe placend on the map at a given set of coordinates and responds to click events.
 * See \ref WidgetMapPinProperties "Map pin properties" for the properties available.
 */
mosync.MAW_MAP_PIN = "MapPin";

/**
* @brief A list section widget is used to group one or more #MAW_LIST_VIEW_ITEM widgets.
* Only #MAW_LIST_VIEW_ITEM objects can be added to this list widget.
* None of the widget's properties applies to this widget, as it only acts like a widget container.
* When creating a list section the #MAW_LIST_VIEW_SECTION_TYPE property must be immediately set.
* See \ref WidgetListViewSectionProperties for the available properties.
* Platform: iOS and Android.
*/
mosync.MAW_LIST_VIEW_SECTION = "ListViewSection";

// End of JavaScript constants.

// =============================================================
//
// File: mosync-resource.js

/*
Copyright (C) 2012-2013 MoSync AB

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License,
version 2, as published by the Free Software Foundation.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
MA 02110-1301, USA.
*/

/*
 * @file mosync.resource.js
 * @author Ali Sarrafi
 *
 * Library for loading image resources into Mosync program from Javascript.
 * This library only supports image resources and used  together with the
 * NativeUI library.
 */

/**
 * The Resource handler submodule.
 * @private
 */
mosync.resource = {};

/**
 * A Hash containing all registered callback functions for
 * loadImage function.
 * @private
 */
mosync.resource.imageCallBackTable = {};

mosync.resource.imageIDTable = {};

mosync.resource.imageDownloadQueue = [];

/**
 * Loads images into image handles for use in MoSync UI systems.
 *
 *  @param imagePath relative path to the image file.
 *  @param imageID a custom ID used for refering to the image in JavaScript
 *  @param callBackFunction a function that will be called when the image is ready.
 *
 *  Example
 *  -------
 *  \code
 *    mosync.resource.loadImage("./img/logo.png", "Logo", function(imageID, imageHandle){
 *			var myImageButton = document.getNativeElementById("myImageButton");
 *			myImageButton.setProperty("image", imageHandle);
 * 		});
 *  \endcode
 *
 */
mosync.resource.loadImage = function(imagePath, imageID, successCallback)
{
	mosync.resource.imageCallBackTable[imageID] = successCallback;
	mosync.bridge.send(
			[
				"Resource",
				"loadImage",
				imagePath,
				imageID
			], null);
};

/**
 * A function that is called by C++ to pass the loaded image information.
 *
 * @param imageID JavaScript ID of the image
 * @param imageHandle C++ handle of the imge which can be used for referring to the loaded image
 * @private
 */
mosync.resource.imageLoaded = function(imageID, imageHandle)
{
	var callbackFun = mosync.resource.imageCallBackTable[imageID];
	if (undefined != callbackFun)
	{
		var args = Array.prototype.slice.call(arguments);

		// Call the function.
		callbackFun.apply(null, args);
	}
};

/**
 * Loads images into image handles from a remote URL for use in MoSync UI systems.
 *
 *  @param imageURL URL to the image file.
 *  @param imageID a custom ID used for referring to the image in JavaScript
 *  @param callBackFunction a function that will be called when the image is ready.
 *
 *  Example
 *  -------
 *  \code
 *    mosync.resource.loadRemoteImage("http://www.example.com/img/logo.png", "Logo", function(imageID, imageHandle){
 *			var myImageButton = document.getNativeElementById("myImageButton");
 *			myImageButton.setProperty("image", imageHandle);
 * 		});
 *  \endcode
 */
mosync.resource.loadRemoteImage = function(imageURL, imageID, callBackFunction)
{
	mosync.resource.imageCallBackTable[imageID] = callBackFunction;
	var message = [
		"Resource",
		"loadRemoteImage",
		imageURL,
		imageID
	];
	// Add message to queue.
	mosync.resource.imageDownloadQueue.push(message);

	if (1 == mosync.resource.imageDownloadQueue.length)
	{
		mosync.bridge.send(message, null);
	}

};

mosync.resource.imageDownloadStarted = function(imageID, imageHandle)
{
	mosync.resource.imageIDTable[imageHandle] = imageID;
};

mosync.resource.imageDownloadFinished = function(imageHandle)
{
	var imageID = mosync.resource.imageIDTable[imageHandle];
	var callbackFun = mosync.resource.imageCallBackTable[imageID];
	if (undefined != callbackFun)
	{
		// Call the function.
		callbackFun(imageID, imageHandle);
	}
	// Remove first message.
	if (mosync.resource.imageDownloadQueue.length > 0)
	{
		mosync.resource.imageDownloadQueue.shift();
	}

	// If there are more messages, send the next
	// message in the queue.
	if (mosync.resource.imageDownloadQueue.length > 0)
	{
		mosync.bridge.send(
			mosync.resource.imageDownloadQueue[0],
			null);
	}
};

/**
 * Send a log message to a remote server. This is useful for
 * displaying debug info when developing/testing on a device.
 *
 * When using Reload, the Reload Client is set up to send log
 * messages to the Reload Server. Nothing needs to be written
 * or configured in C++ in this case.
 *
 * If you wish to implement your own logging handler, you do this
 * in C++ by creating a subclass of class Wormhole::LogMessageListener,
 * implementing method onLogMessage, and then setting the listener
 * using Wormhole::ResourceMessageHandler::setLogMessageListener().
 * See the implementation of the Reload Client for an example of this.
 *
 * @param message The message to be sent, for example "Hello World".
 *
 * @param url Optional string parameter that specifies url of the
 * remote server that should handle the log request, for example:
 * "http://localhost:8282/remoteLogMessage/"
 * If this parameter is not supplied or set to null, "undefined" will
 * be passed to the C++ log message handler.
 */
mosync.resource.sendRemoteLogMessage = function(message, url)
{
	var urlParam = url;
	if (!urlParam)
	{
		urlParam = "undefined";
	}
	mosync.bridge.send([
		"Resource",
		"sendRemoteLogMessage",
		urlParam,
		message
	]);
};

/**
 * Short alias for mosync.resource.sendRemoteLogMessage
 * ("rlog" is short for "remote log").
 * If you use Reload, you can call mosync.rlog like this:
 * mosync.rlog("Hello World");
 * The log message will show up in the Reload user interface.
 */
mosync.rlog = mosync.resource.sendRemoteLogMessage;

// =============================================================
//
// File: mosync-nativeui.js

/*
Copyright (C) 2012-2013 MoSync AB

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License,
version 2, as published by the Free Software Foundation.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
MA 02110-1301, USA.
*/

/**
 * @file mosync.nativeui.js
 * @author Ali Sarrafi
 *
 * Library for supporting Native widgets in Javascript and Web applications.
 * Provides support for designing UI both programatically and declaratively.
 * Should be used together with mosync-resource.js
 */

/**
 * @namespace The mosync.nativeui module
 */
mosync.nativeui = {};

/**
 * A hash containing all callback functions that are registered for getting
 * response of creating a widget
 * @private
 */
mosync.nativeui.callBackTable = {};

/**
 * List of registered callback functions for WidgetEvents
 * @private
 */
mosync.nativeui.eventCallBackTable = {};

/**
 * used to generate IDs for widgets that do not have one
 * @private
 */
mosync.nativeui.widgetCounter = 0;

/**
 * A unique string ID for the main webview widget.
 */
mosync.nativeui.mainWebViewId = "mosync.nativeui.mainWebViewId";

/**
 * Creates a mosync.nativeui widget and registers its callback for return of the
 * handle. Used internally: use mosync.nativeui.create in your code.
 *
 * @param widgetType
 *            A string that includes type of the widget defined in MoSync API
 *            reference
 * @param widgetID
 *            An ID set by the user for high level access to the widget
 * @param successCallback
 *            The function that would be called when the widget is created
 * @param errorCallback
 *            The function that would be called if an error happens
 * @param processedCallback
 *            optional call back for knowing that the message is processed
 *
 * @private
 */
mosync.nativeui.maWidgetCreate = function(
		widgetType,
		widgetID,
		successCallback,
		errorCallback,
		processedCallback,
		properties)
{

	callbackID = "create" + widgetID;
	var message = ["NativeUI","maWidgetCreate", widgetType, widgetID,
			callbackID ];
	if (properties) {
		var params = [];
		var ii = 0;
		for ( var key in properties) {
			params[ii] = String(mosync.nativeui.getNativeAttrName(key));
			ii++;
			params[ii] = String(mosync.nativeui
					.getNativeAttrValue(properties[key]));
			ii++;
		}
		message.push(String(params.length));
		message = message.concat(params);
	} else {
		message.push("0");
	}

	mosync.bridge.send(message, processedCallback);
	// TODO: Micke says: Should we move this code to before send?
	mosync.nativeui.callBackTable[callbackID] = {
		success : successCallback,
		error : errorCallback
	};
};

/**
 * Destroys a widget
 *
 * @param widgetID
 *            ID for the widget in question
 * @param processedCallback
 *            optional call back for knowing that the message is processed. See
 *            mosync.nativeui.getElementById for getting handles
 * @private
 */
mosync.nativeui.maWidgetDestroy = function(widgetID, successCallback,
		errorCallback, processedCallback) {
	callbackID = "destroy" + widgetID;
	var mosyncWidgetHandle = mosync.nativeui.widgetIDList[widgetID];
	mosync.bridge.send([ "NativeUI", "maWidgetDestroy",
			mosyncWidgetHandle + "", callbackID ], processedCallback);
	mosync.nativeui.callBackTable[callbackID] = {
		success : successCallback,
		error : errorCallback
	};
};

/**
 * Adds a widget to the given parent as a child. Letting the parent widget
 * layout the child.
 *
 * @param widgetID
 *            ID of the widget assigned by the user
 * @param childID
 *            ID of the widget to be added as a child
 * @param processedCallback
 *            optional call back for knowing that the message is processed
 *
 * @private
 */
mosync.nativeui.maWidgetAddChild = function(widgetID, childID, successCallback,
		errorCallback, processedCallback) {
	callbackID = "addChild" + widgetID + childID;
	var mosyncWidgetHandle = mosync.nativeui.widgetIDList[widgetID];
	var mosyncChildHandle = mosync.nativeui.widgetIDList[childID];
	mosync.bridge.send([ "NativeUI", "maWidgetAddChild",
			mosyncWidgetHandle + "", mosyncChildHandle + "", callbackID ],
			processedCallback);
	mosync.nativeui.callBackTable[callbackID] = {
		success : successCallback,
		error : errorCallback
	};
};

/**
 * Inserts a widget to the given parent as a child at an index. Letting the
 * parent widget layout the child.
 *
 * @param widgetID
 *            ID of the parent widget
 * @param childID
 *            ID of the child widget
 * @param index
 *            place for the child widget, -1 means last
 * @param processedCallback
 *            optional call back for knowing that the message is processed
 *
 * @private
 */
mosync.nativeui.maWidgetInsertChild = function(widgetID, childID, index,
		successCallback, errorCallback, processedCallback) {
	callbackID = "insertChild" + widgetID;
	var mosyncWidgetHandle = mosync.nativeui.widgetIDList[widgetID];
	var mosyncChildHandle = mosync.nativeui.widgetIDList[childID];
	mosync.bridge.send(
			[ "NativeUI", "maWidgetInsertChild", mosyncWidgetHandle + "",
					mosyncChildHandle + "", index, callbackID ],
			processedCallback);
	mosync.nativeui.callBackTable[callbackID] = {
		success : successCallback,
		error : errorCallback
	};
};

/**
 * Removes a child widget from its parent (but does not destroy it). Removing a
 * currently visible top-level widget causes the MoSync view to become visible.
 *
 * @param childID
 *            ID for the child widget
 * @param processedCallback
 *            optional call back for knowing that the message is processed
 *
 * @private
 */
mosync.nativeui.maWidgetRemoveChild = function(childID, successCallback,
		errorCallback, processedCallback) {
	callbackID = "removeChild" + childID;
	var mosyncChildHandle = mosync.nativeui.widgetIDList[childID];
	mosync.bridge.send([ "NativeUI", "maWidgetRemoveChild",
			mosyncChildHandle + "", callbackID ], processedCallback);
	mosync.nativeui.callBackTable[callbackID] = {
		success : successCallback,
		error : errorCallback
	};
};

/**
 * Shows a screen. If native UI hasn't been initialized, it is also initialized
 * and disables regular MoSync drawing.
 *
 * @param childID
 *            Id of the screen that should be shown
 * @param processedCallback
 *            optional call back for knowing that the message is processed
 *
 * @private
 */
mosync.nativeui.maWidgetScreenShow = function(screenID, successCallback,
		errorCallback, processedCallback) {
	callbackID = "screenShow" + screenID;
	var mosyncScreenHandle = mosync.nativeui.widgetIDList[screenID];
	mosync.bridge.send([ "NativeUI", "maWidgetScreenShow",
			mosyncScreenHandle + "", callbackID ], processedCallback);
	mosync.nativeui.callBackTable[callbackID] = {
		success : successCallback,
		error : errorCallback
	};
};

/**
 * Shows a modalDialog.
 *
 * @param childID
 *            ID of the screen that should be shown
 * @param processedCallback
 *            optional call back for knowing that the message is processed
 *
 * @private
 */
mosync.nativeui.maWidgetModalDialogShow = function(dialogID, successCallback,
		errorCallback, processedCallback) {
	callbackID = "dialogShow" + dialogID;
	var mosyncDialogHandle = mosync.nativeui.widgetIDList[dialogID];
	mosync.bridge.send([ "NativeUI", "maWidgetModalDialogShow",
			mosyncDialogHandle + "", callbackID ], processedCallback);
	mosync.nativeui.callBackTable[callbackID] = {
		success : successCallback,
		error : errorCallback
	};
};

/**
 * Hides a modalDialog.
 *
 * @param childID
 *            ID of the screen that should be shown
 * @param processedCallback
 *            optional callback for knowing that the message is processed
 *
 * @private
 */
mosync.nativeui.maWidgetModalDialogHide = function(dialogID, successCallback,
		errorCallback, processedCallback) {
	callbackID = "dialogHide" + dialogID;
	var mosyncDialogHandle = mosync.nativeui.widgetIDList[dialogID];
	mosync.bridge.send([ "NativeUI", "maWidgetModalDialogHide",
			mosyncDialogHandle + "", callbackID ], processedCallback);
	mosync.nativeui.callBackTable[callbackID] = {
		success : successCallback,
		error : errorCallback
	};
};

/**
 * Pushes a screen to the given screen stack, hides the current screen and shows
 * the pushed screen. Pushing it to the stack will make it automatically go
 
 * back to the previous screen when popped.
 *
 * @param stackScreenID
 *            Javascript ID of the stackscreen widget
 * @param screenID
 *            Javascript ID of the screen widget
 * @param processedCallback
 *            optional call back for knowing that the message is processed
 *
 * @private
 */
mosync.nativeui.maWidgetStackScreenPush = function(stackScreenID, screenID,
		successCallback, errorCallback, processedCallback) {
	callbackID = "StackScreenPush" + screenID;
	var mosyncStackScreenHandle = mosync.nativeui.widgetIDList[stackScreenID];
	var mosyncScreenHandle = mosync.nativeui.widgetIDList[screenID];
	mosync.bridge.send(
			[ "NativeUI", "maWidgetStackScreenPush",
					mosyncStackScreenHandle + "", mosyncScreenHandle + "",
					callbackID ], processedCallback);
	mosync.nativeui.callBackTable[callbackID] = {
		success : successCallback,
		error : errorCallback
	};
};

/**
 * Pops a screen from a screen stack, hides the current screen and shows the
 * popped screen. If there is no previous screen in the screen stack,
 * an empty screen will be shown.
 *
 * @param stackScreenID
 *            JavaScript ID of the StackScreen
 * @param processedCallback
 *            optional callback for knowing that the message is processed
 *
 * @private
 */
mosync.nativeui.maWidgetStackScreenPop = function(stackScreenID,
		successCallback, errorCallback, processedCallback) {
	callbackID = "StackScreenPop" + stackScreenID
			+ Math.round(Math.random() * 100);
	var mosyncStackScreenHandle = mosync.nativeui.widgetIDList[stackScreenID];
	mosync.bridge.send([ "NativeUI", "maWidgetStackScreenPop",
			mosyncStackScreenHandle, callbackID ], processedCallback);
	mosync.nativeui.callBackTable[callbackID] = {
		success : successCallback,
		error : errorCallback
	};
};

mosync.nativeui.widgetPropertyIndexNo = 0;

/**
 * Sets a specified property on the given widget.
 *
 * @param widgetID
 *            JavaScript ID of the widget
 * @param property
 *            name of the property
 * @param value
 *            value of the property
 * @param processedCallback
 *            optional callback for knowing that the message is processed
 *
 * @private
 */
mosync.nativeui.maWidgetSetProperty = function(widgetID, property, value,
		successCallback, errorCallback, processedCallback) {

	// make sure the id is unique for this call
	callbackID = "setProperty" + widgetID + property
			+ mosync.nativeui.widgetPropertyIndexNo++;
	var widgetHandle = mosync.nativeui.widgetIDList[widgetID];
	mosync.bridge.send([ "NativeUI", "maWidgetSetProperty", widgetHandle + "",
			property, value + "", callbackID ], processedCallback);
	mosync.nativeui.callBackTable[callbackID] = {
		success : successCallback,
		error : errorCallback
	};
};

/**
 * Retrieves a specified property from the given widget.
 *
 * @param widgetID
 *            JavaScript ID of the widget
 * @param property
 *            name of the property that should be retrieved
 * @param callBackFunction
 *            the function that will be called when the property is retrieved
 * @param processedCallback
 *            optional callback for knowing that the message is processed
 *
 * @private
 */
mosync.nativeui.maWidgetGetProperty = function(widgetID, property,
		successCallback, errorCallback, processedCallback) {
	callbackID = "getProperty" + widgetID + property;
	var widgetHandle = mosync.nativeui.widgetIDList[widgetID];
	mosync.bridge.send([ "NativeUI", "maWidgetGetProperty", widgetHandle + "",
			property, callbackID ], processedCallback);
	mosync.nativeui.callBackTable[callbackID] = {
		success : successCallback,
		error : errorCallback
	};
};


/**
 * This function is called by C++ to inform creation of a widget If a creation
 * callback is registered it will be called
 *
 * @param callbackID
 *            Javascript ID of the widget
 *
 * @private
 */
mosync.nativeui.createCallback = function(callbackID, widgetID, handle) {
	var callBack = mosync.nativeui.callBackTable[callbackID];
	mosync.nativeui.widgetIDList[widgetID] = handle;

	if (callBack.success) {
		var args = Array.prototype.slice.call(arguments);
		args.shift();
		callBack.success.apply(null, args);
	}
};

/**
 * Sets the web view widget handle and maps it inside the widgetIDList
 * @param handle The handle of the web view widget.
 */
mosync.nativeui.setWebViewHandle = function(handle)
{
	// Bind the string ID of the main webview to the native widget handle.
	mosync.nativeui.widgetIDList[mosync.nativeui.mainWebViewId] = handle;

	// Create a JS widget object for the main webview.
	new mosync.nativeui.NativeWidgetElement(
		"WebView", mosync.nativeui.mainWebViewId,
		{},
		null,
		null);
};

mosync.nativeui.success = function(callbackID) {
	var callBack = mosync.nativeui.callBackTable[callbackID];

	if (callBack.success) {
		var args = Array.prototype.slice.call(arguments);
		// remove the callback ID from the argument list
		args.shift();
		callBack.success.apply(null, args);
	}
};

/**
 * The callback function for getting the widgetProperty. If a property callback
 * is registered it will be called
 *
 * @param widgetHandle
 *            C++ ID of the widget sent from C++
 * @param property
 *            retrieved property's name
 * @param value
 *            value for the retrieved property
 * @private
 */
mosync.nativeui.error = function(callbackID) {
	var callBack = mosync.nativeui.callBackTable[callbackID];
	var args = Array.prototype.slice.call(arguments);
	args.shift();
	if (callBack.error != undefined) {
		var args = Array.prototype.slice.call(arguments);
		callBack.error.apply(null, args);
	}
};

/**
 * Is called by C++ when receiving a widget event. It in turn calls the
 * registered listener for the specific Widget. You normally do not use this
 * function is called internally.
 *
 * @param widgetHandle
 *            C++ ID (MoSync Handle) of the widget that has triggered the event
 * @param eventType
 *            Type of the event (possibly followed by at most 3 event data
 *            variables)
 *
 * @private
 */
mosync.nativeui.event = function(widgetHandle, eventType) {

	var callbackID = widgetHandle + eventType;
	var callbackFunctions = mosync.nativeui.eventCallBackTable[callbackID];
	// if we have a listener registered for this combination, call it
	if (callbackFunctions != undefined) {
		// extract the function arguments
		var args = Array.prototype.slice.call(arguments);
		for (key in callbackFunctions) {

			var callbackFun = callbackFunctions[key];
			// Call the function.
			callbackFun.apply(null, args);
		}
	}
};

mosync.nativeui.NativeElementsTable = {};

/**
 * Registers a callback function for receiving widget events.
 *
 * @param widgetID
 *            JavaScript ID of the widget.
 * @param eventType
 *            Type of the events the users want to listen to.
 * @param callBackFunction
 *            function that will be called when the widget sends an event.
 * @private
 */
mosync.nativeui.registerEventListener = function(widgetID, eventType,
		listenerFunction) {
	var widgetHandle = mosync.nativeui.widgetIDList[widgetID];
	var callbackID = widgetHandle + eventType;
	if (mosync.nativeui.eventCallBackTable[callbackID]) {
		mosync.nativeui.eventCallBackTable[callbackID].push(listenerFunction);
	} else {
		mosync.nativeui.eventCallBackTable[callbackID] = [ listenerFunction ];
	}
};

/**
 * A widget object that user can interact with instead of using the low level
 * functions. This class is not used directly: see mosync.nativeui.create for usage.
 *
 *
 * @param widgetType
 *            Type of the widget that has been created
 * @param widgetID
 *            ID of the widget used for identifying the widget (can be ignored by
 *            the user)
 * @param params A dictionary that includes a list of properties to be set on the widget
 * @param successCallback
 *            a function that will be called if the operation is successful
 * @param errorCallback
 *            a function that will be called if an error occurs
 */
mosync.nativeui.NativeWidgetElement = function(widgetType, widgetID, params,
		successCallback, errorCallback) {
	var self = this;

	self.commandQueue = [];

	self.params = params;

	self.eventQueue = [];

	self.childList = [];

	//var type = widgetType;

	self.type = widgetType;
	/**
	 * Internal function used for synchronizing the widget operations. It makes
	 * sure that the widget is created before calling any other functions.
	 *
	 * @private
	 */
	this.processedMessage = function() {
		function clone(obj) {
			if (null == obj || "object" != typeof obj)
				return obj;
			var copy = obj.constructor();
			for ( var attr in obj) {
				if (obj.hasOwnProperty(attr))
					copy[attr] = obj[attr];
			}
			return copy;
		}
		// Clone the command Queue and try to send everything at once.
		var newCommandQueue = clone(self.commandQueue);
		self.commandQueue = [];
		if (newCommandQueue.length > 0) {
			for ( var i = 0; i < newCommandQueue.length; i++) {
				newCommandQueue[i].func.apply(null, newCommandQueue[i].args);
			}
		}

	};

	// Detect to see if the current widget is a screen
	this.isScreen = ((self.type == "Screen") || (self.type == "TabScreen") || (self.type == "StackScreen")) ? true
			: false;

	// Detect to see if the current widget is a dialog
	this.isDialog = (self.type == "ModalDialog") ? true : false;

	/*
	 * if the widgetID is not defined by the user, we will generate one
	 */
	if (widgetID) {
		self.id = widgetID;
	} else {
		self.id = "natvieWidget" + widgetType + mosync.nativeui.widgetCounter;
		mosync.nativeui.widgetCounter++;
	}

	/**
	 * Internal success function used for creation of the widget
	 *
	 * @private
	 */
	this.onSuccess = function(widgetID, widgetHandle) {
		self.created = true;
		self.handle = widgetHandle;
		if (self.eventQueue) {
			for (key in self.eventQueue) {
				self.addEventListener(self.eventQueue[key].event,
						self.eventQueue[key].callback);
			}
		}
		if (successCallback) {

			successCallback.apply(null, [ widgetID ]);
		}
	};
	/**
	 * Internal error function used for creation of the widget
	 *
	 * @private
	 */
	this.onError = function(errorCode)
	{
		self.latestError = errorCode;
		if (errorCallback)
		{
			errorCallback.apply(null, [ errorCode ]);
		}
	};

	// Send a message to the native layer to create the widget.
	// Note that if we get the id of the main webview, we don't
	// create a new widget, it already exists.
	// This allows us to create a widget tree where the main
	// webveiw can be inserted.
	if (self.id !== mosync.nativeui.mainWebViewId)
	{
		mosync.nativeui.maWidgetCreate(
			widgetType,
			self.id,
			this.onSuccess,
			this.onError,
			self.processedMessage,
			self.params);
	}
	else
	{
		self.created = true;
		self.handle = mosync.nativeui.widgetIDList[mosync.nativeui.mainWebViewId];
	}

	/**
	 * Sets a property to the widget in question.
	 *
	 * @param property
	 *            name of the property
	 * @param successCallback
	 *            a function that will be called if the operation is successful
	 * @param errorCallback
	 *            a function that will be called if an error occurs
	 * Example
	 * -------
	 * \code
	 * 		var myWidget = mosync.nativeui.create("Button" ,"myButton");
	 * 		myWidget.setProperty("width", "FILL_AVAILABLE_SPACE")
	 * \endcode
	 */
	this.setProperty = function(property, value, successCallback, errorCallback)
	{
		if (self.created)
		{
			self.params[property] = value;

			mosync.nativeui.maWidgetSetProperty(self.id, property, value,
					successCallback, errorCallback, self.processedMessage);
		}
		else
		{
			self.commandQueue.push({
				func : self.setProperty,
				args : [ property, value, successCallback, errorCallback ]
			});
		}
	};

	/**
	 * Retrieves a property and call the respective callback.
	 *
	 * @param property
	 *            name of the property
	 * @param successCallback
	 *            a function that will be called if the operation is successful,
	 *            called with two parameters, property name and property value, for example:
	 *            function(prop, value) { ... }
	 * @param errorCallback
	 *            a function that will be called if an error occurs, takes no parameters
	 */
	this.getProperty = function(property, successCallback, errorCallback)
	{
		if (self.created)
		{
			mosync.nativeui.maWidgetGetProperty(self.id, property,
					successCallback, errorCallback, self.processedMessage);
		}
		else
		{
			self.commandQueue.push({
				func : self.getProperty,
				args : [ property, successCallback, errorCallback ]
			});
		}
	};

	/**
	 * Registers an event listener for this widget.
	 *
	 * @param eventType
	 *            type of the event that the user wants to listen to
	 * @param listenerFunction
	 *            a function that will be called when that event is fired
	 *
	 * Example
	 * -------
	 *	\code
	 *	//Create a new button and add an event listener to it
	 *	var myButton = mosync.nativeui.create("Button" ,"myButton",
	 *	{
	 *		//properties of the button
	 *		"width": "FILL_AVAILABLE_SPACE",
	 *		"text": "Click Me!"
	 *	});
	 *	myButton.addEventListener("Clicked", function()
	 *	{
	 *		alert("second button is cliecked");
	 *	});
	 *	\endcode
	 *
	 */
	this.addEventListener = function(eventType, listenerFunction)
	{
		if (self.created)
		{
			mosync.nativeui.registerEventListener(self.id, eventType,
					listenerFunction);
		}
		else
		{
			self.eventQueue.push({
				event : eventType,
				callback : listenerFunction
			});
		}

	};

	/**
	 * Adds a child widget to the current widget.
	 *
	 * @param childID
	 *            the ID for the child widget
	 * @param successCallback
	 *            a function that will be called if the operation is successful
	 * @param errorCallback
	 *            a function that will be called if an error occurs
	 *
	 * Example
	 * -------
	 * \code
	 * 	 //Create a Native Screen
	 *   var myScreen = mosync.nativeui.create("Screen" ,"myScreen", {
	 *    	"title": "My Screen"
	 *   });
	 *
	 *   //Create a Button
	 *	 var myButton = mosync.nativeui.create("Button" ,"myButton",
	 *	 {
	 *		//properties of the button
	 *		"width": "FILL_AVAILABLE_SPACE",
	 *		"text": "Click Me!"
	 *	 });
	 *
	 *	//Add the button to the Created Screen
	 *  myScreen.addChild("myButton")
	 * \endcode
	 *
	 */
	this.addChild = function(childID, successCallback, errorCallback)
	{
		if(childID != undefined)
		{
			self.childList.push(childID);
			if ((self.created))
			{
				mosync.nativeui.maWidgetAddChild(self.id, childID, successCallback,
						errorCallback, self.processedMessage);
			}
			else
			{
				self.commandQueue.push({
					func : self.addChild,
					args : [ childID, successCallback, errorCallback ]
				});
			}
		}
		else
		{
			errorCallback.apply(null, "invalid Child Id");
		}
	};

	/**
	 * Inserts a new child widget in the specified index.
	 *
	 * @param childID
	 *            ID of the child widget
	 * @param index
	 *            the index for the place that the new child should be inserted
	 * @param successCallback
	 *            a function that will be called if the operation is successful
	 * @param errorCallback
	 *            a function that will be called if an error occurs
	 *
	 * Example
	 * -------
	 * \code
	 * 	 //Create a Native Screen
	 *   var myScreen = mosync.nativeui.create("Screen" ,"myScreen", {
	 *    	"title": "My Screen"
	 *   });
	 *
	 *   //Create a Button
	 *	 var myButton = mosync.nativeui.create("Button" ,"myButton",
	 *	 {
	 *		//properties of the button
	 *		"width": "FILL_AVAILABLE_SPACE",
	 *		"text": "Click Me!"
	 *	 });
	 *
	 *	//Insert the button to the Created Screen child list
	 *  myScreen.insertChild(0, "myButton")
	 * \endcode
	 */
	this.insertChild = function(childID, index, successCallback, errorCallback)
	{
		if(childID != undefined)
		{
			self.childList.splice(index, 0, childID);
			if (self.created)
			{
				mosync.nativeui.maWidgetInsertChild(self.id, childID, index,
						successCallback, errorCallback, self.processedMessage);
			} else {
				self.commandQueue.push({
					func : self.insertChild,
					args : [ childID, index, successCallback, errorCallback ]
				});
			}
		}
		else
		{
			errorCallback.apply(null, "invalid Child Id");
		}
	};

	/**
	 * Removes a child widget from the child list of the current widget.
	 *
	 * @param childID
	 *            Id of the child widget that will be removed
	 * @param successCallback
	 *            a function that will be called if the operation is successful
	 * @param errorCallback
	 *            a function that will be called if an error occurs
	 *
	 * Example
	 * -------
	 * \code
	 * 	 //Create a Native Screen
	 *   var myScreen = mosync.nativeui.create("Screen" ,"myScreen", {
	 *    	"title": "My Screen"
	 *   });
	 *
	 *   //Create a Button
	 *	 var myButton = mosync.nativeui.create("Button" ,"myButton",
	 *	 {
	 *		//properties of the button
	 *		"width": "FILL_AVAILABLE_SPACE",
	 *		"text": "Click Me!"
	 *	 });
	 *
	 *	//Add myButton to the screen
	 *  myButton.addTo("myScreen");
	 *
	 *	//Remove mybutton from the childs of myScreen
	 *  myScreen.removeChild("myButton")
	 * \endcode
	 */
	this.removeChild = function(childID, successCallback, errorCallback)
	{
		if(childID != undefined)
		{
			if (self.created)
			{
				//remove the child ID from the list
				for(var index in self.childList)
				{
					if(self.childList[index] ==  childID)
					{
						self.childList.splice(index,1);
					}
				}
				mosync.nativeui.maWidgetRemoveChild(childID, successCallback,
						errorCallback, self.processedMessage);
			}
			else
			{
				self.commandQueue.push({
					func : self.removeChild,
					args : [ childID, successCallback, errorCallback ]
				});
			}
		}
		else
		{
			errorCallback.apply(null, "invalid Child Id");
		}
	};

	/**
	 * Adds the current widget as a child to another widget.
	 *

	 * @param parentId
	 *            JavaScript ID of the parent widget
	 * @param successCallback
	 *            (optional) a function that will be called when the operation
	 *            is done successfuly
	 * @param errorCallback
	 *            (optional) a function that will be called when the operation
	 *            encounters an error
	 *
	 * Example
	 * -------
	 *	\code
	 *	//Create a new button and add an event listener to it
	 *	var secondButton = mosync.nativeui.create("Button" ,"SecondButton",
	 *	{
	 *		//properties of the button
	 *		"width": "FILL_AVAILABLE_SPACE",
	 *		"text": "Second Button"
	 *	});
	 *	secondButton.addTo("mainLayout");
	 *	secondButton.addEventListener("Clicked", function()
	 *	{
	 *		alert("second button is clicked");
	 *	});
	 *	\endcode
	 */
	this.addTo = function(parentId, successCallback, errorCallback)
	{
		var parent = document.getNativeElementById(parentId);
		if (
				(self.created) &&
				(parent != undefined) &&
				(parent.created) &&
				(self.created != undefined)
			)
		{
			parent.addChild(self.id, successCallback, errorCallback);
		}
		else
		{
			self.commandQueue.push({
				func : self.addTo,
				args : [ parentId, successCallback, errorCallback ]
			});
		}
	};

	/**
	 * Clones the current Widget.
	 *
	 * @param newID The ID for the newly created widget.
	 *
	 * Example
	 * -------
	 *	\code
	 *	//Create a new button and add an event listener to it
	 *	var secondButton = mosync.nativeui.create("Button" ,"SecondButton",
	 *	{
	 *		//properties of the button
	 *		"width": "FILL_AVAILABLE_SPACE",
	 *		"text": "Second Button"
	 *	});
	 *	secondButton.addTo("mainLayout");
	 *	var thirdButton = secondButton.clone();
	 *	\endcode
	 */
	this.clone = function(newID) {
		var widgetClone = mosync.nativeui.create(self.type, newID, self.params);
		for (var index in self.childList)
		{
			var currentChild = document.getNativeElementById(self.childList[index]);
			var newChildID = newID + "child" + index;
			console.log("cloning " + currentChild.id + "into " + newChildID);
			var clonedChild = currentChild.clone(newChildID);
			clonedChild.addTo(newID);
		}
		return widgetClone;
	};


	/*
	 * Only create screen related functions if the widget is a screen
	 */
	if (self.isScreen) {
		/**
		 * Shows a screen widget on the screen. Will be set to null if the widget
		 * is not of type screen.
		 *
		 * @param successCallback
		 *            a function that will be called if the operation is
		 *            successful
		 * @param errorCallback
		 *            a function that will be called if an error occurs
		 *
		 * Example
		 * -------
		 * \code
		 * 	 //Create a Native Screen
		 *   var myScreen = mosync.nativeui.create("Screen" ,"myScreen", {
		 *    	"title": "My Screen"
		 *   });
		 *
		 *   //Create a Button
		 *	 var myButton = mosync.nativeui.create("Button" ,"myButton",
		 *	 {
		 *		//properties of the button
		 *		"width": "FILL_AVAILABLE_SPACE",
		 *		"text": "Click Me!"
		 *	 });
		 *
		 *	//Add the button to the Created Screen
		 *  myScreen.addChild("myButton");
		 *
		 *  //Show the created screen on the device's screen
		 *  myScreen.show();
		 * \endcode
		 *
		 */
		this.show = function(successCallback, errorCallback) {
			if (self.created) {
				mosync.nativeui.maWidgetScreenShow(self.id, successCallback,
						errorCallback, self.processedMessage);
			} else {
				self.commandQueue.push({
					func : self.show,
					args : [ successCallback, errorCallback ]
				});
			}
		};

		/**
		 * Pushes a screen to a StackScreen.
		 *
		 * @param stackScreenID
		 *            the ID for the stackscreen that should be used for pushing
		 *            the current screen
		 * @param successCallback
		 *            a function that will be called if the operation is
		 *            successful
		 * @param errorCallback
		 *            a function that will be called if an error occurs
		 *
		 *
		 * Example
		 * -------
		 * \code
		 * 	 //Create a Native StackScreen
		 *   var myStackScreen = mosync.nativeui.create("StackScreen" ,"myStackScreen");
		 *   var myScreen = mosync.nativeui.create("Screen" ,"myScreen", {
		 *    	"title": "My Screen"
		 *   });
		 *
		 *   //Create a Button
		 *	 var myButton = mosync.nativeui.create("Button" ,"myButton",
		 *	 {
		 *		//properties of the button
		 *		"width": "FILL_AVAILABLE_SPACE",
		 *		"text": "Click Me!"
		 *	 });
		 *
		 *	//Add the button to the Created Screen
		 *  myScreen.addChild("myButton");
		 *
		 *  //Show the created screen on the device's screen
		 *  myStackScreen.show();
		 *
		 *  myScreen.pushTo("myStackScreen")
		 * \endcode
		 */
		this.pushTo = function(stackScreenID, successCallback, errorCallback) {
			var stackScreen = document.getNativeElementById(stackScreenID);
			if ((self.created) && (stackScreen != undefined)
					&& (stackScreen.created) && (self.created != undefined)) {
				mosync.nativeui.maWidgetStackScreenPush(stackScreenID, self.id,
						successCallback, errorCallback, self.processedMessage);
			} else {
				self.commandQueue.push({
					func : self.pushTo,
					args : [ stackScreenID, successCallback, errorCallback ]
				});
			}
		};

		/**
		 *
		 * Pops a screen from the current stackscreen, Use only for StackScreen
		 * widgets.
		 *
		 * @param successCallback
		 *            a function that will be called if the operation is
		 *            successful
		 * @param errorCallback
		 *            a function that will be called if an error occurs
		 *
		 * Example
		 * -------
		 * \code
		 * 	 //Create a Native StackScreen
		 *   var myStackScreen = mosync.nativeui.create("StackScreen" ,"myStackScreen");
		 *   var myScreen = mosync.nativeui.create("Screen" ,"myScreen", {
		 *    	"title": "My Screen"
		 *   });
		 *
		 *   //Create a Button
		 *	 var myButton = mosync.nativeui.create("Button" ,"myButton",
		 *	 {
		 *		//properties of the button
		 *		"width": "FILL_AVAILABLE_SPACE",
		 *		"text": "Click Me!"
		 *	 });
		 *
		 *	//Add the button to the Created Screen
		 *  myScreen.addChild("myButton");
		 *
		 *  //Show the created screen on the device's screen
		 *  myStackScreen.show();
		 *
		 *  myScreen.pushTo("myStackScreen");
		 *
		 *  myStackScreen.pop();
		 * \endcode
		 *
		 */
		this.pop = function(successCallback, errorCallback) {
			if (self.created) {
				mosync.nativeui.maWidgetStackScreenPop(self.id,
						successCallback, errorCallback, self.processedMessage);
			} else {
				self.commandQueue.push({
					func : self.pop,
					args : [ successCallback, errorCallback ]
				});
			}
		};
	}
	/*
	 * Create dialog functions for dialog widgets only
	 */
	if (this.isDialog) {
		/**
		 * Shows a modal dialog widget on the screen.
		 *
		 * @param successCallback
		 *            a function that will be called if the operation is
		 *            successful
		 * @param errorCallback
		 *            a function that will be called if an error occurs
		 *
		 */
		this.showDialog = function(successCallback, errorCallback) {
			if (self.created) {
				mosync.nativeui.maWidgetModalDialogShow(self.id,
						successCallback, errorCallback, self.processedMessage);
			} else {
				self.commandQueue.push({
					func : self.showDialog,
					args : [ successCallback, errorCallback ]
				});
			}
		};

		/**
		 * Hides a modal dialog widget from the screen.
		 *
		 * @param successCallback
		 *            a function that will be called if the operation is
		 *            successful
		 * @param errorCallback
		 *            a function that will be called if an error occurs
		 *
		 */
		this.hideDialog = function(successCallback, errorCallback) {
			if (self.created) {
				mosync.nativeui.maWidgetModalDialogHide(self.id,
						successCallback, errorCallback, self.processedMessage);
			} else {
				self.commandQueue.push({
					func : self.hideDialog,
					args : [ successCallback, errorCallback ]
				});
			}
		};

	}
	// add the current widget to the table
	mosync.nativeui.NativeElementsTable[this.id] = this;

};

/**
 * Used to access the nativeWidgetElements created from the HTML markup. It
 * returns the object that can be used to change the properties of the specified
 * widget.
 *
 *
 * @param widgetID
 *            the ID attribute used for identifying the widget in DOM
 *
 * Example
 * -------
 * \code
 * 	  //Get the screen widget
 *    var myScreen = document.getNativeElementById("MyScreen")
 *    //Show it on the device's screen
 *    myScreen.show()
 * \endcode
 */
document.getNativeElementById = function(widgetID)
{
	return mosync.nativeui.NativeElementsTable[widgetID];
};

/**
 * Get the id of the main webview. This can be used to
 * insert the main webview into a widget tree.
 * @return The string id of the main webview widget.
 */
mosync.nativeui.getMainWebViewId = function()
{
	return mosync.nativeui.mainWebViewId;
};

/**
 * Creates a widget and returns a mosync.nativeui.NativeWidgetElement object.
 * The object then can be used for modifying the respective NativeElement.
 *
 *
 * @param widgetType
 *            type of the widget that should be created
 * @param widgetID
 *            ID that will be used for refrencing to the widget
 * @param successCallback
 *            (optional) a function that will be called when the operation is
 *            done successfully
 * @param errorCallback
 *            (optional) a function that will be called when the operation
 *            encounters an error
 *
 * @returns An object of type mosync.nativeui.NativeWidgetElement
 *
 * Example:
 * --------
 * \code
 * 		var myButton = mosync.nativeui.create("Button", "myButton", {
 *					"text" : "Click Me!",
 *					"width" : "FILL_AVAILABLE_SPACE"
 * 					});
 * \endcode
 */
mosync.nativeui.create = function(widgetType, widgetID, params,
		successCallback, errorCallback) {
	var widget = new mosync.nativeui.NativeWidgetElement(widgetType, widgetID,
			params, successCallback, errorCallback);
	return widget;
};

/**
 * Destroys all of the created widgets and cleans up the memory.
 * @private
 */
mosync.nativeui.destroyAll = function()
{
	for (var widget in mosync.nativeui.widgetIDList)
	{
		// Destroy all widgets and do not wait for anything.
		mosync.nativeui.maWidgetDestroy(widget, null, null, null);
	}
};


/**
 * Stores the number of widgets that are waiting to be created. Used when
 * parsing the XML based input
 * @private
 */
mosync.nativeui.numWidgetsRequested = 0;

/**
 * Stores the number of widgets that are created. Used when parsing the XML
 * based input
 * @private
 */
mosync.nativeui.numWidgetsCreated = 0;

/**
 * The interval for checking the availability of all widgets. Used when parsing
 * the XML based input
 * @private
 */
mosync.nativeui.showInterval;

/**
 * List of WidetIDs and handles. Used for accessing MoSync widget handles through their IDs.
 * @private
 */
mosync.nativeui.widgetIDList = {};

/**
 * Provides access to C++ handles through IDs.
 *
 * @param elementID
 *            ID of the widget in question
 * @returns MoSync handle value for that widget
 *
 * Example
 * -------
 * \code
 *   var myButton = mosync.nativeui.getElementById("MyButton");
 *   myButton.addTo("myLayout");
 * \endcode
 * @private
 */
mosync.nativeui.getElementById = function(elementID)
{
	return mosync.nativeui.widgetIDList[elementID];
};

/**
 * Get the MoSync widget handle for the JavaScript NativeUI
 * element with the given ID.
 *
 * @param elementId A string id that identifies the widget (this
 * is the ID of the DOM element that holds the widget info).
 */
mosync.nativeui.getNativeHandleById = function(elementId)
{
	return mosync.nativeui.widgetIDList[elementId];
};

/**
 * Constant to be used to reference the main WebView in an app
 * when calling mosync.nativeui.callJS().
 */
mosync.nativeui.MAIN_WEBVIEW = 0;

/**
 * Evaluate JavaScript code in another WebView. This provides a
 * way to pass messages and communicate between WebViews.
 *
 * @param webViewHandle The MoSync handle of the WebView widget.
 * Use mosync.nativeui.MAIN_WEBVIEW to refer to the main WebView
 * in the application (this is the hidden WebView in a JavaScript
 * NativeUI app).
 * @param script A string with JavaScript code.
 */
mosync.nativeui.callJS = function(webViewHandle, script)
{
	mosync.bridge.send([
		"CallJS",
		"" + webViewHandle,
		script]);
};

/**
 * An internal function that returns the correct property name. Used to overcome
 * case sensitivity problems in browsers.
 *
 * @param attributeName
 *            name of the attribute used in HTML markup
 * @returns new name for the attribute
 * @private
 */
mosync.nativeui.getNativeAttrName = function(attributeName) {
	var correctAttrName = String(attributeName).split("data-").join("");
	switch ((correctAttrName).toLowerCase()) {
	case "fontsize":
		return "fontSize";
		break;
	case "fontcolor":
		return "fontColor";
		break;
	case "backgroundcolor":
		return "backgroundColor";
		break;
	case "backgroundgradient":
		return "backgroundGradient";
		break;
	case "currenttab":
		return "currentTab";
		break;
	case "backbuttonenabled":
		return "backButtonEnabled";
		break;
	case "textverticalalignment":
		return "textVerticalAlignment";
		break;
	case "texthorizontalalignment":
		return "textHorizontalAlignment";
		break;
	case "fonthandle":
		return "fontHandle";
		break;
	case "maxnumberoflines":
		return "maxNumberOfLines";
		break;
	case "backgroundimage":
		return "backgroundImage";
		break;
	case "scalemode":
		return "scaleMode";
		break;
	case "showkeyboard":
		return "showKeyboard";
		break;
	case "editmode":
		return "editMode";
		break;
	case "inputmode":
		return "inputMode";
		break;
	case "inputflag":
		return "inputFlag";
		break;
	case "accessorytype":
		return "accessoryType";
		break;
	case "childverticalalignment":
		return "childVerticalAlignment";
		break;
	case "childhorizontalalignment":
		return "childHorizontalAlignment";
		break;
	case "paddingtop":
		return "paddingTop";
		break;
	case "paddingleft":
		return "paddingLeft";
		break;
	case "paddingright":
		return "paddingRight";
		break;
	case "paddingbottom":
		return "paddingBottom";
		break;
	case "softhook":
		return "softHook";
		break;
	case "hardhook":
		return "hardHook";
		break;
	case "horizontalscrollbarenabled":
		return "horizontalScrollBarEnabled";
		break;
	case "verticalscrollbarenabled":
		return "verticalScrollBarEnabled";
		break;
	case "enablezoom":
		return "enableZoom";
		break;
	case "incrementprogress":
		return "incrementProgress";
		break;
	case "inprogress":
		return "inProgress";
		break;
	case "increasevalue":
		return "increaseValue";
		break;
	case "decreasevalue":
		return "decreaseValue";
		break;
	case "maxdate":
		return "maxDate";
		break;
	case "mindate":
		return "minDate";
		break;
	case "dayofmonth":
		return "dayOfMonth";
		break;
	case "currenthour":
		return "currentHour";
		break;
	case "currentminute":
		return "currentMinute";
		break;
	case "minvalue":
		return "minValue";
		break;
	case "maxvalue":
		return "maxValue";
		break;

	default:
		return correctAttrName;
	}
};

mosync.nativeui.getNativeAttrValue = function(value) {
	switch (String(value)) {
	// @deprecated The alias "100%" is kept for backwards compatibility.
	case "100%":
		return "-1";
		break;
	case "FILL_AVAILABLE_SPACE":
		return "-1";
		break;
	case "WRAP_CONTENT":
		return "-2";
		break;
	default:
		return value;
	}
};

/**
 * Creates a widget, sets its property and adds it to its parent.
 *
 * @param widgetID
 *            ID of the widget in question
 * @param parentID
 *            Id of the parentWidget
 * @private
 */
mosync.nativeui.createWidget = function(widget, parent) {
	var widgetNode = widget;
	var widgetID = widget.id;
	var imageResources = null;
	var widgetType = widgetNode.getAttribute("widgetType");
	if(widgetType == null)
	{
		widgetType = widgetNode.getAttribute("data-widgetType");
	}
	mosync.nativeui.numWidgetsRequested++;
	var attributeList = widgetNode.attributes;
	var propertyList = {};
	var eventList = null;
	for ( var i = 0; i < attributeList.length; i++) {
		// TODO: Add more event types and translate the attributes.
		if (attributeList[i].specified) {
			var attrName = mosync.nativeui
					.getNativeAttrName(attributeList[i].name);
			var attrValue = mosync.nativeui
					.getNativeAttrValue(attributeList[i].value);
			if ((attrName != "id") && (attrName != "widgettype")
					&& (attrValue != null)) {
				if ((attrName.toLowerCase() == "onevent") ||
					(attrName.toLowerCase() == "onclick")) {

					var functionData = attrValue;
					eventList = {
						type : "Clicked",
						func : function(widgetHandle, eventType) {
							// TODO: Improve event function parsing mechanism
							eval(functionData);
						}
					};
				} else if ((attrName.toLowerCase() == "image") || (attrName.toLowerCase() == "icon")) {
					imageResources = {
						propertyType : attrName,
						value : attrValue
					};
				} else if ((mosync.isAndroid) && (attrName == "icon_android")) {
					console.log("mosync.nativeui.createWidget detected an icon: " + attrValue);
					imageResources = {
						propertyType : "icon",
						value : attrValue
					};
				} else if ((mosync.isIOS) && (attrName == "icon_ios")) {
					imageResources = {
						propertyType : "icon",
						value : attrValue
					};
				} else {
					if ((attrName.toLowerCase() != "icon_ios")
							&& (attrName.toLowerCase() != "icon_android")) {
						propertyList[attrName] = attrValue;
					}
				}
			}
		}
	}
	var currentWidget = mosync.nativeui.create(
		widgetType,
		widgetID,
		propertyList,
		function(widgetID, handle) {
			var thisWidget = document.getNativeElementById(widgetID);
			mosync.nativeui.numWidgetsRequested--;
			if (imageResources != null) {
				mosync.resource.loadImage(imageResources.value,
						widgetID + "image", function(imageID,
								imageHandle) {
							thisWidget.setProperty(
									imageResources.propertyType,
									imageHandle, null, null);

						});
			}
			if (eventList != null) {
				thisWidget.addEventListener(eventList.type,
						eventList.func);
			}
		}, null);
	if (parent != null) {
		currentWidget.addTo(parent.id);
	}
};

/**
 * A function that is called when the UI is ready. By default it loads the
 * element with ID "mainScreen" Override this function to add extra
 * functionality. See mosync.nativeui.initUI for more information.
 *
 */
mosync.nativeui.UIReady = function()
{
	// This is the low level way of showing the default screen
	// If you want to override this function,
	// use document.getNativeElementById instead
	mosync.nativeui.maWidgetScreenShow("mainScreen");
};

/**
 * Recursively creates the UI from the HTML5 markup.
 *
 * @param parentid
 *            ID of the parent Widget
 * @param id
 *            ID of the currewnt widget
 * @private
 */
mosync.nativeui.createChildren = function(parent, widget) {
	if (widget != undefined) {
		var node = widget;
		var nodeChilds = node.childNodes;
		mosync.nativeui.createWidget(node, parent);
		if (nodeChilds != null) {
			for ( var i = 0; i < nodeChilds.length; i++) {

				if ((nodeChilds[i] != null)
						&& (nodeChilds[i].tagName != undefined)) {
					if ((nodeChilds[i].id == null)
							|| (nodeChilds[i].id == undefined)
							|| (nodeChilds[i].id == "")) {
						nodeChilds[i].id = "widget"
								+ mosync.nativeui.widgetCounter;
						mosync.nativeui.widgetCounter++;
					}
					mosync.nativeui.createChildren(node, nodeChilds[i]);
				}
			}
		}

	}
};

/**
 * Checks the status of UI and calls UIReady when it is ready.
 *
 * @private
 */
mosync.nativeui.CheckUIStatus = function() {
	if (0 == mosync.nativeui.numWidgetsRequested) {
		window.clearInterval(mosync.nativeui.showInterval);
		mosync.nativeui.UIReady();
	}
};

/**
 * Shows a MoSync Screen, can be used to change the current screen.
 *
 * usage example:
 *  mosync.nativeui.showScreen("myNewScreen");
 *
 * @param screenID
 * @private
 */
mosync.nativeui.showScreen = function(screenID) {
	if (numWidgetsCreated == numWidgetsRequested) {
		mosync.nativeui
				.maWidgetScreenShow(mosync.nativeui.widgetIDList[screenID]);

	}
};

/**
 * Initializes the UI system and parsing of the XML input.
 * This function should be called when the document body is loaded.
 *
 * @return true on success, false on error.
 *
 * \code
 *  <!-- The function can be called in the initialization phase of HTML document.-->
 *  <body onload="mosync.nativeui.initUI()">
 * \endcode
 *  After finalizing the widgets, the UI system will call the UIReady function.
 *  To add your operation you can override the UIReady function as below:
 *
 * \code
 *  mosync.nativeui.UIReady = function()
 *  {
 *  //Do something, and show your main screen
 *  }
 * \endcode
 */
mosync.nativeui.initUI = function() {
	var MoSyncDiv = document.getElementById("NativeUI");
	if (!MoSyncDiv) {
		// TODO: Add log error message.
		return false;
	}
	MoSyncDiv.style.display = "none"; //hide the Native Container
	var MoSyncNodes = document.getElementById("NativeUI").childNodes;
	if (!MoSyncNodes) {
		// TODO: Add log error message.
		return false;
	}
	for (var i = 1; i < MoSyncNodes.length; i++) {
		if ((MoSyncNodes[i] != null) && (MoSyncNodes[i].tagName != undefined)) {
			if (MoSyncNodes[i].id == null) {
				MoSyncNodes[i].id = "widget" + mosync.nativeui.widgetCounter;
				mosync.nativeui.widgetCounter++;
			}
			mosync.nativeui.createChildren(null, MoSyncNodes[i]);
		}
	}
	mosync.nativeui.showInterval = self.setInterval(
		"mosync.nativeui.CheckUIStatus()", 100);
	return true;
};

/**
 * Store the screen size information coming from MoSync
 * in the mosync.nativeui namespace. This function is
 * called from C++.
 */
mosync.nativeui.setScreenSize = function(width, height) {
	mosync.nativeui.screenWidth = width;
	mosync.nativeui.screenHeight = height;
}

// =============================================================
//
// File: mosync-sensormanager.js

/*
Copyright (C) 2012 MoSync AB

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License,
version 2, as published by the Free Software Foundation.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
MA 02110-1301, USA.
*/


/**
 * Returns an object that manages device sensor enumeration
 * @param type (optional) The type of sensor to look for. Null for every sensor
 /code
	var sensorReq = navigator.findSensors();

	sensorReq.addEventListener('onsuccess', function() {
		for(var count = 0; count < this.result.length; count++) {
			window.console.log("Discovered: " + this.result[count].name);
		}
	});
/endcode
 */
navigator.findSensors = function(type)
{
	return new SensorRequest(type);
};

/**
The SensorRequest object handles the device sensor enumeration
_Constructor_
@param type (optional) The sensor type. If specified, only that kind of sensor will be queried.
It can be one of the following:
	+"Accelerometer"
	+"MagneticField"
	+"Orientation"
	+"Gyroscope"
	+"Proximity"

@field result 	A Sensor array with the sensors that were discovered in the system.
				It should be read only after the 'onsuccess' event has fired.
@field readyState A string describing the state of the request. Can be either "processing" or "done"
 */
function SensorRequest(type)
{
	var self = this;

	this.result = [];
	this.readyState = "processing";
	if(type == undefined)
	{
		type = "";
	}
	this.type = type;
	var callbackId = "SensorManager" + PhoneGap.callbackId++;
	PhoneGap.callbacks[callbackId] = {
		success: function(sensorList)
		{
			self.result = sensorList.result;
			self.readyState = "done";
			for(var i = 0; i < self.events.onsuccess.length; i++)
			{
				self.events.onsuccess[i](self.result);
			}
		}
	};

	/**
		@event onsuccess Called when enumeration has finished
		@param result A Sensor array with the sensors that were discovered in the system.
	*/
	this.events = {
			"onsuccess": []
	};
	/**
		Registers a callback to an event
		@param event The name of the event
		@param listener The callback function
	*/
	this.addEventListener = function(event, listener)
	{
		if(self.events[event] != undefined)
		{
			self.events[event].push(listener);
		}
	};

	/**
		Unregisters a callback from an event
		@param event The name of the event
		@param listener The callback function
	*/
	this.removeEventListener = function(event, listener)
	{
		if(self.events[event] != undefined)
		{
			for(var i = 0; i < self.events[event].length; i++)
			{
				if(self.events[event] == listener)
				{
					self.events[event].splice(i,1);
					return;
				}
			}
		}
	};

	mosync.bridge.PhoneGap.send(
		callbackId,
		"SensorManager",
		"findSensors",
		{"type":"" + type});
}

/**
 * This object represents a connection to a sensor
 _Constructor_
 * @param options (Object or string) The sensor to connect to
 *
 * @event onerror Called when there is an error
 * @event onstatuschange Called when the status of the connection has changed
/code
//Initialization of W3C Accelerometer sensor
var accelerometer = new SensorConnection("Accelerometer");

accelerometer.addEventListener("onsensordata", updateAccelerometer);

function updateAccelerometer(sensorData){
	window.console.log("X:" + sensorData.data.x);
	window.console.log("Y:" + sensorData.data.y);
	window.console.log("Z:" + sensorData.data.z);
}

function toggleAccelerometer()
{
	if(accelerometer.status == "open")
	{
		accelerometer.startWatch({interval:1000});
	}
	else
	{
		accelerometer.endWatch();
	}
}
/endcode
 */
function SensorConnection(options)
{
	var self = this;

	if(typeof options == "string")
	{
		this.type = options;
	}
	else if(typeof options.name == "string")
	{
		this.type = options.name;
	}
	else
	{
		this.type = options.type;
	}

	/**
		Starts the periodic sampling of the sensor
	*/
	this.startWatch = function()
	{
		if(self.status != "open")
		{
			var exception = new DOMException();
			exception.code = DOMException.INVALID_STATE_ERR;
			throw exception;
			return;
		}
		this.setStatus("watching");
		var callbackId = "SensorManager" + PhoneGap.callbackId++;
		PhoneGap.callbacks[callbackId] = {
				success:self.sensorEvent,
				fail:self.sensorError
		};
		mosync.bridge.PhoneGap.send(
			callbackId,
			"SensorManager",
			"startSensor",
			{"type":"" + self.type, "interval":0});
	};

	/**
		Stops the sampling process
	*/
	this.endWatch = function()
	{
		if(self.status != "watching")
		{
			var exception = new DOMException();
			exception.code = DOMException.INVALID_STATE_ERR;
			throw exception;
			return;
		}
		this.setStatus("open");
		mosync.bridge.PhoneGap.send(
			null,
			"SensorManager",
			"stopSensor",
			{"type":"" + self.type});
	};

	/**
		Initiates a single sampling of the sensor data
	*/
	this.read = function()
	{
		if(self.status != "open")
		{
			var exception = new DOMException();
			exception.code = DOMException.INVALID_STATE_ERR;
			throw exception;
			return;
		}

		var callbackId = "SensorManager" + PhoneGap.callbackId++;

		PhoneGap.callbacks[callbackId] = {
			success:self.sensorEvent
		};

		mosync.bridge.PhoneGap.send(
			callbackId,
			"SensorManager",
			"startSensor",
			{"type":"" + self.type, "interval":-1});
	};
	/**
	 onsensordata Called when there is new data from the sensor
	 @param sensorData Struct containing sampling information from the sensor
	 @param sensorData.data A (x,y,z) vector with the sensor reading
	 @param sensorData.timestamp Time of sampling
	 @param sensorData.reason "read" or "watch"
	 @endparam
	 onerror Called when there is an error
	 @param sensorError Struct containing the error information
	 @param sensorError.message A string describing the error
	 @param sensorError.code The error code
	 @endparam
	 @event onstatuschange Called when the status of the sensor changes
	 @param status The new status
	 @endparam
	*/
	this.events = {
		"onsensordata": [],
		"onerror": [],
		"onstatuschange":[]
	};

	/**
		Registers a callback to an event
		@param event The name of the event
		@param listener The callback function
	*/
	this.addEventListener = function(event, listener, captureMethod)
	{
		if(self.events[event] != undefined)
		{
			self.events[event].push(listener);
		}
	};

	/**
		Unregisters a callback from an event
		@param event The name of the event
		@param listener The callback function
	*/
	this.removeEventListener = function(event, listener)
	{
		if(self.events[event] != undefined)
		{
			for(var i = 0; i < self.events[event].length; i++)
			{
				if(self.events[event] == listener)
				{
					self.events[event].splice(i,1);
					return;
				}
			}
		}
	};

	this.sensorEvent = function(sensorData)
	{
		var event = {
			data: {
				x: sensorData.x,
				y: sensorData.y,
				z: sensorData.z
			},
			accuracy: "high",
			timestamp: sensorData.timestamp,
			reason: sensorData.reason
		};

		for(var i = 0; i < self.events.onsensordata.length; i++)
		{
			self.events.onsensordata[i](event);
		}
	};

	this.sensorError = function(errorData)
	{
		this.setStatus("error");
		var sensorError = {
			code: errorData.code,
			message: errorData.message
		};
		self.error = sensorError;
		for(var i = 0; i < self.events.onerror.length; i++)
		{
			self.events.onerror[i](sensorError);
		}
	};

	this.setStatus = function(status)
	{
		if(status != self.status)
		{
			self.status = status;
			for(var i = 0; i < self.events.onstatuschange.length; i++)
			{
				self.events.onstatuschange[i](status);
			}
		}
	};

	this.setStatus("open");
}

// =============================================================
//
// File: mosync-pushnotifications.js

/*
Copyright (C) 2012-2013 MoSync AB

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License,
version 2, as published by the Free Software Foundation.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
MA 02110-1301, USA.
*/

/**
 * @file mosync-pushnotifications.js
 * @author Bogdan Iusco
 *
 * The library for supporting Push Notifications in Javascript and
 * Web applications.
 */

/**
 * @private
 */
if (!PhoneGap.hasResource("pushNotification"))
{
PhoneGap.addResource("pushNotification");

/**
 * This class provides access to device Push Notifications Service.
 */
var PushNotificationManager = function() {
	/**
	 * The last received push notification.
	 * @private
	 */
	this.lastPushNotificationData = null;
};

/**
 * Create a push notification object.
 *
 * @param message
 *            push notification's message.
 * @param sound
 *           push notification's sound filename.
 * @param iconBadge
 *           push notification's icon badge.
 *
 * @private
 */
var PushNotificationData = function(message, sound, iconBadge)
{
  this.message = message;
  this.sound = sound;
  this.iconBadge = iconBadge;
};

/**
 * Constants indicating the types of notifications the application accepts.
 * Specific to iOS.
 *
 * On Android alert type is set by default. Types on iOS include:
 *
 *  - badge: The application accepts notifications that badge the application icon.
 *  - sound: The application accepts alert sounds as notifications.
 *  - alert: The application accepts alert messages as notifications.
 *
 */
PushNotificationManager.type = {
		/*
		 * The application accepts notifications that badge the application icon.
		 */
		badge: 1,
		/*
		 * The application accepts alert sounds as notifications.
		 */
		sound: 2,
		/*
		 * The application accepts alert messages as notifications.
		 */
		alert: 4
	};

/**
 * Create a conection with a server.
 * Device token / application id will be send to the remote server.
 *
 * @param serverAddress
 *            server's ip address.
 * @param serverPort
 *            server's port number.
 *
 * @private
 */
PushNotificationManager.prototype.initialize = function(serverAddress, serverPort)
{
	PhoneGap.exec(
			null,
			null,
			"PushNotification",
			"initialize",
			{
				"serverAddress": serverAddress,
				"serverPort": serverPort
			});
};

/**
 * Asynchronously starts the registration process.
 *
 * @param successCallback
 *            the function to call when registration data is available.
 * @param errorCallback
 *            the function to call if an error occured while registering.
 *
 * Example
 * -------
 * \code
 * // The application did successfuly register for receiving push notifications.
 * function push_notification_did_registered(token) {};
 *
 * // The application did not registered for receiving push notifications.
 * function push_notification_failed_to_register(error) {}
 *
 * // Create a push notification manager object.
 * var pushNotificationManager = new PushNotificationManager();
 * pushNotificationManager.register(
 *     push_notification_did_registered,
 *     push_notification_failed_to_register);
 * \endcode
 *
 */
PushNotificationManager.prototype.register = function(
		successCallback,
		errorCallback)
{
	// successCallback required
	if (typeof successCallback !== "function") {
		console.log("PushNotificationManager Error: successCallback is not a function");
		return;
	}

	// errorCallback required
	if (errorCallback && (typeof errorCallback !== "function")) {
		console.log("PushNotificationManager Error: errorCallback is not a function");
		return;
	}

	var onSuccess = function(result)
	{
		successCallback(result);
	};

	var onError = function(err)
	{
		errorCallback(err);
	};

	PhoneGap.exec(onSuccess, onError, "PushNotification", "register", null);
};

/**
 * Unregister application for receiving push notifications.
 *
 * @param callback
 *            the function to call when the application has unregistered.
 *            This method is called only on Android platform.
 *
 * Example
 * -------
 * \code
 * function push_notification_did_unregister() {}
 *
 * // Create a push notification manager object.
 * pushNotificationManager.unregister(push_notification_did_unregister);
 *
 * \endcode
 *
 */
PushNotificationManager.prototype.unregister = function(callback)
{
	if (callback && (typeof callback !== "function")) {
		console.log("PushNotificationManager Error: callback is not a function");
		return;
	}

	var onSuccess = function(result)
	{
		callback();
	};

	PhoneGap.exec(onSuccess, null, "PushNotification", "unregister");
};

/**
 * Set push notification allowed types.
 * Call this method before registering the application for receiving push
 * notifications.
 *
 * @param successCallback
 *           the function to call if the types were set successfuly.
 * @param errorCallback
 *           the function to call if the types param is invalid.
 * @param types
 *           types of the notifications accepted by the application.
 *           If this param is not specified the application will be registered
 *           for receiving all types of notification.
 *
 * Example
 * -------
 * \code
 * 	var typesArray = [PushNotificationManager.type.badge,
 *                    PushNotificationManager.type.sound,
 *                    PushNotificationManager.type.alert];
 *
 * // Create a push notification manager object.
 * var pushNotificationManager = new PushNotificationManager();
 * pushNotificationManager.types(null, null, typesArray);
 *
 * \endcode
 */
PushNotificationManager.prototype.types = function(
	successCallback,
	errorCallback,
	types)
{
	var onSuccess = function(result)
	{
		if (successCallback && (typeof successCallback == "function"))
		{
			successCallback(err);
		}
	};

	var onError = function(err)
	{
		if (errorCallback && (typeof errorCallback == "function"))
		{
			 errorCallback(err);
		}
	};

	// Convert types param to a bitmask.
	var bitmask = 0;
	if (!types)
	{
		bitmask = PushNotificationManager.type.badge |
				  PushNotificationManager.type.sound |
				  PushNotificationManager.type.alert;
	}
	else if(typeof types == "array")
	{
		for(i in types) {
			bitmask = bitmask | types[i];
		}
	}
	else
	{
		onError("Types param is not an array");
		return;
	}

	PhoneGap.exec(onSuccess, onError, "PushNotification", "types", bitmask);
};

/**
 * Set the account ID used for registering the application.
 * Call this method before registering the application.
 *
 * @param  accountID
 *             the account id authorized to send messages to the application,
 *             typically the email address of an account set up by the
 *              application's developer.
 *             Use this function only on Android platform.
 *
 * Example
 * -------
 * \code
 * // Create a push notification manager object.
 * var pushNotificationManager = new PushNotificationManager();
 * pushNotificationManager.accountID("your_account_id");
 *
 * \endcode
 */
PushNotificationManager.prototype.accountID = function(
	accountID)
{
    PhoneGap.exec(null, null, "PushNotification", "accountID", accountID);
};

/**
 * Listener for push notification.
 *
 * @param callback
 *            The function to call when a new push notification is received.
 *
 * Example
 * -------
 * \code
 * function did_receive_push_notification(pushNotification)
 * {
 *     alert(pushNotification.message);
 * }
 * // Create a push notification manager object.
 * var pushNotificationManager = new PushNotificationManager();
 * pushNotificationManager.listener(did_receive_push_notification);
 *
 * \endcode
 */
PushNotificationManager.prototype.listener = function(callback)
{
	if (typeof callback !== "function") {
		console.log("PushNotificationManager Error: newPushNotificationCallback is not a function");
		return;
	}

	var self = this;

	var onSuccess = function(result)
	{
		var data = JSON.parse(result);
		var message = data.message ? data.message : "";
		var sound = data.sound ? data.sound : "";
		var iconBadge = data.iconBadge ? data.iconBadge : 0;
		self.lastPushNotificationData = new PushNotificationData(
			message,
			sound,
			iconBadge);
		callback(self.lastPushNotificationData);
	};

	PhoneGap.exec(onSuccess, null, "PushNotification", "listener");
};

/**
 * @private
 */
PhoneGap.addConstructor(function() {
	if (typeof navigator.pushNotification === "undefined") {
		navigator.pushNotification = new PushNotificationManager();
	}
});
} // End of Push Notification API
