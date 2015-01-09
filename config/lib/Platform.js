/**
 * @copyright Copyright (C) 2014 Devang Negandhi - All Rights Reserved
 */

var os = require('os');

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


/**
 * Method to check if the current platform is a Windows
 * @return {Boolean}
 */
Platform.isWin = function() {
	return /^win/.test(os.platform());
}

/**
 * Method to check if the current platform is a Mac
 * @return {Boolean}
 */
Platform.isMac = function() {
	return /^darwin/.test(os.platform());
}

/**
 * Method to check if the current platform is a Unix
 * @return {Boolean}
 */
Platform.isUnix = function() {
	return /^linux/.test(os.platform());
}

/**
 * Method to get the current platform
 * @return {Number} The enum value from the PLATFORM enum.
 */
Platform.getOS = function() {
	if(Platform.isWin()) {
		return Platform.PLATFORM.WIN;

	} else if(Platform.isMac()) {
		return Platform.PLATFORM.OSX;

	} else if(Platform.isUnix()) {
		return Platform.PLATFORM.UNIX;

	} else {
		return Platform.PLATFORM.UNSUPPORTED;
	}
}

module.exports = Platform;