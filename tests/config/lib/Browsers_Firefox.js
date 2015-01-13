/**
 * @copyright Copyright (C) 2014 Devang Negandhi - All Rights Reserved
 */

define([
	'intern!object',
	'intern/chai!assert',
	'dojo/Deferred',
	'dojo/node!path',
	'dojo/node!mockery',
	'dojo/node!sinon'
], function (registerSuite, assert, Deferred, path, mockery, sinon) {
	var Firefox,
		modulePath;

	var mockBrowsers,
		mockMozDownload,
		mockPath,
		mockMkdirp,
		mockOs,
		mockDeasync,
		mockBrowserVersion,
		mockBrowserName;

	registerSuite({
		name: 'config/lib/Selenium',

		setup: function () {
			modulePath = path.resolve('config/lib/Browsers_Firefox.js');
			require.undef('path');

			mockPath = sinon.stub();
			mockPath.resolve = sinon.stub();

			mockMkdirp = sinon.stub();
			mockMkdirp.sync = sinon.stub();

			mockOs = sinon.stub();

			mockDeasync = sinon.stub();

			mockBrowsers = sinon.stub();
			mockBrowsers.getBrowserVersion = sinon.stub();
			mockBrowsers.BROWSERS = sinon.stub();
			mockBrowsers.BROWSERS.FF = sinon.stub();

			mockMozDownload = sinon.stub();
		},

		beforeEach: function () {
			mockDeasync.returnsArg(0);

			mockBrowserVersion = 123;
			mockBrowserName = 'BrowserFirefox';
			mockBrowsers.getBrowserVersion.returns(mockBrowserVersion);
			mockBrowsers.BROWSERS.FF = mockBrowserName;

			mockery.enable();
			mockery.registerMock('os', mockOs);
			mockery.registerMock('path', mockPath);
			mockery.registerMock('mkdirp', mockMkdirp);
			mockery.registerMock('deasync', mockDeasync);
			mockery.registerMock('./Browsers', mockBrowsers);
			mockery.registerMock('mozilla-download', mockMozDownload);
			mockery.registerAllowable('source-map');
			mockery.registerAllowable(modulePath);

			Firefox = require.nodeRequire(modulePath);
		},

		afterEach: function() {
			mockery.disable();
            mockery.deregisterAll();

			mockPath.resetBehavior();
			mockPath.resolve.resetBehavior();
			mockMkdirp.resetBehavior();
			mockMkdirp.sync.resetBehavior();
			mockOs.resetBehavior();
			mockDeasync.resetBehavior();
			mockBrowsers.resetBehavior();
			mockMozDownload.resetBehavior();
		},

		teardown: function () {
		},

		'downloadWithoutVersion': function () {

			var mockBroswerBaseDir = 'someBrowserBaseDir';
			var mockBroswerDir = 'someBrowserDir';

			var expectedMozOptions = {
				product: mockBrowserName,
				branch: mockBrowserVersion
			}

			mockPath.resolve.onCall(0).returns(mockBroswerBaseDir);
			mockPath.resolve.onCall(1).returns(mockBroswerDir);

			mockMozDownload.returns(undefined);


			var downloadDir = Firefox.download();

			assert.equal(
				mockMkdirp.sync.lastCall.args[0],
				mockBroswerBaseDir,
				'Wrong browser base directory'
			);

			assert.equal(
				downloadDir,
				mockBroswerDir,
				'Wrong browser output directory'
			);

			assert.equal(
				mockMozDownload.lastCall.args[0],
				mockBroswerDir,
				'Wrong browser output directory given to mozDownload'
			);

			assert.deepEqual(
				mockMozDownload.lastCall.args[1],
				expectedMozOptions,
				'Wrong browser options given to mozDownload'
			);
		},

		'downloadWithUserDefinedVersion': function () {

			var mockBroswerBaseDir = 'someBrowserBaseDir';
			var mockBroswerDir = 'someBrowserDir';
			var userDefinedVersion = 234;

			var expectedMozOptions = {
				product: mockBrowserName,
				branch: userDefinedVersion
			}

			mockPath.resolve.onCall(0).returns(mockBroswerBaseDir);
			mockPath.resolve.onCall(1).returns(mockBroswerDir);

			mockMozDownload.returns(undefined);

			var downloadDir = Firefox.download(userDefinedVersion);

			assert.deepEqual(
				mockMozDownload.lastCall.args[1],
				expectedMozOptions,
				'Wrong browser options given to mozDownload'
			);
		},

		'downloadWithVersionDefinedAsEnv': function () {

			var mockBroswerBaseDir = 'someBrowserBaseDir';
			var mockBroswerDir = 'someBrowserDir';
			process.env.BROWSER_FIREFOX = 456;

			var expectedMozOptions = {
				product: mockBrowserName,
				branch: process.env.BROWSER_FIREFOX
			}

			mockPath.resolve.onCall(0).returns(mockBroswerBaseDir);
			mockPath.resolve.onCall(1).returns(mockBroswerDir);

			mockMozDownload.returns(undefined);

			var downloadDir = Firefox.download();

			assert.deepEqual(
				mockMozDownload.lastCall.args[1],
				expectedMozOptions,
				'Wrong browser options given to mozDownload'
			);
		}
	});


});