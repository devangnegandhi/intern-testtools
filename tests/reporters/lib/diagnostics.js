/**
 * @copyright Copyright (C) 2014 Devang Negandhi - All Rights Reserved
 */
define([
	'intern!object',
	'intern/chai!assert',
	'dojo/node!fs',
	'dojo/node!os',
	'dojo/node!path',
	'dojo/node!mkdirp',
	'dojo/node!sinon',
	'dojo/node!../../../reporters/lib/diagnostics'
], function (registerSuite, assert, fs, os, path, mkdirp, sinon, Diagnostics) {
	var randomNumber,
		sandbox;

	registerSuite({
		name: 'reporters/lib/diagnostics',

		setup: function () {
			sandbox = sinon.sandbox.create();
			//Mocking fs module
			sandbox.stub(fs);
			sandbox.stub(mkdirp, 'sync');
			// Always returning 999 for random number generator
			sandbox.spy(Diagnostics, 'generateRandomNumber');
			sandbox.spy(Diagnostics, 'createTempDir');
			fs.existsSync.returns(true);
		},

		teardown: function () {
			sandbox.restore();
		},

		'writeTextLogs': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = 'some text info';

			var ret = Diagnostics.writeTextLogs(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 
					'utf-8'
				), 
				'Diagnostics.writeTextLogs failed to write correct data or to the correct file'
			);

			assert.equal(ret, path.join(logFilePath, logFileName),
				'Return value of Diagnostics.writeTextLogs was wrong'
			);
		},

		'writeTextLogs#withoutFilename': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName;
			var logData = 'some text info';

			Diagnostics.writeTextLogs(logData, logFilePath);

			logFileName = Diagnostics.generateRandomNumber.lastCall.returnValue + '_logs' + '.txt';

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 
					'utf-8'
				), 
				'Diagnostics.writeTextLogs failed to write correct data or to the correct file');
		},

		'writeTextLogs#withoutDirectory': function () {
			var logFilePath;
			var logFileName = 'filename.txt';
			var logData = 'some text info';

			Diagnostics.writeTextLogs(logData, undefined, logFileName);

			logFilePath = Diagnostics.createTempDir.lastCall.returnValue;

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 'utf-8'
				), 
				'Diagnostics.writeTextLogs failed to write correct data or to the correct file'
			);
		},

		'writeTextLogs#withoutDirectoryOrFilename': function () {
			var logFilePath;
			var logFileName;
			var generateRandomNumberCallCount;
			var logData = 'some text info';

			Diagnostics.writeTextLogs(logData);

			logFilePath = Diagnostics.createTempDir.lastCall.returnValue;

			//Need to get the second last call to generateRandomNumber for getting filename 
			generateRandomNumberCallCount = Diagnostics.generateRandomNumber.callCount;
			logFileName = Diagnostics
							.generateRandomNumber
							.getCall(generateRandomNumberCallCount-2)
							.returnValue + '_logs' + '.txt';

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 
					'utf-8'
				), 
				'Diagnostics.writeTextLogs failed to write correct data or to the correct file'
			);
		},

		'writeTextLogs#withoutAnyLogs': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = '';

			Diagnostics.writeTextLogs(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 
					'utf-8'
				), 
				'Diagnostics.writeTextLogs failed to write correct data or to the correct file'
			);
		},

		'writeTextLogs#withInvalidLogs': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = undefined;

			Diagnostics.writeTextLogs(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 
					'utf-8'
				), 
				'Diagnostics.writeTextLogs failed to write correct data or to the correct file'
			);
		},

		'writeErrorLogs': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = {
				error: 'some error',
				message: 'error message'
			};

			var ret = Diagnostics.writeErrorLogs(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					JSON.stringify(logData, undefined, 2), 
					'utf-8'
				), 
				'Diagnostics.writeTextLogs failed to write correct data or to the correct file'
			);

			assert.equal(ret, path.join(logFilePath, logFileName),
				'Return value of Diagnostics.writeErrorLogs was wrong'
			);
		},

		'writeErrorLogs#withoutFilename': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName;
			var logData = {
				error: 'some error',
				message: 'error message'
			};

			Diagnostics.writeErrorLogs(logData, logFilePath);

			logFileName = Diagnostics
							.generateRandomNumber
							.lastCall.returnValue + '_error_logs' + '.txt';

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName),
					JSON.stringify(logData, undefined, 2),
					'utf-8'
				), 
				'Diagnostics.writeTextLogs failed to write correct data or to the correct file'
			);
		},

		'writeErrorLogs#withoutDirectory': function () {
			var logFilePath;
			var logFileName = 'filename.txt';
			var logData = {
				error: 'some error',
				message: 'error message'
			};

			Diagnostics.writeErrorLogs(logData, undefined, logFileName);

			logFilePath = Diagnostics.createTempDir.lastCall.returnValue;

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName),
					JSON.stringify(logData, undefined, 2),
					'utf-8'
				), 
				'Diagnostics.writeTextLogs failed to write correct data or to the correct file'
			);
		},

		'writeErrorLogs#withoutDirectoryOrFilename': function () {
			var logFilePath;
			var logFileName;
			var generateRandomNumberCallCount;
			var logData = {
				error: 'some error',
				message: 'error message'
			};

			Diagnostics.writeErrorLogs(logData);

			logFilePath = Diagnostics.createTempDir.lastCall.returnValue;

			//Need to get the second last call to generateRandomNumber for getting filename 
			generateRandomNumberCallCount = Diagnostics.generateRandomNumber.callCount;
			logFileName = Diagnostics
							.generateRandomNumber
							.getCall(generateRandomNumberCallCount-2)
							.returnValue + '_error_logs' + '.txt';

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName),
					JSON.stringify(logData, undefined, 2),
					'utf-8'
				), 
				'Diagnostics.writeTextLogs failed to write correct data or to the correct file'
			);
		},

		'writeErrorLogs#withoutAnyLogs': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = '';

			Diagnostics.writeErrorLogs(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName),
					JSON.stringify(logData, undefined, 2),
					'utf-8'
				), 
				'Diagnostics.writeTextLogs failed to write correct data or to the correct file'
			);
		},

		'writeErrorLogs#withInvalidLogs': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = undefined;

			Diagnostics.writeErrorLogs(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName),
					JSON.stringify(logData, undefined, 2),
					'utf-8'
				), 
				'Diagnostics.writeTextLogs failed to write correct data or to the correct file'
			);
		},

		'writeBrowserLogs': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = [
				{
					level: 'level1',
					message: 'some console message'
				},
				{
					level: 'level2',
					message: 'another console message'
				},
				{
					level: 'level1',
					message: 'yet another console message'
				}
			];

			var ret = Diagnostics.writeBrowserLogs(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					prettyPrintBrowserLogs(logData), 
					'utf-8'
				), 
				'Diagnostics.writeBrowserLogs failed to write correct data or to the correct file'
			);

			assert.equal(ret, path.join(logFilePath, logFileName),
				'Return value of Diagnostics.writeBrowserLogs was wrong'
			);
		},

		'writeBrowserLogs#withoutFilename': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName;
			var logData = [
				{
					level: 'level1',
					message: 'some console message'
				},
				{
					level: 'level2',
					message: 'another console message'
				},
				{
					level: 'level1',
					message: 'yet another console message'
				}
			];

			Diagnostics.writeBrowserLogs(logData, logFilePath);

			logFileName = Diagnostics
							.generateRandomNumber
							.lastCall.returnValue + '_browser_logs' + '.txt';

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName),
					prettyPrintBrowserLogs(logData),
					'utf-8'
				), 
				'Diagnostics.writeBrowserLogs failed to write correct data or to the correct file'
			);
		},

		'writeBrowserLogs#withoutDirectory': function () {
			var logFilePath;
			var logFileName = 'filename.txt';
			var logData = [
				{
					level: 'level1',
					message: 'some console message'
				},
				{
					level: 'level2',
					message: 'another console message'
				},
				{
					level: 'level1',
					message: 'yet another console message'
				}
			];

			Diagnostics.writeBrowserLogs(logData, undefined, logFileName);

			logFilePath = Diagnostics.createTempDir.lastCall.returnValue;

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName),
					prettyPrintBrowserLogs(logData),
					'utf-8'
				), 
				'Diagnostics.writeBrowserLogs failed to write correct data or to the correct file'
			);
		},

		'writeBrowserLogs#withoutDirectoryOrFilename': function () {
			var logFilePath;
			var logFileName;
			var generateRandomNumberCallCount;
			var logData = [
				{
					level: 'level1',
					message: 'some console message'
				},
				{
					level: 'level2',
					message: 'another console message'
				},
				{
					level: 'level1',
					message: 'yet another console message'
				}
			];

			Diagnostics.writeBrowserLogs(logData);

			logFilePath = Diagnostics.createTempDir.lastCall.returnValue;

			//Need to get the second last call to generateRandomNumber for getting filename 
			generateRandomNumberCallCount = Diagnostics.generateRandomNumber.callCount;
			logFileName = Diagnostics
							.generateRandomNumber
							.getCall(generateRandomNumberCallCount-2)
							.returnValue + '_browser_logs' + '.txt';

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName),
					prettyPrintBrowserLogs(logData),
					'utf-8'
				), 
				'Diagnostics.writeBrowserLogs failed to write correct data or to the correct file'
			);
		},

		'writeBrowserLogs#withoutAnyLogs': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = '';

			Diagnostics.writeBrowserLogs(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName),
					prettyPrintBrowserLogs(logData),
					'utf-8'
				), 
				'Diagnostics.writeBrowserLogs failed to write correct data or to the correct file'
			);
		},

		'writeBrowserLogs#withInvalidLogs': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = undefined;

			Diagnostics.writeBrowserLogs(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName),
					prettyPrintBrowserLogs(logData),
					'utf-8'
				), 
				'Diagnostics.writeBrowserLogs failed to write correct data or to the correct file'
			);
		},

		'writeScreenshot': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = 'some data';

			var ret = Diagnostics.writeScreenshot(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 
					'base64'
				), 
				'Diagnostics.writeScreenshot failed to write correct data or to the correct file'
			);

			assert.equal(ret, path.join(logFilePath, logFileName),
				'Return value of Diagnostics.writeScreenshot was wrong'
			);
		},

		'writeScreenshot#withoutFilename': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName;
			var logData = 'some data';

			Diagnostics.writeScreenshot(logData, logFilePath);

			logFileName = Diagnostics.generateRandomNumber.lastCall.returnValue + 
							'_screenshot' + '.png';

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 
					'base64'
				), 
				'Diagnostics.writeScreenshot failed to write correct data or to the correct file');
		},

		'writeScreenshot#withoutDirectory': function () {
			var logFilePath;
			var logFileName = 'filename.txt';
			var logData = 'some data';

			Diagnostics.writeScreenshot(logData, undefined, logFileName);

			logFilePath = Diagnostics.createTempDir.lastCall.returnValue;

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 
					'base64'
				), 
				'Diagnostics.writeScreenshot failed to write correct data or to the correct file'
			);
		},

		'writeScreenshot#withoutDirectoryOrFilename': function () {
			var logFilePath;
			var logFileName;
			var generateRandomNumberCallCount;
			var logData = 'some data';

			Diagnostics.writeScreenshot(logData);

			logFilePath = Diagnostics.createTempDir.lastCall.returnValue;

			//Need to get the second last call to generateRandomNumber for getting filename 
			generateRandomNumberCallCount = Diagnostics.generateRandomNumber.callCount;
			logFileName = Diagnostics
							.generateRandomNumber
							.getCall(generateRandomNumberCallCount-2)
							.returnValue + '_screenshot' + '.png';

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 
					'base64'
				), 
				'Diagnostics.writeScreenshot failed to write correct data or to the correct file'
			);
		},

		'writeScreenshot#withoutAnyLogs': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = '';

			Diagnostics.writeScreenshot(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 
					'base64'
				), 
				'Diagnostics.writeScreenshot failed to write correct data or to the correct file'
			);
		},

		'writeScreenshot#withInvalidLogs': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = undefined;

			Diagnostics.writeScreenshot(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 
					'base64'
				), 
				'Diagnostics.writeScreenshot failed to write correct data or to the correct file'
			);
		},

		'createTempDir': function () {
			fs.existsSync.returns(false);

			var sessionId = 'someSessionId';
			var osTempDir = os.tmpdir();
			var tempDir = path.join(osTempDir, 'intern', 'diagnostics', sessionId);

			Diagnostics.createTempDir(sessionId);

			assert.ok(
				mkdirp.sync.calledWith(tempDir), 
				'mkdirp called to create the wrong directory'
			);
		},

		'createTempDir#withoutSession': function () {
			fs.existsSync.returns(false);

			Diagnostics.createTempDir();

			var sessionId = Diagnostics.generateRandomNumber.lastCall.returnValue.toString();
			var osTempDir = os.tmpdir();
			var tempDir = path.join(osTempDir, 'intern', 'diagnostics', sessionId);

			assert.ok(
				mkdirp.sync.calledWith(tempDir), 
				'mkdirp called to create the wrong directory'
			);
		}
	});

	var prettyPrintBrowserLogs = function (logs) {
		var prettyPrintLogs = '';
		if(logs) {
			for (var i = 0; i < logs.length; i++) {
				prettyPrintLogs += '[' + logs[i].level + '] ' + 
									logs[i].message.replace(/(\r\n|\n|\r)/gm, '') + 
									'\n'; 
			}
		}

		return prettyPrintLogs;
	}
});