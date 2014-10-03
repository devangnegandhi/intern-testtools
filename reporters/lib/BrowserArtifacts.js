/**
 * @copyright Copyright (C) 2014 Devang Negandhi - All Rights Reserved
 */
var path = require('path');
var mkdirp = require('mkdirp');
var FileWriter = require('./FileWriter');

var BrowserArtifacts = {

	/**
	 * Method to take the browser screenshot and save it on disk
	 * @param  {Object} remote The leadfoot remote object
	 * @param  {String} outDir The directory where to save the screenshot in
	 */
	takeScreenshot: function (remote, outDir) {
		remote.takeScreenshot().then(function (screenshot) {

			var fileName = 'browser_screenshot.png';
			FileWriter.writeScreenshot(screenshot, outDir, fileName);

		}, function (err) {

			var fileName = 'browser_screenshot_error.txt';
			var logStr = 'Reporter Error: Failed to capture screenshot\n' + 
						JSON.stringify(err, undefined, 2); 

			FileWriter.writeTextLogs(logStr, outDir, fileName);

		});
	},

	/**
	 * Method to take the dump of the page under test and save it on disk
	 * @param  {Object} remote The leadfoot remote object
	 * @param  {String} outDir The directory where to save the html snapshot in
	 */
	dumpPageSource: function (remote, outDir) {
		remote.getPageSource().then(function (htmlSnapshot) {

			var fileName = 'html_snapshot.html';
			FileWriter.writeTextLogs(htmlSnapshot, outDir, fileName);

		}, function (err) {

			var fileName = 'html_snapshot_error.txt';
			var logStr = 'Reporter Error: Failed to get page source\n' + 
						JSON.stringify(err, undefined, 2); 

			FileWriter.writeTextLogs(logStr, outDir, fileName);

		});
	},

	/**
	 * Method to record a provided type of browser log
	 * @param  {Object} remote   The leadfoot remote object
	 * @param  {String} outDir   The directory where the log should be saved to
	 * @param  {String} logType  The type of log being collected
	 */
	collectBrowserLog: function(remote, outDir, logType) {

		remote.getLogsFor(logType).then(function (logs) {
			if(logs.length) {
				var fileName = logType + '_logs.txt';
				FileWriter.writeBrowserLogs(logs, outDir, fileName);
			}

		}, function (err) {

			var fileName = logType + '_logs_error.txt';
			var logStr = 'Reporter Error: Failed to get brower logs: ' + logType + '\n' + 
						JSON.stringify(err, undefined, 2); 

			FileWriter.writeTextLogs(logStr, outDir, fileName);

		});
	},

	/**
	 * Method to take collect all available browser logs and save it on disk
	 * @param  {Object} remote The leadfoot remote object
	 * @param  {String} outDir The directory where to save the logs in
	 */
	collectAllBrowserLogs: function (remote, outDir) {
		var that = this;
		remote.getAvailableLogTypes().then(function (logTypes) {

			for(var i = 0; i < logTypes.length; i++) {
				that.collectBrowserLog(remote, outDir, logTypes[i]);
			}

		}, function (err) {
			var fileName = 'browser_logs_error.txt';
			var logStr = 'Reporter Error: Failed to get any browser logs\n' + 
						JSON.stringify(err, undefined, 2); 

			FileWriter.writeTextLogs(logStr, outDir, fileName);
		});
	},

	/**
	 * Method to collect all possible browser artifacts like screenshot, logs etc...
	 * @param  {Object} remote 	The leadfoot remote object
	 * @param  {String} logDir 	The directory where to save these logs in
	 * @param  {String} errorID The error ID associated with these logs
	 */
	collectAllArtifacts: function (remote, logDir, errorID) {
		var artifactsDir = path.join(logDir, errorID.toString());

		mkdirp.sync(artifactsDir);

		this.takeScreenshot(remote, artifactsDir);
		this.dumpPageSource(remote, artifactsDir);
		this.collectAllBrowserLogs(remote, artifactsDir);
	}
}

/**
 * Object to collect all sorts of browser logs
 * @type {Object}
 */
module.exports = BrowserArtifacts;