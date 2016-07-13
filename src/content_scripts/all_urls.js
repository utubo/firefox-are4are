(function() {

'use strict';

// Start ///////////////////////////////
chrome.storage.local.get('urls', r => {
	// Check URL
	let href = document.location.href;
	let is1stPage = false;
	if (href.indexOf('mode=cat') === -1 && href.match(/^http:\/\/[a-z]{3}\.2chan\.net\/[a-z\d]+\/(res\/\d+|futaba\.htm|\d+\.htm)/)) {
		is1stPage = href.indexOf('/res/') === -1;
	} else if (href.match(/\/cont\/[a-z]{3}\.2chan\.net_[a-z\d]+_res_\d+\/index.htm$/)) {
		// FTBucket
	} else {
		// addtional URL
		if (!(r.urls)) return;
		let reg = new RegExp(r.urls.replace(/\n/g, '|'));
		if (!href.replace(/[#\?].*$/, '').match(reg)) return;
	}
	// url matched
	let myExt = new Are4AreThread();
	myExt.is1stPage = is1stPage;
	myExt.start(window);
});
})();

