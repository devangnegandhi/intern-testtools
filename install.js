
var Firefox = require('./config/lib/Browsers_Firefox');

function intern_testtools_init() {
	//Download firefox
	Firefox.download();
}

intern_testtools_init();