(function() {
function Are4AreCatalog() {}
Are4AreCatalog.prototype = {
__proto__ : Are4Are.prototype,

// Field ///////////////////////////////
CATALOG_DATA_SIZE: 1000,

// Event ///////////////////////////////
onClickCatalogMode: function(e) {
	var $$ = this;
	e.preventDefault();
	var current = $$.id('catalog-mode-current');
	if (current.href != e.target.href) {
		current.id = '';
		e.target.id = 'catalog-mode-current';
		$$.win.scrollTo(0, $$.firstTag($$.doc, 'TABLE').offsetTop);
	}
	$$.refreshCatalog(e.target.href);
	return false;
},
bodyOnClick: function(e) {
	var $$ = this;
	if ($$.thumbnailSrc) {
		$$.thumbnailSrc.focus();
		$$.thumbnailSrc = null;
		return;
	}
	if (!e.target) return;
	if (e.target.tagName !== 'FONT' && e.target.tagName !== 'SMALL') return;
	$$.thumbnailSrc = $$.firstTag($$.parentNode(e.target, 'TD'), 'A');
	var src = $$.firstTag($$.thumbnailSrc, 'IMG').src.replace(/cat/, 'thumb').replace(/([0-9]+).?\.([a-z]+)$/, "$1s.$2");
	if (!$$.thumbnail) {
		$$.thumbnail = $$.create('A', { 'class': 'thumbnail', target: '_blank' });
		$$.thumbnail.appendChild($$.create('IMG', { id: 'thumbnailImage' }));
		$$.thumbnail.firstChild.addEventListener('load', function(e2) { e.preventDefault(); this.parentNode.focus(); });
		$$.body.appendChild($$.thumbnail);
	}
	$$.thumbnail.href = $$.thumbnailSrc.href;
	if ($$.thumbnail.firstChild.src == src) {
		$$.thumbnail.focus();
	} else {
		$$.thumbnail.firstChild.src = src;
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
	$$.getDoc(href, function(doc) {
		$$.appendCatalogCountDelta(doc);
	}, {
		'304': '__MSG_notModified__'
	});
},

// Main ////////////////////////////////
exec: function(window) {
	var $$ = this;
	$$.init(window);
	$$.catalogTable = $$.first('TABLE[border="1"][align="center"]');
	$$.catalogData = [];

	// StyleSheet
	$$.addCssFile('content_scripts/catalog.css');

	// Toolbar
	var addedHref = [];
	Array.forEach($$.all('A[href *= "mode=cat"]'), function(a) {
		if (a.href.indexOf('catset') !== -1) return;
		if (addedHref.indexOf(a.href) !== -1) return;
		if (a.parentNode.tagName == 'B') {
			a.id = 'catalog-mode-current';
		}
		if ($$.catalogTable) {
			$$.on(a, 'click', $$.onClickCatalogMode);
		}
		a.classList.add('are_toolbtn');
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
	$$.catalogTable.classList.add('catalog-table');
	$$.isAutoFix =  $$.win.innerWidth < $$.catalogTable.clientWidth;
	$$.autoFix($$.catalogTable);
	$$.autoFixWidth();
	$$.win.scrollTo(0, $$.firstTag($$.doc, 'TABLE').offsetTop);
	$$.appendCatalogCountDelta($$.body);
	$$.on($$.body, 'click', $$.bodyOnClick);
}
}; // end of my extension

// Start ///////////////////////////////
var myExt = new Are4AreCatalog();
myExt.exec(window);
})();

