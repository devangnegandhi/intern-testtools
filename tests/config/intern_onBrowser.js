/**
 * @copyright Copyright (C) 2014 Devang Negandhi - All Rights Reserved
 */
define([
	'intern!object',
	'intern/chai!assert'
], function (registerSuite, assert) {

	registerSuite({
		name: 'config/intern/on_Browser',

		setup: function () {
		},

		teardown: function () {
		},

		'checkDefaultProperties': function () {
			var dfd = this.async();
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
			}));
		},

		'checkDefaultProperties2': function () {
			this.skip();
			var dfd = this.async();
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
			}));
		},

		'checkDefaultProperties3': function () {
			var dfd = this.async();
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
			}));
		},

		'checkDefaultProperties4': function () {
			var dfd = this.async();
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
			}));
		}
	});
});