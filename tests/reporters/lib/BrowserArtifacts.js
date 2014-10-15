/**
 * @copyright Copyright (C) 2014 Devang Negandhi - All Rights Reserved
 */
define([
	'intern!object',
	'intern/chai!assert',
	'dojo/Deferred',
	'dojo/node!path',
	'dojo/node!mkdirp',
	'dojo/node!sinon',
	'dojo/node!../../../reporters/lib/FileWriter',
	'dojo/node!../../../reporters/lib/BrowserArtifacts'
], function (registerSuite, assert, Deferred, path, mkdirp, sinon, FileWriter, BrowserArtifacts) {
	var sandbox,
		mockRemoteAPI;

	mockRemoteAPI = {
		takeScreenshot: function () {},
		getPageSource: function() {},
		getLogsFor: function () {},
		getAvailableLogTypes: function () {}
	}

	registerSuite({
		name: 'reporters/lib/BrowserArtifacts',

		setup: function () {
			sandbox = sinon.sandbox.create();
			//Mocking FileWriter module
			sandbox.stub(FileWriter);
			sandbox.stub(mockRemoteAPI);
			sandbox.stub(mkdirp, 'sync');
		},

		teardown: function () {
			sandbox.restore();
		},

		'takeScreenshot#success': function () {
			var outDir = 'somePath';
			var screenshotData = 'someImage';
			var fileName = 'browser_screenshot.png';
			var dfd = new Deferred();

			mockRemoteAPI.takeScreenshot.returns(dfd.promise);
			BrowserArtifacts.takeScreenshot(mockRemoteAPI, outDir);

			dfd.resolve(screenshotData);

			assert.ok(
				FileWriter.writeScreenshot.calledWith(screenshotData, outDir, fileName), 
				'Error in BrowserArtifacts.takeScreenshot onSuccess'
			);
		},

		'takeScreenshot#fail': function () {
			var outDir = 'somePath';
			var error = {
				message: 'someError'
			};
			var fileName = 'browser_screenshot_error.txt';
			var expectedLog = 'Reporter Error: Failed to capture screenshot\n' + 
						JSON.stringify(error, undefined, 2); 
			var dfd = new Deferred();

			mockRemoteAPI.takeScreenshot.returns(dfd.promise);
			BrowserArtifacts.takeScreenshot(mockRemoteAPI, outDir);

			dfd.reject(error);

			assert.ok(
				FileWriter.writeTextLogs.calledWith(expectedLog, outDir, fileName), 
				'Error in BrowserArtifacts.takeScreenshot onFailure'
			);
		},

		'dumpPageSource#success': function () {
			var outDir = 'somePath';
			var snapshotData = 'someHtmlSnapshot';
			var fileName = 'html_snapshot.html';
			var dfd = new Deferred();

			mockRemoteAPI.getPageSource.returns(dfd.promise);
			BrowserArtifacts.dumpPageSource(mockRemoteAPI, outDir);

			dfd.resolve(snapshotData);

			assert.ok(
				FileWriter.writeTextLogs.calledWith(snapshotData, outDir, fileName), 
				'Error in BrowserArtifacts.dumpPageSource onSuccess'
			);
		},

		'dumpPageSource#fail': function () {
			var outDir = 'somePath';
			var error = {
				message: 'someError'
			};
			var fileName = 'html_snapshot_error.txt';
			var expectedLog = 'Reporter Error: Failed to get page source\n' + 
						JSON.stringify(error, undefined, 2);
			var dfd = new Deferred();

			mockRemoteAPI.getPageSource.returns(dfd.promise);
			BrowserArtifacts.dumpPageSource(mockRemoteAPI, outDir);

			dfd.reject(error);

			assert.ok(
				FileWriter.writeTextLogs.calledWith(expectedLog, outDir, fileName), 
				'Error in BrowserArtifacts.dumpPageSource onFailure'
			);
		},

		'collectBrowserLog#success': function () {
			var outDir = 'somePath';
			var logType = 'someLogType';
			var logData = ['someLogs'];
			var fileName = logType + '_logs.txt';
			var dfd = new Deferred();

			mockRemoteAPI.getLogsFor.returns(dfd.promise);
			BrowserArtifacts.collectBrowserLog(mockRemoteAPI, outDir, logType);

			dfd.resolve(logData);

			assert.ok(
				FileWriter.writeBrowserLogs.calledWith(logData, outDir, fileName), 
				'Problem in writing logs using BrowserArtifacts.collectBrowserLog'
			);
		},

		'collectBrowserLog#successButNoLogs': function () {
			var outDir = 'somePath';
			var logType = 'someLogType';
			var logData = [];
			var dfd = new Deferred();

			mockRemoteAPI.getLogsFor.returns(dfd.promise);
			BrowserArtifacts.collectBrowserLog(mockRemoteAPI, outDir, logType);

			FileWriter.writeBrowserLogs.reset();

			dfd.resolve(logData);

			assert.notOk(
				FileWriter.writeBrowserLogs.called, 
				'BrowserArtifacts.collectBrowserLog onSuccess without logs called FileWriter'
			);
		},

		'collectBrowserLog#fail': function () {
			var outDir = 'somePath';
			var logType = 'someLogType';
			var error = {
				message: 'someError'
			};
			var fileName = logType + '_logs_error.txt';
			var expectedLog = 'Reporter Error: Failed to get brower logs: ' + logType + '\n' + 
						JSON.stringify(error, undefined, 2);
			var dfd = new Deferred();

			mockRemoteAPI.getLogsFor.returns(dfd.promise);
			BrowserArtifacts.collectBrowserLog(mockRemoteAPI, outDir, logType);

			dfd.reject(error);

			assert.ok(
				FileWriter.writeTextLogs.calledWith(expectedLog, outDir, fileName), 
				'Problem in erroring out in BrowserArtifacts.collectBrowserLog'
			);
		},

		'collectAllBrowserLogs#success': function () {
			var outDir = 'somePath';
			var logTypes = ['type1', 'type2', 'type3'];
			var dfd = new Deferred();
			var stub = sinon.stub(BrowserArtifacts, 'collectBrowserLog');

			mockRemoteAPI.getAvailableLogTypes.returns(dfd.promise);
			BrowserArtifacts.collectAllBrowserLogs(mockRemoteAPI, outDir);

			dfd.resolve(logTypes);

			assert.equal(
				BrowserArtifacts.collectBrowserLog.callCount,
				logTypes.length, 
				'collectBrowserLog was not called 3 times'
			);

			assert.ok(
				BrowserArtifacts.collectBrowserLog.firstCall.calledWith(
					mockRemoteAPI, 
					outDir, 
					logTypes[0]
				), 
				'collectBrowserLog called first time with wrong args'
			);

			assert.ok(
				BrowserArtifacts.collectBrowserLog.secondCall.calledWith(
					mockRemoteAPI, 
					outDir, 
					logTypes[1]
				), 
				'collectBrowserLog called second time with wrong args'
			);

			assert.ok(
				BrowserArtifacts.collectBrowserLog.thirdCall.calledWith(
					mockRemoteAPI, 
					outDir, 
					logTypes[2]
				), 
				'collectBrowserLog called third time with wrong args'
			);

			stub.restore();
		},

		'collectAllBrowserLogs#fail': function () {
			var outDir = 'somePath';
			var logTypes = ['type1', 'type2', 'type3'];
			var error = {
				message: 'someError'
			};
			var fileName = 'browser_logs_error.txt';
			var expectedLog = 'Reporter Error: Failed to get any browser logs\n' + 
						JSON.stringify(error, undefined, 2);
			var dfd = new Deferred();

			mockRemoteAPI.getAvailableLogTypes.returns(dfd.promise);
			BrowserArtifacts.collectAllBrowserLogs(mockRemoteAPI, outDir, logTypes);

			dfd.reject(error);

			assert.ok(
				FileWriter.writeTextLogs.calledWith(expectedLog, outDir, fileName), 
				'Problem in erroring out in BrowserArtifacts.collectAllBrowserLogs'
			);
		},

		'collectAllArtifacts': function () {
			var logDir = 'somePath';
			var errorID = 12345;
			var artifactsDir = path.join(logDir, errorID.toString());
			var takeScreenshotStub = sinon.stub(BrowserArtifacts, 'takeScreenshot');
			var dumpPageSourceStub = sinon.stub(BrowserArtifacts, 'dumpPageSource');
			var collectAllBrowserLogsStub = sinon.stub(BrowserArtifacts, 'collectAllBrowserLogs');

			BrowserArtifacts.collectAllArtifacts(mockRemoteAPI, logDir, errorID);

			assert.ok(
				mkdirp.sync.calledWith(artifactsDir), 
				'mkdirp not called or called to create the wrong directory'
			);

			assert.ok(
				BrowserArtifacts.takeScreenshot.calledWith(
					mockRemoteAPI, 
					artifactsDir
				), 
				'BrowserArtifacts.takeScreenshot not called or called with wrong args'
			);

			assert.ok(
				BrowserArtifacts.dumpPageSource.calledWith(
					mockRemoteAPI, 
					artifactsDir
				), 
				'BrowserArtifacts.dumpPageSource not called or called with wrong args'
			);

			assert.ok(
				BrowserArtifacts.collectAllBrowserLogs.calledWith(
					mockRemoteAPI, 
					artifactsDir
				), 
				'BrowserArtifacts.collectAllBrowserLogs not called or called with wrong args'
			);

			takeScreenshotStub.restore();
			dumpPageSourceStub.restore();
			collectAllBrowserLogsStub.restore();
		}
	});
});