	define([
	'intern',
	'intern/lib/util',
	'intern/lib/args',
	'dojo/node!fs',
	'dojo/node!path',
	'dojo/node!glob',
	'dojo/node!istanbul/lib/instrumenter',
	'dojo/node!istanbul/lib/collector',
	'dojo/node!istanbul/lib/report/json',
	'dojo/node!istanbul/lib/report/html',
	'dojo/node!istanbul/lib/report/text',
	'dojo/node!istanbul/lib/report/lcovonly',
	'dojo/node!../../../../reporters/lib/FileWriter',
	'dojo/node!../../../../reporters/lib/Logger',
	'dojo/node!../../../../reporters/lib/BrowserArtifacts',
	'dojo/node!istanbul/index'
], function (intern, util, args, fs, path, glob, Instrumenter, Collector, JsonReporter,
		LcovHtmlReporter, TextReporter, LcovReporter, FileWriter, Logger, BrowserArtifacts) {

	var collector,
		reporters,
		sessions,
		logDir,
		tmpDir,
		coverageDir,
		logger,
		type;

	return {
		start: function () {
			sessions = {};
			reporters = [];
			collector = new Collector();

			// If travis job number env var found, then set log dir name as build numbers
			if (process.env.TRAVIS_JOB_NUMBER) {
				logDir =  path.resolve('.', 'logs', 'build_' + process.env.TRAVIS_JOB_NUMBER);
				tmpDir = FileWriter.createTempDir(process.env.TRAVIS_JOB_NUMBER);

			// Else if logDir specified in command line, then use that dir
			} else if (args.logDir) {
				logDir =  path.resolve(args.logDir);
				tmpDir = FileWriter.createTempDir(args.logDir);

			// Else create log dir from command line arg 'runId'
			} else {
				logDir =  path.resolve('.', 'logs', args.runId.toString());
				tmpDir = FileWriter.createTempDir(args.runId);
			}

			coverageDir = path.resolve(logDir, 'coverage');

			if (intern.mode === 'client') {
				type = Logger.Env.NODE;

				logger = new Logger(type, logDir, {verbose: true});
				reporters = [ new JsonReporter({dir: tmpDir}) ];
			} else {
				type = Logger.Env.BROWSER;

				logger = new Logger(type, logDir, {verbose: true});
				reporters = [ 
					new TextReporter(), 
					new LcovHtmlReporter({dir: coverageDir}), 
					new LcovReporter({dir: coverageDir}),
					new JsonReporter({dir: tmpDir})
				];
			}	

			if (typeof __internCoverage !== 'undefined' && intern.config.instrumentUnloadedFiles) {
				this.instrumentUnloadedFiles();
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
		
		'/suite/error': function (suite) {
			var errorID = FileWriter.generateRandomNumber();
			if (sessions[suite.sessionId]) {
				var remote = sessions[suite.sessionId].remote;
				remote.getCurrentUrl().then(function (url) {
					logger.logFailedTest(suite, errorID, url, remote);
				});
			} else {
				logger.logFailedTest(suite, errorID);
			}
		},

		'/suite/end': function (suite) {
			if (suite.name === 'main') {
				if (!sessions[suite.sessionId]) {
					return;
				}

				sessions[suite.sessionId].suite = suite;
			} else {
				logger.logSuiteEnd(suite);
			}

			return null;
		},

		'/test/pass': function (test) {
			logger.logPassedTest(test);
		},

		'/test/skip': function (test) {
			logger.	logSkippedTest(test);
		},

		'/test/fail': function (test) {
			var errorID = FileWriter.generateRandomNumber();
			if (sessions[test.sessionId]) {
				var remote = sessions[test.sessionId].remote;
				remote.getCurrentUrl().then(function (url) {
					logger.logFailedTest(test, errorID, url, remote);
					BrowserArtifacts.collectAllArtifacts(remote, logDir, errorID);
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
			var coverageJSONFile = path.resolve(tmpDir, 'coverage-final.json');
			if (fs.existsSync(coverageJSONFile)) {
				collector.add(JSON.parse(fs.readFileSync(coverageJSONFile)));

				//Delete the file
				fs.unlinkSync(coverageJSONFile);
			}

			reporters.forEach(function (reporter) {
				reporter.writeReport(collector, true);
			});

			logger.dumpLogs();

		},

		instrumentUnloadedFiles: function() {
			var fileNames = glob.sync('**/*.js');
			var instrumenter = new Instrumenter();

			var fileSrc;
			var coverage;

			for( var i = 0; i< fileNames.length; i++) {
				if(!intern.config.excludeInstrumentation.test(fileNames[i])) {
					fileNames[i] = path.resolve(fileNames[i]);

					if(!__internCoverage[fileNames[i]]) {
						fileSrc = fs.readFileSync(fileNames[i], "utf8");
						instrumenter.instrumentSync(fileSrc.toString(), fileNames[i]);
						coverage = instrumenter.lastFileCoverage();

						// if (coverage) {
							__internCoverage[fileNames[i]] = coverage;
						// }
					}
				}
			}
		}
	}; 
});
