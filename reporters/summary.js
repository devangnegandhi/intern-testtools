/**
 * @copyright Copyright (C) 2014 Devang Negandhi - All Rights Reserved
 */
define([
	'intern/lib/util',
	'dojo/node!./lib/diagnostics'
], function (util, Diagnostics) {
	if (typeof console !== 'object') {
		// IE<10 does not provide a global console object when Developer Tools is turned off
		return {};
	}

	var hasGrouping = 'group' in console && 'groupEnd' in console;
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
			if (suite.numFailedTests === 0) {
				console.log('%s: %d/%d tests failed', remote.environmentType, suite.numFailedTests, suite.numTests);
			} else {
				console.error('%s: %d/%d tests failed', remote.environmentType, suite.numFailedTests, suite.numTests);
			}
			console.log(' ');

			
			/*var diagnostics = new Diagnostics(); 
			diagnostics.collectDiagnostics(remote);*/
		},

		'/suite/start': hasGrouping ? function (suite) {
			console.group(suite.name);
		} : null,

		'/suite/end': function (suite) {
			if (hasGrouping) {
				console.groupEnd(suite.name);
			}

			if (suite.name === 'main') {
				if (!sessions[suite.sessionId]) {
					if (!args.proxyOnly) {
						console.warn('BUG: /suite/end was received for session ' + suite.sessionId + ' without a /session/start');
					}
					return;
				}

				sessions[suite.sessionId].suite = suite;
			}
		},

		'/suite/error': function (suite) {
			generateReport(suite);
		},

		'/test/fail': function (test) {
			generateReport(test);
		},

		'/error': function (error) {
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

			var testID = Diagnostics.generateRandomNumber();
			var sessionId = suite.sessionId;
			var remote = sessions[sessionId].remote;
			var browserName = remote.environmentType.browserName;
			var outputDir = Diagnostics.createTempDir(sessionId);

			remote._wd.takeScreenshot(function (err, data) {
				if (err) {
					var errorLogsFileName = testID + '_' + browserName + '_screenshot_error.txt';
					console.log('Reporter Error: Failed to capture screenshot for TestID: ' + testID);
					console.log(' ');
					Diagnostics.writeErrorLogs(test.error, outputDir, errorLogsFileName);

				} else {
					var imageFileName = testID + '_' + browserName + '_screenshot.png';
					Diagnostics.writeScreenshot(data, outputDir, imageFileName);
				}
			});

			remote._wd.log('browser', function (err, logs) {
				if (err) {
					var errorLogsFileName = testID + '_' + browserName + '_browser_logs_error.txt';
					console.log('Reporter Error: Failed to get browser logs for TestID: ' + testID);
					console.log(' ');
					Diagnostics.writeErrorLogs(test.error, outputDir, errorLogsFileName);
				} else {
					var browserLogsFileName = testID + '_' + browserName + '_browser_logs.txt';
					Diagnostics.writeBrowserLogs(logs, outputDir, browserLogsFileName);
				}
			});

			var errorLogsFileName = testID + '_' + 'error_logs.txt';
			Diagnostics.writeErrorLogs(suite.error, outputDir, errorLogsFileName);

			console.log(type + ' FAIL: (' + test.timeElapsed + 'ms)');
			console.log('   Error: ' + completeErrorMessage);

			if (test.parent) {
				console.log('      ParentSuiteName: ' + test.parent.parent.name);
				console.log('      SuiteName: ' + test.parent.name);
			} else {
				var splitTestId = test.id.split(' - ');
				console.log('      ParentSuiteName: ' + splitTestId[0]);
				console.log('      SuiteName: ' + splitTestId[1]);
			}
			console.log('      TestName: ' + test.name);
			console.log('      Platform: ' + remote.environmentType);
			console.log('      TestID: ' + testID);
			console.log('      Diagnostics: ' + outputDir);

			console.log('      Stacktrace: ');
			console.log('      ===========');
			console.log('      ' + stackTrace);
			console.log(' ');
		} catch (err) {
			console.log('Error in Summary report');
			console.log('ERROR:');
			console.error(JSON.stringify(err, undefined, 2));
			console.log('########################################');
			console.log('SUITE/TEST:');
			console.log(JSON.stringify(suite.error, undefined, 2));
		}
	};

	return consoleReporter;
});
