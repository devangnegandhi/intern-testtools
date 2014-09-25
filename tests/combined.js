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
		LcovReporter, chalk, Diagnostics, Logger) {

	var collector,
		reporters,
		sessions,
		logDir,
		logger,
		type;

	return {
		start: function () {
			sessions = {};
			reporters = [];
			collector = new Collector();
			logDir = './logs/';

			if (process.env.TRAVIS_JOB_NUMBER) {
				logDir += 'build_' + process.env.TRAVIS_JOB_NUMBER;
			} else {
				logDir += args.runId;
			}

			if (intern.mode === 'client') {
				type = Logger.Env.NODE;

				logger = new Logger(type, logDir);
				reporters = [ new JsonReporter() ];
			} else {
				type = Logger.Env.BROWSER;

				logger = new Logger(type, logDir);
				reporters = [ new TextReporter(), new LcovHtmlReporter(), new LcovReporter() ];
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
		}
	};
});
