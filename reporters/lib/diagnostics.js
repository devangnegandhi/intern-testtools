/**
 * @copyright Copyright (C) 2014 Devang Negandhi - All Rights Reserved
 */
var fs = require('fs');
var os = require('os');
var path = require('path');
var mkdirp = require('mkdirp');

var diagnostics = {

	/**
	 * Method to save an base64 data onto the disk.
	 * @this diagnostics
	 * @param  {String} data The image data in base64 format
	 * @param  {String} dir Directory where to store it in. (Default: 'OS temp directory')
	 * @param  {String} name Name of the screenshot. (Default: 'screenshot_<random_number>.png')
	 * @return {String} The complete path of the image file
	 */
	writeScreenshot: function (data, dir, name) {
		name = name || this.generateRandomNumber() + '_screenshot' + '.png';
		dir = dir || this.createTempDir();

		var imagePath = path.join(dir, name);
		fs.writeFileSync(imagePath, data, 'base64');

		return imagePath;
	},

	/**
	 * Method to save a browser log onto the disk
	 * @this diagnostics
	 * @param  {Array.<Object<Number, String, String>>} logs An array of logs object
	 * @param  {String} dir  Directory where to store it in. (Default: 'OS temp directory')		
	 * @param  {String} name Name of the text files. (Default: 'browser_logs_<random_number>.png')
	 * @return {String} The complete path of the image file
	 */
	writeBrowserLogs: function (logs, dir, name) {
		name = name || this.generateRandomNumber() + '_browser_logs' + '.txt';
		dir = dir || this.createTempDir();

		var prettyPrintLogs = '';

		if(logs) {
			for (var i = 0; i < logs.length; i++) {
				prettyPrintLogs += '[' + logs[i].level + '] ' + logs[i].message.replace(/(\r\n|\n|\r)/gm, '') + '\n'; 
			}
		}

		var logsFilePath = path.join(dir, name);

		fs.writeFileSync(logsFilePath, prettyPrintLogs, 'utf-8');

		return logsFilePath;
	},

	/**
	 * Method to save a browser log onto the disk
	 * @this diagnostics
	 * @param  {Object} logs An error logs object
	 * @param  {String} dir  Directory where to store it in. (Default: 'OS temp directory')		
	 * @param  {String} name Name of the text files. (Default: 'error_logs_<random_number>.png')
	 * @return {String} The complete path of the error logs file
	 */
	writeErrorLogs: function (logs, dir, name) {
		name = name || this.generateRandomNumber() + '_error_logs' + '.txt';
		dir = dir || this.createTempDir();

		var stringifiedLogs = JSON.stringify(logs, undefined, 2);

		var logsFilePath = path.join(dir, name);
		fs.writeFileSync(logsFilePath, stringifiedLogs, 'utf-8');

		return logsFilePath;
	},

	/**
	 * Method to save a browser log onto the disk
	 * @this diagnostics
	 * @param  {String} logs A text string containing logs
	 * @param  {String} dir  Directory where to store it in. (Default: 'OS temp directory')		
	 * @param  {String} name Name of the text files. (Default: 'error_logs_<random_number>.png')
	 * @return {String} The complete path of the error logs file
	 */
	writeTextLogs: function (logs, dir, name) {
		name = name || this.generateRandomNumber() + '_logs' + '.txt';
		dir = dir || this.createTempDir();

		var logsFilePath = path.join(dir, name);

		fs.writeFileSync(logsFilePath, logs, 'utf-8');

		return logsFilePath;
	},

	/**
	 * Method to generate a random number.
	 * @this diagnostics
	 * @return {Number} A number between 0 and 10000000
	 */
	generateRandomNumber: function () {
		return Math.floor(Math.random() * 10000000);
	},

	/**
	 * This method create a new temp directory
	 * @this diagnostics
	 * @param  {String=} sessionID The ID of the session
	 * @return {String} The full path of the created directory
	 */
	createTempDir: function (sessionID) {
		var randomNumber = sessionID || this.generateRandomNumber().toString();
		var osTempDir = os.tmpdir();
		var tempDir = path.join(osTempDir, 'intern', 'diagnostics', randomNumber);

		if(!fs.existsSync(tempDir)) {
			mkdirp.sync(tempDir);
		}

		return tempDir;
	}
};

/**
 * Object to write diagnostics onto the disk
 * @type {Object}
 */
module.exports = diagnostics;
