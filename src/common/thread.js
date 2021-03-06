function Are4AreThread() {}
(function() {

'use strict';

Are4AreThread.prototype = {
__proto__ : Are4Are.prototype,

// Util ////////////////////////////////
// find BlockQuote(s)
firstBQ: elm => elm.getElementsByTagName('BLOCKQUOTE')[0],
allBQ: elm => elm.getElementsByTagName('BLOCKQUOTE'),
parentBQ: function(elm) { return this.parentTag(elm, 'BLOCKQUOTE'); },
findTableOrBQ: function(bq) { return !bq ? null : this.parentTag(bq, 'TABLE') || bq; },

// Favicon /////////////////////////////
faviconInfo: null,
calcFaviconInfo: function() {
	if (this.faviconInfo) return this.faviconInfo;
	this.faviconInfo = {
		size: this.computedPx(this.favicon, 'height'),
		hideY: this.y(this.firstBQ(this.doc))
	};
	this.timeout(null, () => { this.faviconInfo = null; }, 5000);
	return this.faviconInfo;
},
showFavicon: function(e) {
	if (!this.favicon) return;
	let info = this.calcFaviconInfo();
	let y = this.scrollY();
	if (
		y < info.hideY ||
		e.detail && e.detail.triggerSrc !== 'pageDownBtn' &&
		e.detail.y && e.detail.y - y < info.size
	) {
		this.fadeOut(this.favicon);
	} else {
		this.fadeIn(this.favicon);
	}
},
appendFavicon: function() {
	// find thread-img
	let threadImg, href;
	for (threadImg = this.firstBQ(this.doc); threadImg; threadImg = threadImg.previousSibling) {
		if (
			threadImg.tagName === 'A' &&
			threadImg.firstChild &&
			threadImg.firstChild.tagName === 'IMG'
		) {
			href = threadImg.href;
			threadImg = threadImg.firstChild;
			break;
		} else if (threadImg.tagName === 'HR') {
			break;
		}
	}
	if (!threadImg) return;
	threadImg.align = '';
	threadImg.classList.add('are4are-thread-img');

	// 1stPage
	if (this.is1stPage) return;

	// make favicon and min thumbnail
	let img = this.create('IMG', {
		src: threadImg.src,
		'class': 'are4are-favicon-img'
	});
	this.create('A', {
		href: href.replace(/\.webm$/, '.webm#'), // prevent open Webm player.
		target: '_blank',
		id: 'are4are_favicon',
		'class': 'are4are-transparent'
	});
	this.favicon.appendChild(img);
	this.on(this.win, 'load', () => { this.body.appendChild(this.favicon); }); // wait for FTBucket
	this.doc.head.appendChild(this.create('LINK', { rel: 'shortcut icon', href: img.src }));
},

// Scroll-buttons //////////////////////
_scrollMax: null,
lastResBottom: function() {
	if (this.is1stPage) return 0;
	try {
		let lastTable = this.findTableOrBQ(this.arrayLast(this.allBQ(this.doc)));
		let y = this.y(lastTable) + lastTable.offsetHeight;
		while (!y) {
			lastTable = lastTable.previousSibling;
			if (!lastTable) return 0;
			y = this.y(lastTable) + lastTable.offsetHeight;
		}
		y += this.computedPx(lastTable, 'margin-bottom');
		y += this.computedPx(this.body, 'line-height');
		y += 5;
		return y;
	} catch (e) { return 0; }
},
clientHeight: function() {
	return this.lastResBottom() || this.body && this.body.clientHeight || this.win.innerHeight;
},
pageDownId: null,
doPageDown: function() {
	let pageDownY = this.scrollY() + Math.round(this.win.innerHeight / 2);
	this.scrollToNoMargin(pageDownY, null, 'pageDownBtn');
},
repeatPageDown: function(func) { // 'func' is dummy for AMO.
	this.doPageDown();
	// ??? "setTimeout or setInterval must have function as 1st arg"
	//this.pageDownId = this.win.setInterval(this.bindFunc('doPageDown'), 1000);
	func = this.bindFunc('doPageDown');
	this.pageDownId = this.win.setInterval(func, 1000);
},
pageDownBtnOnTouchstart: function(e) {
	e && e.preventDefault();
	if (this.pageDownId) {
		this.win.clearInterval(this.pageDownId);
		this.pageDownId = null;
	}
	this.timeout('repeatPageDown', 'repeatPageDown', 300);
},
pageDownBtnOnTouchend: function(e) {
	this.clearTimeout('repeatPageDown');
	if (this.pageDownId) {
		this.win.clearInterval(this.pageDownId);
		this.pageDownId = null;
	} else {
		this.doPageDown();
	}
},
bottomBtnY: 0,
bottomBtnOnClick: function(e) {
	if (this.scrollY() < this.bottomBtnY) {
		this.scrollTo(this.bottomBtnY);
	} else {
		this.scrollToNoMargin(this.scrollMax(), null, 'pageDownBtn');
	}
},
resetBottomBtn: function(force) {
	if (!this.bottomBtn) return;
	if (force || this.bottomBtnY && this.bottomBtnY < this.scrollY() + this.win.innerHeight) {
		this.bottomBtn.classList.remove('are4are-toolbtn--newerborder');
		this.bottomBtnY = 0;
	}
},
backBtnOnClick: function() {
	this.scrollTo(this.history[1].y, () => { this.hideBackBtn({force: true}); });
},

// Newer Border ////////////////////////
showNewerBorder: function() {
	this.newerBorder.style = `opacity: 1; width: 100%; top:${this.newerBorder.style.top};`;
},
hideNewerBorder: function() {
	this.newerBorder.style = `top:${this.newerBorder.style.top};`;
	this.resetBottomBtn(true);
},

// Reload  /////////////////////////////
onReloaded: function(newDoc) {
	// update contdisp
	let oldContdisp = this.id('contdisp');
	let newContdisp = oldContdisp && newDoc.getElementById('contdisp');
	if (newContdisp) {
		oldContdisp.textContent = newContdisp.textContent;
	}
	// find last Res
	let oldBQs = this.allBQ(this.doc);
	let oldBQCount = oldBQs.length;
	// new reses
	let newReses = this.doc.createDocumentFragment();
	let count = 0;
	let table = this.findTableOrBQ(this.allBQ(newDoc)[oldBQCount]);
	while (table) {
		let next = table.nextSibling;
		if (table.nodeType !== 1) {
			// skip
		} else if (table.tagName === 'TABLE' && this.firstBQ(table)) {
			count ++;
			newReses.appendChild(table);
		} else if (table.tagName === 'DIV' && table.style.clear === 'left') {
			break;
		}
		table = next;
	}
	if (!count) {
		this.toast('__MSG_notModified__');
		return;
	}
	this.modifyTables(newReses.querySelector('TABLE')); // DocumentFragment doesn't have getElementsByTagName.
	let lastTable = this.findTableOrBQ(oldBQs[oldBQCount - 1]);
	let newerBorderY = this.y(lastTable) + lastTable.offsetHeight;
	this.newerBorder.style.top = newerBorderY + 'px';
	lastTable.parentNode.insertBefore(newReses, lastTable.nextSibling);
	this.resetScrollMax();
	if (newerBorderY < this.scrollY() + this.win.innerHeight) {
		// auto scroll
		this.queue(() => { this.scrollTo(newerBorderY, this.showNewerBorder); });
	} else {
		// show toast
		this.toast('__MSG_nNewReplies__', count);
		this.showNewerBorder();
		this.bottomBtnY = newerBorderY;
		this.bottomBtn.classList.add('are4are-toolbtn--newerborder');
	}
},
reloadBtnOnClick: function(e) {
	if (this.reloadBtn.classList.contains('are4are-toolbtn--logsite')) {
		this.doc.location.href = this.reloadBtn.getAttribute('data-href');
		return;
	}
	this.hideNewerBorder();
	this.reloadBtn.classList.add('are4are-spin', 'are4are-spinend');
	this.getDoc(
		this.doc.location.href.replace(/#.*$/, ''),
		this.onReloaded,
		st => {
			this.reloadBtn.classList.remove('are4are-spin');
			if (st === 404) {
				this.changeToLogsiteButton();
			}
		}
	);
},
changeToLogsiteButton: function(e) {
	if (!this.ini) return;
	if (!this.ini.logsite) return;
	if (! /https?:\/\/(.+)\.2chan\.net\/(.+)\/res\/(\d+).htm/.test(this.doc.location.href)) return;
	let href = this.ini.logsite
			.replace('$s', RegExp.$1)
			.replace('$b', RegExp.$2)
			.replace('$r', RegExp.$3);
	this.reloadBtn.setAttribute('data-href', href);
	this.reloadBtn.className = 'are4are-toolbtn are4are-toolbtn--logsite';
},

// FindRes /////////////////////////////
history: [], // Index starts 1. history[0] is now position.
hideBackBtn: function(e) {
	if (e.force || this.history[1] && this.history[1].y <= this.scrollY()) {
		let b = this.history.shift();
		this.fadeoutBookmark(b);
		this.showBookmark(this.history[0]);
		if (!this.history[1]) {
			this.flexOut(this.backBtn);
		}
	}
},
findRes: function(reg, from) {
	from = from && (from.tagName === 'TABLE' ? from : this.parentTag(from, 'TABLE'));
	if (!from) return;
	if (from.classList.contains('are4are-quote-org')) {
		from = this.first(`table[data-are4are-res-number="${from.getAttribute('data-are4are-res-number')}"`);
	}
	for (let table = this.prev(from, 'TABLE'); table; table = this.prev(table, 'TABLE')) {
		if (reg.test(table.textContent)) {
			return table;
		}
	}
	let bq = this.firstBQ(this.doc);
	if (reg.test(bq.textContent)) {
		return bq;
	}
	return false;
},
// fadeout bookmak -> (animation 1s.) -> remove bookmark
bookmarkRemoveQueue: [],
fadeoutBookmark: function(b) {
	if (!b || !b.found) return;
	b.foundFrom.classList.add('are4are-bookmark-fadeout');
	b.found.classList.add('are4are-bookmark-fadeout');
	this.bookmarkRemoveQueue.push(b);
	this.timeout(null, 'removeBookmark', 1000);
},
removeBookmark: function() {
	let b = this.bookmarkRemoveQueue.shift();
	b.foundFrom.classList.remove('are4are-bookmark', 'are4are-bookmark-fadeout');
	b.foundFrom = null;
	b.found.classList.remove('are4are-bookmark', 'are4are-bookmark-fadeout', 'are4are-found', 'are4are-found-fuzzy', 'are4are-not-fuzzy');
	b.found = null;
},
showBookmark: function(b) {
	if (!b || !b.found) return;
	b.foundFrom.classList.add('are4are-bookmark');
	b.found.classList.add('are4are-bookmark', 'are4are-found', b.isFuzzy ? 'are4are-found-fuzzy' : 'are4are-not-fuzzy');
},
searchQuoteOrg: function(e) {
	if (e.target.tagName === 'A') return null;
	// find res
	let isFuzzy = false;
	let text = e.target.textContent.replace(/^\s+|\s+$/g, '').replace('>', '');
	let found = this.findRes(new RegExp('(^|[^>])' + this.regEscape(text)), e.target);
	// fuzzy
	if (!found && 10 < text.length) {
		isFuzzy = true;
		let halfLength = Math.round(text.length / 2);
		let fuzzy = `.{${halfLength - 3},${halfLength + 3}}`;
		let fuzzyReg = new RegExp(
			this.regEscape(text.substring(0, halfLength)) + fuzzy +
			'|' + fuzzy + this.regEscape(text.substring(halfLength))
		);
		found = this.findRes(fuzzyReg, e.target);
	}
	if (!found) return null;
	return { isFuzzy: isFuzzy, text: text, found: found };
},
quoteTextOnClick: function(e) {
	if (this.ini.desktopStyle) {
		let quoteOrg = this.firstClass(e.target, 'are4are-quote-org');
		if (quoteOrg) {
			quoteOrg.remove();
		}
	}
	let org = this.searchQuoteOrg(e);
	if (!org) return;
	let isFuzzy = org.isFuzzy;
	let text = org.text;
	let found = org.found;
	let y;
	if (found.tagName === 'TABLE') {
		this.modifyTables(found);
		y = this.y(found);
		found = this.firstBQ(found);
	} else {
		y = this.y(this.prev(found, 'INPUT'));
	}
	// bookmark
	let sy = this.scrollY();
	if (!this.history[1]) {
		this.history[0] = { y: sy };
	} else if (sy != this.history[0].y) {
		this.history.unshift({ y: sy });
	}
	let b = {
		y: y,
		found: found,
		foundFrom: this.parentBQ(e.target),
		isFuzzy: isFuzzy
	};
	if (y < sy) {
		this.scrollTo(y, () => {
			this.showBookmark(b);
			this.flexIn(this.backBtn);
			b.y = this.scrollendDetail.y; // actually scrollY
			this.history.unshift(b);
		}, 'quoteText');
	} else {
		this.showBookmark(b);
		this.history.unshift(b);
	}
},
quoteTextOnEnter: function(e) {
	let quoteOrg = this.firstClass(e.target, 'are4are-quote-org');
	if (quoteOrg) {
		this.fadeIn(quoteOrg);
		return;
	}
	let org = this.searchQuoteOrg(e);
	if (!org) return;
	if (org.found.tagName === 'TABLE') {
		org.found = this.firstBQ(org.found);
	}
	this.modifyBQ(org.found);
	let td = this.parentTag(org.found, 'TD').cloneNode(true);
	td.classList.remove('rtd');
	td.classList.add('are4are-quote-org-rtd');
	let n = td.textContent.match(/No\.(\d+)/)[1];
	this.parentTag(org.found, 'TABLE').setAttribute('data-are4are-res-number', n);
	quoteOrg = this.create('TABLE', { 'data-are4are-res-number': n, 'class': 'are4are-quote-org are4are-transparent' });
	quoteOrg.appendChild(td, quoteOrg.firstChild);
	e.target.appendChild(quoteOrg);
	this.setupBQEvent(this.firstBQ(td));
	quoteOrg.style.top = '' + (0 - this.computedPx(quoteOrg, 'height')) + 'px';
	this.queue(() => { this.fadeIn(quoteOrg); });
},
quoteTextOnLeave: function(e) {
	let quoteOrg = this.firstClass(e.target, 'are4are-quote-org');
	if (quoteOrg) {
		this.fadeOut(quoteOrg);
		this.timeout(null, () => { quoteOrg.remove(); }, 500);
	}
},

// Modify Blockquotes //////////////////
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
// 1:URL(normal), 2:Filename, 3:SioPrefix, 4:Number, 5:Ext
autoLinkRegexp: /(https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-]+)|\b((s[usapq]|fu?)([0-9]{4,})((\.[_a-zA-Z0-9]+)?))/i,
autoLinkTextNode: function(node, nextText) {
	let text = nextText || node.nodeValue;
	let m = this.autoLinkRegexp.exec(text);
	if (!m) {
		if (node && nextText) {
			node.appendChild(this.doc.createTextNode(nextText));
		}
		return null;
	}
	if (!nextText) {
		node = this.doc.createDocumentFragment();
	}
	// prevText
	node.appendChild(this.doc.createTextNode(text.substring(0, m.index)));
	// link
	if (m[1]) {
		node.appendChild(this.create('A', { href: m[1], target: '_blank', 'rel': 'noreferrer', 'class': 'are4are-auto-link' }, m[1]));
	} else {
		node.appendChild(this.create('A', { href: this.SIO_PREFIX[m[3]] + m[2], target: '_blank', 'class': 'are4are-auto-link' }, m[2]));
	}
	// nextText
	this.autoLinkTextNode(node, text.substring(m.index + m[0].length));
	return node;
},
autoLink: function(elm) {
	let textNode = elm.lastChild;
	while (textNode) {
		let prev = textNode.previousSibling;
		if (textNode.nodeType === 3) {
			let fragment = this.autoLinkTextNode(textNode);
			if (fragment) {
				textNode.nodeValue = '';
				elm.insertBefore(fragment, textNode);
			}
		}
		textNode = prev;
	}
},
toggleInlineImage: function(elm) {
	if (elm.previousSibling &&
		elm.previousSibling.classList &&
		elm.previousSibling.classList.contains('are4are-inline-image')
	) {
		elm.previousSibling.remove();
	} else {
		let a = this.create('A', { href: elm.href, target: '_blank', 'class': 'are4are-inline-image' });
		a.appendChild(this.create('IMG', { src: elm.href, 'class': 'are4are-inline-image' }));
		elm.parentNode.insertBefore(a, elm);
	}
	return false;
},
modifyFirstHeader: function(bq) {
	if (!bq) return;
	let e = bq;
	for (let i = 0; i < 15; i ++) { // when over 15, it's may be HOKANKO...
		e = e.previousSibling;
		if (!e) break;
		if (e.nodeType !== 1) continue;
		// delete-checkbox
		if (e.value === 'delete') {
			e.classList.add('are4are-delete-1st');
			break;
		}
		// del
		if (e.classList.contains('del')) {
			e.classList.add('are4are-del-1st');
		}
	}
},
setupBQEvent: function(bq) {
	if (!this.ini.desktopStyle) return;
	Array.forEach(bq.getElementsByTagName('FONT'), font => {
		this.on(font, 'mouseenter', e => {
		if (!e.target) return;
			if (e.target.textContent && e.target.textContent.startsWith('>')) {
				this.quoteTextOnEnter(e);
			}
		});
		this.on(font, 'mouseleave', e => {
			if (e.target.textContent && e.target.textContent.startsWith('>')) {
				this.quoteTextOnLeave(e);
			}
		});
	});
},
modifyBQ: function(bq) {
	if (!bq || bq.getAttribute('data-are4are')) return;
	bq.setAttribute('data-are4are', '1');
	// auto-link
	this.autoLink(bq);
	Array.forEach(bq.getElementsByTagName('FONT'), font => { this.autoLink(font); });
	// header
	let e = bq;
	loop:
	for (let i = 0; i < 15; i ++) { // when over 15, it's may be HOKANKO...
		e = e.previousSibling;
		if (!e) break loop;
		switch (e.nodeType) {
			case 1:
				// delete-checkbox
				if (e.value === 'delete') break loop;
				// mail
				let a = e.tagName !== 'FONT' ? e : e.getElementsByTagName('A')[0];
				if (!a || !a.href) break;
				if (a.href.indexOf('mailto:') !== 0) break;
				a.classList.add('are4are-mail');
				let s = this.create('SPAN', { 'class': 'are4are-shown-mail' }, a.getAttribute('href').replace(/^mailto:/, ''));
				s = this.autoLink(s) || s;
				a.parentNode.insertBefore(s, a.nextSibling);
				break loop;
			case 3:
				// id
				let p = e.nodeValue.indexOf('ID:');
				if (p === -1) break;
				let node = this.doc.createDocumentFragment();
				node.appendChild(this.create('SPAN', { 'class': 'are4are-id' }, e.nodeValue.substring(p, p + 11)));
				node.appendChild(this.doc.createTextNode(e.nodeValue.substring(p + 11, e.nodeValue.length)));
				e.nodeValue = e.nodeValue.substring(0, p);
				e.parentNode.insertBefore(node, e.nextSibling);
				break;
		}
	}
	this.setupBQEvent(bq);
},
modifyTables: function(table) {
	if (!table) return;
	for (let i = 0; i < 20 && table; i ++) {
		this.modifyBQ(this.firstBQ(table));
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
		if (this.firstBQ(table)) {
			this.modifyTables(table);
			return;
		}
	}
},

// Modify Form /////////////////////////
showForm: function() {
	this.quoteSelection();
	this.writeBtnY = this.scrollY();
	this.writeBtn.classList.add('are4are-toolbtn-hold');
	this.fadeIn(this.ftbl);
	this.ftxa.focus();
},
hideForm: function() {
	this.win.scrollTo(0, this.writeBtnY);
	this.writeBtn.classList.remove('are4are-toolbtn-hold');
	this.fadeOut(this.ftbl);
},
onSubmit: function(e) {
	if (this.iframe.contentDocument.URL.indexOf('http') !== 0) return;
	this.iframe.contentDocument.defaultView.stop();
	let msg = this.iframe.contentDocument.getElementsByTagName('DIV')[0] || this.iframe.contentDocument.body;
	this.toast(msg ? msg.textContent.replace(/リロード$/, '') : '__MSG_writeError__');
	this.iframe.contentDocument.location.href = 'about:blank';
	if (this.iframe.contentDocument.querySelector('META[http-equiv="refresh"]')) {
		this.ftxa.value = '';
		(this.first('INPUT[name="upfile"]') || {}).value = '';
		this.hideForm();
		this.timeout(null, 'reloadBtnOnClick', 1000);
	}
},
modifyForm: function() {
	this.ftxa = this.id('ftxa') || this.firstTag('TEXTAREA');
	if (!this.ftxa) {
		return;
	}
	this.ftbl = this.id('ftbl') || this.parentTag(this.ftxa, 'TABLE');
	if (!this.ftbl) {
		return;
	}
	// change id
	this.ftbl.id = 'are4are_ftblFixed';
	this.ftbl.style = '';
	this.ftbl.classList.add('are4are-transparent');
	this.firstTag(this.ftbl, 'TBODY').classList.add('are4are-ftblFixed-tbody');
	// dummy #ftbl
	this.create('DIV', {id: 'are4are_dummyFtbl', 'class': 'are4are-transparent' });
	this.dummyFtbl.setAttribute('id', 'ftbl');
	this.body.appendChild(this.dummyFtbl);
	// form-button
	let submit = this.ftbl.querySelector('INPUT[type="submit"]');
	if (submit) {
		submit.classList.add('are4are-form-button');
	}
	// writeBtn (toolbar)
	this.writeBtn.classList.remove('are4are-disable');
	this.on(this.writeBtn, 'click', () => {
		if (this.ftbl.classList.contains('are4are-transparent')) {
			this.showForm();
		} else {
			this.hideForm();
		}
	});

	// Post with iFrame
	this.ftxa.form.setAttribute('target', 'are4are_iframe');
	this.create(
		'IFRAME', {
		id: 'are4are_iframe',
		name: 'are4are_iframe',
		style: 'display:none',
		src: 'about:blank'
	});
	this.on(this.iframe, 'load', 'onSubmit');
	this.body.appendChild(this.iframe);
},
quoteSelection: function() {
	let text = this.doc.getSelection().toString();
	if (!text) return;
	text = text.replace(/^/mg, '>').replace(/^>\n/mg, '').replace(/\n+$/, '');
	if (!text) return;
	this.ftxa.value += (/[^\n]$/.test(this.ftxa.value) ? "\n" : '') + text + "\n";
},

// Others //////////////////////////////
scrollToThreadImg: function() {
	let i = this.firstClass('are4are-thread-img');
	// 'SMALL' is for Ms.MHT
	i = i && (this.prev(i.parentNode, 'A') || this.prev(i.parentNode, 'SMALL') || i) || this.first('INPUT[value="delete"]');
	if (!i) return;
	let y = this.y(i);
	this.win.scrollTo(0, y);
	// TODO: nnnnnn !!!!11
	this.timeout(null, () => {
		let y2 = this.y(i);
		if (y != y2) {
			this.win.scrollTo(0, y2);
		}
	}, 500);
},
afterModified: function() {
	if (this.scrollY() === 0) {
		this.queue('scrollToThreadImg'); // wait for Ms.MHT
	} else {
		this.modifyTablesFromPageLeftTop();
	}
},
scrollend: function(e) {
	this.showFavicon(e);
	this.modifyTablesFromPageLeftTop(e);
	this.hideBackBtn(e);
	this.resetBottomBtn();
},

lazySetup: function() {
	// Newer Border
	this.create('DIV', { id: 'are4are_newerBorder' });
	this.body.appendChild(this.newerBorder);

	// Click events
	this.on(this.body, 'click', e => {
		if (!e.target) return;
		if (e.target.textContent && e.target.textContent.startsWith('>')) {
			this.quoteTextOnClick(e);
		}
		if (this.ini.inlineImage &&
			e.target.classList.contains('are4are-auto-link') &&
			e.target.href.match(/\.(jpg|jpeg|png|gif|svg)$/)
		) {
			if (!this.toggleInlineImage(e.target)) {
				e.preventDefault();
				return false;
			}
		}
	});

	// other events
	this.on(this.win, 'scrollend', 'scrollend');
},

// Main ////////////////////////////////
cssFile: function() {
	return this.ini.desktopStyle ? 'common/thread_desktop.css' : 'common/thread.css';
},
cssFileTransition: 'common/thread_transition.css',
exec: function() {
	// CSS
	if (!this.firstClass('rts')) {
		this.addCssFile('content_scripts/legacy_thread.css');
	}

	// ToolButtons
	this.backBtn = this.addToolButton('back', 'backBtnOnClick', 'are4are-flexout');
	this.writeBtn = this.addToolButton('write', null, 'are4are-disable', 'are4are-toolbtn-tab');
	if (this.is1stPage) {
		this.addToolButton('reload', null, 'are4are-disable');
	} else {
		this.reloadBtn = this.addToolButton('reload', 'reloadBtnOnClick');
	}
	if (this.doc.title === '404 File Not Found') {
		this.changeToLogsiteButton();
	}
	this.pageDownBtn = this.addToolButton('pagedown');
	this.on(this.pageDownBtn, 'touchstart', 'pageDownBtnOnTouchstart');
	this.on(this.pageDownBtn, 'touchend', 'pageDownBtnOnTouchend');
	this.bottomBtn = this.addToolButton('bottom', 'bottomBtnOnClick');

	// Thread image
	this.appendFavicon();

	// Modify Blockquotes (visible)
	let b = this.allBQ(this.doc);
	this.modifyBQ(b[0]);
	this.modifyFirstHeader(b[0]);
	this.modifyTables(this.findTableOrBQ(b[1]));

	// Modify Form
	this.modifyForm();

	// end of exec
	this.afterModified();
	this.queue('lazySetup');
}
};
})();

