/**
 * @copyright Copyright (C) 2014 Devang Negandhi - All Rights Reserved
 */
define([
	'intern!object',
	'intern/chai!assert'
], function (registerSuite, assert) {

	var oldConsoleError;

	registerSuite({
		name: 'config/intern',

		setup: function () {
		},

		teardown: function () {
		},

		'checkDefaultProperties': function () {
			var dfd = this.async();

			var loggedStr = '';
			var oldConsoleError = console.warn;
			console.warn = function (str) {
				loggedStr += str;
			}

			require(['config/intern'], dfd.callback(function(config) {
				var expectedProperties = [
					'proxyPort',
					'proxyUrl',
					'capabilities',
					'tunnel',
					'tunnelOptions',
					'environments',
					'maxConcurrency',
					'useLoader',
					'loader',
					'excludeInstrumentation',
				];

				assert.equal(
					loggedStr,
					'No SauceLabs credentials or Selenium Webdriver port provided.',
					'No warning was thrown when no saucelabs or selenium server was provided'
				);

				assert.equal(
					Object.keys(config).length, 
					expectedProperties.length, 
					'The number of propertis in the intern config is wrong'
				);

				for (var i = 0; i < expectedProperties.length; i++) {
					assert.ok(
						config.hasOwnProperty(expectedProperties[i]), 
						'intern config does not define the property: ' + expectedProperties[i]
					);
				}

				assert.equal(config.proxyPort, 9000, 'Please check the proxyPort property');
				assert.equal(
					config.proxyUrl, 
					'http://localhost:9000/', 
					'Please check the proxyUrl property'
				);

				assert.deepEqual(
					config.capabilities, 
					{
						takesScreenshot: true,
						cssSelectorsEnabled: true,
						'idle-timeout': 20
					}, 
					'Please check the capabilities property'
				);

				assert.equal(
					config.tunnel, 
					'NullTunnel', 
					'Please check the tunnelType property'
				);

				assert.deepEqual(
					config.tunnelOptions, 
					{
						username: null,
						accessKey: null,
						hostname: 'localhost',
						port: null
					}, 
					'Please check the tunnelOptions property'
				);

				assert.equal(config.maxConcurrency, 2, 'Please check the maxConcurrency property');
				
				assert.deepEqual(
					config.useLoader,  
					{
						'host-node': 'requirejs',
						'host-browser': '../../node_modules/requirejs/require.js'
					}, 
					'Please check the useLoader property'
				);

				require.undef('config/intern');

				loggedStr = '';
				console.warn = oldConsoleError;
			}));
		},

		'setPort': function () {
			var dfd = this.async();
			process.env.SELENIUM_LAUNCHER_PORT = 1234;
			require(['config/intern'], dfd.callback(function(config) {

				assert.deepEqual(
					config.tunnelOptions, 
					{
						username: null,
						accessKey: null,
						hostname: 'localhost',
						port: process.env.SELENIUM_LAUNCHER_PORT
					}, 
					'Wrong tunnelOptions set when using process.env.SELENIUM_LAUNCHER_PORT'
				);

				assert.equal(
					config.tunnel, 
					'NullTunnel', 
					'Wrong tunnelType set when using process.env.SELENIUM_LAUNCHER_PORT'
				);

				require.undef('config/intern');
				delete process.env.SELENIUM_LAUNCHER_PORT;
			}));
		},

		'setPartialSaucelabsSetting': function () {
			var dfd = this.async();

			var loggedStr = '';
			var oldConsoleError = console.warn;
			console.warn = function (str) {
				loggedStr += str;
			}

			process.env.SAUCE_USERNAME = 'someuser';
			require(['config/intern'], dfd.callback(function(config) {

				assert.equal(
					loggedStr,
					'No SauceLabs credentials or Selenium Webdriver port provided.',
					'No warning was thrown when no saucelabs or selenium server was provided'
				);

				assert.deepEqual(
					config.tunnelOptions, 
					{
						username: null,
						accessKey: null,
						hostname: 'localhost',
						port: null
					}, 
					'Wrong tunnelOptions set when using partial saucelabs settings'
				);

				assert.equal(
					config.tunnel, 
					'NullTunnel', 
					'Wrong tunnelType set when using partial saucelabs settings'
				);

				require.undef('config/intern');
				delete process.env.SAUCE_USERNAME;
			}));
		},

		'setSaucelabsSetting': function () {
			var dfd = this.async();

			process.env.SAUCE_USERNAME = 'someuser';
			process.env.SAUCE_ACCESS_KEY = 'someAccessKey';
			require(['config/intern'], dfd.callback(function(config) {

				assert.deepEqual(
					config.tunnelOptions, 
					{
						username: process.env.SAUCE_USERNAME,
						accessKey: process.env.SAUCE_ACCESS_KEY,
						hostname: 'localhost',
						port: null
					}, 
					'Wrong tunnelOptions set when using saucelabs settings'
				);

				assert.equal(
					config.tunnel, 
					'SauceLabsTunnel', 
					'Wrong tunnelType set when using partial saucelabs settings'
				);

				require.undef('config/intern');

				loggedStr = '';
				console.warn = oldConsoleError;

				delete process.env.SAUCE_USERNAME;
				delete process.env.SAUCE_ACCESS_KEY;
			}));
		},

		// 'setProcessUndefined': function () {
		// 	var dfd = new Deferred;
		// 	var oldProcess = process;
		// 	process = undefined;
		// 	require(['config/intern'], function(config) {

		// 		assert.equal(
		// 			config.tunnel, 
		// 			'NullTunnel', 
		// 			'Please check the tunnelType property'
		// 		);

		// 		assert.deepEqual(
		// 			config.tunnelOptions, 
		// 			{
		// 				username: null,
		// 				accessKey: null,
		// 				hostname: 'localhost',
		// 				port: null
		// 			}, 
		// 			'Please check the tunnelOptions property'
		// 		);

		// 		require.undef('config/intern');
		// 		dfd.resolve();
		// 	});
				
		// 	process = oldProcess;

		// 	return dfd;
		// }
	});
});