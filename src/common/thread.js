function Are4AreThread() {}
(function() {

'use strict';

Are4AreThread.prototype = {
__proto__ : Are4Are.prototype,

// Util //////////////////////////////
findTableOrBlockquote: function(bq) {
	return !bq ? null : this.parentTag(bq, 'TABLE') || bq;
},
// find BlockQuote(s)
firstBQ: elm => elm.getElementsByTagName('BLOCKQUOTE')[0],
allBQ: elm => elm.getElementsByTagName('BLOCKQUOTE'),
parentBQ: function(elm) { return this.parentTag(elm, 'BLOCKQUOTE'); },

// MinThumbnail //////////////////////
MINTHUMBNAIL_SIZE: 60,
MINTHUMBNAIL_HIDE_SCROLLTOP: 300,
showMinTumbnail: function(e) {
	if (!this.minThumbnail) return;
	let y = this.scrollY();
	if (
		y < this.MINTHUMBNAIL_HIDE_SCROLLTOP ||
		e.detail && e.detail.triggerSrc !== 'pageDownBtn' &&
		e.detail.y && e.detail.y - y < this.MINTHUMBNAIL_SIZE
	) {
		this.fadeOut(this.minThumbnail);
	} else {
		this.fadeIn(this.minThumbnail);
	}
},
appendMinThumbnail: function() {
	// find thread-image
	let threadImage, href;
	for (threadImage = this.firstBQ(this.doc); threadImage; threadImage = threadImage.previousSibling) {
		if (
			threadImage.tagName === 'A' &&
			threadImage.firstChild &&
			threadImage.firstChild.tagName === 'IMG'
		) {
			href = threadImage.href;
			threadImage = threadImage.firstChild;
			break;
		} else if (threadImage.tagName === 'HR') {
			break;
		}
	}
	if (!threadImage) return;
	threadImage.align = '';
	threadImage.classList.add('are4are-thread-image');

	// 1stPage
	if (this.is1stPage) return;

	// make minThumbnail
	let img = this.create('IMG', {
		src: threadImage.src,
		id: 'are4are_minThumbnailImg',
		'class': 'are4are-min-thumbnail-img'
	});
	this.create('A', {
		href: href,
		target: '_blank',
		id: 'are4are_minThumbnail',
		'class': 'are4are-transparent'
	});
	this.minThumbnail.appendChild(img);
	// wait for FTBucket
	this.on(this.win, 'load', () => { this.body.appendChild(this.minThumbnail); });

	// favicon
	if (this.minThumbnailImg.complete) {
		this.modifyFavicon();
	} else {
		this.on(this.minThumbnailImg, 'load', 'modifyFavicon');
	}
},
modifyFavicon: function() {
	let faviconLink = this.create('LINK', { rel: 'shortcut icon', href: this.minThumbnailImg.src });
	this.firstTag('HEAD').appendChild(faviconLink);
},

// Scroll-buttons ////////////////////////////
_scrollMax: null,
clientHeight: function() {
	if (this.is1stPage) return this.body && this.body.clientHeight || this.win.innerHeight;
	try {
		let lastTable = this.findTableOrBlockquote(this.arrayLast(this.allBQ(this.doc)));
		let y = lastTable.offsetTop + lastTable.offsetHeight;
		while (!y) {
			lastTable = lastTable.previousSibling;
			if (!lastTable) return this.body.clientHeight;
			y = lastTable.offsetTop + lastTable.offsetHeight;
		}
		y += parseInt(this.win.getComputedStyle(lastTable).getPropertyValue('margin-bottom'), 10);
		y += parseInt(this.win.getComputedStyle(this.body).getPropertyValue('line-height'), 10);
		y += 5;
		return y;
	} catch (e) {
		return this.body && this.body.clientHeight || this.win.innerHeight;
	}
},
pageDownBtnOnTouchstart: function(e) {
	e && e.preventDefault();
	this.pageDownBtn.classList.add('active');
	this.pageDownY = this.scrollY() + Math.round(this.win.innerHeight / 2);
	this.scrollToNoMargin(this.pageDownY, null, 'pageDownBtn');
	this.timeout('RePageDown', 'pageDownBtnOnTouchstart', 1000);
},
pageDownBtnOnTouchend: function(e) {
	this.clearTimeout('RePageDown');
	this.pageDownBtn.classList.remove('active');
	this.pageDownY = null;
},
bottomBtnOnClick: function(e) {
	this.activateToolBar();
	this.scrollToNoMargin(this.scrollMax(), null, 'pageDownBtn');
	this.noactivateToolBar();
},
backBtnOnClick: function() {
	this.scrollTo(this.backY);
	this.hideBackBtn({force: true});
},

// Newer Border ///////////////////////
showNewerBorder: function() {
	this.newerBorder.style = `opacity: 1; width: 100%; top:${this.newerBorder.style.top};`;
},
hideNewerBorder: function() {
	this.newerBorder.style = `top:${this.newerBorder.style.top};`;
},

// Reload  ///////////////////////////
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
	let table = this.findTableOrBlockquote(this.allBQ(newDoc)[oldBQCount]);
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
	let lastTable = this.findTableOrBlockquote(oldBQs[oldBQCount - 1]);
	let newerBorderY = lastTable.offsetTop + lastTable.offsetHeight;
	this.newerBorder.style.top = newerBorderY + 'px';
	lastTable.parentNode.insertBefore(newReses, lastTable.nextSibling);
	this.resetScrollMax();
	this.queue(() => { this.scrollTo(newerBorderY, this.showNewerBorder); });
},
reloadBtnOnClick: function(e) {
	this.activateToolBar();
	this.hideNewerBorder();
	this.getDoc(this.doc.location.href.replace(/#.*$/, ''), this.onReloaded);
},

// FindRes ///////////////////////////
hideBackBtn: function(e) {
	if (e.force || this.backY && this.backY <= this.scrollY()) {
		this.backY = 0;
		this.backBtn.classList.add('are4are-hide');
	}
},
showBackBtn: function() {
	if (this.backY) return;
	this.backY = this.win.scrollY;
	this.backBtn.classList.remove('are4are-hide');
	this.win.addEventListener('scrollend', this.bindFunc('hideBackBtn'));
},
findRes: function(reg, from) {
	from = from && (from.tagName === 'TABLE' ? from : this.parentTag(from, 'TABLE'));
	if (!from) return;
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
quoteTextOnClick: function(e) {
	if (e.target.tagName === 'A') return;
	// find res
	let fuzzyClass = 'not-fuzzy';
	let text = e.target.textContent.replace(/^\s+|\s+$/g, '').replace('>', '');
	let found = this.findRes(new RegExp(this.regEscape(text)), e.target);
	// fuzzy
	if (!found && 10 < text.length) {
		fuzzyClass = 'are4are-found-fuzzy';
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
		found = this.firstBQ(found);
	} else {
		y = this.prev(found, 'INPUT').offsetTop;
	}
	// bookmark
	if (this.found) {
		this.found.classList.remove('are4are-bookmark', 'are4are-found', 'are4are-found-fuzzy', 'are4are-not-fuzzy');
	}
	this.found = found;
	if (this.backY < this.parentTag(e.target, 'TABLE').offsetTop) {
		this.backY = 0;
	}
	if (!this.backY) {
		this.foundFrom && this.foundFrom.classList.remove('are4are-bookmark');
		this.foundFrom = this.parentBQ(e.target);
		this.foundFrom.classList.add('are4are-bookmark');
	}
	// scroll
	this.showBackBtn();
	this.scrollTo(y, () => { found.classList.add('are4are-bookmark', 'are4are-found', fuzzyClass); }, 'quoteText');
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
// 1:URL(normal), 2:Filename, 3:SioPrefix, 4:Number, 5:Ext
autoLinkRegexp: /(https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-]+)|\b((s[usapq]|fu?)([0-9]{4,})((\.[_a-zA-Z0-9]+)?))/gi,
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
		node.appendChild(this.create('A', { href: m[1], target: '_blank', 'class': 'noref' }, m[1]));
	} else {
		node.appendChild(this.create('A', { href: this.SIO_PREFIX[m[3]] + m[2], target: '_blank' }, m[2]));
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
norefOnClick: function(e) {
	e.preventDefault();
	let html = `<html><head><meta http-equiv="Refresh" content="0; url=${e.target.href}"></head><body></body></html>`;
	this.win.open(`data:text/html; charset=utf-8,${encodeURIComponent(html)}`);
},
modifyBQ: function(bq) {
	if (!bq || bq.getAttribute('data-are4are')) return;
	bq.setAttribute('data-are4are', '1');
	// auto link
	this.autoLink(bq);
	Array.forEach(bq.getElementsByTagName('font'), font => { this.autoLink(font); });
	// res header
	let a = bq;
	for (let i = 0; i < 15; i ++) { // when over 15, it's may be HOKANKO...
		a = a.previousSibling;
		if (!a) break;
		if (a.nodeType !== 1) continue;
		if (a.value === 'delete') break; // delete-checkbox
		// mail
		if (a.href && /^mailto:/.test(a.href)) {
			a.parentNode.insertBefore(this.create('SPAN', null, a.textContent), a);
			a.textContent = a.getAttribute('href').replace('mailto:', ' ') + ' ';
			if (a.href.indexOf('mailto:http') === 0) {
				a.href = a.href.replace('mailto:', '');
			}
		}
	}
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

// Modify Form ///////////////////////
showForm: function() {
	this.writeBtnY = this.scrollY();
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

	// Quote
	this.on(this.body, 'mousedown touchstart', 'showQuoteBtn');
},
showQuoteBtn: function() {
	this.timeout('showQuoteBtn', () => {
		if (!this.doc.getSelection().toString()) return;
		this.quoteBtn.classList.remove('are4are-hide');
	}, 1000);
},
quoteBtnOnClick: function() {
	let text = this.doc.getSelection().toString();
	this.quoteBtn.classList.add('are4are-hide');
	if (!text) return;
	text = text.replace(/^/mg, '>').replace(/^>\n/mg, '').replace(/\n+$/, '');
	if (!text) return;
	this.ftxa.value += (/[^\n]$/.test(this.ftxa.value) ? "\n" : '') + text + "\n";
	this.showForm();
},

// Others ////////////////////////////
scrollToThreadImage: function() {
	let i = this.firstClass('are4are-thread-image');
	// 'SMALL' is for Ms.MHT
	i = i && (this.prev(i.parentNode, 'A') || this.prev(i.parentNode, 'SMALL') || i) || this.first('INPUT[value="delete"]');
	if (i) { this.win.scrollTo(0, i.offsetTop); }
},
afterModified: function() {
	if (this.scrollY() === 0) {
		this.queue('scrollToThreadImage'); // wait for Ms.MHT
	} else {
		this.modifyTablesFromPageLeftTop();
	}
},
scrollend: function(e) {
	this.showMinTumbnail(e);
	this.modifyTablesFromPageLeftTop(e);
	this.hideBackBtn(e);
},

// Main ////////////////////////////////
cssFile: 'common/thread.css',
exec: function() {
	// CSS
	if (!this.firstClass('rts')) {
		this.addCssFile('content_scripts/legacy_thread.css');
	}

	// ToolButtons
	this.backBtn = this.addToolButton('back', 'backBtnOnClick', 'are4are-hide');
	this.quoteBtn = this.addToolButton('quote', 'quoteBtnOnClick', 'are4are-hide');
	this.writeBtn = this.addToolButton('write', null, 'are4are-disable');
	if (this.is1stPage) {
		this.addToolButton('reload', null, 'are4are-disable');
	} else {
		this.addToolButton('reload', 'reloadBtnOnClick');
	}
	this.pageDownBtn = this.addToolButton('pagedown');
	this.on(this.pageDownBtn, 'touchstart mousedown', 'pageDownBtnOnTouchstart');
	this.on(this.pageDownBtn, 'touchend mouseup', 'pageDownBtnOnTouchend');
	this.bottomBtn = this.addToolButton('bottom', 'bottomBtnOnClick');

	// MinThumbnail
	this.appendMinThumbnail();

	// Modify Blockquotes (visible)
	let b = this.allBQ(this.doc);
	this.modifyBQ(b[0]);
	this.modifyTables(this.findTableOrBlockquote(b[1]));

	// Newer Border
	this.create('DIV', { id: 'are4are_newerBorder' });
	this.body.appendChild(this.newerBorder);

	// Modify Form
	this.modifyForm();

	// Click Events
	this.on(this.body, 'click', e => {
		if (!e.target) return;
		if (e.target.classList.contains('noref')) {
			this.norefOnClick(e);
		} else if (e.target.textContent && e.target.textContent.startsWith('>')) {
			this.quoteTextOnClick(e);
		}
	});

	// other events
	this.on(this.win, 'scrollend', 'scrollend');
	this.afterModified();
}
};
})();

