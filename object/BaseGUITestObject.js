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
			if (typeof obj[m] === 'function') {
				methods.push(m);
				/*methods.push('F:' + m);*/
			} /*else {
				methods.push('O:' + m);
			}*/
		}

		return methods;
	};

	assertionCount = {};

	assertMethods = getAllMethods(assert);
	for (var i = 0; i < assertMethods.length; i++) {
		sinon.spy(assert, assertMethods[i]);
	}

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
			name: 'BaseGUITestObject',

			/**
			 * The method to perform any setup tasks
			 */
			setup: function () {
				// Adding the method to mock server response
				this.remote.mockServerResponse = function (obj) {
					if (!obj || !obj.url || !obj.requestType) {
						throw new Error('Please pass in correct mock response object');
					}

					obj.requestType = obj.requestType.toLowerCase();
					obj.delay = obj.delay | 0;
					obj.response = obj.response | '';
					obj.connectionError = obj.connectionError || false;

					var that = this;
					return that
							.execute(function () {
									require([ 
										'js/RemoteService/Remote' 
									], function (remoteMock) { 
										remoteMock.showMockInputOverlay();
									});
								})	
								.end()
							.waitForElementById('serverResponseDialog', function () {
								return driver.findElement('serverResponseDialog').isDisplayed();
							}, 5000)
								.end()
							.elementById('serverResponseDialog_' + obj.requestType)
								.click()
								.end()
							.elementById('serverResponseDialog_url')
								.click()
								.clear()
								.type(obj.url)
								.end()
							.elementById('serverResponseDialog_delay')
								.click()
								.clear()
								.type(obj.delay)
								.end()
							.elementById('serverResponseDialog_response')
								.click()
								.clear()
								.type(obj.response)
								.end()
							.elementById('serverResponseDialog_connection_error')
								.then(function (checkBox) {
									return that.execute(function (node, connError) {
										if (node.checked != connError) {
											node.checked = connError;
										} 
										return node;
									}, [ checkBox, obj.connectionError ]).end();
								})
								.end()
							.elementById('serverResponseDialog_addToQueue')
								.click()
								.end();
				};
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
