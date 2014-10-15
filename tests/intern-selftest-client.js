define({
	// The port on which the instrumenting proxy will listen
	proxyPort: 9000,

	// A fully qualified URL to the Intern proxy
	proxyUrl: 'http://localhost:9000/',

	// Default desired capabilities for all environments. Individual capabilities can be overridden by any of the
	// specified browser environments in the `environments` array below as well. See
	// https://code.google.com/p/selenium/wiki/DesiredCapabilities for standard Selenium capabilities and
	// https://saucelabs.com/docs/additional-config#desired-capabilities for Sauce Labs capabilities.
	// Note that the `build` capability will be filled in with the current commit ID from the Travis CI environment
	// automatically
	capabilities: {
		'selenium-version': '2.43.1',
		'idle-timeout': 30
	},

	// Browsers to run integration testing against. Note that version numbers must be strings if used with Sauce
	// OnDemand. Options that will be permutated are browserName, version, platform, and platformVersion; any other
	// capabilities options specified for an environment will be copied as-is
	environments: [
		{ browserName: 'phantomjs' }
	],

	// Maximum number of simultaneous integration tests that should be executed on the remote WebDriver service
	maxConcurrency: 3,

	// Name of the tunnel class to use for WebDriver tests
	tunnel: 'NullTunnel',

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
		'combined'
		// 'console',
		// 'lcovhtml',
		// 'lcov',
		//'reporters/lcovhtml_custom'
		// 'reporters/summary'
	],

	// Non-functional test suite(s) to run in each browser
	suites: [
		'tests/config/intern',
		'tests/reporters/lib/FileWriter',
		'tests/reporters/lib/BrowserArtifacts',
		'tests/reporters/lib/Logger',
		'tests/reporters/summary'
	],

	// Functional test suite(s) to run in each browser once non-functional tests are completed
	functionalSuites: [
	],

	// A regular expression matching URLs to files that should not be included in code coverage analysis
	excludeInstrumentation: /^(?:tests|node_modules|combined)\//,

	isSelfTestConfig: true,

	instrumentUnloadedFiles: true
});
