
var Platform = {};

/**
 * Enum containing all the supported OS Platforms
 * The platform strings are saucelabs compatible
 * @type {Object}
 */
Platform.PLATFORM = {
	UNIX: 'linux',
	WIN: 'windows',
	OSX: 'osx',
	UNSUPPORTED: 'unsupported'
};

/**
 * The name of the linux platform
 * @type {String}
 */
Platform.LINUX = Platform.PLATFORM.UNIX;

/**
 * Enum containing different saucelab compatible Windows OS strings
 * @type {Object}
 */
Platform.WINDOWS = {
	'XP': Platform.PLATFORM.WIN + ' XP',
	'7': Platform.PLATFORM.WIN + ' 7',
	'8': Platform.PLATFORM.WIN + ' 8',
	'8.1': Platform.PLATFORM.WIN + ' 8.1'
};

/**
 * Enum containing different saucelab compatible Mac OS strings
 * @type {Object}
 */
Platform.OSX = {
	'10.6': Platform.PLATFORM.OSX + ' 10.6',
	'10.8': Platform.PLATFORM.OSX + ' 10.8',
	'10.9': Platform.PLATFORM.OSX + ' 10.9',
	'10.10': Platform.PLATFORM.OSX + ' 10.10'
};

module.exports = Platform;