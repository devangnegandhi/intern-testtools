var fs = require('fs');
var chalk = require('chalk');
var path = require('path');
var FileWriter = require('./FileWriter');

var Logger = function (envType, outDir, opts) {
	var logStr;
	var type;
	var sessionId;
	var logFile;

	this._outDir = outDir || FileWriter.createTempDir();
	this._verbose = opts && opts.verbose || false;
	this._indentStr = opts && opts.indentStr || '    ';
	this._outFile = 'test_logs.txt';

	logFile = path.resolve(this._outDir, this._outFile);
	if (!fs.existsSync(logFile)) {
		console.log(chalk.blue('Logs can be found at: ' + this._outDir) + '\n');
	}

	if (envType === Logger.Env.NODE) {
		this._log = '';
		this._tabs = '';
		type = 'Node.js';
	} else if (envType === Logger.Env.BROWSER) {
		this._log = {};
		this._tabs = {};
		sessionId = 'init';
		this._tabs[sessionId] = '';
		type = 'Browser';
	}

	logStr = 'Running tests on ' + type + '...';
	this.log(logStr, sessionId, true);
	this.indent(sessionId);
};

/**
 * Method to store logs into the logs object
 * @param  {String} 	logStr    	The string to log
 * @param  {String} 	[sessionId] The session Id to log
 * @param  {Boolean} 	[forceLog] 	Flag to indicate to log a string regardless of verbosity
 */
Logger.prototype.log = function (logStr, sessionId, forceLog) {
	var tabs = this.getIndentation(sessionId);
	var logsObj;
	var forceLogString;

	var noOfleadingSpaces = logStr.match(/^\s*/)[0].length;
	var leadingSpaces = '';

	for (var i = 0; i < noOfleadingSpaces; i++) {
		leadingSpaces += ' ';
	}

	forceLogString = logStr.replace(/(\n\s*)/g, '\n' + leadingSpaces + this._indentStr);
	logStr = logStr.replace(/(\n\s*)/g, '\n' + tabs + leadingSpaces + this._indentStr);
	if (this._verbose) {
		console.log(tabs + logStr);
	} else if (forceLog) {
		console.log(forceLogString);
	}

	if (!sessionId) {
		this._log += '\n' + tabs + chalk.stripColor(logStr);
	} else {
		if (!this._log[sessionId]) {
			this._log[sessionId] = '';
		}

		this._log[sessionId] += '\n' + tabs + chalk.stripColor(logStr);
	}
}

/**
 * The method to log the intern session start
 * @param  {Object} remoteObj The intern remote object
 */
Logger.prototype.logSessionStart = function (remoteObj) {
	var logStr = 'Testing on ' + remoteObj.environmentType;
	this._tabs[remoteObj.sessionId] = '';
	this.log(logStr, remoteObj.sessionId, true);
	this.indent(remoteObj.sessionId);
	/*
		Need an extra indent because we hae to un-indent in
		/suite/start evverytime. The reason we are not un-
		indenting in /suite/end is because, intern calls
		/test/pass and /test/fail after /suite/end for some
		reason.
	 */ 
	this.indent(remoteObj.sessionId);
}

/**
 * Method to log the end of the session
 * @param  {Object} remoteObj The intern remote object
 */
Logger.prototype.logSessionEnd = function (remoteObj) {
	/* 
		Intentionally empty for
		Nothing to log at the moment
	*/
}

/**
 * Log that the suite has started
 * @param  {Object} suiteObj The intern suite object
 */
Logger.prototype.logSuiteStart = function (suiteObj) {
	var suiteStartStr;

	if(suiteObj.name !== 'main') {
		if(suiteObj.sessionId) {
			this.unindent(suiteObj.sessionId);
		}

		logStr = 'RUNNING: ' + suiteObj.name;		
		this.log(logStr, suiteObj.sessionId);
		this.indent(suiteObj.sessionId);
	}
}

/**
 * Log that the suite has ended
 * @param  {Object} suiteObj The intern suite object
 */
Logger.prototype.logSuiteEnd = function (suiteObj) {
	if(suiteObj.name !== 'main' && !suiteObj.sessionId) {
		this.unindent(suiteObj.sessionId);
	}
}

/**
 * Method to log a passed intern test
 * @param  {Object} testObj The intern test object
 */
Logger.prototype.logPassedTest = function (testObj) {
	var logStr = chalk.green('PASS:') + ' ' + testObj.name + ' (' + testObj.timeElapsed + 'ms)';

	this.log(logStr, testObj.sessionId);
}

/**
 * Method to log a skipped intern test
 * @param  {Object} testObj The intern test object
 */
Logger.prototype.logSkippedTest = function (testObj) {
	var logStr = chalk.yellow('SKIP:') + ' ' + testObj.name + ' (' + testObj.timeElapsed + 'ms)';

	this.log(logStr, testObj.sessionId, true);
}

/**
 * Method to log a failed test
 * @param  {Object} testObj The intern test object
 * @param  {String} errorID The error ID to associate this failed test with
 * @param  {String} [url]     The URL that was used in case the failure was from a runner
 * @param  {Object} [remote]  The interns remote object in case the failure was from a runner 
 */
Logger.prototype.logFailedTest = function (testObj, errorID, url, remote) {
	this.logFailure(testObj, errorID, url, remote);
}

/**
 * Method to log the start of the digdub tunnel
 * @param  {String} tunnelId The DigDug tunnel ID
 */
Logger.prototype.logTunnelStart = function (tunnelId) {
	var logStr = 'Starting tunnel';
	this._tabs['tunnelLogs'] = '';
	this.log(logStr, 'tunnelLogs', true);
}

/**
 * Method to log any status change in the tunnel
 * @param  {String} tunnelId The DigDug tunnel ID
 * @param  {String} status   The updated tunnel status
 */
Logger.prototype.logTunnelStatus = function (tunnelId, status) {
	var logStr = 'Tunnel: ' + status;
	this.log(logStr, 'tunnelLogs', true);
}

Logger.prototype.logWarning = function (warningStr) {
	var logStr = chalk.yellow('WARNING:') + warningStr;

	console.log(logStr);

	if (typeof this._log === 'string') {
		this._log += '\n' + chalk.stripColor(logStr);
	} else {
		if (!this._log['warning']) {
			this._log['warning'] = '';
		}
		this._log['warning'] += '\n' + chalk.stripColor(logStr);
	}
}

/**
 * Method to log a failure (test or suite)
 * @param  {Object} obj 		The intern test/suite object
 * @param  {Number} errorID 	The error ID to associate this failed test with
 * @param  {String} [url]     	The URL that was used in case the failure was from a runner
 * @param  {Object} [remote]  	The interns remote object in case the failure was from a runner 
 */
Logger.prototype.logFailure = function (obj, errorID, url, remote) {
	try {
		var test,
			suite,
			sessionId,
			errorName,
			errorMessage,
			stackTrace,
			envType,
			completeErrorMessage,
			doubleIndent,
			FileWriter;

		sessionId = obj.sessionId;
		if (obj.error.relatedTest) {
			test = obj.error.relatedTest;
			suite = obj;
		} else {
			test = obj;
			suite = obj;
		}

		doubleIndent = this._indentStr + this._indentStr;
		errorName = suite.error.name;
		errorMessage = suite.error.message;
		stackTrace = suite.error.stack;
		completeErrorMessage = errorName + ': ' + errorMessage

		if (remote) {
			envType = remote.environmentType;
			artifactsDir = path.join(this._outDir, errorID.toString());
		} else {
			envType = 'Node.js';
			artifactsDir = 'None';
		}

		if (completeErrorMessage === stackTrace) {
			stackTrace = 'No Stacktrace';
		}

		this.log(
			chalk.red('FAIL: ' + test.name + ' (' + test.timeElapsed + 'ms)'), 
			sessionId, 
			true
		);

		this.log(
			this._indentStr + chalk.red.bold('Error: ') + completeErrorMessage, 
			sessionId, 
			true
		);

		if (test.parent) {
			this.log(
				doubleIndent + chalk.cyan('ParentSuiteName:') + ' ' + test.parent.parent.name, 
				sessionId, 
				true
			);

			this.log(
				doubleIndent + chalk.cyan('SuiteName:') + ' ' + test.parent.name, 
				sessionId, 
				true
			);

		} else {
			var splitTestId = test.id.split(' - ');
			this.log(
				doubleIndent + chalk.cyan('ParentSuiteName:') + ' ' + splitTestId[0], 
				sessionId, true
			);

			this.log(
				doubleIndent + chalk.cyan('SuiteName:') + ' ' + splitTestId[1], 
				sessionId, 
				true
			);
		}
		this.log(doubleIndent + chalk.cyan('TestName:') + ' ' + test.name, sessionId, true);
		this.log(doubleIndent + chalk.cyan('Platform:') + ' ' + envType, sessionId, true);
		this.log(doubleIndent + chalk.cyan('ErrorID:') + ' ' + errorID, sessionId, true);
		this.log(doubleIndent + chalk.cyan('URL:') + ' ' + unescape(url), sessionId, true);
		this.log(doubleIndent + chalk.cyan('Diagnostics:') + ' ' + artifactsDir, sessionId, true);

		this.log(doubleIndent + chalk.cyan('Stacktrace:'), sessionId, true);
		this.log(doubleIndent + chalk.cyan('==========='), sessionId, true);
		this.log(doubleIndent + chalk.red(stackTrace), sessionId, true);
		this.log(' ', sessionId, true);

	} catch (err) {
		this.log('REPORTER ERROR:', sessionId, true);
		this.log('=========================================', sessionId, true);
		this.log(JSON.stringify(err, undefined, 2), sessionId, true);
	}
}

Logger.prototype.logFatalError = function (error) {
	var stackTrace;
	var logStr = '';
	logStr += '\n' + chalk.red('FATAL ERROR (Mostly caused due to handling an async test incorrectly)');
	logStr += '\n' + this._indentStr + chalk.red(error.message);
	logStr += '\n' + this._indentStr + chalk.red('Stacktrace:');
	logStr += '\n' + this._indentStr + chalk.red('===========');

	if (!error.stack) {
		stackTrace = '\n' + this._indentStr + chalk.red('No Stacktrace');
	} else {
		stackTrace = error.stack.replace(/(\n\s*)/g, '\n' + this._indentStr + this._indentStr);
		stackTrace = '\n' + this._indentStr + chalk.red(stackTrace);
	}
	logStr += stackTrace;
	logStr += '\n';

	if (this._tabs['fatalErrors'] === undefined) {
		this._tabs['fatalErrors'] = '';
	}

	this.log(logStr, 'fatalErrors', true);

}

/**
 * Method to increase indent by 1 indentStr
 * @param  {String} [sessionId] The sessionId of the tests/suite
 */
Logger.prototype.indent = function (sessionId) {
	if (!sessionId) {
		this._tabs += this._indentStr;
	} else {
		if (typeof this._tabs[sessionId] === undefined) {
			this._tabs[sessionId] = '';
		}

		this._tabs[sessionId] += this._indentStr;
	}
}

/**
 * Method to decrease indent by 1 indentStr
 * @param  {String} [sessionId] The sessionId of the tests/suite
 */
Logger.prototype.unindent = function (sessionId) {
	var newTabLength;

	if (!sessionId) {
		newTabLength = this._tabs.length - this._indentStr.length;
		this._tabs = this._tabs.substring(0, newTabLength);
	} else {
		if (!this._tabs[sessionId]) {
			return;
		}

		newTabLength = this._tabs[sessionId].length - this._indentStr.length;
		this._tabs[sessionId] = this._tabs[sessionId].substring(0, newTabLength);
	}
}

/**
 * Method to get the current indentation level
 * @param  {String} [sessionId] The sessionId of the tests/suite
 * @return {String} The string to be used for indentation
 */
Logger.prototype.getIndentation = function (sessionId) {
	var ret;

	if (!sessionId) {
		ret = this._tabs;
	} else {
		if (sessionId !== 'init' && typeof this._tabs[sessionId] === undefined) {
			this.indent(sessionId);
		}

		ret = this._tabs[sessionId];
	}

	return ret;
}

Logger.prototype.dumpLogs = function () {
	var outStr = '';
	if(typeof this._log === 'string') {
		FileWriter.writeTextLogs(this._log.trim(), this._outDir, this._outFile, true);
	} else {
		outStr += this._log['init'];
		delete this._log['init'];

		outStr += this._log['tunnelLogs'];
		delete this._log['tunnelLogs'];

		for (var sessionId in this._log) {
		    if (this._log.hasOwnProperty(sessionId)) {
		    	if (sessionId !== 'fatalErrors') {
					outStr += this._log[sessionId];
					delete this._log[sessionId];
		    	}
		    }
		}

		if (this._log['fatalErrors']) {
			outStr += this._log['fatalErrors'];
			delete this._log['fatalErrors'];
		}

		//Write the init logs
		FileWriter.writeTextLogs(outStr.trim(), this._outDir, this._outFile, true);
	}
}

/**
 * Enum storing different types of enviornments available
 * @type {Object}
 */
Logger.Env = {
	NODE: 1,
	BROWSER: 2
};

Object.freeze(Logger.Env);

module.exports = Logger;