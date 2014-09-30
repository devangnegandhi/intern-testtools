/**
 * @copyright Copyright (C) 2014 Devang Negandhi - All Rights Reserved
 */
define([
	'dojo/node!intern/node_modules/leadfoot/helpers/pollUntil',
	'dojo/node!cli-color/index',
	'dojo/node!./lib/FileWriter'
], function (pollUntil, color, FileWriter) {

	var hasGrouping = 'group' in console;
	var sessions = {};

	/**
	 * Object that is subscribing to topics for reporting.
	 * checkout https://github.com/theintern/intern/wiki/Using-and-Writing-Reporters#custom-reporters
	 * @type {Object}
	 */
	var consoleReporter = {
		'/session/start': function (remote) {
			sessions[remote.sessionId] = { remote: remote };
			console.log('Initialised ' + remote.environmentType);
		},

		'/session/end': function (remote) {
			var session = sessions[remote.sessionId],
				suite = session.suite;

			// TODO: Unit tests are reported but functional tests are not. The functional tests are reported in the
			// grand total, however.
			console.log(remote.environmentType + ': ' + 
				suite.numFailedTests + '/' + 
				suite.numTests + ' tests failed'
			);
			console.log(' ');

			
			/*var diagnostics = new FileWriter(); 
			diagnostics.collectFileWriter(remote);*/
		},

		'/suite/start': function (suite) {
			if (hasGrouping) {
				console.group(suite.name);
			} else {
				return null;
			}
		},

		'/suite/end': function (suite) {
			if (hasGrouping) {
				console.groupEnd(suite.name);
			}

			if (suite.name === 'main') {
				if (!sessions[suite.sessionId]) {
					console.warn('BUG: /suite/end was received for session ' + suite.sessionId + ' without a /session/start');
					return;
				}

				sessions[suite.sessionId].suite = suite;
			} else {
				return null;
			}
		},

		'/suite/error': function (suite) {
			generateReport(suite);
		},

		'/test/fail': function (test) {
			generateReport(test);
		},

		'/error': function (error) {
			console.log(JSON.stringify(error, undefined, 2))
		},

		/**
		 * Method to set the hasGrouping boolean for testing purposes
		 * @private
		 * @param {boolean} value Set the value to true or false
		 */
		_setHasGrouping: function(value) {
			hasGrouping = value;
		},

		/**
		 * Method to reset the hasGrouping boolean after testing is done
		 * @private
		 */
		_resetHasGrouping: function() {
			hasGrouping = 'group' in console && 'groupEnd' in console;
		},

		/**
		 * Method to return the sessions 
		 * @private
		 * @return {Object} The sessions Object
		 */
		_getSessions: function() {
			return sessions;
		}
	};

	/**
	 * Function to generate a custom reporter and log diagnostics to file
	 * @param  {Object} suite The test/suite object that failed
	 */
	var generateReport = function (suite) {
		try {
			var test = null;
			var type = '';
			if (suite.error.relatedTest) {
				test = suite.error.relatedTest;
				type = 'SUITE';
			} else {
				test = suite;
				type = 'TEST';
			}
			var errorName = suite.error.name;
			var errorMessage = suite.error.message;
			var stackTrace = suite.error.stack;
			var completeErrorMessage = errorName + ': ' + errorMessage;

			if (completeErrorMessage === stackTrace) {
				stackTrace = 'No Stacktrace';
			}

			var errorID = FileWriter.generateRandomNumber();
			var sessionId = suite.sessionId;
			var remote = sessions[sessionId].remote;
			var browserName = remote.environmentType.browserName;
			var outputDir = FileWriter.createTempDir(sessionId);

			//make sure the page has loaded
			remote.getPageLoadTimeout().then(pollUntil('return window.ready;', 5000));

			remote.getAvailableLogTypes().then(function (logTypes) {
				var i = 0;
				for(; i < logTypes.length; i++) {
					recordLogs(remote, browserName, logTypes[i], errorID, outputDir);
				}
			});

			remote.getCurrentUrl().then(function (url) {
				var errorLogsFileName = errorID + '_error_logs.txt';
				FileWriter.writeErrorLogs(suite.error, outputDir, errorLogsFileName);

				var realConsoleLog = console.log;
				var logData = '';
				console.log = function(data) {
					logData += JSON.stringify(data).replace(/\\u(\d)*b\[(\d)*m/g, '') + '\n';
					logData = logData.replace(/"/g, '').replace(/\\n/g, '\n');
					realConsoleLog(data);
				}

				console.log(color.red.italic(type + ' FAIL: (' + test.timeElapsed + 'ms)'));
				console.log('   ' + color.red.bold('Error: ') + completeErrorMessage);

				if (test.parent) {
					console.log('      ' + color.cyan('ParentSuiteName:') + ' ' + test.parent.parent.name);
					console.log('      ' + color.cyan('SuiteName:') + ' ' + test.parent.name);
				} else {
					var splitTestId = test.id.split(' - ');
					console.log('      ' + color.cyan('ParentSuiteName:') + ' ' + splitTestId[0]);
					console.log('      ' + color.cyan('SuiteName:') + ' ' + splitTestId[1]);
				}
				console.log('      ' + color.cyan('TestName:') + ' ' + test.name);
				console.log('      ' + color.cyan('Platform:') + ' ' + remote.environmentType);
				console.log('      ' + color.cyan('ErrorID:') + ' ' + errorID);
				console.log('      ' + color.cyan('URL:') + ' ' + unescape(url));
				console.log('      ' + color.cyan('FileWriter:') + ' ' + outputDir);

				console.log('      ' + color.cyan('Stacktrace:'));
				console.log('      ' + color.cyan('==========='));
				console.log('      ' + color.red(stackTrace));
				console.log(' ');

				console.log = realConsoleLog;
				var textLogsFileName = errorID + '_intern_logs.txt';
				FileWriter.writeTextLogs(logData, outputDir, textLogsFileName);

				remote.getPageSource().then(function (htmlSnapshot) {

					var htmlSnapshotFileName = errorID + '_' + browserName + '_html_snapshot.html';
					FileWriter.writeTextLogs(htmlSnapshot, outputDir, htmlSnapshotFileName);
				});

				remote.takeScreenshot().then(function (data) {

					var imageFileName = errorID + '_' + browserName + '_screenshot.png';
					FileWriter.writeScreenshot(data, outputDir, imageFileName);

				}, function (err) {

					console.log('Reporter Error: Failed to capture screenshot for ErrorID: ' + errorID);
					console.log(' ');
				});
			});
		} catch (err) {
			console.log('Error in Summary report');
			console.log('ERROR:');
			console.log(err);
			console.log('=========================================');
			console.log(JSON.stringify(suite.error, undefined, 2));
		}
	};

	/**
	 * Method to record any type of text logs
	 * @param  {Object} remote      The leadfoot remote object
	 * @param  {String} browserName The name of the browser from which the log is collected
	 * @param  {String} logType     The type of log being collected
	 * @param  {Number} errorID     The errorID to which this log is associated with
	 * @param  {String} outputDir   The directory where the logs should be stored
	 */
	function recordLogs(remote, browserName, logType, errorID, outputDir) {

		remote.getLogsFor(logType).then(function (logs) {

			var browserLogsFileName = errorID + '_' + browserName + '_' + logType + '_logs.txt';
			FileWriter.writeBrowserLogs(logs, outputDir, browserLogsFileName);

		}, function (err) {

			console.log('Reporter Error: Failed to get ' + logType + ' logs for ErrorID: ' + errorID);
			console.log(' ');
		});
	}

	return consoleReporter;
});
