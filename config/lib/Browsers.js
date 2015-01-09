/**
 * @copyright Copyright (C) 2014 Devang Negandhi - All Rights Reserved
 */

var Platform = require('./Platform');

/**
 * Enum containing all the browsers we like to support 
 * The browser strings are saucelabs compatible
 * @type {Object}
 */
var BROWSER = {
	CHROME: 'chrome',
	SAFARI: 'safari',
	OPERA: 'opera',
	FF: 'firefox',
	IE: 'internet explorer'	
};

var VERSION = {};
VERSION[BROWSER.CHROME] = '39';
VERSION[BROWSER.FF] = '33.1.1';

// Browsers to run integration testing against. Note that version numbers must be strings if used with Sauce
// OnDemand. Options that will be permutated are browserName, version, platform, and platformVersion; any other
// capabilities options specified for an environment will be copied as-is
var saucelabsConfig = [
	{
		browserName: BROWSER.CHROME,
		version: VERSION[BROWSER.CHROME],
		platform: [
			Platform.LINUX
		]
	},
	{
		browserName: BROWSER.FF,
		version: VERSION[BROWSER.FF],
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

/**
 * A map containig the browsers we like to support on different platforms
 * @type {Object}
 */
var PlatformBroswerMap = {};
PlatformBroswerMap[Platform.PLATFORM.UNIX] = [BROWSER.CHROME, BROWSER.FF/*, BROWSER.OPERA*/];
PlatformBroswerMap[Platform.PLATFORM.WIN] = [BROWSER.CHROME, BROWSER.FF, BROWSER.IE/*, BROWSER.OPERA*/];
PlatformBroswerMap[Platform.PLATFORM.OSX] = [BROWSER.CHROME, BROWSER.FF, BROWSER.SAFARI];
PlatformBroswerMap[Platform.PLATFORM.UNSUPPORTED] = [];


var Browsers = {
	getLocalMachineConfig: function() {
		var config = [];
		var supportedBrowsers = PlatformBroswerMap[Platform.getOS()];

		supportedBrowsers.forEach(function (browser) {
			var browserVersion = VERSION[browser];

			config.push({
				browserName: browser,
				version: browserVersion 
			});
		});

		return config;
	},

	getSauceLabsConfig: function() {
		return saucelabsConfig;
	},

	getBrowserVersion: function(browser) {
		return VERSION[browser];
	},

	BROWSERS: BROWSER
}

module.exports = Browsers;

