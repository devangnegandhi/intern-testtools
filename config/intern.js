/**
 * @copyright Copyright (C) 2014 Devang Negandhi - All Rights Reserved
 */

var tunnelType = 'NullTunnel';
var sauceLabsUsername = null;
var sauceLabsAccessKey = null;
var port = null;
var proxyPort = 9000;
var hostname = 'localhost';

if(typeof process !== "undefined") {
	// If Sauce Labs ccredentials are provided, use that
	if (process.env.SAUCE_USERNAME && process.env.SAUCE_ACCESS_KEY) {
		tunnelType = 'SauceLabsTunnel';
		sauceLabsUsername = process.env.SAUCE_USERNAME;
		sauceLabsAccessKey = process.env.SAUCE_ACCESS_KEY;

	// Else if Selenium webdriver port is provided, use that
	} else if (process.env.SELENIUM_LAUNCHER_PORT) {
		port = process.env.SELENIUM_LAUNCHER_PORT;

	// Else error out
	} else {
		console.error('No SauceLabs credentials or Selenium Webdriver port provided.');
	}
}

// Learn more about configuring this file at <https://github.com/theintern/intern/wiki/Configuring-Intern>.
// These default settings work OK for most people. The options that *must* be changed below are the
// packages, suites, excludeInstrumentation, and (if you want functional tests) functionalSuites.
define({
	// The port on which the instrumenting proxy will listen
	proxyPort: proxyPort,

	// A fully qualified URL to the Intern proxy
	proxyUrl: 'http://' + hostname + ':' + proxyPort + '/',

	// Default desired capabilities for all environments. Individual capabilities can be overridden by any of the
	// specified browser environments in the `environments` array below as well. See
	// https://code.google.com/p/selenium/wiki/DesiredCapabilities for standard Selenium capabilities and
	// https://saucelabs.com/docs/additional-config#desired-capabilities for Sauce Labs capabilities.
	// Note that the `build` capability will be filled in with the current commit ID from the Travis CI environment
	// automatically
	capabilities: {
		takesScreenshot: true,
		cssSelectorsEnabled: true,
		'idle-timeout': 20
	},

	tunnel: tunnelType,

	tunnelOptions: {
		username: sauceLabsUsername,
		accessKey: sauceLabsAccessKey,
		hostname: 'localhost',
		port: port
	},

	// Browsers to run integration testing against. Note that version numbers must be strings if used with Sauce
	// OnDemand. Options that will be permutated are browserName, version, platform, and platformVersion; any other
	// capabilities options specified for an environment will be copied as-is
	environments: [
		// { browserName: 'chrome', version: '34', platform: [ 'OS X 10.9', 'Windows 7', 'Linux' ] },
		{ browserName: 'chrome'},
		//{ browserName: 'firefox'},
	],

	// Maximum number of simultaneous integration tests that should be executed on the remote WebDriver service
	maxConcurrency: 2,

	// Whether or not to start Sauce Connect before running tests
	// useSauceConnect: false,

	// Connection information for the remote WebDriver service. If using Sauce Labs, keep your username and password
	// in the SAUCE_USERNAME and SAUCE_ACCESS_KEY environment variables unless you are sure you will NEVER be
	// publishing this configuration file somewhere
	// webdriver: {
	// 	host: 'localhost',
	// 	port: process.env.SELENIUM_LAUNCHER_PORT	
	// },

	// The desired AMD loader to use when running unit tests (client.html/client.js). Omit to use the default Dojo
	// loader
	useLoader: {
		'host-node': 'requirejs',
		'host-browser': '../../node_modules/requirejs/require.js'
	},

	// Configuration options for the module loader; any AMD configuration options supported by the specified AMD loader
	// can be used here
	loader: {
		baseUrl: '',
		paths: {
			// jquery: 'src/client/libs/jquery/jquery',
			intern: 'node_modules/intern',
			js: 'src/client/js',
			nls: 'src/client/nls',
			i18n: 'src/client/libs/requirejs-i18n/i18n',
			custom_reporters: 'tests/tools/intern/reporters',
			// test_tools: 'tests/tools/tests/client',
			// sinon: 'node_modules/sinon/lib/sinon',
			// 'sinon.stub': 'node_modules/sinon/lib/sinon/stub',
			// 'sinon.call': 'node_modules/sinon/lib/sinon/call',
			// 'sinon.match': 'node_modules/sinon/lib/sinon/match',
			// 'sinon.spy': 'node_modules/sinon/lib/sinon/spy'
			// functional_tests: 'tests/client/functional_tests'
		},
		// shim。
		shim: {
			// jquery: {
			// 	exports: '$'
			// },
			// 'sinon.stub': [ 'sinon' ],
			// 'sinon.match': [ 'sinon' ],
			// 'sinon.call': [ 'sinon.match' ],
			// 'sinon.spy': [ 'sinon.call' ]
		},
		map: { 
			intern: {
				dojo: 'intern/node_modules/dojo',
				chai: 'intern/node_modules/chai/chai',
				requirejs: 'node_modules/requirejs'
			},
			'*': {
				unit_tests: 'tests/client/unit_tests',
				dojo: 'intern/node_modules/dojo',
				istanbul: 'intern/node_modules/istanbul'	
			}
		}
	},

	// A regular expression matching URLs to files that should not be included in code coverage analysis
	excludeInstrumentation: /^(node_modules|tests|src\/client\/libs)\//
});
