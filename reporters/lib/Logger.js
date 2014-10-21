var fs = require('fs');
var chalk = require('chalk');
var path = require('path');
var FileWriter = require('./FileWriter');

/**
 * Logger constructor
 * @class
 * @param {number}  envType                 The Env type from Logger.Env enum
 * @param {string}  [outDir=tempDir]        The outout directory for the logs
 * @param {object}  [opts]                  Options for the logger
 * @param {boolean} [opts.verbose=false]    Make the console output verbose
 * @param {string}  [opts.indentStr='    '] The string to use for indentation of logs
 * 
 */
var Logger = function (envType, outDir, opts) {
    var logStr;
    var type;
    var sessionId;
    var logFile;

    // Check if the second argument is outDir or opts
    if (outDir && typeof outDir === 'object') {
        opts = outDir;
        outDir = undefined;
    }

    // Assinging default variables
    this._outDir = outDir || FileWriter.createTempDir();
    this._verbose = opts && opts.verbose || false;
    this._indentStr = opts && opts.indentStr || '    ';
    this._outFile = 'test_logs.txt';

    // If log file does not exist from another reporter before,
    // log its location on the console.
    logFile = path.resolve(this._outDir, this._outFile);
    if (!fs.existsSync(logFile)) {
        console.log(chalk.blue('Logs can be found at: ' + this._outDir) + '\n');
    }

    // If Env is Node, then only one instance of _log and _tab is maintined
    if (envType === Logger.Env.NODE) {

        this._log = '';
        this._tabs = '';
        type = 'Node.js';

    // If Env is Browser,then an object of _log and _tab is maintained 
    // containing different sessions
    } else if (envType === Logger.Env.BROWSER) {

        this._log = {};
        this._tabs = {};
        sessionId = 'init';
        this._tabs[sessionId] = '';
        type = 'Browser';

    // Else throw an error
    } else {
        throw(new Error('Unknown/Unsupported Enviornment provided for the Logger'));
    }

    // Log the Env we are running in
    logStr = 'Running tests on ' + type + '...';
    this.log(logStr, sessionId, true);
    this._indent(sessionId);
};

/**
 * Enum storing different types of enviornments available
 * @enum {number}
 * @readOnly
 * @public
 */
Logger.Env = {
    NODE: 1,
    BROWSER: 2
};

Object.freeze(Logger.Env);

/**
 * Method to store logs into the logs object
 * @param  {string}     logStr      The string to log
 * @param  {string}     [sessionId] The session Id to log
 * @param  {boolean}    [forceLog]  Flag to indicate to log a string regardless of verbosity
 */
Logger.prototype.log = function (logStr, sessionId, forceLog) {
    var tabs = this._getIndentation(sessionId) || '';
    var logsObj;
    var forceLogString;

    var noOfleadingSpaces = logStr.match(/^\s*/)[0].length;
    var leadingSpaces = '';

    // Check if the second argument is sessionId or forceLog
    if (sessionId && typeof sessionId === 'boolean') {
        forceLog = sessionId;
        sessionId = undefined;
    }

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
 * @param  {Object} remote  The intern remote object
 */
Logger.prototype.logSessionStart = function (remote) {
    var logStr = 'Testing on ' + remote.environmentType;
    this._tabs[remote.sessionId] = '';

    //Log and indent
    this.log(logStr, remote.sessionId, true);
    this._indent(remote.sessionId);
    /*
        Need an extra indent because we have to un-indent in
        /suite/start everytime. The reason we are not un-
        indenting in /suite/end is because, intern calls
        /test/pass and /test/fail after /suite/end for some
        reason.
     */ 
    this._indent(remote.sessionId);
}

/**
 * Method to log the end of the session
 * @param  {Object} remote  The intern remote object
 */
Logger.prototype.logSessionEnd = function (remote) {
    /* 
        Intentionally empty for
        Nothing to log at the moment
    */
}

/**
 * Log that the suite has started
 * @param  {Object} suite   The intern suite object
 */
Logger.prototype.logSuiteStart = function (suite) {
    var logStr;

    // Skip logging is suite name is 'main'
    if(suite.name !== 'main') {
        // Unindent if no session ID found
        // This is because no session ID means sessionStart was not called
        if(suite.sessionId) {
            this._unindent(suite.sessionId);
        }

        logStr = 'RUNNING: ' + suite.name;       
        this.log(logStr, suite.sessionId);
        this._indent(suite.sessionId);
    }
}

/**
 * Log that the suite has ended
 * @param  {Object} suite   The intern suite object
 */
Logger.prototype.logSuiteEnd = function (suite) {
    /*
        Unindent if the suite is not 'main' and without a session ID
        The reason we are not un-indenting in /suite/end for session 
        start is because, intern calls /test/pass and /test/fail after 
        /suite/end for some reason.
     */ 
    if(suite.name !== 'main' && !suite.sessionId) {
        this._unindent(suite.sessionId);
    }
}

/**
 * Method to log a passed intern test
 * @param  {Object} test    The intern test object
 */
Logger.prototype.logPassedTest = function (test) {
    var logStr = chalk.green('PASS:') + ' ' + test.name + ' (' + test.timeElapsed + 'ms)';

    this.log(logStr, test.sessionId);
}

/**
 * Method to log a skipped intern test
 * @param  {Object} test    The intern test object
 */
Logger.prototype.logSkippedTest = function (test) {
    var logStr = chalk.yellow('SKIP:') + ' ' + test.name + ' (' + test.timeElapsed + 'ms)';

    this.log(logStr, test.sessionId, true);
}

/**
 * Method to log a warning
 * @param  {string} warn    A warning string
 */
Logger.prototype.logWarning = function (warn) {
    var sessionId;
    var logStr = chalk.yellow('WARN:') + ' ' + warn;


    // Assign a sessionId if needed
    if (typeof this._log === "object") {
        sessionId = 'warnings';
    }

    this.log(logStr, sessionId, true);
}

/**
 * Method to log a failed test
 * @param  {Object} test        The intern test object
 * @param  {String} errorID     The error ID to associate this failed test with
 * @param  {String} [url]       The URL that was used in case the failure was from a runner
 * @param  {Object} [remote]    The interns remote object in case the failure was from a runner 
 */
Logger.prototype.logFailedTest = function (test, errorID, url, remote) {
    this._logFailure(test, errorID, url, remote);
}

/**
 * Method to log any fatal errors
 * @param  {Object} error The error object
 */
Logger.prototype.logFatalError = function (error) {
    var stackTrace;
    var sessionId;
    var logStr = '';

    logStr += chalk.red('FATAL ERROR');
    logStr += '\n' + this._indentStr + chalk.red(error.message);
    logStr += '\n' + this._indentStr + chalk.red('Stacktrace:');
    logStr += '\n' + this._indentStr + chalk.red('===========');

    // Check if error stack is available
    if (!error.stack) {
        stackTrace = '\n' + this._indentStr + chalk.red('No Stacktrace');
    } else {
        stackTrace = error.stack.replace(/(\n\s*)/g, '\n' + this._indentStr + this._indentStr);
        stackTrace = '\n' + this._indentStr + chalk.red(stackTrace);
    }
    logStr += stackTrace;
    logStr += '\n';

    // Create appropriate tab object if needed
    if (typeof this._tabs === "object" && this._tabs['fatalErrors'] === undefined) {
        this._tabs['fatalErrors'] = '';
    }

    // Assign a sessionId if needed
    if (typeof this._log === "object") {
        sessionId = 'fatalErrors';
    }

    this.log(logStr, sessionId, true);

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

/**
 * Method to log a failure (test or suite)
 * @param  {Object} obj         The intern test/suite object
 * @param  {Number} errorID     The error ID to associate this failed test with
 * @param  {String} [url]       The URL that was used in case the failure was from a runner
 * @param  {Object} [remote]    The interns remote object in case the failure was from a runner 
 */
Logger.prototype._logFailure = function (obj, errorID, url, remote) {
    try {
        var test,
            suite,
            sessionId,
            errorName,
            errorMessage,
            stackTrace,
            envType,
            completeErrorMessage,
            doubleIndent;

        sessionId = obj.sessionId;
        if (obj.error.relatedTest) {
            test = obj.error.relatedTest;
            suite = obj;
        } else {
            test = obj;
            suite = obj;
        }

        url = url || 'N/A';
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
        err.message = 'Reporter Error: ' + err.message;
        this.logFatalError(err);
    }
}

/**
 * Method to increase indent by 1 indentStr
 * @param  {String} [sessionId] The sessionId of the tests/suite
 */
Logger.prototype._indent = function (sessionId) {
    if (!sessionId) {
        this._tabs += this._indentStr;
    } else {
        if (typeof this._tabs[sessionId] === "undefined") {
            this._tabs[sessionId] = '';
        }

        this._tabs[sessionId] += this._indentStr;
    }
}

/**
 * Method to decrease indent by 1 indentStr
 * @param  {String} [sessionId] The sessionId of the tests/suite
 */
Logger.prototype._unindent = function (sessionId) {
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
Logger.prototype._getIndentation = function (sessionId) {
    var ret;

    if (!sessionId) {
        ret = this._tabs;
    } else {
        if (sessionId !== 'init' && typeof this._tabs[sessionId] === "undefined") {
            this._indent(sessionId);
        }

        ret = this._tabs[sessionId];
    }

    return ret;
}

/**
 * Dump all the logs collected so far into the log file
 */
Logger.prototype.dumpLogs = function () {
    var outStr = '';

    // If log is of type string then just write it as is
    if(typeof this._log === 'string') {
        outStr = this._log;

    // Else serialize the log object and then write it
    } else {
        if (this._log['init']) {
            outStr += this._log['init'];
        }

        if (this._log['tunnelLogs']) {
            outStr += this._log['tunnelLogs'];
        }

        for (var sessionId in this._log) {
            if (this._log.hasOwnProperty(sessionId)) {
                    if (sessionId !== 'init'
                        && sessionId !== 'tunnelLogs'
                        && sessionId !== 'warnings'
                        && sessionId !== 'fatalErrors') {

                    outStr += this._log[sessionId];
                }
            }
        }

        if (this._log['warnings']) {
            outStr += this._log['warnings'];
        }

        if (this._log['fatalErrors']) {
            outStr += this._log['fatalErrors'];
        }
    }

    //Write the logs
    FileWriter.writeTextLogs(outStr.trim(), this._outDir, this._outFile, true);
}

/**
 * Object to collect and write logs
 * @type {Object}
 */
module.exports = Logger;