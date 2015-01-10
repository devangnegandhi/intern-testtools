/**
 * @copyright Copyright (C) 2014 Devang Negandhi - All Rights Reserved
 */

define([
	'intern!object',
	'intern/chai!assert',
	'dojo/Deferred',
	'dojo/node!path',
	'dojo/node!touch',
	'dojo/node!mkdirp',
	'dojo/node!mockery',
	'dojo/node!sinon',
], function (registerSuite, assert, Deferred, path, touch, mkdirp, mockery, sinon) {
	var Selenium,
		modulePath,
		logsDir;

	var mockSeleniumProcess,
		mockSeleniumStandalone,
		mockFreeport,
		mockRequest,
		mockPath,
		mockTouch,
		mockMkdirp,
		mockFs,
		mockDeasync;

	var generateRandomPort = function () {
		return Math.floor(Math.random() * ((65535-1025)+1) + 1025);
	}

	registerSuite({
		name: 'config/lib/Selenium',

		setup: function () {
			modulePath = path.resolve('config/lib/Selenium.js');
			require.undef('path');

			mockSeleniumProcess = sinon.stub();
			mockSeleniumProcess.unref = sinon.stub();

			mockSeleniumStandalone = sinon.stub();

			mockFreeport = sinon.stub();

			mockRequest = sinon.stub();
			mockRequest.defaults = sinon.stub();

			mockPath = sinon.stub();
			mockPath.resolve = sinon.stub();

			mockTouch = sinon.stub();
			mockTouch.sync = sinon.stub();

			mockMkdirp = sinon.stub();
			mockMkdirp.sync = sinon.stub();

			mockFs = sinon.stub();
			mockFs.openSync = sinon.stub();

			mockDeasync = sinon.stub();
			mockDeasync.sleep = sinon.stub();
		},

		beforeEach: function () {
			mockSeleniumStandalone.returns(mockSeleniumProcess);
			mockRequest.defaults.returns(mockRequest);
			mockDeasync.returnsArg(0);

			mockery.enable();
			mockery.registerMock('touch', mockTouch);
			mockery.registerMock('path', mockPath);
			mockery.registerMock('mkdirp', mockMkdirp);
			mockery.registerMock('request', mockRequest);
			mockery.registerMock('selenium-standalone', mockSeleniumStandalone);
			mockery.registerMock('freeport', mockFreeport);
			mockery.registerMock('deasync', mockDeasync);
			mockery.registerMock('fs', mockFs);
			mockery.registerAllowable('source-map');
			mockery.registerAllowable(modulePath);

			Selenium = require.nodeRequire(modulePath);
			Selenium = new Selenium();
		},

		afterEach: function() {
			mockery.disable();
            mockery.deregisterAll();

			mockRequest.resetBehavior();
			mockSeleniumProcess.resetBehavior();
			mockSeleniumProcess.unref.resetBehavior();
			mockSeleniumStandalone.resetBehavior();
			mockFreeport.resetBehavior();
			mockRequest.resetBehavior();
			mockRequest.defaults.resetBehavior();
			mockPath.resetBehavior();
			mockPath.resolve.resetBehavior();
			mockTouch.resetBehavior();
			mockTouch.sync.resetBehavior();
			mockMkdirp.resetBehavior();
			mockMkdirp.sync.resetBehavior();
			mockFs.resetBehavior();
			mockFs.openSync.resetBehavior();
			mockDeasync.resetBehavior();
			mockDeasync.sleep.resetBehavior();
		},

		teardown: function () {
		},

		'checkDefaultProperties': function () {

			var defaultPort = Selenium.getPort();
			var defaultArgs = Selenium.getArgs();
			var defaultHubAddress = Selenium.getHubAddress();
			var hasStarted = Selenium.hasStarted();

			assert.equal(
				defaultPort,
				0,
				'Wrong default port specified for Selenium'
			);

			assert.deepEqual(
				defaultArgs,
				[],
				'Wrong default args specified for Selenium'
			);

			assert.equal(
				defaultHubAddress,
				'',
				'Wrong default hub address specified for Selenium'
			);

			assert.isFalse(
				hasStarted,
				'Selenium started by default before calling start'
			);
		},

		'Selenium.start#withoutArgsAndSuccess': function () {

			var randomNumber = generateRandomPort();
			var mockOutStream = 'someFsOutStreamObject';
			var mockErrStream = 'someFsErrStreamObject';

			mockFs.openSync.onCall(0).returns(mockOutStream);
			mockFs.openSync.onCall(1).returns(mockErrStream);
			mockFreeport.returns(randomNumber);
			mockPath.resolve.returns('somePath');

			var mockResponse = {
				statusCode: 200
			};

			mockRequest.returns(mockResponse);

			Selenium.start();

			var port = Selenium.getPort();
			var args = Selenium.getArgs();
			var hubAddress = Selenium.getHubAddress();
			var hasStarted = Selenium.hasStarted();

			assert.equal(
				port,
				randomNumber,
				'Wrong port assigned to Selenium server'
			);

			assert.deepEqual(
				args,
				[ '-debug', '-port', randomNumber ],
				'Wrong args assigned to Selenium server'
			);

			assert.equal(
				hubAddress,
				'http://localhost:' + randomNumber + '/wd/hub/status',
				'Wrong hub address assigned to Selenium server'
			);

			assert.isTrue(
				hasStarted,
				'Selenium failed to set started flag'
			);

			assert.deepEqual(
				mockSeleniumStandalone.lastCall.args[0],
				{ stdio: [ 'ignore', mockOutStream, mockErrStream ] },
				'Called selenium-standalone with wrong spawn options'
			);

			assert.isTrue(
				mockSeleniumProcess.unref.callCount > 0,
				'Failed to detach selenium server process from parent'
			);

			mockSeleniumProcess.unref.reset();

			assert.equal(
				mockMkdirp.sync.lastCall.args,
				'somePath',
				'Failed to create logs dir'
			);

			assert.equal(
				mockTouch.sync.lastCall.args,
				'somePath',
				'Failed to create selenium.log file'
			);
		},

		'Selenium.start#withPortAndNoArgsAndSuccess': function () {

			var randomNumber = generateRandomPort();

			var mockResponse = {
				statusCode: 200
			};

			mockRequest.returns(mockResponse);

			Selenium.start(randomNumber);

			var port = Selenium.getPort();
			var args = Selenium.getArgs();
			var hubAddress = Selenium.getHubAddress();
			var hasStarted = Selenium.hasStarted();

			assert.equal(
				port,
				randomNumber,
				'Wrong port assigned to Selenium server'
			);

			assert.deepEqual(
				args,
				[ '-debug', '-port', randomNumber ],
				'Wrong args assigned to Selenium server'
			);

			assert.equal(
				hubAddress,
				'http://localhost:' + randomNumber + '/wd/hub/status',
				'Wrong hub address assigned to Selenium server'
			);

			assert.isTrue(
				hasStarted,
				'Selenium failed to set started flag'
			);
		},

		'Selenium.start#withPortAndArgsAndSuccess': function () {

			var randomNumber = generateRandomPort();
			var someArgs = ['-arg1', 123, '-arg2', 456];

			var mockResponse = {
				statusCode: 200
			};

			mockRequest.returns(mockResponse);

			Selenium.start(randomNumber, someArgs);

			var port = Selenium.getPort();
			var args = Selenium.getArgs();
			var hubAddress = Selenium.getHubAddress();
			var hasStarted = Selenium.hasStarted();

			assert.equal(
				port,
				randomNumber,
				'Wrong port assigned to Selenium server'
			);

			assert.deepEqual(
				args,
				[ '-debug', '-port', randomNumber ].concat(someArgs),
				'Wrong args assigned to Selenium server'
			);

			assert.equal(
				hubAddress,
				'http://localhost:' + randomNumber + '/wd/hub/status',
				'Wrong hub address assigned to Selenium server'
			);

			assert.isTrue(
				hasStarted,
				'Selenium failed to set started flag'
			);
		},

		'Selenium.start#withArgsAndNoPortAndSuccess': function () {

			var randomNumber = generateRandomPort();
			var someArgs = ['-arg1', 123, '-arg2', 456];

			var mockResponse = {
				statusCode: 200
			};

			mockRequest.returns(mockResponse);
			mockFreeport.returns(randomNumber);

			Selenium.start(someArgs);

			var port = Selenium.getPort();
			var args = Selenium.getArgs();
			var hubAddress = Selenium.getHubAddress();
			var hasStarted = Selenium.hasStarted();

			assert.equal(
				port,
				randomNumber,
				'Wrong port assigned to Selenium server'
			);

			assert.deepEqual(
				args,
				[ '-debug', '-port', randomNumber ].concat(someArgs),
				'Wrong args assigned to Selenium server'
			);

			assert.equal(
				hubAddress,
				'http://localhost:' + randomNumber + '/wd/hub/status',
				'Wrong hub address assigned to Selenium server'
			);

			assert.isTrue(
				hasStarted,
				'Selenium failed to set started flag'
			);
		},

		'Selenium.start#failedToStart': function () {

			var mockResponse = {
				statusCode: 404
			};

			mockRequest.returns(mockResponse);

			assert.throws(
				Selenium.start,
				'Unable to connect to selenium'
			);
		},

		'Selenium.start#failedToRequest': function () {

			mockRequest.throws();

			assert.throws(
				Selenium.start,
				'Unable to connect to selenium'
			);

			assert.isTrue(
				mockDeasync.sleep.callCount > 0,
				'Failed to sleep and try again if request failed'
			);

			mockDeasync.sleep.reset();
		},

		'Selenium.start#AndTryToStartAgain': function () {
			var mockResponse = {
				statusCode: 200
			};

			mockRequest.returns(mockResponse);

			Selenium.start();

			assert.throws(
				Selenium.start,
				'Selenium is already listening on port: ' + Selenium.getPort()
			);
		}
	});
});