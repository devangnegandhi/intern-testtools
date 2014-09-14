define([
    'dojo/topic'
], function (topic) {

    return {
        '/coverage': function (sessionId, coverage) {
        },

        stop: function () {
            var files = [
                '/home/devang/Projects/intern-testtools/reporters/html.js',
                '/home/devang/Projects/intern-testtools/reporters/json.js',
                '/home/devang/Projects/intern-testtools/reporters/lcovhtml_custom.js',
                '/home/devang/Projects/intern-testtools/reporters/ReportDir.js',
                '/home/devang/Projects/intern-testtools/reporters/summary.js'
            ]; 

            for (var i = 0; i < files[i].length; ++i) {
                console.log('*************** ' + createCoverageForFile(files[i]));
                topic.publish('/coverage', createCoverageForFile(files[i]));
            };
        }
    };
});