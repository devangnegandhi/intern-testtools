var os = require('os');

/**
 * Enum containing all the supported OS Platforms
 * The platform strings are saucelabs compatible
 * @type {Object}
 */
var PLATFORM = {
	LINUX: 'linux',
	WIN: 'windows',
	MAC: 'osx',
	UNSUPPORTED: 'unsupported'
};

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

/**
 * A map containing the versions of browsers we like to support
 * An empty array means the latest version only
 * @type {Object}
 */
var BroswerVersionMap = {};
BroswerVersionMap[BROWSER.CHROME] = [];
BroswerVersionMap[BROWSER.SAFARI] = [7, 8];
BroswerVersionMap[BROWSER.OPERA] = [12]
BroswerVersionMap[BROWSER.FF] = [];
BroswerVersionMap[BROWSER.IE] = [10, 11];

/**
 * A map containig the browsers we like to support on different platforms
 * @type {Object}
 */
var PlatformBroswerMap = {};
PlatformBroswerMap[PLATFORM.LINUX] = [BROWSER.CHROME, BROWSER.FF/*, BROWSER.OPERA*/];
PlatformBroswerMap[PLATFORM.WIN] = [BROWSER.CHROME, BROWSER.FF, BROWSER.IE/*, BROWSER.OPERA*/];
PlatformBroswerMap[PLATFORM.MAC] = [BROWSER.CHROME, BROWSER.FF, BROWSER.SAFARI];
PlatformBroswerMap[PLATFORM.UNSUPPORTED] = [];

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
		return PLATFORM.WIN;

	} else if(isMac()) {
		return PLATFORM.MAC;

	} else if(isUnix()) {
		return PLATFORM.LINUX;

	} else {
		return PLATFORM.UNSUPPORTED;
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
		var config = [];
		var browsers = {};
		var platformName;

		for (var platform in PLATFORM) {
		    if (platform !== 'UNSUPPORTED' && PLATFORM.hasOwnProperty(platform)) {
		    	platformName = PLATFORM[platform];
		        PlatformBroswerMap[platformName].forEach(function (browserName) {

		        	if (!browsers[browserName]) {
		        		browsers[browserName] = {};
		        		browsers[browserName].browserName = browserName;
		        		browsers[browserName].version = [];
		        		browsers[browserName].platform = [];

			        	BroswerVersionMap[browserName].forEach(function (browserVersion) {
			        		browsers[browserName].version.push(browserVersion);
			        	});
		        	}

	        		browsers[browserName].platform.push(platformName);
		        })
		    }
		}

		for (var browser in browsers) {
			config.push(browsers[browser]);
		}

		return config;
	}
}

module.exports = Browsers;

