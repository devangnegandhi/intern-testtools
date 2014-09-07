/**
 * @copyright Copyright (C) 2014 Devang Negandhi - All Rights Reserved
 */
define([
	'intern!object',
	'intern/chai!assert',
	'sinon',
	'sinon.match',
	'sinon.call',
	'sinon.spy'
], function (registerSuite, assert, sinon) {

	var getAllMethods = function (obj) {
		var methods = [];
		for (var m in obj) {
			if (typeof obj[m] == 'function') {
				methods.push(m);
				/*methods.push('F:' + m);*/
			} /*else {
				methods.push('O:' + m);
			}*/
		}

		return methods;
	};

	assertionCount = {};
	assertMethods = [];

	/**
	 * Register a test suite with this base suite
	 * @param  {Object} nestedSuite The test suite descripton
	 */
	var registerNestedSuite = function (nestedSuite) {
		/**
		 * The base suite descriptor
		 * @type {Object}
		 */
		this.baseSuite = {
			/**
			 * The name of this suite
			 * @type {String}
			 */
			name: 'BaseUnitTestObject',

			/**
			 * The method to perform any setup tasks
			 */
			setup: function () {
				assertMethods = getAllMethods(assert);
				for (var i = 0; i < assertMethods.length; i++) {
					sinon.spy(assert, assertMethods[i]);
				}
				assertionCount[this.sessionId] = -1;
			},

			/**
			 * The method to perform any setup tasks before each tests
			 */
			beforeEach: function () {
				assertionCount[this.sessionId] = 0;
			},

			/**
			 * The method to perform any teardown tasks after each tests
			 */
			afterEach: function () {
				var expectedNoOfAssertions = assertionCount[this.sessionId];

				var actualNoOfAssertions = 0;
				for (var i = 0; i < assertMethods.length; i++) {
					actualNoOfAssertions += assert[assertMethods[i]].callCount;
					assert[assertMethods[i]].reset();
				}

				assert.strictEqual(actualNoOfAssertions, expectedNoOfAssertions, 
					'No of assertions do not match up');
				assert.strictEqual.reset();
			}
		};

		this.baseSuite[nestedSuite.name] = nestedSuite;

		registerSuite(this.baseSuite);
	};

	return registerNestedSuite;
});
