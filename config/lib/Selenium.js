/**
 * @copyright Copyright (C) 2014 Devang Negandhi - All Rights Reserved
 */

var fs = require('fs');
var path = require('path');
var touch = require('touch');
var mkdirp = require('mkdirp');
var selenium = require('selenium-standalone');
var deasync = require('deasync');
var request = deasync(require('request').defaults({json: true}));
var freeport = deasync(require('freeport'));

/**
 * @class 
 * Class to manage an instance of Selenium Server
 */
var Selenium = function() {

	var started = false;
	var SELENIUM_PORT = 0;
	var SELENIUM_ARGS = [];
	var SELENIUM_HUB = '';

	return {

		/**
		 * Method to start the Selenium Server
		 * @param  {Number} [port]       	The port at which the server has to be started at. Default is a random port
		 * @param  {Array}  [seleniumArgs] 	Array of args to pass to `java -jar selenium-server-standalone-X.XX.X.jar`
		 */
		start: function (port, seleniumArgs) {
			// Start only if no selenium was already started by this instance
			if(!started) {
				// Check if the first arg is seleniumArgs
				if(port && port instanceof Array) {
					//Assign random port
					SELENIUM_PORT = freeport();

					seleniumArgs = port;

				} else {
					SELENIUM_PORT = port || freeport();

					// user options to pass to `java -jar selenium-server-standalone-X.XX.X.jar`
					seleniumArgs = seleniumArgs || [];
				}

				SELENIUM_HUB = 'http://localhost:' + SELENIUM_PORT + '/wd/hub/status';

				// default options to pass to `java -jar selenium-server-standalone-X.XX.X.jar`
				SELENIUM_ARGS = [ '-debug', '-port', SELENIUM_PORT ];

				seleniumArgs.forEach( function (args) {
					SELENIUM_ARGS.push(args);
				});

				var logsDir = path.resolve('./logs');
				mkdirp.sync(logsDir);

				var logFile = path.resolve(logsDir, 'selenium.log');
				touch.sync(logFile);

				var seleniumOut = fs.openSync(logFile, 'a');
				var seleniumErr = fs.openSync(logFile, 'a');

				// Ignore debug output to console and instead write it to the file stream
				var spawnOptions = { stdio: [ 'ignore', seleniumOut, seleniumErr ] };

				// Start the selenium server. It will auto-shutdown once the parent proccess is killed
				var server = selenium(spawnOptions, SELENIUM_ARGS);

				// Un-couple server process with the parent process otherwise the parent process
				// will never exit as long as selenium server is not shut down
				server.unref();

				var response = undefined;
				var retries = 0;

				// Poll for selenium to start up by checking response from SELENIUM_HUB
				do {
					try {
						response = request(SELENIUM_HUB);

						// If we get a response and its statusCode is 200, it has started
						if (response && response.statusCode === 200) {
							started = true;
							break;
						}
					} catch (e) {
						// If error in connecting, do nothing and try again after a brief pause
						deasync.sleep(1000);
					}

				} while (++retries < 60);

				//If selenium failed to start, error out and exit
				if (!started) {
					throw new Error('Unable to connect to selenium');
				}

			// Report port on which this instance already started selenium
			} else {
				throw new Error('Selenium is already listening on port: ' + SELENIUM_PORT);
			}
		},

		/**
		 * Get the port at which Selenium server was started at
		 * @return {Number} Port number of the selenium server (0 if not started)
		 */
		getPort: function () {
			return SELENIUM_PORT;
		},

		/**
		 * Get the arguments that was passed to `java -jar selenium-server-standalone-X.XX.X.jar`
		 * @return {Array} Selenium arguments as an array
		 */
		getArgs: function () {
			return SELENIUM_ARGS;
		},

		/**
		 * Return the url of the Selenium hub
		 * @return {String} The Hub URL
		 */
		getHubAddress: function () {
			return SELENIUM_HUB;
		},

		/**
		 * Method to check if this instance has already successfully spawned a selenium server
		 * @return {Boolean}
		 */
		hasStarted: function() {
			return started;
		}
	}
};

module.exports = Selenium;
