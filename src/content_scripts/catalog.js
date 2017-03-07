(function() {

'use strict';

function Are4AreCatalog() {}
Are4AreCatalog.prototype = {
__proto__ : Are4Are.prototype,

// Field ///////////////////////////////
CATALOG_CACHE_SIZE: 1000,

// Event ///////////////////////////////
catalogModeOnClick: function(e) {
	e.preventDefault();
	let current = this.firstClass(this.toolbar, 'are4are-current');
	if (current.href !== e.target.href) {
		current.classList.remove('are4are-current');
		e.target.classList.add('are4are-current');
		this.win.scrollTo(0, this.firstTag('TABLE').offsetTop);
	}
	this.refreshCatalog(e.target.href);
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
	if (this.handleTouchend) {
		e.preventDefault();
		this.handleTouchend = false;
		this.body.classList.remove('are4are-user-select-none');
	}
},
setLongtap: function(elm, func, msec) {
	this.longtapLink = elm.tagName === 'A' ? elm : this.parentTag(elm, 'A');
	this.longtapLinkHref = this.longtapLink.href;
	this.timeout('longtap', () => {
		if (this.longtapLink) {
			this.longtapLink.removeAttribute('href');
		}
		this.body.classList.add('are4are-user-select-none');
		this.handleTouchend = true;
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

// Thumbnail ///////////////////////////
hideThumbnail: function(visible) {
	if (this.isThumbnailVisible) {
		this.isThumbnailVisible = false;
		this.fadeOut(this.thumbnail);
		this.flexOut(this.threadImgBtn);
	}
},
thumbnaiImgOnLoad: function() {
	this.fadeIn(this.thumbnail);
	this.flexIn(this.threadImgBtn);
	this.isThumbnailVisible = true;
},
showThumbnail: function() {
	let img = this.firstTag(this.threadLink, 'IMG');
	// create thumbnail
	if (!this.thumbnail) {
		this.create('DIV', { id: 'are4are_thumbnail', 'class': 'are4are-thumbnail are4are-transparent' })
		.appendChild(this.create('A', { id: 'are4are_thumbnailLink', 'class': 'are4are-thumbnail-link', target: '_blank' }))
		.appendChild(this.create('IMG', { id: 'are4are_thumbnailImg', 'class': 'are4are-thumbnail-img' }));
		this.on(this.thumbnail, 'click', 'hideThumbnail');
		this.on(this.thumbnailImg, 'load', 'thumbnaiImgOnLoad');
		this.body.appendChild(this.thumbnail);
	}
	// show thumbnail
	this.thumbnailLink.href = this.longtapLinkHref;
	this.threadImgBtn.href = 'javascript: void(0);';
	this.threadImgBtn.removeAttribute('target');
	this.threadImgStatus = 0;
	let src = img.src.replace(/cat/, 'thumb').replace(/([0-9]+).?\.([a-z]+)$/, "$1s.$2");
	if (this.thumbnailImg.src === src) {
		this.thumbnaiImgOnLoad();
	} else {
		this.thumbnailImg.src = src;
	}
},

// Thread image ////////////////////////
threadImgStatus: 0,
threadImgBtnOnTouchstart: function() {
	if (this.threadImgStatus) return;
	this.threadImgBtn.focus();
	this.getDoc(this.threadLink.href, doc => {
		let thumbnailFilename = this.thumbnailImg.src.split('/').pop();
		let img = doc.querySelector(`IMG[src$="${thumbnailFilename}"]`);
		if (!img) {
			this.toast('__MSG_networkError__');
			return;
		}
		this.threadImgBtn.href = img.parentNode.href;
		this.threadImgBtn.target = '_blank';
	}, st => {
		this.threadImgStatus = st;
	});
},
threadImgBtnOnClick: function() {
	switch (this.threadImgStatus) {
		case 0: this.win.alert(this.format('__MSG_plzWait__')); break;
		case 200: break;
		case 304: break;
		case 404: this.toast('__MSG_notFound__'); break;
		default: this.toast(`__MSG_networkError__(${this.threadImgStatus})`); break;
	}
},

// Fix table layout ////////////////////
autoFix: function(table) {
	if (!this.isAutoFix) return;
	table.classList.add('are4are-auto-fix');
},
autoFixWidth: function() {
	if (!this.isAutoFix) return;
	let img = this.first('.are4are-auto-fix>TBODY>TR>TD>A>IMG');
	if (!img) return;
	let s = `${Math.max(img.width, img.height) + 4}px`;
	this.arrayLast(this.doc.styleSheets).insertRule(`.are4are-auto-fix>tbody>tr>td>a:first-child { width:${s}; height:${s}; }`, 0);
},

// RefreshCatalog //////////////////////
appendCatalogCountDelta: function(tablePalent) {
	let work = tablePalent.querySelector('TABLE[border="1"][align="center"]');
	work.classList.add('are4are-catalog-table');
	this.autoFix(work);
	// add count delta
	let threadCount = 0;
	let searchMax = this.catalogData.length;
	let appendDelta = searchMax !== 0;
	let hrefs = [];
	Array.forEach(work.getElementsByTagName('TD'), td => { try {
		let href = this.firstTag(td, 'A').getAttribute('href');
		let countElm = this.firstTag(td, 'FONT');
		countElm.classList.add('are4are-res-count');
		let count = parseInt(countElm.textContent, 10);
		if (appendDelta) {
			let delta = '?';
			for (let i = threadCount; i < searchMax; i ++) {
				let old = this.catalogData[i];
				if (old.href !== href) {
					continue;
				}
				delta = count - old.count;
				this.catalogData.splice(i, 1);
				searchMax --;
				break;
			}
			if (delta) {
				countElm.appendChild(this.create('SPAN', { class: 'are4are-res-count-delta' }, `+${delta}`));
			}
		}
		this.catalogData.unshift({href:href, count:count});
		hrefs.push(href);
		threadCount ++;
		searchMax ++;
	} catch (e) { /*nop*/ } });
	this.catalogData.splice(this.CATALOG_CACHE_SIZE);
	// red-border
	hrefs = hrefs.sort((a,b) => (a.length > b.length || a > b));
	for (let i = Math.min(4, hrefs.length); 0 <= i; i --) {
		let href = hrefs[i];
		let img = work.querySelector(`a[href="${href}"] img`);
		if (!img) break;
		img.classList.add('are4are-old');
	}
	// complete
	this.catalogTable.parentNode.replaceChild(work, this.catalogTable);
	this.catalogTable = this.first('TABLE[border="1"][align="center"]');
},
setupCatalogData: function(href) {
	this.catalogData = href.indexOf('sort=8') !== -1 ? this.catalogDataSodCount : this.catalogDataResCount;
},
refreshCatalog: function(href) {
	this.hideThumbnail();
	this.setupCatalogData(href);
	this.loading.classList.add('are4are-now-loading');
	this.getDoc(
		href,
		this.appendCatalogCountDelta,
		() => { this.loading.classList.remove('are4are-now-loading'); }
	);
},

// Main ////////////////////////////////
exec: function() {
	this.firstTag('BODY').classList.add('are4are-initialized');
	this.catalogTable = this.first('TABLE[border="1"][align="center"]');
	this.catalogDataResCount = [];
	this.catalogDataSodCount = [];
	this.setupCatalogData(this.doc.location.href);

	// Toolbar
	let addedHref = [];
	Array.forEach(this.all('A[href *= "mode=cat"]'), a => {
		if (a.href.indexOf('catset') !== -1) return;
		if (addedHref.indexOf(a.href) !== -1) return;
		if (a.parentNode.tagName === 'B') {
			a.classList.add('are4are-current');
		}
		if (this.catalogTable) {
			this.on(a, 'click', 'catalogModeOnClick');
		}
		a.classList.add('are4are-toolbtn');
		this.toolbar.appendChild(a);
		addedHref.push(a.href);
	});

	// Setting page
	if (this.doc.location.href.indexOf('mode=catset') !== -1) {
		this.body.classList.add('are4are-catalog-setting');
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
			'class': 'are4are-options-page-link'
			},
			this.format('__MSG_extensionName__ - __MSG_options__')
		));
		return;
	}

	// Catalog
	if (!this.catalogTable) return;
	// thread-image-button
	this.create('A', { id: 'are4are_threadImgBtn', 'class': 'are4are-toolbtn are4are-flexout' }, this.format('__MSG_threadImg__'));
	this.on(this.threadImgBtn, 'touchstart', 'threadImgBtnOnTouchstart');
	this.on(this.threadImgBtn, 'click', 'threadImgBtnOnClick');
	this.toolbar.insertBefore(this.threadImgBtn, this.toolbar.firstChild);
	// modify catalog
	this.catalogTable.classList.add('are4are-catalog-table');
	this.isAutoFix =  this.win.innerWidth < this.catalogTable.clientWidth;
	this.autoFix(this.catalogTable);
	this.autoFixWidth();
	this.win.scrollTo(0, this.firstTag('TABLE').offsetTop);
	this.appendCatalogCountDelta(this.body);
	this.body.appendChild(this.create('DIV', { id: 'are4are_loading', 'class': 'are4are-loading' }));
	// events
	this.on(this.body, 'touchstart', 'bodyOnTouchstart');
	this.on(this.body, 'touchend', 'bodyOnTouchend');
	this.on(this.win, 'scroll', 'bodyOnScroll');
	// title
	if (this.doc.location.href.indexOf('/b/futaba.php') !== -1) {
		let title = this.firstTag('TITLE');
		title.textContent = this.doc.location.hostname.replace(/\..+$/, ' - ') + title.textContent;
	}
}
}; // end of my extension

// Start ///////////////////////////////
let myExt = new Are4AreCatalog();
myExt.start(window);
})();

