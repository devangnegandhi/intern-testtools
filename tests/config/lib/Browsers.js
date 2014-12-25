/**
 * @copyright Copyright (C) 2014 Devang Negandhi - All Rights Reserved
 */
define([
	'intern!object',
	'intern/chai!assert',
	'dojo/node!os',
	'dojo/node!sinon',
	'dojo/node!../../../config/lib/Browsers',
	'dojo/node!../../../config/lib/Platform'
], function (registerSuite, assert, os, sinon, Browsers, Platform) {
	var BROWSER = {
		CHROME: 'chrome',
		SAFARI: 'safari',
		OPERA: 'opera',
		FF: 'firefox',
		IE: 'internet explorer'	
	};

	var saucelabsConfig = [
		{
			browserName: BROWSER.CHROME,
			platform: [
				Platform.LINUX
			]
		},
		{
			browserName: BROWSER.FF,
			platform: [
				Platform.LINUX
			]
		},
		{
			browserName: BROWSER.IE,
			version: '10',
			platform: [
				Platform.WINDOWS['7']
			]
		},
		{
			browserName: BROWSER.IE,
			version: '11',
			platform: [
				Platform.WINDOWS['7']
			]
		},
		{
			browserName: BROWSER.SAFARI,
			version: '7',
			platform: [
				Platform.OSX['10.9']
			]
		}
	];

	registerSuite({
		name: 'config/intern/Browsers',

		setup: function () {
		},

		beforeEach: function () {
		},

		afterEach: function() {
		},

		teardown: function () {
		},

		'getLocalMachineConfig#linux': function () {
			var config;
			var sandbox = sinon.sandbox.create();
			var expectedLinuxConfig = [ 
				{ browserName: BROWSER.CHROME },
				{ browserName: BROWSER.FF } 
			];

			sandbox.stub(os, "platform"); 
			os.platform.returns('linux');

			config = Browsers.getLocalMachineConfig();

			assert.deepEqual(config, expectedLinuxConfig,
				'Browsers returned wrong config for linux platform for a local machine'
			);

			sandbox.restore();
		},

		'getLocalMachineConfig#windows': function () {
			var config;
			var sandbox = sinon.sandbox.create();
			var expectedWinConfig = [ 
				{ browserName: BROWSER.CHROME },
				{ browserName: BROWSER.FF },
				{ browserName: BROWSER.IE }
			];

			sandbox.stub(os, "platform"); 
			os.platform.returns('windows');

			config = Browsers.getLocalMachineConfig();

			assert.deepEqual(config, expectedWinConfig,
				'Browsers returned wrong config for windows platform for a local machine'
			);

			sandbox.restore();
		},

		'getLocalMachineConfig#osx': function () {
			var config;
			var sandbox = sinon.sandbox.create();
			var expectedOSXConfig = [ 
				{ browserName: BROWSER.CHROME },
				{ browserName: BROWSER.FF },
				{ browserName: BROWSER.SAFARI }
			];

			sandbox.stub(os, "platform"); 
			os.platform.returns('darwin');

			config = Browsers.getLocalMachineConfig();

			assert.deepEqual(config, expectedOSXConfig,
				'Browsers returned wrong config for osx platform for a local machine'
			);

			sandbox.restore();
		},

		'getLocalMachineConfig#invalidOS': function () {
			var config;
			var sandbox = sinon.sandbox.create();
			var expectedConfig = [];

			sandbox.stub(os, "platform"); 
			os.platform.returns('someUnsupportedOS');

			config = Browsers.getLocalMachineConfig();

			assert.deepEqual(config, expectedConfig,
				'Browsers returned wrong config for unsupported platform for a local machine'
			);

			sandbox.restore();
		},

		'getSauceLabsConfig': function () {
			
			var config = Browsers.getSauceLabsConfig();

			assert.deepEqual(config, saucelabsConfig,
				'Browsers returned wrong config for saucelabs'
			);
		}
	});
});