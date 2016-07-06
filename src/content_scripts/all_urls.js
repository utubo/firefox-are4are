(function() {

'use strict';

// Start ///////////////////////////////
chrome.storage.local.get('urls', r => {
	// Check URL
	let href = document.location.href;
	if (href.indexOf('mode=cat') === -1 && href.match(/^http:\/\/([a-z]+)\.2chan\.net\/[^\/]+\/(res\/\d+|futaba\.htm|\d+\.htm)/)) {
		// default URL
	} else {
		// addtional URL
		if (!(r.urls)) return;
		let reg = new RegExp(r.urls.replace(/\n/g, '|'));
		if (!href.replace(/[#\?].*$/, '').match(reg)) return;
	}
	// url matched
	let myExt = new Are4AreThread();
	myExt.is1stPage = href.match(/^http:\/\/[a-z]+\.2chan\.net\/[^\/]+\/(futaba\.htm|\d+\.htm)$/);
	myExt.start(window);
});
})();

