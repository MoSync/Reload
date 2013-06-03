
			/**
			 * Initialization.
			 */
			function initialize()
			{
				document.addEventListener("deviceready", displayDeviceInfo, true);
				document.addEventListener("backbutton", close, true);
			}

			/**
			 * Handle the backbutton event.
			 */
			function close()
			{
				// Close the application if the back key is pressed.
				mosync.bridge.send(["close"]);
			}

			/**
			 * Displays the device information on the screen.
			 */
			function displayDeviceInfo()
			{
				document.getElementById("platform").innerHTML = device.platform;
				document.getElementById("version").innerHTML = device.version;
				document.getElementById("uuid").innerHTML = device.uuid;
				document.getElementById("name").innerHTML = device.name;
				document.getElementById("width").innerHTML = screen.width;
				document.getElementById("height").innerHTML = screen.height;
			}

			/**
			 * Vibrate for 1 second.
			 */
			function vibrate()
			{
				navigator.notification.vibrate(1000);
			}

			/**
			 * Play one beep sound.
			 */
			function beep()
			{
				navigator.notification.beep(1);
			}

			/**
			 * Change page background to random color.
			 */
			function changeColor()
			{
				var color = "#" +
					(Math.random() * 0xFFFFFF + 0x1000000)
						.toString(16).substr(1,6);
				document.documentElement.style.backgroundColor = color;
				document.body.style.backgroundColor = color;
				mosync.rlog("Changed background color to " + color);
			}
