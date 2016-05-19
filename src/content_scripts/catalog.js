(function() {
function Are4AreCatalog() {}
Are4AreCatalog.prototype = {
__proto__ : Are4Are.prototype,

// Field ///////////////////////////////
CATALOG_DATA_SIZE: 1000,

// Event ///////////////////////////////
onclickCatalogMode: function(e) {
	var $$ = this, $ = this.$;
	e.preventDefault();
	var current = $$.doc.getElementById('catalog-mode-current');
	if (current.href != e.target.href) {
		current.id = '';
		e.target.id = 'catalog-mode-current';
		$$.win.scrollTo(0, $('table')[0].offsetTop);
	}
	$$.refreshCatalog(e.target.href);
	return false;
},

// RefreshCatalog ///////////////////////
appendCatalogCountDelta: function(tablePalent) {
	var $$ = this, $ = this.$;
	var $work = $(tablePalent).find('table[border="1"][align="center"]');
	$work.addClass('catalog-table');
	// add count delta
	var searchMin = 0;
	var searchMax = $$.catalogData.length;
	var doAppend = searchMax !== 0;
	$work.find('td').each(function() { try {
		var $td = $(this);
		var href = $td.find('a')[0].href;
		var $countElm = $td.find('font');
		$countElm.addClass('res-count');
		var count = parseInt($countElm.text());
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
				$countElm.append('<span class="res-count-delta">+' + delta + '</span>');
			}
		}
		$$.catalogData.unshift({href:href, count:count});
		searchMin ++;
		searchMax ++;
	} catch (e) { /*nop*/ } });
	$$.catalogData.splice($$.CATALOG_DATA_SIZE);
	if (doAppend) {
		$$.catalogTable.parentNode.replaceChild($work[0], $$.catalogTable);
		$$.catalogTable = $('table[border="1"][align="center"]')[0];
	}
},
refreshCatalog: function(href) {
	var $$ = this, $ = this.$;
	$$.activateToolBar();
	$.ajax({
		type: 'GET',
		url: href,
		ifModified: true
	})
	.done(function(data) {
		if (data && data.length === 0) {
			$$.toast( '__MSG_networkError__ (0byte)');
			return;
		}
		var $frag = $(document.createDocumentFragment());
		$frag.html(data);
		$$.appendCatalogCountDelta($frag);
	})
	.fail(function(xhr) {
		switch (xhr.status) {
			case 304: $$.toast( '__MSG_notModified__'); return;
			default:  $$.toast( '__MSG_networkError__ (' + xhr.status + ')'); return;
		}
	})
	.complete(function() {
		$$.noactivateToolBar();
	});
},

// Main ////////////////////////////////
exec: function(window, $) {
	var $$ = this;
	$$.init(window, $);
	// setup fields
	$$.catalogTable = $('table[border="1"][align="center"]')[0];
	$$.catalogData = [];
	// tool bar
	var addedHref = [];
	$('a[href *= "mode=cat"]').each(function() {
		if (this.href.indexOf('catset') !== -1) return;
		if (addedHref.indexOf(this.href) !== -1) return;
		if (this.parentNode.tagName == 'B') {
			this.id = 'catalog-mode-current';
		}
		if ($$.catalogTable) {
			this.onclick = $$.onclickCatalogMode.bind($$);
		}
		this.classList.add('are_toolbtn');
		$$.toolbar.appendChild(this);
		addedHref.push(this.href);
	});
	// setting page
	if ($$.doc.location.href.indexOf('mode=catset') !== -1) {
		$('input[name="mode"]').each(function() {
			this.form.action += "?mode=" + this.value;
		});
		var $a = $('<a>', {
			href: chrome.extension.getURL('common/options.html'),
			'class': 'options-page-link'

		});
		$a.text($$.format('__MSG_extensionName__ - __MSG_options__'));
		$($$.doc.body).append($a);
		return;
	}
	// main
	if (! $$.catalogTable) return;
	$$.catalogTable.classList.add('catalog-table');
	$$.addCssFile('content_scripts/catalog.css');
	$$.win.scrollTo(0, $('table')[0].offsetTop);
	$$.appendCatalogCountDelta($$.doc.body);
}
}; // end of my extension

jQuery.noConflict();
var myExt = new Are4AreCatalog();
myExt.exec(window, jQuery);

})();

