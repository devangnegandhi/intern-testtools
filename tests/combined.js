define([
	'intern',
	'intern/lib/util',
	'intern/lib/args',
	'dojo/node!fs',
	'dojo/node!istanbul/lib/collector',
	'dojo/node!istanbul/lib/report/json',
	'dojo/node!istanbul/lib/report/html',
	'dojo/node!istanbul/lib/report/text',
	'dojo/node!istanbul/lib/report/lcovonly',
	'dojo/node!chalk',
	'dojo/node!../../../../reporters/lib/diagnostics',
	'dojo/node!../../../../reporters/lib/Logger',
	'dojo/node!istanbul/index',
], function (intern, util, args, fs, Collector, JsonReporter, LcovHtmlReporter, TextReporter, 
		LcovReporter, chalk, diagnostics, Logger) {

	var collector = new Collector();
	var reporters = [];
	var hasGrouping = 'group' in console && 'groupEnd' in console;
	var tabs = '    ';
	var color = chalk;
	var Diagnostics = diagnostics;
	var sessions = {};

	var logger;

	intern.debug = true;

	var logFile = 'myLogFile.txt';
	var logDir = './logs/';
	var logs;

	if (process.env.TRAVIS_JOB_NUMBER) {
		logDir += 'build_' + process.env.TRAVIS_JOB_NUMBER;
	} else {
		logDir += args.runId;
	}

	if (intern.mode === 'client') {
		reporters = [ new JsonReporter() ];
		logs = '';
	}
	else {
		reporters = [ new TextReporter(), new LcovHtmlReporter(), new LcovReporter() ];
		logs = {};
	}

	return {
		start: function () {
			var type;
			var obj = null;
			if (intern.mode === 'client') {
				type = 'Node.js';

				logger = new Logger(Logger.Env.NODE, logDir);
			} else {
				type = 'Browser';
				obj = {sessionId: 'start'}

				logger = new Logger(Logger.Env.BROWSER, logDir);
			}	
		},

		'/session/start': function (remote) {
			sessions[remote.sessionId] = { remote: remote };
			logger.logSessionStart(remote);
		},

		'/session/end': function (remote) {
			sessions[remote.sessionId] = { remote: remote };
			logger.logSessionEnd(remote);
		},

		'/suite/start': function (suite) {
			logger.logSuiteStart(suite);
		},
		
		'/suite/error': function (test) {
			var errorID = Diagnostics.generateRandomNumber();
			if (sessions[test.sessionId]) {
				var remote = sessions[test.sessionId].remote;
				remote.getCurrentUrl().then(function (url) {
					logger.logFailedTest(test, errorID, url, remote);
				});
			} else {
				var url = 'N/A';
				logger.logFailedTest(test, errorID, url);
			}
		},

		'/suite/end': function (suite) {
			if (suite.name === 'main') {
				if (!sessions[suite.sessionId]) {
					return;
				}

				sessions[suite.sessionId].suite = suite;
			} else if(suite.name !== 'main') {
				logger.logSuiteEnd(suite);
			}

			return null;
		},

		'/test/pass': function (test) {
			logger.logPassedTest(test);
		},

		'/test/skip': function (test) {
			logger.logSkippedTest(test);
		},

		'/test/fail': function (test) {
			var errorID = Diagnostics.generateRandomNumber();
			if (sessions[test.sessionId]) {
				var remote = sessions[test.sessionId].remote;
				remote.getCurrentUrl().then(function (url) {
					logger.logFailedTest(test, errorID, url, remote);
				});
			} else {
				var url = 'N/A';
				logger.logFailedTest(test, errorID, url);
			}
		},

		'/tunnel/start': function (tunnel) {
			logger.logTunnelStart(tunnel.tunnelId);
		},

		'/tunnel/status': function (tunnel, status) {
			logger.logTunnelStatus(tunnel.tunnelId, status);
		},

		'/deprecated': function (name, replacement, extras) {
			logger.logWarning(name + ' is deprecated. Please use ' + replacement + ' instead');
		},

		'/error': function (error) {
			logger.logFatalError(error);
		},

		'/coverage': function (sessionId, coverage) {
			collector.add(coverage);
		},

		stop: function () {
			if (intern.mode === 'runner' && fs.existsSync('coverage-final.json')) {
				collector.add(JSON.parse(fs.readFileSync('coverage-final.json')));
			}

			reporters.forEach(function (reporter) {
				reporter.writeReport(collector, true);
			});

			logger.dumpLogs();
			//diagnostics.writeTextLogs(chalk.stripColor(getLogs()), logDir, logFile, true);
		}
	};
});
