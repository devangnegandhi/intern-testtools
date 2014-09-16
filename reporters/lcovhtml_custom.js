define([
    'intern/lib/args',
    'intern/lib/util',
    'dojo/topic',
    'dojo/node!fs',
    'dojo/node!path',
    'dojo/node!util',
    'dojo/node!glob',
], function (args, util, topic, fs, path, utility, glob) {

    return {

        start: function () {
            var files = glob.sync('**/*.js');
            var filteredFiles = [];
            var filedata;
            var coverage;
            var internConfig = require(args.config);

            for( var i = 0; i< files.length; i++) {
                if(!internConfig.excludeInstrumentation.test(files[i])) {
                    filedata = fs.readFileSync(files[i], "utf8");
                    util.instrument(filedata.toString(), files[i]);
                    coverage = util.getInstrumenter().lastFileCoverage();
                    // console.log(__internCoverage);
                    //console.log(coverage);
                    files[i] = path.resolve(files[i]);
                    var covObj = {};
                    covObj[files[i]] = coverage;
                    topic.publish('/coverage', null, covObj);

                    // var sandbox = {};

                    // vm.runInThisContext(coverage);
                    // console.log(utility.inspect(sandbox));
                }
            }

            // console.log(filteredFiles);
        },

        '/coverage': function (sessionId, coverage) {
            //console.log(coverage);
        },

        stop: function () {
            // var files = [
            //     '/home/devang/Projects/intern-testtools/reporters/html.js',
            //     '/home/devang/Projects/intern-testtools/reporters/json.js',
            //     '/home/devang/Projects/intern-testtools/reporters/lcovhtml_custom.js',
            //     '/home/devang/Projects/intern-testtools/reporters/ReportDir.js',
            //     '/home/devang/Projects/intern-testtools/reporters/summary.js'
            // ]; 

            // for (var i = 0; i < files.length; ++i) {
            //     console.log('*************** ' + files[i]);
            //     //topic.publish('/coverage', createCoverageForFile(files[i]));
            // };
        }
    };
});