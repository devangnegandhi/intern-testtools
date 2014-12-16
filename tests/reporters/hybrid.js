/**
 * @copyright Copyright (C) 2014 Devang Negandhi - All Rights Reserved
 */
define([
	'intern!object',
	'intern/chai!assert',
	'intern',
	'intern/lib/args',
	'dojo/Deferred',
	'dojo/node!mockery',
	'dojo/node!sinon',
	'dojo/node!fs',
	'dojo/node!path',
	'dojo/node!glob',
	'dojo/node!istanbul/lib/instrumenter',
	'dojo/node!istanbul/lib/collector',
	'dojo/node!istanbul/lib/report/json',
	'dojo/node!istanbul/lib/report/html',
	'dojo/node!istanbul/lib/report/text',
	'dojo/node!istanbul/lib/report/lcovonly',
	'dojo/node!../../reporters/lib/FileWriter',
	'dojo/node!../../reporters/lib/Logger',
	'dojo/node!../../reporters/lib/BrowserArtifacts',
	// 'reporters/hybrid'
], function (registerSuite, assert, intern, args, Deferred, mockery, sinon, fs, path, glob, Instrumenter, 
			Collector, JsonReporter, LcovHtmlReporter, TextReporter, LcovReporter,FileWriter, Logger, 
			BrowserArtifacts) {

	var mockLogger;
	var instrumentUnloadedFilesStub;
	var mockJsonReporter, mockLcovHtmlReporter, mockTextReporter, mockLcovReporter, mockFileWriter,
		mockGlob;  
	var hybrid;
	var randomNumber = 999;
	var mockTempDir = '/some/temp/dir/';
	var getCurrentUrlDfd;

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
		name: 'someSuite',
		numTests: 55,
		numFailedTests: 10,
		error: {
			name: 'mocked error',
			message: 'mocking out the error',
			stack: 'one-on-top-of-the-other',
		}
	};

	var mockSuiteWithoutSessionId = {
		name: 'someSuiteWithoutSessionId',
		numTests: 55,
		numFailedTests: 10,
		error: {
			name: 'mocked error',
			message: 'mocking out the error',
			stack: 'one-on-top-of-the-other',
		}
	};

	var mockSuiteWithNameMain = {
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

	var mockSuiteWithNameMainWithouSessionId = {
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

	var mockTestWithoutSessionId = {
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
		name: 'childWithoutSessionId',
		id: 'grandparent-parent-child',
		timeElapsed: '1000',
		mockErrId: 1234
	};

	var mockTunnel = {
		tunnelId: '0'
	}

	registerSuite({
		name: 'reporters/hybrid',

		setup: function () {
			sandbox = sinon.sandbox.create();
			//Mocking FileWriter module
			sandbox.stub(FileWriter);
			sandbox.stub(BrowserArtifacts);
			sandbox.stub(glob, "sync");
			glob.sync.returns([]);

			// Always returning 999 for random number generator
			FileWriter.generateRandomNumber.returns(randomNumber);

			console.warn = function() {}
		},

		beforeEach: function() {
			var dfd = new Deferred();

			mockRemote.sessionId 
				= mockSuite.sessionId 
				= mockSuiteWithNameMain.sessionId
				= mockTest.sessionId 
				= mockTunnel.tunnelId
				= (parseInt(mockRemote.sessionId) + 1) + '';

			FileWriter.createTempDir.returns(mockTempDir + mockSuite.sessionId);


			mockLogger = sinon.stub();
			mockLogger.Env = Logger.Env;
			mockLogger.prototype = sinon.createStubInstance(Logger);

			mockCollector = sinon.stub();
			mockCollector.prototype = sinon.createStubInstance(Collector);
			
			mockJsonReporter = sinon.stub();
			mockJsonReporter.prototype = sinon.createStubInstance(JsonReporter);

			mockLcovHtmlReporter = sinon.stub();
			mockLcovHtmlReporter.prototype = sinon.createStubInstance(LcovHtmlReporter);

			mockTextReporter = sinon.stub();
			mockTextReporter.prototype = sinon.createStubInstance(TextReporter);

			mockLcovReporter = sinon.stub();
			mockLcovReporter.prototype = sinon.createStubInstance(LcovReporter);

			mockery.enable();
			mockery.registerMock(path.resolve('reporters/lib/Logger.js'), mockLogger);
			mockery.registerMock('istanbul/lib/collector', mockCollector);
			mockery.registerMock('istanbul/lib/report/json', mockJsonReporter);
			mockery.registerMock('istanbul/lib/report/html', mockLcovHtmlReporter);
			mockery.registerMock('istanbul/lib/report/text', mockTextReporter);
			mockery.registerMock('istanbul/lib/report/lcovonly', mockLcovReporter);

            require.undef('reporters/hybrid');
			require([ 'reporters/hybrid' ], function (hybridUsingMock) {
				hybrid = hybridUsingMock;
				dfd.resolve();
			});

      		return dfd.promise;
		},

		afterEach: function() {
			// instrumentUnloadedFilesStub.restore();
			mockery.disable();
            mockery.deregisterAll();
            require.undef('reporters/hybrid');
		},

		teardown: function () {
			sandbox.restore();
		},

		'start#localRandomLogDirAndClientMode': function() {

			var oldMode,
				oldArgsRunId,
				oldArgsLogDir,
				oldTravisJobNumber;

			oldMode = intern.mode;
			oldArgsRunId = args.runId;
			oldArgsLogDir = args.logDir;
			oldTravisJobNumber = process.env.TRAVIS_JOB_NUMBER;

			intern.mode = "client";
			args.runId = 1234;
			args.logDir = undefined;
			delete process.env.TRAVIS_JOB_NUMBER;

			hybrid.start();

			assert.deepEqual(
				mockLogger.lastCall.args, 
				[
					mockLogger.Env.NODE,
					path.resolve('.', 'logs', args.runId.toString()),
					{
						verbose: true
					}
				], 
				'hybrid.start failed to initialize Logger with correct args'
			);

			assert.deepEqual(
				mockJsonReporter.lastCall.args[0], 
				{dir: FileWriter.createTempDir.lastCall.returnValue}, 
				'hybrid.start failed to initialize JsonReporter correctly for NODE env'
			);

			assert.equal(
				mockTextReporter.callCount, 
				0, 
				'hybrid.start wrongly initialized TextReporter for NODE env'
			);

			assert.equal(
				mockLcovReporter.callCount, 
				0, 
				'hybrid.start wrongly initialized LcovReporter for NODE env'
			);

			assert.equal(
				mockLcovHtmlReporter.callCount, 
				0, 
				'hybrid.start wrongly initialized LcovHtmlReporter for NODE env'
			);

			intern.mode = oldMode;
			args.runId = oldArgsRunId;
			args.logDir = oldArgsLogDir;
			process.env.TRAVIS_JOB_NUMBER = oldTravisJobNumber;
		},

		'start#cliLogDirAndClientMode': function() {

			var oldMode,
				oldArgsRunId,
				oldArgsLogDir,
				oldTravisJobNumber;

			oldMode = intern.mode;
			oldArgsRunId = args.runId;
			oldArgsLogDir = args.logDir;
			oldTravisJobNumber = process.env.TRAVIS_JOB_NUMBER;

			intern.mode = "client";
			args.runId = 1234;
			args.logDir = "someLogDir";
			delete process.env.TRAVIS_JOB_NUMBER;

			hybrid.start();

			assert.deepEqual(
				mockLogger.lastCall.args, 
				[
					mockLogger.Env.NODE,
					path.resolve(args.logDir),
					{
						verbose: true
					}
				], 
				'hybrid.start failed to initialize Logger with correct args'
			);

			assert.deepEqual(
				mockJsonReporter.lastCall.args[0], 
				{dir: FileWriter.createTempDir.lastCall.returnValue}, 
				'hybrid.start failed to initialize JsonReporter correctly for NODE env'
			);

			assert.equal(
				mockTextReporter.callCount, 
				0, 
				'hybrid.start wrongly initialized TextReporter for NODE env'
			);

			assert.equal(
				mockLcovReporter.callCount, 
				0, 
				'hybrid.start wrongly initialized LcovReporter for NODE env'
			);

			assert.equal(
				mockLcovHtmlReporter.callCount, 
				0, 
				'hybrid.start wrongly initialized LcovHtmlReporter for NODE env'
			);

			intern.mode = oldMode;
			args.runId = oldArgsRunId;
			args.logDir = oldArgsLogDir;
			process.env.TRAVIS_JOB_NUMBER = oldTravisJobNumber;
		},

		'start#travisCIAndRunnerMode': function() {

			var oldMode,
				oldArgsRunId,
				oldTravisJobNumber,
				logDir,
				coverageDir;

			oldMode = intern.mode;
			oldArgsRunId = args.runId;
			oldTravisJobNumber = process.env.TRAVIS_JOB_NUMBER;

			intern.mode = "Runner";
			args.runId = 2345;
			process.env.TRAVIS_JOB_NUMBER = 9876;

			logDir = path.resolve('.', 'logs', 'build_' + process.env.TRAVIS_JOB_NUMBER);
			coverageDir = path.resolve(logDir, 'coverage');

			hybrid.start();

			assert.deepEqual(
				mockLogger.lastCall.args,
				[
					mockLogger.Env.BROWSER,
					logDir,
					{
						verbose: true
					}
				], 
				'hybrid.start failed to initialize Logger with correct args'
			);

			assert.deepEqual(
				mockJsonReporter.lastCall.args[0], 
				{dir: FileWriter.createTempDir.lastCall.returnValue}, 
				'hybrid.start failed to initialize JsonReporter correctly for BROWSER env'
			);

			assert.deepEqual(
				mockLcovHtmlReporter.lastCall.args[0], 
				{dir: coverageDir}, 
				'hybrid.start failed to initialize LcovHtmlReporter correctly for BROWSER env'
			);

			assert.deepEqual(
				mockLcovReporter.lastCall.args[0], 
				{dir: coverageDir}, 
				'hybrid.start failed to initialize LcovReporter correctly for BROWSER env'
			);

			assert.equal(
				mockTextReporter.callCount, 
				1,
				'hybrid.start wrongly initialized mockTextReporter'
			);

			intern.mode = oldMode;
			args.runId = oldArgsRunId;
			process.env.TRAVIS_JOB_NUMBER = oldTravisJobNumber;
		},

		'start#instrumentUnloadedFiles': function() {

			var oldMode,
				oldArgsRunId,
				oldArgsLogDir,
				oldInternConfigInstrumentCode,
				oldTravisJobNumber;

			oldMode = intern.mode;
			oldArgsRunId = args.runId;
			oldArgsLogDir = args.logDir;
			oldInternConfigInstrumentCode = intern.config.instrumentUnloadedFiles;
			oldTravisJobNumber = process.env.TRAVIS_JOB_NUMBER;

			intern.mode = "client";
			args.runId = 1234;
			args.logDir = undefined;
			intern.config.instrumentUnloadedFiles = true;
			delete process.env.TRAVIS_JOB_NUMBER;

			hybrid.start();

			// assert.equal(
			// 	instrumentUnloadedFilesStub.callCount,
			// 	1,
			// 	'Failed to call instrumentUnloadedFiles during start'
			// );
			

			intern.mode = oldMode;
			args.runId = oldArgsRunId;
			args.logDir = oldArgsLogDir;
			intern.config.instrumentUnloadedFiles = oldInternConfigInstrumentCode;
			process.env.TRAVIS_JOB_NUMBER = oldTravisJobNumber;
		},

		'start#doNotInstrumentUnloadedFiles': function() {

			var oldMode,
				oldArgsRunId,
				oldArgsLogDir,
				oldInternConfigInstrumentCode,
				oldTravisJobNumber;

			oldMode = intern.mode;
			oldArgsRunId = args.runId;
			oldArgsLogDir = args.logDir;
			oldInternConfigInstrumentCode = intern.config.instrumentUnloadedFiles;
			oldTravisJobNumber = process.env.TRAVIS_JOB_NUMBER;

			intern.mode = "client";
			args.runId = 1234;
			args.logDir = undefined;
			intern.config.instrumentUnloadedFiles = false;
			delete process.env.TRAVIS_JOB_NUMBER;

			hybrid.start();

			// assert.equal(
			// 	instrumentUnloadedFilesStub.callCount,
			// 	0,
			// 	'Failed to call instrumentUnloadedFiles during start'
			// );
			

			intern.mode = oldMode;
			args.runId = oldArgsRunId;
			args.logDir = oldArgsLogDir;
			intern.config.instrumentUnloadedFiles = oldInternConfigInstrumentCode;
			process.env.TRAVIS_JOB_NUMBER = oldTravisJobNumber;
		},

		'/session/start': function() {

			hybrid.start();
			hybrid['/session/start'](mockRemote);

			assert.deepEqual(
				mockLogger.prototype.logSessionStart.lastCall.args[0],
				mockRemote, 
				'hybrid["/session/start"] failed to call logger.logSessionStart correctly'
			);
		},

		'/session/end': function() {

			hybrid.start();
			hybrid['/session/start'](mockRemote);
			hybrid['/session/end'](mockRemote);

			assert.deepEqual(
				mockLogger.prototype.logSessionEnd.lastCall.args[0],
				mockRemote, 
				'hybrid["/session/end"] failed to call logger.logSessionEnd correctly'
			);
		},

		'/suite/start': function() {

			hybrid.start();
			hybrid['/session/start'](mockRemote);
			hybrid['/suite/start'](mockSuite);

			assert.deepEqual(
				mockLogger.prototype.logSuiteStart.lastCall.args[0],
				mockSuite, 
				'hybrid["/suite/start"] failed to call logger.logSuiteStart correctly'
			);
		},

		'/suite/end': function() {

			hybrid.start();
			hybrid['/session/start'](mockRemote);
			hybrid['/suite/start'](mockSuite);
			hybrid['/suite/end'](mockSuite);

			assert.deepEqual(
				mockLogger.prototype.logSuiteEnd.lastCall.args[0],
				mockSuite, 
				'hybrid["/suite/end"] failed to call logger.logSuiteEnd correctly'
			);
		},

		'/suite/end#withSuiteNameMain': function() {

			hybrid.start();
			hybrid['/session/start'](mockRemote);
			hybrid['/suite/start'](mockSuiteWithNameMain);
			hybrid['/suite/end'](mockSuiteWithNameMain);

			assert.equal(
				mockLogger.prototype.logSuiteEnd.callCount,
				0, 
				'hybrid["/suite/end"] called with suite.name was main'
			);
		},

		'/suite/end#withSuiteNameMainAndInvalidSessionId': function() {

			mockSuiteWithNameMain.sessionId = 'someSessionId';
			hybrid.start();
			hybrid['/session/start'](mockRemote);
			hybrid['/suite/start'](mockSuiteWithNameMain);
			hybrid['/suite/end'](mockSuiteWithNameMain);

			assert.equal(
				mockLogger.prototype.logSuiteEnd.callCount,
				0, 
				'hybrid["/suite/end"] called with suite.name was main'
			);
		},

		'/suite/error#withoutSessionId': function() {
			var randomNumber = 12345;

			FileWriter.generateRandomNumber.returns(randomNumber);

			hybrid.start();
			hybrid['/suite/error'](mockSuiteWithoutSessionId);

			assert.equal(
				mockLogger.prototype.logFailedTest.callCount,
				1, 
				'hybrid["/suite/end"] not called when sessionId was not given'
			);

			assert.deepEqual(
				mockLogger.prototype.logFailedTest.lastCall.args[0],
				mockSuiteWithoutSessionId, 
				'hybrid["/suite/error"] failed to call logger.logFailedTest with correct testObj'
			);

			assert.equal(
				mockLogger.prototype.logFailedTest.lastCall.args[1],
				randomNumber, 
				'hybrid["/suite/error"] failed to call logger.logFailedTest with correct errorId'
			);

		},

		'/suite/error#withSessionId': function() {
			var randomNumber = 23456,
				mockUrl = "someURL";

			FileWriter.generateRandomNumber.returns(randomNumber);

			hybrid.start();
			hybrid['/session/start'](mockRemote);
			hybrid['/suite/start'](mockSuite);
			hybrid['/suite/error'](mockSuite);

			getCurrentUrlDfd.resolve(mockUrl);

			assert.equal(
				mockLogger.prototype.logFailedTest.callCount,
				1, 
				'hybrid["/suite/end"] not called when sessionId was given'
			);

			assert.deepEqual(
				mockLogger.prototype.logFailedTest.lastCall.args[0],
				mockSuite, 
				'hybrid["/suite/error"] failed to call logger.logFailedTest with correct testObj'
			);

			assert.equal(
				mockLogger.prototype.logFailedTest.lastCall.args[1],
				randomNumber, 
				'hybrid["/suite/error"] failed to call logger.logFailedTest with correct errorId'
			);

			assert.equal(
				mockLogger.prototype.logFailedTest.lastCall.args[2],
				mockUrl, 
				'hybrid["/suite/error"] failed to call logger.logFailedTest with correct URL'
			);

			assert.deepEqual(
				mockLogger.prototype.logFailedTest.lastCall.args[3],
				mockRemote, 
				'hybrid["/suite/error"] failed to call logger.logFailedTest with correct remoteObj'
			);	
		},

		'/test/pass': function() {

			hybrid.start();
			hybrid['/test/pass'](mockTest);

			assert.deepEqual(
				mockLogger.prototype.logPassedTest.lastCall.args[0],
				mockTest, 
				'hybrid["/test/pass"] failed to call logger.logPassedTest correctly'
			);
		},

		'/test/skip': function() {

			hybrid.start();
			hybrid['/test/skip'](mockTest);

			assert.deepEqual(
				mockLogger.prototype.logSkippedTest.lastCall.args[0],
				mockTest, 
				'hybrid["/test/skip"] failed to call logger.logSkippedTest correctly'
			);
		},

		'/test/fail#withoutSessionId': function() {
			var randomNumber = 3456,
				mockURL = "N/A";

			FileWriter.generateRandomNumber.returns(randomNumber);

			hybrid.start();
			hybrid['/test/fail'](mockTestWithoutSessionId);

			assert.equal(
				mockLogger.prototype.logFailedTest.callCount,
				1, 
				'hybrid["/test/fail"] not called when sessionId was not given'
			);

			assert.deepEqual(
				mockLogger.prototype.logFailedTest.lastCall.args[0],
				mockTestWithoutSessionId, 
				'hybrid["/test/fail"] failed to call logger.logFailedTest with correct testObj'
			);

			assert.equal(
				mockLogger.prototype.logFailedTest.lastCall.args[1],
				randomNumber, 
				'hybrid["/test/fail"] failed to call logger.logFailedTest with correct errorId'
			);

			assert.equal(
				mockLogger.prototype.logFailedTest.lastCall.args[2],
				mockURL, 
				'hybrid["/test/fail"] failed to call logger.logFailedTest with correct URL'
			);

		},

		'/test/fail#withSessionId': function() {
			var randomNumber = 23456,
				mockUrl = "someURL";

			FileWriter.generateRandomNumber.returns(randomNumber);

			hybrid.start();
			hybrid['/session/start'](mockRemote);
			hybrid['/suite/start'](mockSuite);
			hybrid['/test/fail'](mockTest);

			getCurrentUrlDfd.resolve(mockUrl);

			assert.equal(
				mockLogger.prototype.logFailedTest.callCount,
				1, 
				'hybrid["/test/fail"] not called when session Id was given'
			);

			assert.deepEqual(
				mockLogger.prototype.logFailedTest.lastCall.args[0],
				mockTest, 
				'hybrid["/test/fail"] failed to call logger.logFailedTest with correct testObj'
			);

			assert.equal(
				mockLogger.prototype.logFailedTest.lastCall.args[1],
				randomNumber, 
				'hybrid["/test/fail"] failed to call logger.logFailedTest with correct errorId'
			);

			assert.equal(
				mockLogger.prototype.logFailedTest.lastCall.args[2],
				mockUrl, 
				'hybrid["/test/fail"] failed to call logger.logFailedTest with correct URL'
			);

			assert.deepEqual(
				mockLogger.prototype.logFailedTest.lastCall.args[3],
				mockRemote, 
				'hybrid["/test/fail"] failed to call logger.logFailedTest with correct remoteObj'
			);	
		},

		'/tunnel/start': function() {

			hybrid.start();
			hybrid['/tunnel/start'](mockTunnel);

			assert.equal(
				mockLogger.prototype.logTunnelStart.lastCall.args[0],
				mockTunnel.tunnelId, 
				'hybrid["/tunnel/start"] failed to call logger.logTunnelStart correctly'
			);
		},

		'/tunnel/status': function() {
			var mockStatus = "someStatus";

			hybrid.start();
			hybrid['/tunnel/status'](mockTunnel, mockStatus);

			assert.equal(
				mockLogger.prototype.logTunnelStatus.lastCall.args[0],
				mockTunnel.tunnelId, 
				'hybrid["/tunnel/status"] failed to call logger.logTunnelStatus with correct tunnelId'
			);

			assert.equal(
				mockLogger.prototype.logTunnelStatus.lastCall.args[1],
				mockStatus, 
				'hybrid["/tunnel/status"] failed to call logger.logTunnelStatus wit correct status'
			);
		},

		'/deprecated': function() {
			var mockDeprecatedModule = "someDeprecatedModule",
				mockReplcamentModule = "someReplcamentModule";

			hybrid.start();
			hybrid['/deprecated'](mockDeprecatedModule, mockReplcamentModule);

			assert.equal(
				mockLogger.prototype.logWarning.lastCall.args[0],
				mockDeprecatedModule + ' is deprecated. Please use ' + mockReplcamentModule + ' instead',
				'hybrid["/deprecated"] failed to call logger.logWarning with correct message'
			);
		},

		'/error': function() {
			var mockError = "someErrorObj";

			hybrid.start();
			hybrid['/error'](mockError);

			assert.equal(
				mockLogger.prototype.logFatalError.lastCall.args[0],
				mockError,
				'hybrid["/error"] failed to call logger.logFatalError with correct errorObj'
			);
		},

		'/coverage': function() {
			var mockSessionId = "someSessionId",
				mockError = "someErrorObj";

			hybrid.start();
			hybrid['/coverage'](mockSessionId, mockError);

			assert.equal(
				mockCollector.prototype.add.lastCall.args.length,
				1,
				'hybrid["/coverage"] failed to call collector.add with correct no of args'
			);

			assert.equal(
				mockCollector.prototype.add.lastCall.args[0],
				mockError,
				'hybrid["/coverage"] failed to call collector.add with correct errorObj'
			);
		},

		'stop#withoutExistingCoverageFile': function() {
			var mockCoverageFile = "someCoverageFile";

			var stopSandbox = sinon.sandbox.create();
			stopSandbox.stub(path, "resolve"); 
			stopSandbox.stub(fs, "existsSync");

			path.resolve.returns(mockCoverageFile);
			fs.existsSync.returns(false);

			hybrid.start();
			hybrid.stop();		

			assert.deepEqual(
				mockJsonReporter.prototype.writeReport.lastCall.args[0], 
				new mockCollector(), 
				'hybrid.stop failed to call JsonReporter.writeReport correctly'
			);			

			assert.equal(
				mockJsonReporter.prototype.writeReport.lastCall.args[1], 
				true, 
				'hybrid.stop failed to call JsonReporter.writeReport correctly'
			);

			assert.deepEqual(
				mockCollector.prototype.add.callCount, 
				0, 
				'hybrid.stop wrongly called collector.add when coverage file does not exist'
			);

			assert.equal(
				mockLogger.prototype.dumpLogs.callCount, 
				1, 
				'hybrid.stop failed call Logger.dumpLogs'
			);

			stopSandbox.restore();	
		},

		'stop#withExitingCoverageFile': function() {
			var mockCoverageFile = "someCoverageFile",
				mockJSON = '{"a": 123}';

			var stopSandbox = sinon.sandbox.create();
			stopSandbox.stub(path, "resolve"); 
			stopSandbox.stub(fs, "existsSync"); 
			stopSandbox.stub(fs, "readFileSync"); 
			stopSandbox.stub(fs, "unlinkSync"); 

			path.resolve.returns(mockCoverageFile);
			fs.existsSync.returns(true);
			fs.readFileSync.returns(mockJSON);

			hybrid.start();
			hybrid.stop();		

			assert.deepEqual(
				mockJsonReporter.prototype.writeReport.lastCall.args[0], 
				new mockCollector(), 
				'hybrid.stop failed to call JsonReporter.writeReport correctly'
			);		

			assert.equal(
				mockJsonReporter.prototype.writeReport.lastCall.args[1], 
				true, 
				'hybrid.stop failed to call JsonReporter.writeReport correctly'
			);

			assert.deepEqual(
				mockCollector.prototype.add.lastCall.args[0], 
				JSON.parse(mockJSON), 
				'hybrid.stop failed to call collector.add correctly when coverage file exists'
			);

			assert.equal(
				fs.unlinkSync.lastCall.args[0], 
				mockCoverageFile, 
				'hybrid.stop failed to delete existing coverage files'
			);

			assert.equal(
				mockLogger.prototype.dumpLogs.callCount, 
				1, 
				'hybrid.stop failed call Logger.dumpLogs'
			);

			stopSandbox.restore();	
		},

		'stop#withMultipleReporters': function() {
			var oldMode;
			oldMode = intern.mode;
			intern.mode = "Runner";

			var mockCoverageFile = "someCoverageFile";

			var stopSandbox = sinon.sandbox.create();
			stopSandbox.stub(path, "resolve"); 
			stopSandbox.stub(fs, "existsSync");

			path.resolve.returns(mockCoverageFile);
			fs.existsSync.returns(false);

			hybrid.start();
			hybrid.stop();		

			assert.deepEqual(
				mockTextReporter.prototype.writeReport.lastCall.args[0], 
				new mockCollector(), 
				'hybrid.stop failed to call TextReporter.writeReport correctly'
			);		

			assert.equal(
				mockTextReporter.prototype.writeReport.lastCall.args[1], 
				true, 
				'hybrid.stop failed to call TextReporter.writeReport correctly'
			);

			assert.deepEqual(
				mockLcovHtmlReporter.prototype.writeReport.lastCall.args[0], 
				new mockCollector(), 
				'hybrid.stop failed to call LcovHtmlReporter.writeReport correctly'
			);		

			assert.equal(
				mockLcovHtmlReporter.prototype.writeReport.lastCall.args[1], 
				true, 
				'hybrid.stop failed to call LcovHtmlReporter.writeReport correctly'
			);

			assert.deepEqual(
				mockLcovReporter.prototype.writeReport.lastCall.args[0], 
				new mockCollector(), 
				'hybrid.stop failed to call LcovReporter.writeReport correctly'
			);		

			assert.equal(
				mockLcovReporter.prototype.writeReport.lastCall.args[1], 
				true, 
				'hybrid.stop failed to call LcovReporter.writeReport correctly'
			);

			assert.deepEqual(
				mockJsonReporter.prototype.writeReport.lastCall.args[0], 
				new mockCollector(), 
				'hybrid.stop failed to call JsonReporter.writeReport correctly'
			);	

			assert.equal(
				mockJsonReporter.prototype.writeReport.lastCall.args[1], 
				true, 
				'hybrid.stop failed to call JsonReporter.writeReport correctly'
			);	

			intern.mode = oldMode;
			stopSandbox.restore();	
		},

		'instrumentUnloadedFiles#exludedFiles': function() {
			var oldExcludeInstrumentation,
				fileList;

			fileList = ['exclude/file1', 'exclude/file2'];

			glob.sync.returns(fileList);

			oldExcludeInstrumentation = intern.config.excludeInstrumentation;

			intern.config.excludeInstrumentation = /^(?:exclude)\//;

			hybrid.instrumentUnloadedFiles();

			for( var i = 0; i< fileList.length; i++) {
				assert.isUndefined(
					__internCoverage[fileList[i]],
					'instrumented file in the excluded list'
				);
			}

			intern.config.excludeInstrumentation = oldExcludeInstrumentation;
		},

		'instrumentUnloadedFiles#alreadyInstrumentedFiles': function() {
			var oldExcludeInstrumentation,
				instrumentUnloadedFilesSandbox,
				fileList;

			fileList = ['some/file1', 'some/file2'];

			for( i = 0; i< fileList.length; i++) {
				__internCoverage[fileList[i]] = 'some/resolved/file' + (i + 1);
			}

			glob.sync.returns(fileList);

			oldExcludeInstrumentation = intern.config.excludeInstrumentation;

			intern.config.excludeInstrumentation = /^(?:exclude)\//;

			instrumentUnloadedFilesSandbox = sinon.sandbox.create();
			instrumentUnloadedFilesSandbox.stub(path, "resolve");

			for( var i = 0; i< fileList.length; i++) {
				path.resolve.onCall(i).returns(fileList[i]);
			}

			hybrid.instrumentUnloadedFiles();
			instrumentUnloadedFilesSandbox.restore();

			for( i = 0; i< fileList.length; i++) {
				assert.equal(
					__internCoverage[fileList[i]],
					'some/resolved/file' + (i + 1)
				);
			}

			intern.config.excludeInstrumentation = oldExcludeInstrumentation;

			for( i = 0; i< fileList.length; i++) {
				delete __internCoverage[fileList[i]];
			}
		},

		'instrumentUnloadedFiles': function() {
			var oldExcludeInstrumentation,
				instrumentUnloadedFilesSandbox,
				fileList;

			var mockIns = new Instrumenter();

			fileList = ['some/file1', 'some/file2', 'exclude/some/file3'];

			glob.sync.returns(fileList);

			oldExcludeInstrumentation = intern.config.excludeInstrumentation;

			intern.config.excludeInstrumentation = /^(?:exclude)\//;

			instrumentUnloadedFilesSandbox = sinon.sandbox.create();
			instrumentUnloadedFilesSandbox.stub(path, "resolve");
			instrumentUnloadedFilesSandbox.stub(fs, "readFileSync");

			for( var i = 0; i< fileList.length; i++) {
				path.resolve.onCall(i).returns(fileList[i]);
			}

			fs.readFileSync.returns('mockStr');

			hybrid.instrumentUnloadedFiles();
			instrumentUnloadedFilesSandbox.restore();

			for( i = 0; i< fileList.length-1; i++) {
				mockIns.instrumentSync('mockStr', fileList[i]);
				assert.deepEqual(
					__internCoverage[fileList[i]],
					mockIns.lastFileCoverage()
				);
			}

			intern.config.excludeInstrumentation = oldExcludeInstrumentation;

			for( i = 0; i< fileList.length-1; i++) {
				delete __internCoverage[fileList[i]];
			}
		}
	});
});