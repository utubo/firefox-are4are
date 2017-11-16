(function() {

'use strict';

// Start ///////////////////////////////
chrome.storage.local.get(['urls', 'logsite', 'desktopStyle', 'inlineImage'], res => {
	// Check URL
	let href = document.location.href;
	let is1stPage = false;
	if (href.indexOf('mode=cat') === -1 && href.match(/^https?:\/\/[a-z]{3}\.2chan\.net\/[a-z\d]+\/(res\/\d+|futaba\.htm|\d+\.htm)/)) {
		is1stPage = href.indexOf('/res/') === -1;
	} else if (href.match(/\/cont\/[a-z]{3}\.2chan\.net_[a-z\d]+_res_\d+\/index.htm$/)) {
		// FTBucket
	} else if (href.match(/\/futaba\.php\?res=\d+$/)) {
		// hinanjo no hinanjo
	} else {
		// addtional URL
		if (!(res.urls)) return;
		let reg = new RegExp(res.urls.replace(/\n/g, '|'));
		if (!href.replace(/[#\?].*$/, '').match(reg)) return;
	}
	// url matched
	let myExt = new Are4AreThread();
	myExt.is1stPage = is1stPage;
	myExt.ini = { logsite: res.logsite, desktopStyle: res.desktopStyle, inlineImage: res.inlineImage };
	myExt.start(window);
});
})();

