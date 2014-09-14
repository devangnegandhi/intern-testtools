/**
 * @copyright Copyright (C) 2014 Devang Negandhi - All Rights Reserved
 */
define([
	'./ReportDir',
	'dojo/node!istanbul/lib/collector',
	'dojo/node!istanbul/lib/report/html',
	'dojo/node!istanbul/index'
], function (ReportDir, Collector, Reporter) {
	var collector = new Collector();
	var reporter = new Reporter({ dir: ReportDir.dir });

	return {
		'/coverage': function (sessionId, coverage) {
			collector.add(coverage);
		},

		stop: function () {
			reporter.writeReport(collector, true);
		}
	};
});
