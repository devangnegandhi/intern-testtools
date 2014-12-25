var os = require('os');
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

// Browsers to run integration testing against. Note that version numbers must be strings if used with Sauce
// OnDemand. Options that will be permutated are browserName, version, platform, and platformVersion; any other
// capabilities options specified for an environment will be copied as-is
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

/**
 * A map containig the browsers we like to support on different platforms
 * @type {Object}
 */
var PlatformBroswerMap = {};
PlatformBroswerMap[Platform.PLATFORM.UNIX] = [BROWSER.CHROME, BROWSER.FF/*, BROWSER.OPERA*/];
PlatformBroswerMap[Platform.PLATFORM.WIN] = [BROWSER.CHROME, BROWSER.FF, BROWSER.IE/*, BROWSER.OPERA*/];
PlatformBroswerMap[Platform.PLATFORM.OSX] = [BROWSER.CHROME, BROWSER.FF, BROWSER.SAFARI];
PlatformBroswerMap[Platform.PLATFORM.UNSUPPORTED] = [];

/**
 * Method to check if the current platform is a Windows
 * @return {Boolean}
 */
function isWin() {
	return /^win/.test(os.platform());
}

/**
 * Method to check if the current platform is a Mac
 * @return {Boolean}
 */
function isMac() {
	return /^darwin/.test(os.platform());
}

/**
 * Method to check if the current platform is a Unix
 * @return {Boolean}
 */
function isUnix() {
	return /^linux/.test(os.platform());
}

/**
 * Method to get the current platform
 * @return {Number} The enum value from the PLATFORM enum.
 */
function getOS() {
	if(isWin()) {
		return Platform.PLATFORM.WIN;

	} else if(isMac()) {
		return Platform.PLATFORM.OSX;

	} else if(isUnix()) {
		return Platform.PLATFORM.UNIX;

	} else {
		return Platform.PLATFORM.UNSUPPORTED;
	}
}

var Browsers = {
	getLocalMachineConfig: function() {
		var config = [];
		var supportedBrowsers = PlatformBroswerMap[getOS()];

		supportedBrowsers.forEach(function (browser) {
			config.push({
				browserName: browser 
			});
		});

		return config;
	},

	getSauceLabsConfig: function() {
		return saucelabsConfig;
	}
}

module.exports = Browsers;

