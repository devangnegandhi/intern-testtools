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
	'dojo/node!../../../reporters/lib/FileWriter'
], function (registerSuite, assert, fs, os, path, mkdirp, sinon, FileWriter) {
	var randomNumber,
		sandbox;

	registerSuite({
		name: 'reporters/lib/FileWriter',

		setup: function () {
			sandbox = sinon.sandbox.create();
			//Mocking fs module
			sandbox.stub(fs);
			sandbox.stub(mkdirp, 'sync');
			// Always returning 999 for random number generator
			sandbox.spy(FileWriter, 'generateRandomNumber');
			sandbox.spy(FileWriter, 'createTempDir');
			fs.existsSync.returns(true);
		},

		teardown: function () {
			sandbox.restore();
		},

		'writeTextLogs': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = 'some text info';

			var ret = FileWriter.writeTextLogs(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 
					{
						encoding: 'utf-8',
						flag: 'w'
					}
				), 
				'FileWriter.writeTextLogs failed to write correct data or to the correct file'
			);

			assert.equal(ret, path.join(logFilePath, logFileName),
				'Return value of FileWriter.writeTextLogs was wrong'
			);
		},

		'writeTextLogs#withAppend': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = 'some text info';

			var ret = FileWriter.writeTextLogs(logData, logFilePath, logFileName, true);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					'\n' + logData, 
					{
						encoding: 'utf-8',
						flag: 'a'
					}
				), 
				'FileWriter.writeTextLogs failed to write correct data or to the correct file'
			);

			assert.equal(ret, path.join(logFilePath, logFileName),
				'Return value of FileWriter.writeTextLogs was wrong'
			);
		},

		'writeTextLogs#withoutFilename': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName;
			var logData = 'some text info';

			FileWriter.writeTextLogs(logData, logFilePath);

			logFileName = FileWriter.generateRandomNumber.lastCall.returnValue + '_logs' + '.txt';

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 
					{
						encoding: 'utf-8',
						flag: 'w'
					}
				), 
				'FileWriter.writeTextLogs failed to write correct data or to the correct file'
			);
		},

		'writeTextLogs#withoutDirectory': function () {
			var logFilePath;
			var logFileName = 'filename.txt';
			var logData = 'some text info';

			FileWriter.writeTextLogs(logData, undefined, logFileName);

			logFilePath = FileWriter.createTempDir.lastCall.returnValue;

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 
					{
						encoding: 'utf-8',
						flag: 'w'
					}
				), 
				'FileWriter.writeTextLogs failed to write correct data or to the correct file'
			);
		},

		'writeTextLogs#withoutDirectoryOrFilename': function () {
			var logFilePath;
			var logFileName;
			var generateRandomNumberCallCount;
			var logData = 'some text info';

			FileWriter.writeTextLogs(logData);

			logFilePath = FileWriter.createTempDir.lastCall.returnValue;

			//Need to get the second last call to generateRandomNumber for getting filename 
			generateRandomNumberCallCount = FileWriter.generateRandomNumber.callCount;
			logFileName = FileWriter
							.generateRandomNumber
							.getCall(generateRandomNumberCallCount-2)
							.returnValue + '_logs' + '.txt';

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 
					{
						encoding: 'utf-8',
						flag: 'w'
					}
				), 
				'FileWriter.writeTextLogs failed to write correct data or to the correct file'
			);
		},

		'writeTextLogs#withoutAnyLogs': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = '';

			FileWriter.writeTextLogs(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 
					{
						encoding: 'utf-8',
						flag: 'w'
					}
				), 
				'FileWriter.writeTextLogs failed to write correct data or to the correct file'
			);
		},

		'writeTextLogs#withInvalidLogs': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = undefined;

			FileWriter.writeTextLogs(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 
					{
						encoding: 'utf-8',
						flag: 'w'
					}
				), 
				'FileWriter.writeTextLogs failed to write correct data or to the correct file'
			);
		},

		'writeTextLogs#withoutDirExists': function () {
			fs.existsSync.returns(false);
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = 'some text info';

			var ret = FileWriter.writeTextLogs(logData, logFilePath, logFileName, true);

			assert.ok(
				mkdirp.sync.calledWith(logFilePath), 
				'mkdirp called to create the wrong directory'
			);

			assert.equal(ret, path.join(logFilePath, logFileName),
				'Return value of FileWriter.writeTextLogs was wrong'
			);
		},

		'writeErrorLogs': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = {
				error: 'some error',
				message: 'error message'
			};

			var ret = FileWriter.writeErrorLogs(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					JSON.stringify(logData, undefined, 2), 
					'utf-8'
				), 
				'FileWriter.writeTextLogs failed to write correct data or to the correct file'
			);

			assert.equal(ret, path.join(logFilePath, logFileName),
				'Return value of FileWriter.writeErrorLogs was wrong'
			);
		},

		'writeErrorLogs#withoutFilename': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName;
			var logData = {
				error: 'some error',
				message: 'error message'
			};

			FileWriter.writeErrorLogs(logData, logFilePath);

			logFileName = FileWriter
							.generateRandomNumber
							.lastCall.returnValue + '_error_logs' + '.txt';

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName),
					JSON.stringify(logData, undefined, 2),
					'utf-8'
				), 
				'FileWriter.writeTextLogs failed to write correct data or to the correct file'
			);
		},

		'writeErrorLogs#withoutDirectory': function () {
			var logFilePath;
			var logFileName = 'filename.txt';
			var logData = {
				error: 'some error',
				message: 'error message'
			};

			FileWriter.writeErrorLogs(logData, undefined, logFileName);

			logFilePath = FileWriter.createTempDir.lastCall.returnValue;

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName),
					JSON.stringify(logData, undefined, 2),
					'utf-8'
				), 
				'FileWriter.writeTextLogs failed to write correct data or to the correct file'
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

			FileWriter.writeErrorLogs(logData);

			logFilePath = FileWriter.createTempDir.lastCall.returnValue;

			//Need to get the second last call to generateRandomNumber for getting filename 
			generateRandomNumberCallCount = FileWriter.generateRandomNumber.callCount;
			logFileName = FileWriter
							.generateRandomNumber
							.getCall(generateRandomNumberCallCount-2)
							.returnValue + '_error_logs' + '.txt';

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName),
					JSON.stringify(logData, undefined, 2),
					'utf-8'
				), 
				'FileWriter.writeTextLogs failed to write correct data or to the correct file'
			);
		},

		'writeErrorLogs#withoutAnyLogs': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = '';

			FileWriter.writeErrorLogs(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName),
					JSON.stringify(logData, undefined, 2),
					'utf-8'
				), 
				'FileWriter.writeTextLogs failed to write correct data or to the correct file'
			);
		},

		'writeErrorLogs#withInvalidLogs': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = undefined;

			FileWriter.writeErrorLogs(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName),
					JSON.stringify(logData, undefined, 2),
					'utf-8'
				), 
				'FileWriter.writeTextLogs failed to write correct data or to the correct file'
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

			var ret = FileWriter.writeBrowserLogs(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					prettyPrintBrowserLogs(logData), 
					'utf-8'
				), 
				'FileWriter.writeBrowserLogs failed to write correct data or to the correct file'
			);

			assert.equal(ret, path.join(logFilePath, logFileName),
				'Return value of FileWriter.writeBrowserLogs was wrong'
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

			FileWriter.writeBrowserLogs(logData, logFilePath);

			logFileName = FileWriter
							.generateRandomNumber
							.lastCall.returnValue + '_browser_logs' + '.txt';

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName),
					prettyPrintBrowserLogs(logData),
					'utf-8'
				), 
				'FileWriter.writeBrowserLogs failed to write correct data or to the correct file'
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

			FileWriter.writeBrowserLogs(logData, undefined, logFileName);

			logFilePath = FileWriter.createTempDir.lastCall.returnValue;

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName),
					prettyPrintBrowserLogs(logData),
					'utf-8'
				), 
				'FileWriter.writeBrowserLogs failed to write correct data or to the correct file'
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

			FileWriter.writeBrowserLogs(logData);

			logFilePath = FileWriter.createTempDir.lastCall.returnValue;

			//Need to get the second last call to generateRandomNumber for getting filename 
			generateRandomNumberCallCount = FileWriter.generateRandomNumber.callCount;
			logFileName = FileWriter
							.generateRandomNumber
							.getCall(generateRandomNumberCallCount-2)
							.returnValue + '_browser_logs' + '.txt';

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName),
					prettyPrintBrowserLogs(logData),
					'utf-8'
				), 
				'FileWriter.writeBrowserLogs failed to write correct data or to the correct file'
			);
		},

		'writeBrowserLogs#withoutAnyLogs': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = '';

			FileWriter.writeBrowserLogs(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName),
					prettyPrintBrowserLogs(logData),
					'utf-8'
				), 
				'FileWriter.writeBrowserLogs failed to write correct data or to the correct file'
			);
		},

		'writeBrowserLogs#withInvalidLogs': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = undefined;

			FileWriter.writeBrowserLogs(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName),
					prettyPrintBrowserLogs(logData),
					'utf-8'
				), 
				'FileWriter.writeBrowserLogs failed to write correct data or to the correct file'
			);
		},

		'writeScreenshot': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = 'some data';

			var ret = FileWriter.writeScreenshot(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 
					'base64'
				), 
				'FileWriter.writeScreenshot failed to write correct data or to the correct file'
			);

			assert.equal(ret, path.join(logFilePath, logFileName),
				'Return value of FileWriter.writeScreenshot was wrong'
			);
		},

		'writeScreenshot#withoutFilename': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName;
			var logData = 'some data';

			FileWriter.writeScreenshot(logData, logFilePath);

			logFileName = FileWriter.generateRandomNumber.lastCall.returnValue + 
							'_screenshot' + '.png';

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 
					'base64'
				), 
				'FileWriter.writeScreenshot failed to write correct data or to the correct file');
		},

		'writeScreenshot#withoutDirectory': function () {
			var logFilePath;
			var logFileName = 'filename.txt';
			var logData = 'some data';

			FileWriter.writeScreenshot(logData, undefined, logFileName);

			logFilePath = FileWriter.createTempDir.lastCall.returnValue;

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 
					'base64'
				), 
				'FileWriter.writeScreenshot failed to write correct data or to the correct file'
			);
		},

		'writeScreenshot#withoutDirectoryOrFilename': function () {
			var logFilePath;
			var logFileName;
			var generateRandomNumberCallCount;
			var logData = 'some data';

			FileWriter.writeScreenshot(logData);

			logFilePath = FileWriter.createTempDir.lastCall.returnValue;

			//Need to get the second last call to generateRandomNumber for getting filename 
			generateRandomNumberCallCount = FileWriter.generateRandomNumber.callCount;
			logFileName = FileWriter
							.generateRandomNumber
							.getCall(generateRandomNumberCallCount-2)
							.returnValue + '_screenshot' + '.png';

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 
					'base64'
				), 
				'FileWriter.writeScreenshot failed to write correct data or to the correct file'
			);
		},

		'writeScreenshot#withoutAnyLogs': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = '';

			FileWriter.writeScreenshot(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 
					'base64'
				), 
				'FileWriter.writeScreenshot failed to write correct data or to the correct file'
			);
		},

		'writeScreenshot#withInvalidLogs': function () {
			var logFilePath = path.join('some', 'dir');
			var logFileName = 'filename.txt';
			var logData = undefined;

			FileWriter.writeScreenshot(logData, logFilePath, logFileName);

			assert.ok(
				fs.writeFileSync.calledWith(
					path.join(logFilePath, logFileName), 
					logData, 
					'base64'
				), 
				'FileWriter.writeScreenshot failed to write correct data or to the correct file'
			);
		},

		'createTempDir': function () {
			fs.existsSync.returns(false);

			var randomNo = 1234;
			var osTempDir = os.tmpdir();
			var tempDir = path.join(osTempDir, 'intern', randomNo.toString());

			FileWriter.createTempDir(randomNo);

			assert.ok(
				mkdirp.sync.calledWith(tempDir), 
				'mkdirp called to create the wrong directory'
			);
		},

		'createTempDir#withoutSession': function () {
			fs.existsSync.returns(false);

			FileWriter.createTempDir();

			var sessionId = FileWriter.generateRandomNumber.lastCall.returnValue.toString();
			var osTempDir = os.tmpdir();
			var tempDir = path.join(osTempDir, 'intern', sessionId);

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