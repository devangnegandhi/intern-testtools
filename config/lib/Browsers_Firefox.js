/**
 * @copyright Copyright (C) 2014 Devang Negandhi - All Rights Reserved
 */

var os = require('os');
var path = require('path');
var mkdirp = require('mkdirp');
var deasync = require('deasync');
var mozDownload = deasync(require('mozilla-download'));
var Browsers = require('./Browsers');

var Firefox = {};

/**
 * Method to download a specified version of firefox from the web
 * @param  {String|Number} [version] The version of Firefox to download
 * @return {String}	The location where the firefox was downloaded to
 */
Firefox.download = function(version) {
	var version = process.env.BROWSER_FIREFOX ||
					version ||
					Browsers.getBrowserVersion(Browsers.BROWSERS.FF);

	var mozOptions = {
		//Mozilla product to download
		product: Browsers.BROWSERS.FF,

		//FF Version to download
		branch: version,
	}

	var browserDir = path.resolve(
					'browsers', 
					mozOptions.product
				);

	mkdirp.sync(browserDir);

	var downloadDir = path.resolve(
						browserDir, 
						mozOptions.branch
					);

	mozDownload(downloadDir, mozOptions);

	return downloadDir;
};

module.exports = Firefox;
