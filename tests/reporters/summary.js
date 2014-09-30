/**
 * @copyright Copyright (C) 2014 Devang Negandhi - All Rights Reserved
 */
define([
	'intern!object',
	'intern/chai!assert',
	'dojo/Deferred',
	'dojo/node!sinon',
	'dojo/node!../../reporters/lib/FileWriter',
	'reporters/summary'
], function (registerSuite, assert, Deferred, sinon, FileWriter, summary) {
	var originalConsoleGroup = console.group;	
	var originalConsoleGroupEnd = console.groupEnd;	
	var loggedStr, oldConsoleLog;
	var randomNumber = 999;
	var sandbox;
	var getPageLoadTimeoutDfd,
		getAvailableLogTypesDfd,
		getLogsForDfd,
		getLogsForErrorDfd,
		getCurrentUrlDfd,
		getPageSourceDfd,
		takeScreenshotDfd;

	var mockTempDir = '/some/temp/dir/';
	var mockRemote = {
		sessionId: '0',
		environmentType: {
			browserName: 'mockBrowser',
			toString: function() {
				return 'mockEnv';
			}
		},
		getPageLoadTimeout: function () {
			return (getPageLoadTimeoutDfd = new Deferred());
		},
		getAvailableLogTypes: function () {
			return (getAvailableLogTypesDfd = new Deferred());
		},
		getLogsFor: function (mockLogType) {
			if (mockLogType === 'logType1') {
				return (getLogsForDfd = new Deferred());
			} else {
				return (getLogsForErrorDfd = new Deferred());
			}
		},
		getCurrentUrl: function () {
			return (getCurrentUrlDfd = new Deferred());
		},
		getPageSource: function () {
			return (getPageSourceDfd = new Deferred());
		},
		takeScreenshot: function () {
			return (takeScreenshotDfd = new Deferred());
		}
	};

	var mockSuite = {
		sessionId: '0',
		name: 'main',
		numTests: 55,
		numFailedTests: 10,
		error: {
			name: 'mocked error',
			message: 'mocking out the error',
			stack: 'one-on-top-of-the-other',
		}
	};

	var mockTest = {
		sessionId: '0',
		error: {
			name: 'mocked error',
			message: 'mocking out the error',
			stack: 'one-on-top-of-the-other',
		},
		parent: {
			name: 'parent',
			parent: {
				name: 'grandparent'
			}
		},
		name: 'child',
		id: 'grandparent-parent-child',
		timeElapsed: '1000',
		mockErrId: 1234
	};

	registerSuite({
		name: 'reporters/summary',

		setup: function () {
			sandbox = sinon.sandbox.create();
			//Mocking FileWriter module
			sandbox.stub(FileWriter);

			// Always returning 999 for random number generator
			FileWriter.generateRandomNumber.returns(randomNumber);
		},

		beforeEach: function() {
			mockRemote.sessionId 
				= mockSuite.sessionId 
				= mockTest.sessionId 
				= (parseInt(mockRemote.sessionId) + 1) + '';

			loggedStr = '';
			oldConsoleLog = console.log;
			console.log = function(str) {
				loggedStr += str;
			};

			FileWriter.createTempDir.returns(mockTempDir + mockSuite.sessionId);
		},

		afterEach: function() {
			if(originalConsoleGroup) {
				console.group = originalConsoleGroup;
			} else if ('group' in console) {
				delete console.group;
			}

			if(originalConsoleGroupEnd) {
				console.groupEnd = originalConsoleGroupEnd;
			} else if ('groupEnd' in console) {
				delete console.groupEnd;
			}

			if (mockSuite.error.relatedTest) {
				delete mockSuite.error.relatedTest;
			}
		},

		teardown: function () {
			sandbox.restore();
		},

		'/session/start': function() {
			try {
				summary['/session/start'](mockRemote);

				assert.equal(loggedStr, 'Initialised ' + mockRemote.environmentType, 
					'console.log should have been called');
			} finally {
				console.log = oldConsoleLog;
			}
		},

		'/suite/start#hasGroupingFalse': function() {
			var oldConsoleGroup = console.group;
			var groupName = '';

			summary._setHasGrouping(false);

			console.group = function(str) {
				groupName = str;
			};

			try {
				assert.isNull(summary['/suite/start'](), 
					'suite start should be null by default for node platform');
				
				assert.equal(groupName, '',
					'suite end should not have called console.groupEnd');
			} finally {
				console.group = oldConsoleGroup;
				console.log = oldConsoleLog;
				summary._resetHasGrouping();
			}

		},

		'/suite/start#hasGroupingTrue': function() {
			var oldConsoleGroup = console.group;
			var groupName = '';

			summary._setHasGrouping(true);

			console.group = function(str) {
				groupName = str;
			};

			try {

				summary['/suite/start'](mockSuite);

				assert.equal(groupName, mockSuite.name, 
					'suite start should have called console.group');

			} finally {
				console.group = oldConsoleGroup;
				console.log = oldConsoleLog;
				summary._resetHasGrouping();
			}
		},

		'/suite/end#hasGroupingFalse': function() {
			var oldConsoleGroupEnd = console.groupEnd;
			var oldSuiteName = mockSuite.name;
			var groupEndName = '';

			summary._setHasGrouping(false);

			console.groupEnd = function(str) {
				groupEndName = str;
			};

			try {
				mockSuite.name = 'invalid';

				summary['/session/start'](mockRemote);

				assert.isNull(summary['/suite/end'](mockSuite), 
					'suite end should be null for invalid suite name');

				assert.equal(groupEndName, '',
					'suite end should not have called console.groupEnd');

			} finally {
				console.groupEnd = oldConsoleGroupEnd;
				console.log = oldConsoleLog;
				summary._resetHasGrouping();
				mockSuite.name = oldSuiteName;
			}
		},

		'/suite/end#hasGroupingTrue#HasValidSession': function() {
			var oldConsoleGroupEnd = console.groupEnd;
			var groupEndName = '';
			var sessionObj;

			summary._setHasGrouping(true);

			console.groupEnd = function(str) {
				groupEndName = str;
			};

			try {

				summary['/session/start'](mockRemote);
				summary['/suite/end'](mockSuite);

				sessionObj = summary._getSessions();

				assert.equal(groupEndName, mockSuite.name, 
					'suite end should have called console.groupEnd');

				assert.deepEqual(sessionObj[mockSuite.sessionId].suite, mockSuite, 
					'suite end should have stored the suite obj in session obj when suite name is "main"');

			} finally {
				console.groupEnd = oldConsoleGroupEnd;
				console.log = oldConsoleLog;
				summary._resetHasGrouping();
			}
		},

		'/suite/end#HasInvalidSession': function() {
			var oldConsoleWarn = console.warn;

			var sessionObj;

			console.warn = function(str) {
				loggedStr = str;
			};

			try {

				summary['/suite/end'](mockSuite);

				sessionObj = summary._getSessions();

				assert.equal(loggedStr, 'BUG: /suite/end was received for session ' + mockSuite.sessionId + ' without a /session/start', 
					'console.warn should have been called');

				assert.equal(sessionObj[mockSuite.sessionId], undefined,
					'suite should not have been added to the session');
			} finally {
				console.warn = oldConsoleWarn;
				console.log = oldConsoleLog;
			}
		},

		'/session/end#withNoFailures': function() {
			try {

				mockSuite.numTests = 99;
				mockSuite.numFailedTests = 0;

				// To end the session, we need to start it and start->end a suite
				summary['/session/start'](mockRemote);
				summary['/suite/start'](mockSuite);
				summary['/suite/end'](mockSuite);

				loggedStr = '';

				summary['/session/end'](mockRemote);

				assert.equal(loggedStr, 
					mockRemote.environmentType + ': ' + 
					mockSuite.numFailedTests + '/' + 
					mockSuite.numTests + ' tests failed ',
					'The session end output was not as expected'
				);

			} finally {
				console.log = oldConsoleLog;
			}

		},

		'/session/end#withFailures': function() {
			try {
				mockSuite.numTests = 55;
				mockSuite.numFailedTests = 10;

				// To end the session, we need to start it and start->end a suite
				summary['/session/start'](mockRemote);
				summary['/suite/start'](mockSuite);
				summary['/suite/end'](mockSuite);

				loggedStr = '';

				summary['/session/end'](mockRemote);

				assert.equal(loggedStr, 
					mockRemote.environmentType + ': ' + 
					mockSuite.numFailedTests + '/' + 
					mockSuite.numTests + ' tests failed ',
					'The session end output was not as expected'
				);

			} finally {
				console.log = oldConsoleLog;
			}

		},

		'/test/fail#SummaryOutput': function() {

			try {
				// To end the session, we need to start it and start->end a suite
				summary['/session/start'](mockRemote);
				summary['/suite/start'](mockSuite);
				summary['/suite/end'](mockSuite);

				loggedStr = '';
				summary['/test/fail'](mockTest);

				getCurrentUrlDfd.resolve('someURL');

				var errorLogsFileName = randomNumber + '_error_logs.txt';
				var textLogsFileName = randomNumber + '_intern_logs.txt';
				
				var loggedData = 'TEST FAIL: (1000ms)\n   Error: mocked error: mocking out the error\n      ParentSuiteName: grandparent\n      SuiteName: parent\n      TestName: child\n      Platform: mockEnv\n      ErrorID: ' + randomNumber + '\n      URL: someURL\n      FileWriter: ' + mockTempDir + mockTest.sessionId + '\n      Stacktrace:\n      ===========\n      one-on-top-of-the-other\n \n';
				var loggedColorData = '"\\u001b[31m\\u001b[3mTEST FAIL: (1000ms)\\u001b[23m\\u001b[39m   \\u001b[1m\\u001b[31mError: \\u001b[39m\\u001b[22mmocked error: mocking out the error      \\u001b[36mParentSuiteName:\\u001b[39m grandparent      \\u001b[36mSuiteName:\\u001b[39m parent      \\u001b[36mTestName:\\u001b[39m child      \\u001b[36mPlatform:\\u001b[39m mockEnv      \\u001b[36mErrorID:\\u001b[39m ' + randomNumber +'      \\u001b[36mURL:\\u001b[39m someURL      \\u001b[36mFileWriter:\\u001b[39m ' + mockTempDir + mockTest.sessionId + '      \\u001b[36mStacktrace:\\u001b[39m      \\u001b[36m===========\\u001b[39m      \\u001b[31mone-on-top-of-the-other\\u001b[39m "';					

				// The expected string was pre-calculated by taking JSON.stringify(loggedStr) 
				// output manually beforehand and then making sure it is equal to that
				assert.equal(JSON.stringify(loggedStr), loggedColorData,
					'The summary output was not as expected'
				);

				assert.ok(FileWriter.writeErrorLogs.calledWith(mockTest.error, mockTempDir + mockTest.sessionId, errorLogsFileName), 
					'FileWriter.writeErrorLogs not called or called with wrong arguments');

				assert.ok(FileWriter.writeTextLogs.calledWith(loggedData, mockTempDir + mockTest.sessionId, textLogsFileName), 
					'FileWriter.writeTextLogs not called or called with wrong arguments');

			} finally {
				console.log = oldConsoleLog;
			}
		},

		'/test/fail#getAvailableLogTypes': function() {
			try {
				// To end the session, we need to start it and start->end a suite
				summary['/session/start'](mockRemote);
				summary['/suite/start'](mockSuite);
				summary['/suite/end'](mockSuite);

				loggedStr = '';
				summary['/test/fail'](mockTest);

				var mockLogTypes = ['logType1', 'logType2'];
				
				var logType1Filename = randomNumber + '_' + mockRemote.environmentType.browserName + '_' + mockLogTypes[0] + '_logs.txt';

				var mockBrowserLogs = 'mock browser logs'

				getAvailableLogTypesDfd.resolve(mockLogTypes);
				getLogsForDfd.resolve(mockBrowserLogs);

				assert.ok(FileWriter.writeBrowserLogs.calledWith(mockBrowserLogs, mockTempDir + mockTest.sessionId, logType1Filename), 
					'FileWriter.writeBrowserLogs not called or called with wrong arguemtns');

				getLogsForErrorDfd.reject(mockBrowserLogs);

				assert.equal(loggedStr, 
					'Reporter Error: Failed to get ' + mockLogTypes[1] + ' logs for ErrorID: ' + randomNumber + ' '	,
					'Invalid browser logs should have thrown an error');

			} finally {
				console.log = oldConsoleLog;
			}
		},

		'/test/fail#getPageSource': function() {
			var someHtmlSnapshot = 'someHtmlSnapshot';

			try {
				// To end the session, we need to start it and start->end a suite
				summary['/session/start'](mockRemote);
				summary['/suite/start'](mockSuite);
				summary['/suite/end'](mockSuite);

				summary['/test/fail'](mockTest);

				getCurrentUrlDfd.resolve('someURL');
				getPageSourceDfd.resolve(someHtmlSnapshot);

				var fileName = randomNumber + 
									'_' + 
									mockRemote.environmentType.browserName + 
									'_html_snapshot.html';

				assert.ok(FileWriter.writeTextLogs.calledWith(someHtmlSnapshot, mockTempDir + mockTest.sessionId, fileName), 
					'FileWriter.writeTextLogs not called or called with wrong arguments');

			} finally {
				console.log = oldConsoleLog;
			}
		},

		'/test/fail#takeScreenshot': function() {
			var someImageData = 'someImageData';

			try {
				// To end the session, we need to start it and start->end a suite
				summary['/session/start'](mockRemote);
				summary['/suite/start'](mockSuite);
				summary['/suite/end'](mockSuite);

				summary['/test/fail'](mockTest);

				getCurrentUrlDfd.resolve('someURL');
				takeScreenshotDfd.resolve(someImageData);

				var imageFileName = randomNumber + 
									'_' + 
									mockRemote.environmentType.browserName + 
									'_screenshot.png';

				assert.ok(FileWriter.writeScreenshot.calledWith(someImageData, mockTempDir + mockTest.sessionId, imageFileName), 
					'FileWriter.writeScreenshot not called or called with wrong arguments');

			} finally {
				console.log = oldConsoleLog;
			}
		},

		'/test/fail#takeScreenshot#failure': function() {

			try {
				// To end the session, we need to start it and start->end a suite
				summary['/session/start'](mockRemote);
				summary['/suite/start'](mockSuite);
				summary['/suite/end'](mockSuite);

				summary['/test/fail'](mockTest);

				getCurrentUrlDfd.resolve('someURL');
				loggedStr = '';

				takeScreenshotDfd.reject();

				assert.equal(loggedStr, 
					'Reporter Error: Failed to capture screenshot for ErrorID: ' + randomNumber + ' ',
					'Failure of capturing screenshot should have thrown an error')

			} finally {
				console.log = oldConsoleLog;
			}
		},

		'/test/fail#invalidTest->Parent': function() {
			var oldParent, oldId;
			try {
				oldParent = mockTest.parent;
				oldId = mockTest.id;

				mockTest.parent = undefined;
				mockTest.id = 'one - two - three';
				// To end the session, we need to start it and start->end a suite
				summary['/session/start'](mockRemote);
				summary['/suite/start'](mockSuite);
				summary['/suite/end'](mockSuite);

				summary['/test/fail'](mockTest);

				loggedStr = '';
				getCurrentUrlDfd.resolve('someURL');

				var loggedColorData = '"\\u001b[31m\\u001b[3mTEST FAIL: (1000ms)\\u001b[23m\\u001b[39m   \\u001b[1m\\u001b[31mError: \\u001b[39m\\u001b[22mmocked error: mocking out the error      \\u001b[36mParentSuiteName:\\u001b[39m one      \\u001b[36mSuiteName:\\u001b[39m two      \\u001b[36mTestName:\\u001b[39m child      \\u001b[36mPlatform:\\u001b[39m mockEnv      \\u001b[36mErrorID:\\u001b[39m ' + randomNumber +'      \\u001b[36mURL:\\u001b[39m someURL      \\u001b[36mFileWriter:\\u001b[39m ' + mockTempDir + mockTest.sessionId + '      \\u001b[36mStacktrace:\\u001b[39m      \\u001b[36m===========\\u001b[39m      \\u001b[31mone-on-top-of-the-other\\u001b[39m "';					

				// The expected string was pre-calculated by taking JSON.stringify(loggedStr) 
				// output manually beforehand and then making sure it is equal to that
				assert.equal(JSON.stringify(loggedStr), loggedColorData,
					'The summary output for invalid test.parent was not as expected'
				);

			} finally {
				console.log = oldConsoleLog;
				mockTest.parent = oldParent;
				mockTest.id = oldId;
			}
		},

		'/test/fail#noStackTrace': function() {
			var oldStackTrace;
			try {
				oldStackTrace = mockTest.error.stack;
				mockTest.error.stack = mockTest.error.name + ': ' + mockTest.error.message;

				// To end the session, we need to start it and start->end a suite
				summary['/session/start'](mockRemote);
				summary['/suite/start'](mockSuite);
				summary['/suite/end'](mockSuite);

				summary['/test/fail'](mockTest);

				loggedStr = '';
				getCurrentUrlDfd.resolve('someURL');

				var loggedColorData = '"\\u001b[31m\\u001b[3mTEST FAIL: (1000ms)\\u001b[23m\\u001b[39m   \\u001b[1m\\u001b[31mError: \\u001b[39m\\u001b[22mmocked error: mocking out the error      \\u001b[36mParentSuiteName:\\u001b[39m grandparent      \\u001b[36mSuiteName:\\u001b[39m parent      \\u001b[36mTestName:\\u001b[39m child      \\u001b[36mPlatform:\\u001b[39m mockEnv      \\u001b[36mErrorID:\\u001b[39m ' + randomNumber +'      \\u001b[36mURL:\\u001b[39m someURL      \\u001b[36mFileWriter:\\u001b[39m ' + mockTempDir + mockSuite.sessionId + '      \\u001b[36mStacktrace:\\u001b[39m      \\u001b[36m===========\\u001b[39m      \\u001b[31mNo Stacktrace\\u001b[39m "';

				// The expected string was pre-calculated by taking JSON.stringify(loggedStr) 
				// output manually beforehand and then making sure it is equal to that
				assert.equal(JSON.stringify(loggedStr), loggedColorData,
					'The summary output for no stacktrace was not as expected'
				);

			} finally {
				console.log = oldConsoleLog;
				mockTest.error.stack = oldStackTrace;
			}
		},

		'/test/fail#triggerCatch': function() {
			var oldSessionId;
			try {
				oldSessionId = mockTest.sessionId;
				mockTest.sessionId = undefined;

				// To end the session, we need to start it and start->end a suite
				summary['/session/start'](mockRemote);
				summary['/suite/start'](mockSuite);
				summary['/suite/end'](mockSuite);

				loggedStr = '';
				summary['/test/fail'](mockTest);

				var loggedData = 'Error in Summary reportERROR:TypeError: Cannot read property \'remote\' of undefined========================================={\n  "name": "mocked error",\n  "message": "mocking out the error",\n  "stack": "one-on-top-of-the-other"\n}';

				// The expected string was pre-calculated by taking JSON.stringify(loggedStr) 
				// output manually beforehand and then making sure it is equal to that
				assert.equal(loggedStr, loggedData,
					'The output in catch() is not as expected'
				);

			} finally {
				console.log = oldConsoleLog;
				mockTest.sessionId = oldSessionId;
			}
		},

		'/suite/error#SummaryOutput': function() {
			mockSuite.error.relatedTest = mockTest;
			try {
				// To end the session, we need to start it and start->end a suite
				summary['/session/start'](mockRemote);
				summary['/suite/start'](mockSuite);

				loggedStr = '';
				summary['/suite/error'](mockSuite);

				getCurrentUrlDfd.resolve('someURL');

				var errorLogsFileName = randomNumber + '_error_logs.txt';
				var textLogsFileName = randomNumber + '_intern_logs.txt';
				
				var loggedData = 'SUITE FAIL: (1000ms)\n   Error: mocked error: mocking out the error\n      ParentSuiteName: grandparent\n      SuiteName: parent\n      TestName: child\n      Platform: mockEnv\n      ErrorID: ' + randomNumber + '\n      URL: someURL\n      FileWriter: ' + mockTempDir + mockSuite.sessionId + '\n      Stacktrace:\n      ===========\n      one-on-top-of-the-other\n \n';
				var loggedColorData = '"\\u001b[31m\\u001b[3mSUITE FAIL: (1000ms)\\u001b[23m\\u001b[39m   \\u001b[1m\\u001b[31mError: \\u001b[39m\\u001b[22mmocked error: mocking out the error      \\u001b[36mParentSuiteName:\\u001b[39m grandparent      \\u001b[36mSuiteName:\\u001b[39m parent      \\u001b[36mTestName:\\u001b[39m child      \\u001b[36mPlatform:\\u001b[39m mockEnv      \\u001b[36mErrorID:\\u001b[39m ' + randomNumber +'      \\u001b[36mURL:\\u001b[39m someURL      \\u001b[36mFileWriter:\\u001b[39m ' + mockTempDir + mockSuite.sessionId + '      \\u001b[36mStacktrace:\\u001b[39m      \\u001b[36m===========\\u001b[39m      \\u001b[31mone-on-top-of-the-other\\u001b[39m "';					

				// The expected string was pre-calculated by taking JSON.stringify(loggedStr) 
				// output manually beforehand and then making sure it is equal to that
				assert.equal(JSON.stringify(loggedStr), loggedColorData,
					'The summary output was not as expected'
				);

				assert.ok(FileWriter.writeErrorLogs.calledWith(mockSuite.error, mockTempDir + mockTest.sessionId, errorLogsFileName), 
					'FileWriter.writeErrorLogs not called or called with wrong arguments');

				assert.ok(FileWriter.writeTextLogs.calledWith(loggedData, mockTempDir + mockTest.sessionId, textLogsFileName), 
					'FileWriter.writeTextLogs not called or called with wrong arguments');

			} finally {
				console.log = oldConsoleLog;
			}
		},

		'/suite/error#getAvailableLogTypes': function() {
			mockSuite.error.relatedTest = mockTest;
			try {
				// To end the session, we need to start it and start->end a suite
				summary['/session/start'](mockRemote);
				summary['/suite/start'](mockSuite);

				loggedStr = '';
				summary['/suite/error'](mockSuite);

				var mockLogTypes = ['logType1', 'logType2'];
				
				var logType1Filename = randomNumber + '_' + mockRemote.environmentType.browserName + '_' + mockLogTypes[0] + '_logs.txt';

				var mockBrowserLogs = 'mock browser logs'

				getAvailableLogTypesDfd.resolve(mockLogTypes);
				getLogsForDfd.resolve(mockBrowserLogs);

				assert.ok(FileWriter.writeBrowserLogs.calledWith(mockBrowserLogs, mockTempDir + mockTest.sessionId, logType1Filename), 
					'FileWriter.writeBrowserLogs not called or called with wrong arguemtns');

				getLogsForErrorDfd.reject(mockBrowserLogs);

				assert.equal(loggedStr, 
					'Reporter Error: Failed to get ' + mockLogTypes[1] + ' logs for ErrorID: ' + randomNumber + ' '	,
					'Invalid browser logs should have thrown an error');

			} finally {
				console.log = oldConsoleLog;
			}
		},

		'/suite/error#getPageSource': function() {
			mockSuite.error.relatedTest = mockTest;
			var someHtmlSnapshot = 'someHtmlSnapshot';

			try {
				// To end the session, we need to start it and start->end a suite
				summary['/session/start'](mockRemote);
				summary['/suite/start'](mockSuite);

				summary['/suite/error'](mockSuite);

				getCurrentUrlDfd.resolve('someURL');
				getPageSourceDfd.resolve(someHtmlSnapshot);

				var fileName = randomNumber + 
									'_' + 
									mockRemote.environmentType.browserName + 
									'_html_snapshot.html';

				assert.ok(FileWriter.writeTextLogs.calledWith(someHtmlSnapshot, mockTempDir + mockTest.sessionId, fileName), 
					'FileWriter.writeTextLogs not called or called with wrong arguments');

			} finally {
				console.log = oldConsoleLog;
			}
		},

		'/suite/error#takeScreenshot': function() {
			mockSuite.error.relatedTest = mockTest;
			var someImageData = 'someImageData';

			try {
				// To end the session, we need to start it and start->end a suite
				summary['/session/start'](mockRemote);
				summary['/suite/start'](mockSuite);

				summary['/suite/error'](mockSuite);

				getCurrentUrlDfd.resolve('someURL');
				takeScreenshotDfd.resolve(someImageData);

				var imageFileName = randomNumber + 
									'_' + 
									mockRemote.environmentType.browserName + 
									'_screenshot.png';

				assert.ok(FileWriter.writeScreenshot.calledWith(someImageData, mockTempDir + mockTest.sessionId, imageFileName), 
					'FileWriter.writeScreenshot not called or called with wrong arguments');

			} finally {
				console.log = oldConsoleLog;
			}
		},

		'/suite/error#takeScreenshot#failure': function() {
			mockSuite.error.relatedTest = mockTest;

			try {
				// To end the session, we need to start it and start->end a suite
				summary['/session/start'](mockRemote);
				summary['/suite/start'](mockSuite);

				summary['/suite/error'](mockSuite);

				getCurrentUrlDfd.resolve('someURL');
				loggedStr = '';

				takeScreenshotDfd.reject();

				assert.equal(loggedStr, 
					'Reporter Error: Failed to capture screenshot for ErrorID: ' + randomNumber + ' ',
					'Failure of capturing screenshot should have thrown an error')

			} finally {
				console.log = oldConsoleLog;
			}
		},

		'/suite/error#invalidTest->Parent': function() {
			mockSuite.error.relatedTest = mockTest;
			var oldParent, oldId;
			try {
				oldParent = mockTest.parent;
				oldId = mockTest.id;

				mockTest.parent = undefined;
				mockTest.id = 'one - two - three';
				// To end the session, we need to start it and start->end a suite
				summary['/session/start'](mockRemote);
				summary['/suite/start'](mockSuite);

				summary['/suite/error'](mockSuite);

				loggedStr = '';
				getCurrentUrlDfd.resolve('someURL');

				var loggedColorData = '"\\u001b[31m\\u001b[3mSUITE FAIL: (1000ms)\\u001b[23m\\u001b[39m   \\u001b[1m\\u001b[31mError: \\u001b[39m\\u001b[22mmocked error: mocking out the error      \\u001b[36mParentSuiteName:\\u001b[39m one      \\u001b[36mSuiteName:\\u001b[39m two      \\u001b[36mTestName:\\u001b[39m child      \\u001b[36mPlatform:\\u001b[39m mockEnv      \\u001b[36mErrorID:\\u001b[39m ' + randomNumber +'      \\u001b[36mURL:\\u001b[39m someURL      \\u001b[36mFileWriter:\\u001b[39m ' + mockTempDir + mockTest.sessionId + '      \\u001b[36mStacktrace:\\u001b[39m      \\u001b[36m===========\\u001b[39m      \\u001b[31mone-on-top-of-the-other\\u001b[39m "';					

				// The expected string was pre-calculated by taking JSON.stringify(loggedStr) 
				// output manually beforehand and then making sure it is equal to that
				assert.equal(JSON.stringify(loggedStr), loggedColorData,
					'The summary output for invalid test.parent was not as expected'
				);

			} finally {
				console.log = oldConsoleLog;
				mockTest.parent = oldParent;
				mockTest.id = oldId;
			}
		},

		'/suite/error#noStackTrace': function() {
			mockSuite.error.relatedTest = mockTest;
			var oldStackTrace;
			try {
				oldStackTrace = mockSuite.error.stack;
				mockSuite.error.stack = mockSuite.error.name + ': ' + mockSuite.error.message;

				// To end the session, we need to start it and start->end a suite
				summary['/session/start'](mockRemote);
				summary['/suite/start'](mockSuite);

				summary['/suite/error'](mockSuite);

				loggedStr = '';
				getCurrentUrlDfd.resolve('someURL');

				var loggedColorData = '"\\u001b[31m\\u001b[3mSUITE FAIL: (1000ms)\\u001b[23m\\u001b[39m   \\u001b[1m\\u001b[31mError: \\u001b[39m\\u001b[22mmocked error: mocking out the error      \\u001b[36mParentSuiteName:\\u001b[39m grandparent      \\u001b[36mSuiteName:\\u001b[39m parent      \\u001b[36mTestName:\\u001b[39m child      \\u001b[36mPlatform:\\u001b[39m mockEnv      \\u001b[36mErrorID:\\u001b[39m ' + randomNumber +'      \\u001b[36mURL:\\u001b[39m someURL      \\u001b[36mFileWriter:\\u001b[39m ' + mockTempDir + mockSuite.sessionId + '      \\u001b[36mStacktrace:\\u001b[39m      \\u001b[36m===========\\u001b[39m      \\u001b[31mNo Stacktrace\\u001b[39m "';

				// The expected string was pre-calculated by taking JSON.stringify(loggedStr) 
				// output manually beforehand and then making sure it is equal to that
				assert.equal(JSON.stringify(loggedStr), loggedColorData,
					'The summary output for no stacktrace was not as expected'
				);

			} finally {
				console.log = oldConsoleLog;
				mockSuite.error.stack = oldStackTrace;
			}
		},

		'/error': function() {
			try {
				summary['/error']('someError');

				var loggedData = '"someError"';

				// The expected string was pre-calculated by taking JSON.stringify(loggedStr) 
				// output manually beforehand and then making sure it is equal to that
				assert.equal(loggedStr, loggedData,
					'The output for /error was not as expected'
				);
			} finally {
				console.log = oldConsoleLog;
			}
		}
	});
});
