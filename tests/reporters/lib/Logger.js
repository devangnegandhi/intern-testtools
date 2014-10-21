/**
 * @copyright Copyright (C) 2014 Devang Negandhi - All Rights Reserved
 */
define([
    'intern!object',
    'intern/chai!assert',
    'dojo/Deferred',
    'dojo/node!fs',
    'dojo/node!path',
    'dojo/node!chalk',
    'dojo/node!sinon',
    'dojo/node!../../../reporters/lib/FileWriter',
    'dojo/node!../../../reporters/lib/Logger'
], function (registerSuite, assert, Deferred, fs, path, chalk, sinon, FileWriter, Logger) {
    var sandbox,
        mockTest,
        mockTestWithNoSession,
        mockSuite,
        mockSuiteWithNoSession,
        mockRemote;

    mockTest = {
        sessionId: '0',
        error: {
            name: 'mocked error',
            message: 'mocking out the error',
            stack: 'one-on-top-of-the-other',
        },
        parent: {
            name: 'parent',
            parent: {
                name: 'grandparent'
            }
        },
        name: 'child',
        id: 'grandparent-parent-child',
        timeElapsed: '1000',
        mockErrId: 1234
    };

    mockTestWithNoSession = {
        error: {
            name: 'mocked error',
            message: 'mocking out the error',
            stack: 'mocked error: mocking out the error',
        },
        name: 'child',
        id: 'grandparent-parent-child',
        timeElapsed: '1000',
        mockErrId: 1234
    };

    mockSuite = {
        sessionId: '0',
        name: 'suite',
        numTests: 55,
        numFailedTests: 10,
        error: {
            name: 'mocked error',
            message: 'mocking out the error',
            stack: 'one-on-top-of-the-other',
        }
    };

    mockSuiteWithRelatedTest = {
        sessionId: '0',
        name: 'suite',
        numTests: 55,
        numFailedTests: 10,
        error: {
            name: 'mocked error',
            message: 'mocking out the error',
            stack: 'one-on-top-of-the-other',
            relatedTest: mockTest
        }
    };

    mockSuiteWithNoSession = {
        name: 'suiteWithNoSession',
        numTests: 50,
        numFailedTests: 15,
        error: {
            name: 'mocked error',
            message: 'mocking out the error',
            stack: 'one-on-top-of-the-other',
        }
    };

    mockRemote = {
        sessionId: '0',
        environmentType: {
            browserName: 'mockBrowser',
            toString: function() {
                return 'mockEnv';
            }
        }
    };

    registerSuite({
        name: 'reporters/lib/Logger',

        setup: function () {
            sandbox = sinon.sandbox.create();
            //Mocking FileWriter module
            sandbox.stub(FileWriter);

            sandbox.stub(fs, 'existsSync');
            sandbox.stub(path, 'resolve');
            sandbox.stub(path, 'join');
            fs.existsSync.returns(true);
            path.join.returns('someJoinedPath');
            path.resolve.returns('someResolvedPath');
        },

        teardown: function () {
            sandbox.restore();
        },

        'checkEnvEnum': function () {
            assert.isTrue(
                Object.isFrozen(Logger.Env),
                'Logger.Env object is not frozen'
            );

            assert.ok(
                Logger.Env.NODE, 
                'Node Enum wwas not found in Logger.Env'
            );

            assert.ok(
                Logger.Env.BROWSER, 
                'Node Enum wwas not found in Logger.Env'
            );
        },

        'constructorAssignments#withoutOutDirAndOpts': function () {
            var defaultOutDir,
                logger,
                consoleStub;

            defaultOutDir = 'somePath';

            FileWriter.createTempDir.returns(defaultOutDir);

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.NODE);
            consoleStub.restore();

            assert.equal(
                logger._outDir,
                defaultOutDir,
                'Logger failed to assign correct default value to _outDir'
            );

            assert.equal(
                logger._verbose,
                false,
                'Logger failed to assign correct default value to _verbose'
            );

            assert.equal(
                logger._indentStr,
                '    ',
                'Logger failed to assign correct default value to _indentStr'
            );

            assert.equal(
                logger._outFile,
                'test_logs.txt',
                'Logger failed to assign correct default value to _outFile'
            );

        },

        'constructorAssignments#withOutDirAndOpts': function () {
            var defaultOutDir,
                opts,
                logger,
                consoleStub;

            defaultOutDir = 'somePath';
            opts = {
                verbose: true,
                indentStr: '\n'
            };

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.NODE, defaultOutDir, opts);
            consoleStub.restore();

            assert.equal(
                logger._outDir,
                defaultOutDir,
                'Logger failed to assign correct value to _outDir'
            );

            assert.equal(
                logger._verbose,
                opts.verbose,
                'Logger failed to assign correct value to _verbose'
            );

            assert.equal(
                logger._indentStr,
                opts.indentStr,
                'Logger failed to assign correct value to _indentStr'
            );
        },

        'constructorAssignments#withoutOutDirButWithOpts': function () {
            var defaultOutDir,
                opts,
                logger,
                consoleStub;

            defaultOutDir = 'somePath';
            opts = {
                verbose: true,
                indentStr: '\n'
            };

            FileWriter.createTempDir.returns(defaultOutDir);

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.NODE, opts);
            consoleStub.restore();

            assert.equal(
                logger._outDir,
                defaultOutDir,
                'Logger failed to assign correct value to _outDir'
            );

            assert.equal(
                logger._verbose,
                opts.verbose,
                'Logger failed to assign correct value to _verbose'
            );

            assert.equal(
                logger._indentStr,
                opts.indentStr,
                'Logger failed to assign correct value to _indentStr'
            );
        },

        'constructorAssignments#withNodeEnv': function () {
            var logger,
                consoleStub,
                consoleStr;

            defaultOutDir = 'somePath';
            opts = {
                verbose: true,
                indentStr: '\n'
            };

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.NODE);
            consoleStr = console.log.lastCall.args[0];
            consoleStub.restore();

            assert.equal(
                logger._log,
                '\n' + consoleStr,
                'Logger failed to assign correct value to _log'
            );

            assert.equal(
                logger._tabs,
                logger._indentStr,
                'Logger failed to assign correct value to _tabs'
            );

            assert.equal(
                consoleStr,
                'Running tests on Node.js...',
                'Logger failed to log start of Node.js env testing'
            );
        },

        'constructorAssignments#withBrowserEnv': function () {
            var logger,
                consoleStub,
                consoleStr;

            defaultOutDir = 'somePath';
            opts = {
                verbose: true,
                indentStr: '\n'
            };

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.BROWSER);
            consoleStr = console.log.lastCall.args[0];
            consoleStub.restore();

            assert.deepEqual(
                logger._log,
                {
                    'init' : '\n' + consoleStr
                },
                'Logger failed to assign correct value to _log'
            );

            assert.deepEqual(
                logger._tabs,
                {
                    'init' : logger._indentStr
                },
                'Logger failed to assign correct value to _tabs'
            );

            assert.equal(
                consoleStr,
                'Running tests on Browser...',
                'Logger failed to log start of Node.js env testing'
            );
        },

        'constructorAssignments#withInvalidEnv': function () {
            assert.throws(
                function () {
                    new Logger(999);
                }, 
                'Unknown/Unsupported Enviornment provided for the Logger'
            );
        },

        'constructorAssignments#withoutExistingLogFile': function () {
            var defaultOutDir,
                defaultLogFilename,
                logger,
                consoleStr,
                consoleStub;

            defaultOutDir = 'somePath';
            defaultLogFilename = 'test_logs.txt';

            FileWriter.createTempDir.returns(defaultOutDir);
            fs.existsSync.returns(false);

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.NODE);
            consoleStr = console.log.firstCall.args[0];
            consoleStub.restore();

            assert.equal(
                consoleStr,
                chalk.blue('Logs can be found at: ' + defaultOutDir) + '\n',
                'Logger failed to log the location of the log file when one was not found'
            );
        },

        'logSessionStart': function () {
            var consoleStr,
                logger,
                consoleStub;

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.BROWSER);
            logger.logSessionStart(mockRemote);
            consoleStr = console.log.lastCall.args[0];
            consoleStub.restore();

            assert.equal(
                consoleStr,
                'Testing on ' + mockRemote.environmentType,
                'Logger failed to console log the remote env type during sesison start'
            );

            assert.equal(
                logger._log[mockRemote.sessionId],
                '\nTesting on ' + mockRemote.environmentType,
                'Logger failed to save log in _log the remote env type during sesison start'
            );

            assert.equal(
                logger._tabs[mockRemote.sessionId],
                logger._indentStr + logger._indentStr,
                'Incorrect indentation during logSessionStart'
            );
        },

        'logSessionEnd': function () {
            var consoleStr,
                logger,
                consoleStub;

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.BROWSER);
            logger.logSessionStart(mockRemote);
            logger.logSessionEnd(mockRemote);
            consoleStub.restore();

            //No check since the function logSessionEnd is empty for now
        },

        'logSuiteStart#whenVerbose': function () {
            var consoleStr,
                logger,
                consoleStub;

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.BROWSER, {verbose: true });
            logger.logSessionStart(mockRemote);
            logger.logSuiteStart(mockSuite);
            consoleStr = console.log.lastCall.args[0];
            consoleStub.restore();

            assert.equal(
                consoleStr,
                logger._indentStr + 'RUNNING: ' + mockSuite.name,
                'Logger failed to console log the suite name during suite start when verbose'
            );
            
            assert.include(
                logger._log[mockSuite.sessionId],
                '\n' + logger._indentStr + 'RUNNING: ' + mockSuite.name,
                'Logger failed to save log in _log the remote env type during suite start'
            );

            assert.equal(
                logger._tabs[mockSuite.sessionId],
                logger._indentStr + logger._indentStr,
                'Incorrect indentation during logSuiteStart when verbose'
            );
        },

        'logSuiteStart#whenNotVerbose': function () {
            var consoleStr,
                logger,
                consoleStub;

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.BROWSER);
            logger.logSessionStart(mockRemote);
            logger.logSuiteStart(mockSuite);
            consoleStr = console.log.lastCall.args[0];
            consoleStub.restore();

            assert.notEqual(
                consoleStr,
                logger._indentStr + 'RUNNING: ' + mockSuite.name,
                'Logger wrongly logged the suite name during suite start when not verbose'
            );
            
            assert.include(
                logger._log[mockSuite.sessionId],
                '\n' + logger._indentStr + 'RUNNING: ' + mockSuite.name,
                'Logger wrongly logged to _log the suite name during suite start when not verbose'
            );

            assert.equal(
                logger._tabs[mockSuite.sessionId],
                logger._indentStr + logger._indentStr,
                'Incorrect indentation during logSuiteStart when not verbose'
            );
        },

        'logSuiteStart#whenSuiteNameIsMain': function () {
            var consoleStr,
                logger,
                consoleStub;

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.BROWSER, {verbose: true});
            logger.logSessionStart(mockRemote);
            logger.logSuiteStart({name: 'main'});
            consoleStr = console.log.lastCall.args[0];
            consoleStub.restore();

            assert.notEqual(
                consoleStr,
                logger._indentStr + 'RUNNING: ' + mockSuite.name,
                'Logger wrongly console logged the suite name "main" during suite start'
            );
            
            assert.notInclude(
                logger._log[mockSuite.sessionId],
                '\n' + logger._indentStr + 'RUNNING: ' + mockSuite.name,
                'Logger wrongly logged in _log the suite name "main" during suite start'
            );

            assert.equal(
                logger._tabs[mockSuite.sessionId],
                logger._indentStr + logger._indentStr,
                'Incorrect indentation during logSuiteStart with suite name as main'
            );
        },

        'logSuiteStart#withNoSessionId': function () {
            var consoleStr,
                logger,
                consoleStub;

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.NODE, {verbose: true});
            logger.logSuiteStart(mockSuiteWithNoSession);
            consoleStr = console.log.lastCall.args[0];
            consoleStub.restore();

            assert.equal(
                consoleStr,
                logger._indentStr + 'RUNNING: ' + mockSuiteWithNoSession.name,
                'Logger failed to log the suite name for suite with no sessionId'
            );
            
            assert.include(
                logger._log,
                '\n' + logger._indentStr + 'RUNNING: ' + mockSuiteWithNoSession.name,
                'Logger failed to save log in _log the suite name for suite with no sessionId'
            );

            assert.equal(
                logger._tabs,
                logger._indentStr + logger._indentStr,
                'Incorrect indentation during logSuiteStart without a session ID'
            );
        },

        'logSuiteStart#withNoSessionStart': function () {
            var consoleStr,
                logger,
                consoleStub;

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.NODE);
            logger.logSuiteStart(mockSuite);
            consoleStr = console.log.lastCall.args[0];
            consoleStub.restore();

            assert.equal(
                logger._tabs,
                logger._indentStr,
                'Incorrect indentation during logSuiteStart with client Env'
            );
        },

        'logSuiteEnd': function () {
            var consoleStr,
                logger,
                consoleStub;

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.NODE);
            logger.logSuiteStart(mockSuiteWithNoSession);
            logger.logSuiteEnd(mockSuiteWithNoSession);
            consoleStub.restore();

            assert.equal(
                logger._tabs,
                logger._indentStr,
                'Incorrect indentation during logSuiteEnd'
            );
        },

        'logSuiteEnd#withSessionNameAsMain': function () {
            var consoleStr,
                logger,
                consoleStub;

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.NODE);
            logger.logSuiteStart(mockSuiteWithNoSession);
            logger.logSuiteEnd({name: 'main'});
            consoleStub.restore();

            assert.equal(
                logger._tabs,
                logger._indentStr + logger._indentStr,
                'Incorrect indentation during logSuiteEnd when suite name is main'
            );
        },

        'logSuiteEnd#withSuiteHavingSessionId': function () {
            var consoleStr,
                logger,
                consoleStub;

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.NODE);
            logger.logSessionStart(mockRemote);
            logger.logSuiteStart(mockSuite);
            logger.logSuiteEnd(mockSuite);
            consoleStub.restore();

            assert.equal(
                logger._tabs,
                logger._indentStr,
                'Incorrect indentation during logSuiteEnd when suite has a session ID'
            );
        }, 

        'logPassedTest#verboseOff': function () {
            var consoleStr,
                logger,
                consoleStub,
                passStr;

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.NODE);
            logger.logSuiteStart(mockSuiteWithNoSession);
            logger.logPassedTest(mockTestWithNoSession);
            consoleStr = console.log.lastCall.args[0];
            consoleStub.restore();

            passStr = chalk.green('PASS:') + ' ' + 
                        mockTestWithNoSession.name + ' (' + 
                        mockTestWithNoSession.timeElapsed + 'ms)';

            assert.notInclude(
                consoleStr,
                passStr,
                'Logger wrongly logged the passed test when verbosity is false'
            );
            
            assert.include(
                logger._log,
                logger._indentStr + logger._indentStr + chalk.stripColor(passStr),
                'Logger failed to save log in _log the passed test when verbosity is false'
            );
        }, 

        'logPassedTest#verbose': function () {
            var consoleStr,
                logger,
                consoleStub,
                passStr;

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.NODE, {verbose: true});
            logger.logSuiteStart(mockSuiteWithNoSession);
            logger.logPassedTest(mockTestWithNoSession);
            consoleStr = console.log.lastCall.args[0];
            consoleStub.restore();

            passStr = logger._indentStr + 
                        chalk.green('PASS:') + ' ' + 
                        mockTestWithNoSession.name + ' (' + 
                        mockTestWithNoSession.timeElapsed + 'ms)';

            assert.equal(
                consoleStr,
                logger._indentStr + passStr,
                'Logger failed to console log the passed test when verbosity is true'
            );
            
            assert.include(
                logger._log,
                chalk.stripColor(passStr),
                'Logger failed to save log in _log the passed test when verbosity is true'
            );
        }, 

        'logSkippedTest#verboseOff': function () {
            var consoleStr,
                logger,
                consoleStub,
                skipStr;

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.NODE);
            logger.logSuiteStart(mockSuiteWithNoSession);
            logger.logSkippedTest(mockTestWithNoSession);
            consoleStr = console.log.lastCall.args[0];
            consoleStub.restore();

            skipStr = chalk.yellow('SKIP:') + ' ' + 
                        mockTestWithNoSession.name + ' (' + 
                        mockTestWithNoSession.timeElapsed + 'ms)';

            assert.equal(
                consoleStr,
                skipStr,
                'Logger failed to console log the skipped test when verbosity is failed'
            );
            
            assert.include(
                logger._log,
                logger._indentStr + logger._indentStr + chalk.stripColor(skipStr),
                'Logger failed to save log in _log the skipped test when verbosity is false'
            );
        }, 

        'logSkippedTest#verbose': function () {
            var consoleStr,
                logger,
                consoleStub,
                skipStr;

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.NODE, {verbose: true});
            logger.logSuiteStart(mockSuiteWithNoSession);
            logger.logSkippedTest(mockTestWithNoSession);
            consoleStr = console.log.lastCall.args[0];
            consoleStub.restore();

            skipStr = logger._indentStr + 
                        chalk.yellow('SKIP:') + ' ' + 
                        mockTestWithNoSession.name + ' (' + 
                        mockTestWithNoSession.timeElapsed + 'ms)';

            assert.equal(
                consoleStr,
                logger._indentStr + skipStr,
                'Logger failed to console log the skipped test when verbosity is true'
            );
            
            assert.include(
                logger._log,
                chalk.stripColor(skipStr),
                'Logger failed to save log in _log the skipped test when verbosity is true'
            );
        }, 

        'logSkippedTest#verboseOff': function () {
            var consoleStr,
                logger,
                consoleStub,
                warningStr,
                str = 'someWarning';

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.BROWSER);
            logger.logSuiteStart(mockSuite);
            logger.logWarning(str);
            consoleStr = console.log.lastCall.args[0];
            consoleStub.restore();

            warningStr = chalk.yellow('WARN:') + ' ' + str;

            assert.equal(
                consoleStr,
                warningStr,
                'Logger failed to console log the warning when verbosity is failed'
            );
            
            assert.include(
                logger._log['warnings'],
                '\n' + logger._indentStr + chalk.stripColor(warningStr),
                'Logger failed to save log in _log the warning when verbosity is false'
            );
        }, 

        'logWarning#verbose': function () {
            var consoleStr,
                logger,
                consoleStub,
                warningStr,
                str = 'someWarning';

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.NODE, {verbose: true});
            logger.logSuiteStart(mockSuiteWithNoSession);
            logger.logWarning(str);
            consoleStr = console.log.lastCall.args[0];
            consoleStub.restore();

            warningStr = chalk.yellow('WARN:') + ' ' + str;

            assert.equal(
                consoleStr,
                logger._indentStr + logger._indentStr +  warningStr,
                'Logger failed to console log the warning when verbosity is true'
            );
            
            assert.include(
                logger._log,
                chalk.stripColor(warningStr),
                'Logger failed to save log in _log the warning when verbosity is true'
            );
        },

        'logFailedTest': function () {
            var logger,
                logFailureStub,
                consoleStub,
                errorID,
                url;

            errorID = 1234;
            url = "http://something.com";

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.NODE, {verbose: true});
            logFailureStub = sinon.stub(logger, '_logFailure');
            logger.logFailedTest(mockTest, errorID, url, mockRemote);
            consoleStub.restore();

            assert.ok(
                logger._logFailure.calledWith(mockTest, errorID, url, mockRemote),
                'logger.logFailedTest failed to call logFailure'
            );

            logFailureStub.restore();
        }, 

        'logTunnelStart': function () {
            var consoleStr,
                logger,
                consoleStub,
                mockTunnelId,
                logStr;

            mockTunnelId = "1234";
            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.BROWSER);
            logger.logTunnelStart(mockTunnelId);
            consoleStr = console.log.lastCall.args[0];
            consoleStub.restore();

            logStr = 'Starting tunnel';
            assert.equal(
                consoleStr,
                logStr,
                'Logger failed to console log tunnel start'
            );
            
            assert.equal(
                logger._log['tunnelLogs'],
                '\n' + logStr,
                'Logger failed to log to _log on tunnel start'
            );
            
            assert.equal(
                logger._tabs['tunnelLogs'],
                '',
                'Logger failed to assign correct value to _tabs on tunnel start'
            );
        }, 

        'logTunnelStatus': function () {
            var consoleStr,
                logger,
                consoleStub,
                mockTunnelId,
                tunnelStatus,
                logStr;

            mockTunnelId = "1234";
            tunnelStatus = "some status";
            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.BROWSER);
            logger.logTunnelStart(mockTunnelId);
            logger.logTunnelStatus(mockTunnelId, tunnelStatus);
            consoleStr = console.log.lastCall.args[0];
            consoleStub.restore();

            logStr = 'Tunnel: ' + tunnelStatus;

            assert.equal(
                consoleStr,
                logStr,
                'Logger failed to console log tunnel status'
            );
            
            assert.include(
                logger._log['tunnelLogs'],
                '\n' + logStr,
                'Logger failed to log to _log on tunnel status'
            );
        }, 

        'logFatalError#withoutStacktrace': function () {
            var consoleStr,
                logger,
                consoleStub,
                mockError,
                logStr;

            mockError = {
                message: "some error"
            }

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.NODE);
            logger.logFatalError(mockError);
            consoleStr = console.log.lastCall.args[0];
            consoleStub.restore();

            logStr = '';
            logStr += chalk.red('FATAL ERROR');
            logStr += '\n' + logger._indentStr + chalk.red(mockError.message);
            logStr += '\n' + logger._indentStr + chalk.red('Stacktrace:');
            logStr += '\n' + logger._indentStr + chalk.red('===========');
            logStr += '\n' + logger._indentStr + chalk.red('No Stacktrace');
            logStr += '\n' + logger._indentStr;

            assert.equal(
                consoleStr,
                logStr,
                'Logger failed to console log fatal error without stacktrace correctly'
            );
        }, 

        'logFatalError#withStacktrace': function () {
            var consoleStr,
                logger,
                consoleStub,
                mockError,
                stacktrace,
                sessionId,
                logStr;

            mockError = {
                message: "some error",
                stack: "stacktrace\nfile1:line1\nfile2:line2"
            }

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.BROWSER);
            logger.logFatalError(mockError);
            consoleStr = console.log.lastCall.args[0];
            consoleStub.restore();

            sessionId = 'fatalErrors'
            stackTrace = mockError.stack.replace(
                            /(\n\s*)/g, '\n' + 
                            logger._indentStr
                        );

            logStr = '';
            logStr += chalk.red('FATAL ERROR');
            logStr += '\n' + logger._indentStr + chalk.red(mockError.message);
            logStr += '\n' + logger._indentStr + chalk.red('Stacktrace:');
            logStr += '\n' + logger._indentStr + chalk.red('===========');
            logStr += '\n' + logger._indentStr + chalk.red(stackTrace);
            logStr += '\n' + logger._indentStr;

            assert.equal(
                consoleStr,
                logStr,
                'Logger failed to console log fatal error with stacktrace correctly'
            );
        }, 

        'dumpLogs#withNodeEnv': function () {
            var logger,
                consoleStub,
                logStr,
                outDir,
                outFile,
                append,
                mockLog,
                mockOutDir,
                mockOutFile;

            mockLog = "Some log";
            mockOutDir = "SomeDir";
            mockOutFile = "SomeFile";
            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.NODE);

            logger._log = mockLog;
            logger._outDir = mockOutDir;
            logger._outFile = mockOutFile;

            logger.dumpLogs();

            logStr = FileWriter.writeTextLogs.lastCall.args[0];
            outDir = FileWriter.writeTextLogs.lastCall.args[1];
            outFile = FileWriter.writeTextLogs.lastCall.args[2];
            append = FileWriter.writeTextLogs.lastCall.args[3];
            consoleStub.restore();

            assert.equal(
                mockLog,
                logStr,
                'Logger.dumpLogs failed to write correct logs to FileWriter'
            );

            assert.equal(
                outDir,
                mockOutDir,
                'Logger.dumpLogs failed to give correct outDir to FileWriter'
            );
            
            assert.equal(
                outFile,
                mockOutFile,
                'Logger.dumpLogs failed to give correct outFile to FileWriter'
            );
            
            assert.ok(
                append,
                'Logger.dumpLogs failed to pass in append flag to FileWriter'
            );
        }, 

        'dumpLogs#withBrowserEnv': function () {
            var logger,
                consoleStub,
                logStr,
                outDir,
                outFile,
                append,
                mockLog,
                mockLogObj,
                mockOutDir,
                mockOutFile;

            mockLogObj = {
                init: 'someInit',
                tunnelLogs: 'someTunnelLogs',
                fatalErrors: 'someFatalErrors',
                warnings: 'someWarnings',
                someSessionId: 'someSessionIdLogs',
                anotherSessionId: 'anotherSessionIdLogs',
                yetAnotherSessionId: 'yetAnotherSessionIdLogs'
            };

            mockLog = '';
            mockLog += mockLogObj['init'];
            mockLog += mockLogObj['tunnelLogs'];

            for (var sessionId in mockLogObj) {
                if (mockLogObj.hasOwnProperty(sessionId)) {
                    if (sessionId !== 'init'
                        && sessionId !== 'tunnelLogs'
                        && sessionId !== 'warnings'
                        && sessionId !== 'fatalErrors') {

                        mockLog += mockLogObj[sessionId];
                    }
                }
            }
            mockLog += mockLogObj['warnings'];
            mockLog += mockLogObj['fatalErrors'];

            mockOutDir = "SomeDir";
            mockOutFile = "SomeFile";
            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.BROWSER);

            logger._log = mockLogObj;
            logger._outDir = mockOutDir;
            logger._outFile = mockOutFile;

            logger.dumpLogs();
            
            logStr = FileWriter.writeTextLogs.lastCall.args[0];
            outDir = FileWriter.writeTextLogs.lastCall.args[1];
            outFile = FileWriter.writeTextLogs.lastCall.args[2];
            append = FileWriter.writeTextLogs.lastCall.args[3];
            consoleStub.restore();

            assert.deepEqual(
                mockLog,
                logStr,
                'Logger.dumpLogs failed to write correct logs to FileWriter'
            );

            assert.equal(
                outDir,
                mockOutDir,
                'Logger.dumpLogs failed to give correct outDir to FileWriter'
            );
            
            assert.equal(
                outFile,
                mockOutFile,
                'Logger.dumpLogs failed to give correct outFile to FileWriter'
            );
            
            assert.ok(
                append,
                'Logger.dumpLogs failed to pass in append flag to FileWriter'
            );
        }, 

        'dumpLogs#withBrowserEnvWithoutFatalErrors': function () {
            var logger,
                consoleStub,
                logStr,
                outDir,
                outFile,
                append,
                mockLog,
                mockLogObj,
                mockOutDir,
                mockOutFile;

            mockLogObj = {
                init: 'someInit',
                tunnelLogs: 'someTunnelLogs',
                someSessionId: 'someSessionIdLogs',
                anotherSessionId: 'anotherSessionIdLogs',
                yetAnotherSessionId: 'yetAnotherSessionIdLogs'
            };

            mockLog = '';
            mockLog += mockLogObj['init'];
            mockLog += mockLogObj['tunnelLogs'];

            for (var sessionId in mockLogObj) {
                if (mockLogObj.hasOwnProperty(sessionId)) {
                    if (sessionId !== 'init'
                        && sessionId !== 'tunnelLogs'
                        && sessionId !== 'fatalErrors') {

                        mockLog += mockLogObj[sessionId];
                    }
                }
            }

            mockOutDir = "SomeDir";
            mockOutFile = "SomeFile";
            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.BROWSER);

            logger._log = mockLogObj;
            logger._outDir = mockOutDir;
            logger._outFile = mockOutFile;

            logger.dumpLogs();
            
            logStr = FileWriter.writeTextLogs.lastCall.args[0];
            outDir = FileWriter.writeTextLogs.lastCall.args[1];
            outFile = FileWriter.writeTextLogs.lastCall.args[2];
            append = FileWriter.writeTextLogs.lastCall.args[3];
            consoleStub.restore();

            assert.deepEqual(
                mockLog,
                logStr,
                'Logger.dumpLogs failed to write correct logs to FileWriter'
            );

            assert.equal(
                outDir,
                mockOutDir,
                'Logger.dumpLogs failed to give correct outDir to FileWriter'
            );
            
            assert.equal(
                outFile,
                mockOutFile,
                'Logger.dumpLogs failed to give correct outFile to FileWriter'
            );
            
            assert.ok(
                append,
                'Logger.dumpLogs failed to pass in append flag to FileWriter'
            );
        }, 

        'dumpLogs#withBrowserEnvWitoutAnythingToLog': function () {
            var logger,
                consoleStub,
                logStr,
                outDir,
                outFile,
                append,
                mockLog,
                mockLogObj,
                mockOutDir,
                mockOutFile,
                parentMockObj;

            // Needed for testing hasOwnProperty for mockLogObj
            parentMockObj = function() {};
            parentMockObj.prototype.a = 123;

            mockLogObj = new parentMockObj();

            mockLog = '';

            mockOutDir = "SomeDir";
            mockOutFile = "SomeFile";
            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.BROWSER);

            logger._log = mockLogObj;
            logger._outDir = mockOutDir;
            logger._outFile = mockOutFile;

            logger.dumpLogs();
            
            logStr = FileWriter.writeTextLogs.lastCall.args[0];
            outDir = FileWriter.writeTextLogs.lastCall.args[1];
            outFile = FileWriter.writeTextLogs.lastCall.args[2];
            append = FileWriter.writeTextLogs.lastCall.args[3];
            consoleStub.restore();

            assert.deepEqual(
                mockLog,
                logStr,
                'Logger.dumpLogs failed to write correct logs to FileWriter'
            );

            assert.equal(
                outDir,
                mockOutDir,
                'Logger.dumpLogs failed to give correct outDir to FileWriter'
            );
            
            assert.equal(
                outFile,
                mockOutFile,
                'Logger.dumpLogs failed to give correct outFile to FileWriter'
            );
            
            assert.ok(
                append,
                'Logger.dumpLogs failed to pass in append flag to FileWriter'
            );
        },

        '_logFailure#NodeEnvWithTestObj': function() {
            var consoleStr,
                logger,
                consoleStub,
                mockErrorId,
                logStr,
                errorName,
                errorMessage,
                stackTrace,
                completeErrorMessage,
                envType,
                artifactsDir,
                splitTestId;

            mockErrorId = 1234;

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.NODE);
            // reset _logs
            logger._log = '';

            logger._logFailure(mockTestWithNoSession, mockErrorId);
            consoleStub.restore();

            envType = 'Node.js';
            artifactsDir = 'None';
            errorName = mockTestWithNoSession.error.name;
            errorMessage = mockTestWithNoSession.error.message;
            stackTrace = 'No Stacktrace';
            completeErrorMessage = errorName + ': ' + errorMessage;
            splitTestId = mockTestWithNoSession.id.split(' - ');

            logStr = '\n\
    FAIL: ' + mockTestWithNoSession.name + ' (' + mockTestWithNoSession.timeElapsed + 'ms)\n\
        Error: ' + completeErrorMessage + '\n\
            ParentSuiteName: ' + splitTestId[0] + '\n\
            SuiteName: ' + splitTestId[1] + '\n\
            TestName: ' + mockTestWithNoSession.name + '\n\
            Platform: ' + envType + '\n\
            ErrorID: ' + mockErrorId + '\n\
            URL: N/A\n\
            Diagnostics: ' + artifactsDir + '\n\
            Stacktrace:\n\
            ===========\n\
            ' + stackTrace + '\n\
     '
            assert.equal(
                logStr,
                logger._log,
                'Logger._logFailure failed log correctly for NODE env'
            );

        },

        '_logFailure#BrowserEnvWithSuiteObj': function() {
            var consoleStr,
                logger,
                consoleStub,
                mockErrorId,
                mockUrl,
                logStr,
                errorName,
                errorMessage,
                stackTrace,
                completeErrorMessage,
                envType,
                artifactsDir,
                sessionId;

            mockErrorId = 1234;
            mockUrl = "http://somthing.com";
            sessionId = mockSuiteWithRelatedTest.sessionId;

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.BROWSER);
            // reset _logs
            logger._log[sessionId] = '';

            logger._logFailure(mockSuiteWithRelatedTest, mockErrorId, mockUrl, mockRemote);
            consoleStub.restore();

            envType = mockRemote.environmentType;
            artifactsDir = path.join(logger._outDir, mockErrorId.toString());
            errorName = mockSuiteWithRelatedTest.error.name;
            errorMessage = mockSuiteWithRelatedTest.error.message;
            stackTrace = mockSuiteWithRelatedTest.error.stack;
            completeErrorMessage = errorName + ': ' + errorMessage;

            logStr = '\n\
    FAIL: ' + mockTest.name + ' (' + mockTest.timeElapsed + 'ms)\n\
        Error: ' + completeErrorMessage + '\n\
            ParentSuiteName: ' + mockTest.parent.parent.name + '\n\
            SuiteName: ' + mockTest.parent.name + '\n\
            TestName: ' + mockTest.name + '\n\
            Platform: ' + envType + '\n\
            ErrorID: ' + mockErrorId + '\n\
            URL: ' + mockUrl + '\n\
            Diagnostics: ' + artifactsDir + '\n\
            Stacktrace:\n\
            ===========\n\
            ' + stackTrace + '\n\
     '
            assert.equal(
                logStr,
                logger._log[sessionId],
                'Logger._logFailure failed log correctly for BROWSER env'
            );

        },

        '_logFailure#Error': function() {
            var logger,
                consoleStub,
                logFatalErrorStub,
                error;

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.BROWSER);
            logFatalErrorStub = sinon.stub(logger, 'logFatalError');
            
            logger._logFailure();
            error = logger.logFatalError.lastCall.args[0];

            consoleStub.restore();
            logFatalErrorStub.restore();

            assert.equal(
                error.message,
                "Reporter Error: Cannot read property 'sessionId' of undefined",
                'Logger._logFailure failed log reporter error'
            );

            assert.equal(
                error.message,
                "Reporter Error: Cannot read property 'sessionId' of undefined",
                'Logger._logFailure failed log reporter error'
            );

        },

        'log#withForceFlagAndWithoutSessionId': function() {
            var logger,
                consoleStub,
                logStr;

            logStr = 'someString';

            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.BROWSER);
            consoleStub.restore();

            consoleStub = sinon.stub(console, 'log');

            logger.log(logStr, false);
            assert.equal(
                console.log.callCount,
                0,
                'Logger.log failed to take forceLog flag without sessionId'
            );

            logger.log(logStr, true);
            assert.equal(
                console.log.callCount,
                1,
                'Logger.log failed to take forceLog flag without sessionId'
            );

            consoleStub.restore();
        },

        '_indent#withInvalidSessionId': function() {
            var logger,
                consoleStub,
                sessionId;

            sessionId = "invalidId";
            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.BROWSER);
            consoleStub.restore();

            logger._indent(sessionId);

            assert.equal(
                logger._tabs[sessionId],
                logger._indentStr,
                'Logger._indent with invalid session Id failed to set a property in logger._tabs'
            );
        },

        '_unindent#withInvalidSessionId': function() {
            var logger,
                consoleStub,
                sessionId;

            sessionId = "invalidId";
            consoleStub = sinon.stub(console, 'log');
            logger = new Logger(Logger.Env.BROWSER);
            consoleStub.restore();

            logger._unindent(sessionId);

            assert.equal(
                logger._tabs[sessionId],
                undefined,
                'Logger._unindent wrongly intialized logger._tabs with invalid session id'
            );
        }
    });
});