(function() {

'use strict';

function Are4AreCatalog() {}
Are4AreCatalog.prototype = {
__proto__ : Are4Are.prototype,

// Field ///////////////////////////////
CATALOG_DATA_SIZE: 1000,

// Event ///////////////////////////////
catalogModeOnClick: function(e) {
	e.preventDefault();
	let current = this.id('catalogModeCurrent');
	if (current.href != e.target.href) {
		current.id = '';
		e.target.id = 'catalogModeCurrent';
		this.win.scrollTo(0, this.firstTag(this.doc, 'TABLE').offsetTop);
	}
	this.refreshCatalog(e.target.href);
	return false;
},
// Longtap
bodyOnScroll: function(e) {
	this.cancelLongtap();
	this.hideThumbnail();
},
bodyOnTouchstart: function(e) {
	if (e.target.id === 'thumbnail') {
		this.cancelLongtap();
	} else if (e.target.tagName !== 'IMG') {
		// nop
	} else if (this.parentTag(e.target, 'TD')) {
		this.threadLink = this.parentTag(e.target, 'A');
		if (!this.threadLink) return;
		this.setLongtap(e.target, this.showThumbnail, 300);
	}
},
bodyOnTouchend: function(e) {
	this.cancelLongtap();
	if (this.isPreventTouchend) {
		e.preventDefault();
		this.isPreventTouchend = false;
		this.body.classList.remove('user-select-none');
	}
},
setLongtap: function(elem, func, msec) {
	this.longtapLink = elem.tagName == 'A' ? elem : this.parentTag(elem, 'A');
	this.longtapLinkHref = this.longtapLink.href;
	this.timeout('longtap', () => {
		if (this.longtapLink) {
			this.longtapLink.removeAttribute('href');
		}
		this.body.classList.add('user-select-none');
		this.isPreventTouchend = true;
		func.call(this);
	}, msec);
},
cancelLongtap: function() {
	this.clearTimeout('longtap');
	if (this.longtapLink) {
		this.queue(() => {
			this.longtapLink.href = this.longtapLinkHref;
			this.longtapLink = null;
		});
	}
},

// Thumbnail //////////////////////////////
hideThumbnail: function(visible) {
	if (this.isThumbnailVisible) {
		this.isThumbnailVisible = false;
		this.fadeOut(this.thumbnail);
		this.threadImgBtn.classList.add('slide-out-h');
	}
},
thumbnaiImgOnLoad: function() {
	this.fadeIn(this.thumbnail);
	this.threadImgBtn.classList.remove('slide-out-h');
	this.isThumbnailVisible = true;
},
showThumbnail: function() {
	let img = this.firstTag(this.threadLink, 'IMG');
	// create thumbnail
	if (!this.thumbnail) {
		this.create('DIV', { id: 'thumbnail', 'class': 'thumbnail transparent' })
		.appendChild(this.create('A', { id: 'thumbnailLink', 'class': 'thumbnail-link', target: '_blank' }))
		.appendChild(this.create('IMG', { id: 'thumbnailImg', 'class': 'thumbnail-img' }));
		this.on(this.thumbnail, 'click', this.hideThumbnail);
		this.on(this.thumbnailImg, 'load', this.thumbnaiImgOnLoad);
		this.body.appendChild(this.thumbnail);
	}
	// show thumbnail
	this.thumbnailLink.href = this.longtapLinkHref;
	this.threadImgBtn.href = 'javascript: void(0);';
	this.threadImgBtn.removeAttribute('target');
	this.isThreadImgBtnLoaded = false;
	let src = img.src.replace(/cat/, 'thumb').replace(/([0-9]+).?\.([a-z]+)$/, "$1s.$2");
	if (this.thumbnailImg.src == src) {
		this.thumbnaiImgOnLoad();
	} else {
		this.thumbnailImg.src = src;
	}
},

// Thread image ///////////////////////////
threadImgBtnOnTouchstart: function() {
	if (this.isThreadImgBtnLoaded) return;
	this.threadImgBtn.focus();
	this.getDoc(this.threadLink.href, doc => {
		let img = doc.querySelector(`IMG[src="${this.thumbnailImg.src}"]`);
		if (!img) {
			this.toast('__MSG_networkError__');
			return;
		}
		this.threadImgBtn.href = img.parentNode.href;
		this.threadImgBtn.target = '_blank';
		this.isThreadImgBtnLoaded = true;
	}, {
		'404': '__MSG_threadNotFound__'
	});
},
threadImgBtnOnClick: function() {
	if (!this.isThreadImgBtnLoaded) {
		this.win.alert(this.format('__MSG_plzWait__'));
	}
},

// Fix table layout ///////////////////////
autoFix: function(table) {
	if (!this.isAutoFix) return;
	table.classList.add('auto-fix');
},
autoFixWidth: function() {
	if (!this.isAutoFix) return;
	let width = 0;
	Array.forEach(this.catalogTable.querySelectorAll('TD>A>IMG'), img => {
		width = Math.max(width, img.width);
	});
	this.doc.styleSheets[0].insertRule(`.catalog-table>tbody>tr>td {width:${width + 4}px !important;}`, 0);
},

// RefreshCatalog ///////////////////////
appendCatalogCountDelta: function(tablePalent) {
	let work = tablePalent.querySelector('TABLE[border="1"][align="center"]');
	work.classList.add('catalog-table');
	this.autoFix(work);
	// add count delta
	let searchMin = 0;
	let searchMax = this.catalogData.length;
	let doAppend = searchMax !== 0;
	Array.forEach(work.getElementsByTagName('TD'), td => { try {
		let href = this.firstTag(td, 'A').href;
		let countElm = this.firstTag(td, 'FONT');
		countElm.classList.add('res-count');
		let count = parseInt(countElm.textContent);
		if (doAppend) {
			let delta = '?';
			for (let i = searchMin; i < searchMax; i ++) {
				let old = this.catalogData[i];
				if (old.href != href) {
					continue;
				}
				delta = count - old.count;
				this.catalogData.splice(i, 1);
				searchMax --;
				break;
			}
			if (delta) {
				countElm.appendChild(this.create('SPAN', { class: 'res-count-delta' }, `+${delta}`));
			}
		}
		this.catalogData.unshift({href:href, count:count});
		searchMin ++;
		searchMax ++;
	} catch (e) { /*nop*/ } });
	this.catalogData.splice(this.CATALOG_DATA_SIZE);
	if (doAppend) {
		this.catalogTable.parentNode.replaceChild(work, this.catalogTable);
		this.catalogTable = this.first('TABLE[border="1"][align="center"]');
	}
},
refreshCatalog: function(href) {
	this.hideThumbnail();
	this.getDoc(
		href,
		this.appendCatalogCountDelta,
		{ '304': '__MSG_notModified__' }
	);
},

// Main ////////////////////////////////
exec: function(window) {
	this.catalogTable = this.first('TABLE[border="1"][align="center"]');
	this.catalogData = [];

	// load by manifest.json
	//// StyleSheet
	//this.addCssFile('content_scripts/catalog.css');

	// Toolbar
	let addedHref = [];
	Array.forEach(this.all('A[href *= "mode=cat"]'), a => {
		if (a.href.indexOf('catset') !== -1) return;
		if (addedHref.indexOf(a.href) !== -1) return;
		if (a.parentNode.tagName == 'B') {
			a.id = 'catalogModeCurrent';
		}
		if (this.catalogTable) {
			this.on(a, 'click', this.catalogModeOnClick);
		}
		a.classList.add('are-toolbtn');
		this.toolbar.appendChild(a);
		addedHref.push(a.href);
	});

	// Setting page
	if (this.doc.location.href.indexOf('mode=catset') !== -1) {
		this.body.classList.add('catalog-setting');
		Array.forEach(this.all('INPUT[name="mode"]'), input => {
			input.form.action += "?mode=" + input.value;
		});
		Array.forEach(this.all('INPUT[name="cx"],INPUT[name="cy"],INPUT[name="cl"]'), input => {
			input.setAttribute('type', 'tel');
		});
		let td = this.parentTag(this.first('INPUT[name="mode"]'), 'TD') || this.body;
		td.appendChild(this.create(
			'A', {
			href: chrome.extension.getURL('common/options.html#tabpage'),
			'class': 'options-page-link'
			},
			this.format('__MSG_extensionName__ - __MSG_options__')
		));
		return;
	}

	// Catalog
	if (!this.catalogTable) return;
	this.create('A', { id: 'threadImgBtn', 'class': 'are-toolbtn slide-out-h' }, this.format('__MSG_threadImg__'));
	this.on(this.threadImgBtn, 'mousedown touchstart', this.threadImgBtnOnTouchstart);
	this.on(this.threadImgBtn, 'click', this.threadImgBtnOnClick);
	this.toolbar.insertBefore(this.threadImgBtn, this.toolbar.firstChild);
	this.catalogTable.classList.add('catalog-table');
	this.isAutoFix =  this.win.innerWidth < this.catalogTable.clientWidth;
	this.autoFix(this.catalogTable);
	this.autoFixWidth();
	this.win.scrollTo(0, this.firstTag(this.doc, 'TABLE').offsetTop);
	this.appendCatalogCountDelta(this.body);
	this.on(this.body, 'mousedown touchstart', this.bodyOnTouchstart);
	this.on(this.body, 'mouseup touchend', this.bodyOnTouchend);
	this.on(this.win, 'scroll', this.bodyOnScroll);
}
}; // end of my extension

// Start ///////////////////////////////
let myExt = new Are4AreCatalog();
myExt.start(window);
})();

