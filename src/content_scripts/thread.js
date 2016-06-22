(function() {

'use strict';

function Are4AreThread() {}
Are4AreThread.prototype = {
__proto__ : Are4Are.prototype,

// MinThumbnail //////////////////////
MINTHUMBNAIL_SIZE: 60,
MINTHUMBNAIL_HIDE_SCROLLTOP: 300,
showMinTumbnail: function(e) {
	let y = this.win.scrollY;
	if (
		y < this.MINTHUMBNAIL_HIDE_SCROLLTOP ||
		e.detail && e.detail.triggerSrc !== 'pageDownBtn' && e.detail.y && e.detail.y - y < this.MINTHUMBNAIL_SIZE
	) {
		this.fadeOut(this.minThumbnail);
	} else {
		this.fadeIn(this.minThumbnail);
	}
},
appendMinThumbnail: function() {
	// find thread-image
	let threadImage, href;
	for (threadImage = this.firstTag(this.doc, 'BLOCKQUOTE'); threadImage; threadImage = threadImage.previousSibling) {
		if (
			threadImage.tagName == 'A' &&
			threadImage.firstChild &&
			threadImage.firstChild.tagName == 'IMG'
		) {
			href = threadImage.href;
			threadImage = threadImage.firstChild;
			break;
		} else if (threadImage.tagName == 'HR') {
			break;
		}
	}
	if (!threadImage) return;
	threadImage.align = '';
	threadImage.classList.add('thread-image');

	// make minThumbnail
	let img = this.create('IMG', {
		src: threadImage.src,
		id: 'minThumbnailImg',
		'class': 'min-thumbnail-img'
	});
	this.create('A', {
		href: href,
		target: '_blank',
		id: 'minThumbnail',
		'class': 'transparent'
	});
	this.minThumbnail.appendChild(img);
	// waite for FTBucket
	this.on(this.win, 'load', () => { this.body.appendChild(this.minThumbnail); });

	// favicon
	if (this.minThumbnailImg.complete) {
		this.modifyFavicon();
	} else {
		this.on(this.minThumbnailImg, 'load', this.modifyFavicon);
	}
},
modifyFavicon: function() {
	let faviconLink = this.create('LINK', {rel:'shortcut icon', href: this.minThumbnailImg.src});
	this.firstTag(this.doc, 'HEAD').appendChild(faviconLink);
},

// Newer Border ///////////////////////
showNewerBorder: function() {
	this.newerBorder.style = `opacity: 1; width: 100%; top:${this.newerBorder.style.top};`;
},
hideNewerBorder: function() {
	this.newerBorder.style = `top:${this.newerBorder.style.top};`;
},

// Common-tool-buttons ///////////////////////
pageDownBtnOnTouchstart: function(e) {
	e && e.preventDefault();
	this.pageDownBtn.classList.add('active');
	this.pageDownY = this.win.scrollY + Math.round(this.win.innerHeight / 2);
	this.scrollToNoMargin(this.pageDownY, null, 'pageDownBtn');
	this.timeout('RePageDown', this.pageDownBtnOnTouchstart, 1000);
},
pageDownBtnOnTouchend: function(e) {
	this.clearTimeout('RePageDown');
	this.pageDownBtn.classList.remove('active');
	this.pageDownY = null;
},
findTableOrBlockquote: function(checkbox) {
	return checkbox ? (this.parentTag(checkbox, 'TABLE') || this.next(checkbox, 'BLOCKQUOTE')) : null;
},
bottomBtnOnClick: function(e) {
	this.activateToolBar();
	this.scrollToNoMargin(this.body.clientHeight - this.win.innerHeight, null, 'pageDownBtn');
	this.noactivateToolBar();
},
backBtnOnClick: function() {
	this.scrollTo(this.backY);
	this.hideBackBtn({force: true});
},

// Reload  ///////////////////////////
onReloaded: function(doc) {
	// update contdisp
	let contdisp = this.id('contdisp');
	let newContdisp = contdisp && doc.getElementById('contdisp');
	if (newContdisp) {
		contdisp.textContent = newContdisp.textContent;
	}
	// find last Res
	let checkboxs = this.all('INPUT[type="checkbox"][value="delete"]');
	let lastCheckbox = this.arrayLast(checkboxs);
	let lastResNumber = lastCheckbox.name;
	let lastResMarker = this.next(this.findTableOrBlockquote(lastCheckbox), 'DIV');
	// new reses
	let newReses = this.doc.createDocumentFragment();
	let count = 0;
	let table = doc.querySelector(`INPUT[type="checkbox"][value="delete"][name="${lastResNumber}"]`);
	table = this.findTableOrBlockquote(table);
	table = table && table.nextSibling;
	while (table) {
		let next = table.nextSibling;
		if (table.nodeType !== 1) {
			// skip
		} else if (table.tagName === 'TABLE' && table.querySelector('INPUT[type="checkbox"][value="delete"]')) {
			count ++;
			newReses.appendChild(table);
		} else if (table.tagName === 'DIV' && table.style.clear == 'left') {
			break;
		}
		table = next;
	}
	if (!count) {
		this.toast('__MSG_notModified__');
		return;
	}
	this.modifyTables(newReses.querySelector('TABLE'));
	let newerBorderY = lastResMarker.offsetTop;
	this.newerBorder.style.top = newerBorderY + 'px';
	lastResMarker.parentNode.insertBefore(newReses, lastResMarker);
	this.queue(() => { this.scrollTo(newerBorderY, this.showNewerBorder); });
},
reloadBtnOnClick: function(e) {
	this.activateToolBar();
	this.hideNewerBorder();
	this.getDoc(
		this.doc.location.href.replace(/#.*$/, ''),
		this.onReloaded,
		{
			'304': '__MSG_notModified__',
			'404': '__MSG_threadNotFound__'
		}
	);
},

// FindRes ///////////////////////////
hideBackBtn: function(e) {
	if (e.force || this.backY && this.backY <= this.win.scrollY) {
		this.backY = 0;
		this.win.removeEventListener('scrollend', this.func('hideBackBtn'));
		this.backBtn.classList.add('slide-out-h');
	}
},
showBackBtn: function() {
	if (this.backY) return;
	this.backY = this.win.scrollY;
	this.backBtn.classList.remove('slide-out-h');
	this.win.addEventListener('scrollend', this.func('hideBackBtn'));
},
findRes: function(reg, from) {
	while (from && from.tagName !== 'TABLE') {
		from = from.parentNode;
	}
	if (!from) return;
	let table = this.prev(from, 'TABLE');
	while(table) {
		if (reg.test(table.textContent)) {
			return table;
		}
		table = this.prev(table, 'TABLE');
	}
	let bq = this.firstTag(this.doc, 'BLOCKQUOTE');
	if (reg.test(bq.textContent)) {
		return bq;
	}
	return false;
},
quoteTextOnClick: function(e) {
	if (e.target.tagName === 'A') return;
	// find res
	let fuzzyClass = 'not-fuzzy';
	let text = e.target.textContent.replace(/^\s+|\s+$/g, '').replace('>', '');
	let found = this.findRes(new RegExp(this.regEscape(text)), e.target);
	// fuzzy
	if (!found && 10 < text.length) {
		fuzzyClass = 'found-fuzzy';
		let halfLength = Math.round(text.length / 2);
		let fuzzy = `.{${halfLength - 3},${halfLength + 3}}`;
		let fuzzyReg = new RegExp(
			this.regEscape(text.substring(0, halfLength)) + fuzzy +
			'|' + fuzzy + this.regEscape(text.substring(halfLength))
		);
		found = this.findRes(fuzzyReg, e.target);
	}
	if (!found) return;
	let y;
	if (found.tagName === 'TABLE') {
		this.modifyTables(found);
		y = found.offsetTop;
		found = this.firstTag(found, 'BLOCKQUOTE');
	} else {
		y = this.prev(found, 'INPUT').offsetTop;
	}
	// bookmark
	if (this.found) {
		this.found.classList.remove('bookmark', 'found', 'found-fuzzy', 'not-fuzzy');
	}
	this.found = found;
	if (this.backY < this.parentTag(e.target, 'TABLE').offsetTop) {
		this.backY = 0;
	}
	if (!this.backY) {
		this.foundFrom && this.foundFrom.classList.remove('bookmark');
		this.foundFrom = this.parentTag(e.target, 'BLOCKQUOTE');
		this.foundFrom.classList.add('bookmark');
	}
	// scroll
	this.showBackBtn();
	this.scrollTo(y, () => { found.classList.add('bookmark', 'found', fuzzyClass); }, 'quoteText');
},

// Modify Blockquotes ////////////////
// auto link
SIO_PREFIX: {
	su: 'http://www.nijibox5.com/futabafiles/tubu/src/',
	ss: 'http://www.nijibox5.com/futabafiles/kobin/src/',
	sa: 'http://www.nijibox6.com/futabafiles/001/src/',
	sp: 'http://www.nijibox6.com/futabafiles/003/src/',
	sq: 'http://www.nijibox6.com/futabafiles/mid/src/',
	f:  'http://dec.2chan.net/up/src/',
	fu: 'http://dec.2chan.net/up2/src/'
},
// 1:URL, 2:Filename, 3:SioPrefix, 4:SioNumber, 5:Ext
autoLinkRegexp: /(https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-]+)|\b((s[usapq]|fu?)([0-9]{4,})((\.[_a-zA-Z0-9]+)?))/gi,
autoLinkNode: function(node, after) {
	let text = after || node.nodeValue;
	let m = this.autoLinkRegexp.exec(text);
	if (!m) {
		if (node && after) {
			node.appendChild(this.doc.createTextNode(after));
		}
		return false;
	}
	if (!after) {
		node = this.doc.createDocumentFragment();
	}
	// before
	node.appendChild(this.doc.createTextNode(text.substring(0, m.index)));
	// link
	if (m[1]) {
		node.appendChild(this.create('A', { href: m[1], target: '_blank', 'class': 'noref' }, m[1]));
	} else {
		node.appendChild(this.create('A', { href: this.SIO_PREFIX[m[3]] + m[2], target: '_blank' }, m[2]));
	}
	// after
	this.autoLinkNode(node, text.substring(m.index + m[0].length));
	return node;
},
autoLinkTextNode: function(elm) {
	let textNode = elm.lastChild;
	while (textNode) {
		let prev = textNode.previousSibling;
		if (textNode.nodeType === 3) {
			let fragment = this.autoLinkNode(textNode);
			if (fragment) {
				textNode.nodeValue = '';
				elm.insertBefore(fragment, textNode);
			}
		}
		textNode = prev;
	}
},
norefOnClick: function(e) {
	e.preventDefault();
	let href = e.target.href;
	let html = this.format('<html><head><meta http-equiv="Refresh" content="0; url={0}"></head><body></body></html>', href);
	this.win.open(`data:text/html; charset=utf-8,${encodeURIComponent(html)}`);
},
modifyBq: function(bq) {
	if (!bq || bq.getAttribute('data-are4are')) return;
	bq.setAttribute('data-are4are', '1');
	// auto link
	this.autoLinkTextNode(bq);
	Array.forEach(bq.getElementsByTagName('font'), font => { this.autoLinkTextNode(font); });
	// Mail
	let a = bq;
	for (let i = 0; i < 10; i ++) { // when over 10, it's may be HOKANKO...
		a = a.previousSibling;
		if (a.nodeType !== 1) continue;
		if (!a || a.value === 'delete') {
			// find Delete-Checkbox
			break;
		}
		if (a.href && /^mailto:/.test(a.href)) {
			a.parentNode.insertBefore(this.create('SPAN', null, a.textContent), a);
			a.textContent = a.getAttribute('href').replace('mailto:', ' ') + ' ';
			if (a.href.indexOf('mailto:http') === 0) {
				a.href = a.href.replace('mailto:', '');
			}
		}
	}
	// find Qutoted Res
	Array.forEach(bq.querySelectorAll('FONT[color="#789922"]'), font => { font.classList.add('quote-text'); });
},
modifyTables: function(table) {
	if (!table) return;
	for (let i = 0; i < 20 && table; i ++) {
		let rtd = this.firstClass(table, 'rtd');
		if (rtd) {
			this.modifyBq(this.firstTag(rtd, 'BLOCKQUOTE'));
		}
		table = this.next(table, 'TABLE');
	}
},
modifyTablesFromPageLeftTop: function() {
	// find left-top TABLE and modify.
	for (let xy = 3; xy < 30; xy += 3) {
		let table = this.doc.elementFromPoint(xy, xy);
		if (table.tagName === 'HTML') {
			continue;
		} else if (table.tagName !== 'TABLE') {
			table = this.parentTag(table, 'TABLE');
			if (!table) continue;
		}
		let rtd = this.firstClass(table, 'rtd');
		if (rtd && this.parentTag(rtd, 'TABLE') === table) {
			this.modifyTables(table);
			return;
		}
	}
},

// Modify Form ///////////////////////
showForm: function() {
	this.writeBtnY = this.win.scrollY;
	this.writeBtn.classList.add('active');
	this.fadeIn(this.ftbl);
	this.ftxa.focus();
},
hideForm: function() {
	this.win.scrollTo(0, this.writeBtnY);
	this.writeBtn.classList.remove('active');
	this.fadeOut(this.ftbl);
},
onSubmit: function(e) {
	if (this.areIframe.contentDocument.URL.indexOf('http') !== 0) return;
	this.areIframe.contentDocument.defaultView.stop();
	let msg = this.areIframe.contentDocument.getElementsByTagName('DIV')[0] || this.areIframe.contentDocument.body;
	this.toast(msg ? msg.textContent.replace(/リロード$/, '') : '__MSG_writeError__');
	this.areIframe.contentDocument.location.href = 'about:blank';
	if (this.areIframe.contentDocument.querySelector('META[http-equiv="refresh"]')) {
		this.ftxa.value = '';
		(this.first('INPUT[name="upfile"]') || {}).value = '';
		this.hideForm();
		this.timeout(null, this.reloadBtnOnClick, 1000);
	}
},
modifyForm: function() {
	this.ftxa = this.id('ftxa');
	if (!this.ftxa) {
		this.writeBtn.classList.add('disable');
		return;
	}
	this.ftbl = this.id('ftbl');
	if (!this.ftbl) {
		this.writeBtn.classList.add('disable');
		return;
	}
	// change id
	this.ftbl.id = 'ftblFixed';
	this.ftbl.style = '';
	this.ftbl.classList.add('transparent');
	// dummy #ftbl
	this.create('DIV', {id: 'dummyFtbl', 'class': 'transparent' });
	this.dummyFtbl.setAttribute('id', 'ftbl');
	this.body.appendChild(this.dummyFtbl);
	// writeBtn
	this.on(this.writeBtn, 'click', () => {
		if (this.ftbl.classList.contains('transparent')) {
			this.showForm();
		} else {
			this.hideForm();
		}
	});

	// Post with iFrame
	this.ftxa.form.setAttribute('target', 'areIframe');
	this.create(
		'IFRAME', {
		id: 'areIframe',
		name: 'areIframe',
		style: 'display:none',
		src: 'about:blank'
	});
	this.on(this.areIframe, 'load', this.onSubmit);
	this.body.appendChild(this.areIframe);

	// Quote
	this.on(this.body, 'mousedown touchstart', this.showQuoteBtn);
},
showQuoteBtn: function() {
	this.timeout('showQuoteBtn', () => {
		if (!this.doc.getSelection().toString()) return;
		this.quoteBtn.classList.remove('slide-out-h');
	}, 1000);
},
quoteBtnOnClick: function() {
	let text = this.doc.getSelection().toString();
	for (let i = 0; i < 1; i ++) {
		if (!text) break;
		text = text.replace(/^/mg, '>').replace(/^>\n/mg, '').replace(/\n+$/, '');
		if (!text) break;
		this.ftxa.value += (/[^\n]$/.test(this.ftxa.value) ? "\n" : '') + text + "\n";
		this.showForm();
	}
	this.quoteBtn.classList.add('slide-out-h');
},

// Others ////////////////////////////
scrollToThreadImage: function() {
	let i = this.firstClass(this.doc, 'thread-image');
	// 'SMALL' is for Ms.MHT
	i = i && (this.prev(i.parentNode, 'A') || this.prev(i.parentNode, 'SMALL') || i) || this.first('INPUT[value="delete"]');
	if (i) { this.scrollTo(i.offsetTop); }
},

// Main ////////////////////////////////
exec: function(window) {
	// StyleSheet
	this.addCssFile('content_scripts/thread.css');
	if (!this.doc.getElementsByClassName('rts')[0]) {
		this.addCssFile('content_scripts/legacy_thread.css');
	}

	// ToolButtons
	this.backBtn = this.addToolButton('back', this.backBtnOnClick);
	this.backBtn.classList.add('slide-out-h');
	this.quoteBtn = this.addToolButton('quote', this.quoteBtnOnClick);
	this.quoteBtn.classList.add('slide-out-h');
	this.writeBtn = this.addToolButton('write');
	this.addToolButton('reload', this.reloadBtnOnClick);
	this.pageDownBtn = this.addToolButton('pagedown');
	this.on(this.pageDownBtn, 'touchstart mousedown', this.pageDownBtnOnTouchstart);
	this.on(this.pageDownBtn, 'touchend mouseup', this.pageDownBtnOnTouchend);
	this.addToolButton('bottom', this.bottomBtnOnClick);

	// MinThumbnail
	this.appendMinThumbnail();
	this.on(this.win, 'scrollend', this.showMinTumbnail);

	// Modify Blockquote (visible)
	this.modifyBq(this.firstTag(this.doc, 'BLOCKQUOTE'));
	this.modifyTables(this.first('TABLE[border="0"]'));
	this.on(this.win, 'scrollend', this.modifyTablesFromPageLeftTop);

	// Newer Border
	this.create('DIV', { id: 'newerBorder' });
	this.body.appendChild(this.newerBorder);

	// Modify Form
	this.modifyForm();

	// Click Events
	this.on(this.body, 'click', e => {
		if (!e.target) return;
		if (e.target.classList.contains('noref')) {
			this.norefOnClick(e);
		} else if (e.target.classList.contains('quote-text')) {
			this.quoteTextOnClick(e);
		}
	});

	// after repainted
	this.on(this.win, 'load', () => {
		this.scrollToThreadImage();
		this.modifyTablesFromPageLeftTop();
	});
}
}; // end of my extension

// Start ///////////////////////////////
chrome.storage.local.get('urls', r => {
	// Check URL
	let href = document.location.href;
	if (href.indexOf('mode=cat') === -1 && href.match(/^http:\/\/([a-z]+)\.2chan\.net\/[^\/]+\/(res\/[0-9]+|futaba\.php)/)) {
		// default URL
	} else {
		// addtional URL
		if (!(r.urls)) return;
		let reg = new RegExp(r.urls.replace(/\n/g, '|'));
		if (!href.replace(/[#\?].*$/, '').match(reg)) return;
	}
	// url matched
	let myExt = new Are4AreThread();
	myExt.start(window);
});
})();

