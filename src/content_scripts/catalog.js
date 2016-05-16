jQuery.noConflict();
(function($) {
var
	util = new Are4AreUtil().init(this, $),
	catalogTable = $('table[border="1"][align="center"]')[0],
	catalogData = [],
	CATALOG_DATA_SIZE = 1000
;

// Event //////////////////////////////////////////////////
function onclickCatalogMode(e) {
	e.preventDefault();
	var current = document.getElementById('catalog-mode-current');
	if (current.href != e.target.href) {
		current.id = '';
		e.target.id = 'catalog-mode-current';
		window.scrollTo(0, $('table')[0].offsetTop);
	}
	refreshCatalog(e.target.href);
	return false;
}

function appendCatalogCountDelta(tablePalent) {
	var $work = $(tablePalent).find('table[border="1"][align="center"]');
	$work.addClass('catalog-table');
	// add count delta
	var searchMin = 0;
	var searchMax = catalogData.length;
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
				var old = catalogData[i];
				if (old.href != href) {
					continue;
				}
				delta = count - old.count;
				catalogData.splice(i, 1);
				searchMax --;
				break;
			}
			if (delta) {
				$countElm.append('<span class="res-count-delta">+' + delta + '</span>');
			}
		}
		catalogData.unshift({href:href, count:count});
		searchMin ++;
		searchMax ++;
	} catch (e) { /*nop*/ } });
	catalogData.splice(CATALOG_DATA_SIZE);
	if (doAppend) {
		catalogTable.parentNode.replaceChild($work[0], catalogTable);
		catalogTable = $('table[border="1"][align="center"]')[0];
	}
}

function refreshCatalog(href) {
	util.activateToolBar();
	$.ajax({
		type: 'GET',
		url: href,
		ifModified: true
	})
	.done(function(data) {
		if (data && data.length === 0) {
			util.toast( '__MSG_networkError__ (0byte)'); return;
			return;
		}
		var $frag = $(document.createDocumentFragment());
		$frag.html(data);
		appendCatalogCountDelta($frag);
	})
	.fail(function(xhr) {
		switch (xhr.status) {
			case 304: util.toast( '__MSG_notModified__'); return;
			default:  util.toast( '__MSG_networkError__ (' + xhr.status + ')'); return;
		}
	})
	.complete(function() {
		util.noactivateToolBar();
	});
}

// Main ///////////////////////////////////////////////////
catalogTable.classList.add('catalog-table');
util.addCssFile('content_scripts/catalog.css');
// tool bar
$('a[href *= "mode=cat"]').each(function() {
	if (this.href.indexOf('catset') != -1) {
		return;
	}
	if (this.parentNode.tagName == 'B') {
		this.id = 'catalog-mode-current';
	}
	this.onclick = onclickCatalogMode;
	this.classList.add('are_toolbtn');
	util.toolbar.appendChild(this);
});
window.scrollTo(0, $('table')[0].offsetTop);
appendCatalogCountDelta(document.body);

})(jQuery);

