/**
 * @copyright Copyright (C) 2014 Devang Negandhi - All Rights Reserved
 */
var fs = require('fs'),
    path = require('path'),
    Report = require(process.cwd() + '/node_modules/intern/node_modules/istanbul/lib/report/index'),
    util = require('util');

/**
 * @extends {istanbul/lib/report/index}
 * @constructor 
 * @param {Object} opts Optional options
 * @param {String} optsdir The directory to write the JSON report to
 * 
 */
function JsonReport (opts) {
    Report.call(this);
    this.opts = opts || {};
    this.opts.dir = this.opts.dir || path.resolve(process.cwd());
}

/**
 * The type of the report
 * @public
 * @type {String}
 */
JsonReport.TYPE = 'json';
util.inherits(JsonReport, Report);

Report.mix(JsonReport, /** @lends JsonReport */ {

	/**
	 * Method to write a JSON report onto the disk which has 'coverage.json' as its file name
	 * @public
	 * @param  {Object} collector The intern collector object
	 */
	writeReport: function (collector) {
		
		var opts = this.opts,
			dir = opts.dir;

		var jsonFile = path.resolve(dir, 'coverage.json');
		fs.writeFileSync(jsonFile, JSON.stringify(collector.getFinalCoverage()), 'utf8');
	}
});

/**
 * Exports the JsonReport
 * @type {Object}
 */
module.exports = JsonReport;
