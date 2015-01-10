
var path = require.nodeRequire('path');
var deasync = require.nodeRequire('deasync');
var freeport = deasync(require.nodeRequire('freeport'));
var Browsers = require.nodeRequire(path.resolve('config/lib/Browsers'));
var Selenium = require.nodeRequire(path.resolve('config/lib/Selenium'));
var Firefox = require.nodeRequire(path.resolve('config/lib/Browsers_Firefox'));

var tunnelType = 'NullTunnel';
var port = null;
var proxyPort = freeport();
var hostname = 'localhost';
var environments = undefined;

Selenium = new Selenium();

// Default desired capabilities for all environments. Individual capabilities can be overridden by any of the
// specified browser environments in the `environments` array below as well. See
// https://code.google.com/p/selenium/wiki/DesiredCapabilities for standard Selenium capabilities and
// https://saucelabs.com/docs/additional-config#desired-capabilities for Sauce Labs capabilities.
// Note that the `build` capability will be filled in with the current commit ID from the Travis CI environment
// automatically
var capabilities = {
	'idle-timeout': 30
}

if(typeof process !== "undefined") {

	// If Sauce Labs credentials are provided, use SauceLabsTunnel
	if (process.env.SAUCE_USERNAME && process.env.SAUCE_ACCESS_KEY) {
		tunnelType = 'SauceLabsTunnel';
		port = freeport();
		environments = Browsers.getSauceLabsConfig();

	// Else use local selenium and browsers
	} else {

		// If selenium was already available, use that
		if (process.env.SELENIUM_LAUNCHER_PORT) {
			port = process.env.SELENIUM_LAUNCHER_PORT;
			console.log('Using external Selenium on port ' + port);

		// Else launch a new instance of selenium
		} else {
			port = freeport();
			console.log('Launching Selenium on port ' + port);
			Selenium.start(port);		
		}

		// Get the enviornments for running on local machine
		environments = Browsers.getLocalMachineConfig();

		// Download FF browser
		var downloadDirFF = Firefox.download();
		capabilities['firefox_binary'] = path.resolve(downloadDirFF, 'firefox');
	}
}

define({
	// The port on which the instrumenting proxy will listen
	proxyPort: proxyPort,

	// A fully qualified URL to the Intern proxy
	proxyUrl: 'http://' + hostname + ':' + proxyPort + '/',

	capabilities: capabilities,

	environments: environments,

	// Maximum number of simultaneous integration tests that should be executed on the remote WebDriver service
	maxConcurrency: 3,

	// Name of the tunnel class to use for WebDriver tests
	tunnel: tunnelType,

	tunnelOptions: {
//		username: null,
//		accessKey: null,
		// hostname: 'localhost',
		port: port
	},

	// Configuration options for the module loader; any AMD configuration options supported by the Dojo loader can be
	// used here
	loader: {
		baseUrl: '',
		paths: {
			intern: 'node_modules/intern'
		},
		map: { 
			intern: {
				dojo: 'intern/node_modules/dojo',
				chai: 'intern/node_modules/chai/chai'
			},
			'*': {
				unit_tests: 'tests/client/unit_tests',
				dojo: 'intern/node_modules/dojo',
				istanbul: 'intern/node_modules/istanbul'
			}
		}
	},

	reporters: [
		'combined',
		// 'lcovhtml',
		// 'lcov',
		// 'reporters/hybrid'
		//'reporters/lcovhtml_custom'
	],

	// Non-functional test suite(s) to run in each browser
	suites: [
		'tests/config/intern_onBrowser'
	],

	// Functional test suite(s) to run in each browser once non-functional tests are completed
	functionalSuites: [
	],

	// A regular expression matching URLs to files that should not be included in code coverage analysis
	excludeInstrumentation: /^(?:tests|node_modules|combined|logs)\//,

	isSelfTestConfig: true,

	instrumentUnloadedFiles: true
});