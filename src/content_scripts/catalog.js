(function() {

'use strict';

function Are4AreCatalog() {}
Are4AreCatalog.prototype = {
__proto__ : Are4Are.prototype,

// Field ///////////////////////////////
CATALOG_DATA_SIZE: 1000,

// Event ///////////////////////////////
catalogModeOnClick: function(e) {
	var $$ = this;
	e.preventDefault();
	var current = $$.id('catalogModeCurrent');
	if (current.href != e.target.href) {
		current.id = '';
		e.target.id = 'catalogModeCurrent';
		$$.win.scrollTo(0, $$.firstTag($$.doc, 'TABLE').offsetTop);
	}
	$$.refreshCatalog(e.target.href);
	return false;
},
bodyOnScroll: function(e) {
	var $$ = this;
	$$.hideThumbnail();
},
// Longtap
bodyOnTouchstart: function(e) {
	var $$ = this;
	if (e.target.id === 'thumbnail') {
		$$.cancelLongtap(e);
	} else if (e.target.tagName !== 'IMG') {
		// nop
	} else if ($$.parentNode(e.target, 'TD')) {
		$$.threadLink = $$.parentNode(e.target, 'A'); if (!$$.threadLink) return;
		$$.setLongtap(e.target, $$.showThumbnail.bind($$), 300);
	}
},
bodyOnTouchend: function(e) {
	var $$ = this;
	$$.cancelLongtap(e);
	if ($$.isPreventTouchend) {
		$$.isPreventTouchend = false;
		e.preventDefault();
	}
},
setLongtap: function(elem, func, msec) {
	var $$ = this;
	$$.longtapLink = elem.tagName == 'A' ? elem : $$.parentNode(elem, 'A');
	$$.longtapLinkHref = $$.longtapLink.href;
	$$.setTimeout('longtap', function () {
		if ($$.longtapLink) {
			$$.longtapLink.removeAttribute('href');
		}
		$$.isPreventTouchend = true;
		func();
	}, msec);
},
cancelLongtap: function(e) {
	var $$ = this;
	$$.clearTimeout('longtap');
	if ($$.longtapLink) {
		$$.queue(function() {
			$$.longtapLink.href = $$.longtapLinkHref;
			$$.longtapLink = null;
		});
	}
},

// Thumbnail //////////////////////////////
hideThumbnail: function(visible) {
	var $$ = this;
	if ($$.isThumbnailVisible) {
		$$.isThumbnailVisible = false;
		$$.fadeOut($$.thumbnail);
		$$.threadImgBtn.classList.add('slide-out-h');
	}
},
thumbnaiImgOnLoad: function() {
	var $$ = this;
	$$.fadeIn($$.thumbnail);
	$$.threadImgBtn.classList.remove('slide-out-h');
	$$.isThumbnailVisible = true;
},
showThumbnail: function() {
	var $$ = this;
	var img = $$.firstTag($$.threadLink, 'IMG');
	// create thumbnail
	if (!$$.thumbnail) {
		$$.create('DIV', { id: 'thumbnail', 'class': 'thumbnail transparent' })
		.appendChild($$.create('A', { id: 'thumbnailLink', 'class': 'thumbnail-link', target: '_blank' }))
		.appendChild($$.create('IMG', { id: 'thumbnailImg', 'class': 'thumbnail-img' }));
		$$.on($$.thumbnail, 'click', $$.hideThumbnail);
		$$.on($$.thumbnailImg, 'load', $$.thumbnaiImgOnLoad);
		$$.body.appendChild($$.thumbnail);
	}
	// show thumbnail
	$$.thumbnailLink.href = $$.longtapLinkHref;
	$$.threadImgBtn.href = 'javascript: void(0);';
	$$.threadImgBtn.removeAttribute('target');
	$$.isThreadImgBtnLoaded = false;
	var src = img.src.replace(/cat/, 'thumb').replace(/([0-9]+).?\.([a-z]+)$/, "$1s.$2");
	if ($$.thumbnailImg.src == src) {
		$$.thumbnaiImgOnLoad();
	} else {
		$$.thumbnailImg.src = src;
	}
},

// Thread image ///////////////////////////
threadImgBtnOnTouchstart: function() {
	var $$ = this;
	if ($$.isThreadImgBtnLoaded) return;
	$$.threadImgBtn.focus();
	$$.getDoc($$.threadLink.href, function(doc) {
		var img = doc.querySelector('IMG[src="' + $$.thumbnailImg.src + '"]');
		if (!img) {
			$$.toast('__MSG_networkError__');
			return;
		}
		$$.threadImgBtn.href = img.parentNode.href;
		$$.threadImgBtn.target = '_blank';
		$$.isThreadImgBtnLoaded = true;
	}, {
		'404': '__MSG_threadNotFound__'
	});
},
threadImgBtnOnClick: function() {
	var $$ = this;
	if (!$$.isThreadImgBtnLoaded) {
		$$.win.alert($$.format('__MSG_plzWait__'));
	}
},

// Fix table layout ///////////////////////
autoFix: function(table) {
	var $$ = this;
	if (!$$.isAutoFix) return;
	table.classList.add('auto-fix');
},
autoFixWidth: function() {
	var $$ = this;
	if (!$$.isAutoFix) return;
	var width = 0;
	Array.forEach($$.catalogTable.querySelectorAll('TD>A>IMG'), function(img) {
		width = Math.max(width, img.width);
	});
	$$.doc.styleSheets[0].insertRule('.catalog-table>tbody>tr>td {width:' + (width + 4) + 'px !important;}', 0);
},

// RefreshCatalog ///////////////////////
appendCatalogCountDelta: function(tablePalent) {
	var $$ = this;
	var work = tablePalent.querySelector('TABLE[border="1"][align="center"]');
	work.classList.add('catalog-table');
	$$.autoFix(work);
	// add count delta
	var searchMin = 0;
	var searchMax = $$.catalogData.length;
	var doAppend = searchMax !== 0;
	Array.forEach(work.getElementsByTagName('TD'), function(td) { try {
		var href = $$.firstTag(td, 'A').href;
		var countElm = $$.firstTag(td, 'FONT');
		countElm.classList.add('res-count');
		var count = parseInt(countElm.textContent);
		if (doAppend) {
			var delta = '?';
			for (var i = searchMin; i < searchMax; i ++) {
				var old = $$.catalogData[i];
				if (old.href != href) {
					continue;
				}
				delta = count - old.count;
				$$.catalogData.splice(i, 1);
				searchMax --;
				break;
			}
			if (delta) {
				countElm.appendChild($$.create('SPAN', { class: 'res-count-delta' }, '+' + delta));
			}
		}
		$$.catalogData.unshift({href:href, count:count});
		searchMin ++;
		searchMax ++;
	} catch (e) { /*nop*/ } });
	$$.catalogData.splice($$.CATALOG_DATA_SIZE);
	if (doAppend) {
		$$.catalogTable.parentNode.replaceChild(work, $$.catalogTable);
		$$.catalogTable = $$.first('TABLE[border="1"][align="center"]');
	}
},
refreshCatalog: function(href) {
	var $$ = this;
	$$.hideThumbnail();
	$$.getDoc(href, function(doc) {
		$$.appendCatalogCountDelta(doc);
	}, {
		'304': '__MSG_notModified__'
	});
},

// Main ////////////////////////////////
exec: function(window) {
	var $$ = this;

	$$.catalogTable = $$.first('TABLE[border="1"][align="center"]');
	$$.catalogData = [];

	// load by manifest.json
	//// StyleSheet
	//$$.addCssFile('content_scripts/catalog.css');

	// Toolbar
	var addedHref = [];
	Array.forEach($$.all('A[href *= "mode=cat"]'), function(a) {
		if (a.href.indexOf('catset') !== -1) return;
		if (addedHref.indexOf(a.href) !== -1) return;
		if (a.parentNode.tagName == 'B') {
			a.id = 'catalogModeCurrent';
		}
		if ($$.catalogTable) {
			$$.on(a, 'click', $$.catalogModeOnClick);
		}
		a.classList.add('are-toolbtn');
		$$.toolbar.appendChild(a);
		addedHref.push(a.href);
	});

	// Setting page
	if ($$.doc.location.href.indexOf('mode=catset') !== -1) {
		$$.body.classList.add('catalog-setting');
		Array.forEach($$.all('INPUT[name="mode"]'), function(input) {
			input.form.action += "?mode=" + input.value;
		});
		Array.forEach($$.all('INPUT[name="cx"],INPUT[name="cy"],INPUT[name="cl"]'), function(input) {
			input.setAttribute('type', 'tel');
		});
		var td = $$.parentNode($$.first('INPUT[name="mode"]'), 'TD') || $$.body;
		td.appendChild($$.create(
			'A', {
			href: chrome.extension.getURL('common/options.html#tabpage'),
			'class': 'options-page-link'
			},
			$$.format('__MSG_extensionName__ - __MSG_options__')
		));
		return;
	}

	// Catalog
	if (!$$.catalogTable) return;
	$$.create('A', { id: 'threadImgBtn', 'class': 'are-toolbtn slide-out-h' }, $$.format('__MSG_threadImg__'));
	$$.on($$.threadImgBtn, 'mousedown touchstart', $$.threadImgBtnOnTouchstart);
	$$.on($$.threadImgBtn, 'click', $$.threadImgBtnOnClick);
	$$.toolbar.insertBefore($$.threadImgBtn, $$.toolbar.firstChild);
	$$.catalogTable.classList.add('catalog-table');
	$$.isAutoFix =  $$.win.innerWidth < $$.catalogTable.clientWidth;
	$$.autoFix($$.catalogTable);
	$$.autoFixWidth();
	$$.win.scrollTo(0, $$.firstTag($$.doc, 'TABLE').offsetTop);
	$$.appendCatalogCountDelta($$.body);
	$$.on($$.body, 'mousedown touchstart', $$.bodyOnTouchstart);
	$$.on($$.body, 'mouseup touchend', $$.bodyOnTouchend);
	$$.on($$.win, 'scroll', $$.bodyOnScroll);
}
}; // end of my extension

// Start ///////////////////////////////
var myExt = new Are4AreCatalog();
myExt.start(window);
})();

