(function() {
function Are4AreThread() {}
Are4AreThread.prototype = {

// MinThumbnail //////////////////////
MINTHUMBNAIL_SIZE: 60,
MINTHUMBNAIL_HIDE_SCROLLTOP: 300,
showMinTumbnail: function(e, targetY) {
	var $$ = this;
	var t = $$.$win.scrollTop();
	if (
		t < $$.MINTHUMBNAIL_HIDE_SCROLLTOP ||
		targetY && targetY - t < $$.MINTHUMBNAIL_SIZE
	) {
		// hide
		$$.$minThumbnail.addClass('fadeout');
	} else {
		// show
		$$.$minThumbnail.removeClass('fadeout');
	}
},
appendMinThumbnail: function() {
	var $$ = this, $ = this.$;
	// find thread-image
	var threadImage = $('blockquote:first')[0], href;
	if (!threadImage) return;
	while (threadImage = threadImage.previousSibling) {
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
	threadImage.className = 'thread-image';

	// make minThumbnail
	var $img = $('<img>');
	$img.attr({
		src: threadImage.src,
		'class': 'min-thumbnail-img'
	});
	$$.$minThumbnail = $('<a>');
	$$.$minThumbnail.attr({
		href: href,
		target: '_blank',
		id: 'minThumbnail',
		'class': 'fadeout'
	});
	$$.$minThumbnail.append($img);
	$('body').append($$.$minThumbnail);

	// favicon
	var $faviconLink = $('<link>');
	$faviconLink.attr({rel:'shortcut icon', href: threadImage.src});
	$('head').append($faviconLink);
},

// Newer Border ///////////////////////
showNewerBorder: function() {
	var $$ = this;
	$$.$newerBorder.css('opacity', '1');
	$$.$newerBorder.css('width', '100%');
},
hideNewerBorder: function() {
	var $$ = this;
	$$.$newerBorder.css('opacity', '0');
	$$.$newerBorder.css('width', '0');
},

// ToolButtons ///////////////////////
_pageDownTimeout: null,
pageDownBtnOnTouchstart: function(e) {
	e && e.preventDefault();
	var $$ = this, util = this.util;
	$$.$pageDownBtn.addClass('active');
	util.scrollTo($$.$win.scrollTop() + Math.round($$.win.innerHeight / 2));
	util.clearTimeout($$._pageDownTimeout);
	$$._pageDownTimeout = $$.win.setTimeout(function() { $$.pageDownBtnOnTouchstart(); }, 1000);
},
pageDownBtnOnTouchend: function(e) {
	var $$ = this, util = this.util;
	$$._pageDownTimeout = util.clearTimeout($$._pageDownTimeout);
	$$.$pageDownBtn.removeClass('active');
},
reloadBtnOnClick: function(e) {
	var $$ = this, $ = this.$, util = this.util;
	util.activateToolBar();
	$$.hideNewerBorder();
	$.ajax({
		type: 'GET',
		url: $$.doc.location.href.replace(/#.*$/, ''),
		ifModified: true,
		dataType: 'text'
	})
	.done(function(data) {
		if (!data || data.length === 0) {
			util.toast( '__MSG_notModified__');
			return;
		}
		// delete old reses
		var lastResNumber = $('input[type="checkbox"][value="delete"]:last').attr('name');
		data = data.substring(data.indexOf('<input type=checkbox name="' + lastResNumber + '"'));
		data = data.substring(data.indexOf('</table>') + 8);
		// update contdisp
		var contdisp = $$.doc.getElementById('contdisp');
		if (contdisp && data.match(/<span id="contdisp">([^<]*)</))
			contdisp.textContent = RegExp.$1;
		// delete after reses
		var endOfRes = '</blockquote></td></tr></table>';
		var lastIndex = data.lastIndexOf(endOfRes);
		if (lastIndex < 0) {
			util.toast( '__MSG_notModified__');
			return;
		}
		data = data.substring(0, lastIndex + endOfRes.length);
		// newer_border position
		var $lastResMarker = $('div[style="clear:left"]:last');
		var newerBorderY = $lastResMarker.offset().top;
		// add new res tables
		var p = $lastResMarker.parent().get(0);
		var m = $lastResMarker[0];
		var $work = $($$.doc.createDocumentFragment());
		$work.html('<div'> + data + '</div>');
		$('<div>').html(data).find('table').each(function() {
			p.insertBefore(this, m);
		});
		$$.$newerBorder.css('top', newerBorderY + 'px');
		util.scrollTo(newerBorderY, $$.showNewerBorder);
	})
	.fail(function(xhr) {
		switch (xhr.status) {
			case 304: util.toast( '__MSG_notModified__'); return;
			case 404: util.toast( '__MSG_threadNotFound__'); return;
			default:  util.toast( '__MSG_networkError__ (' + xhr.status + ')'); return;
		}
	})
	.complete(function() {
		util.noactivateToolBar();
	});
},
bottomBtnOnClick: function(e) {
	var $$ = this, util = this.util;
	util.activateToolBar();
	$$.win.scrollTo(0, $$.doc.body.clientHeight - $$.win.innerHeight);
	$$.$win.trigger('scrollend');
	util.noactivateToolBar();
},
backBtnOnClick: function() {
	var $$ = this, util = this.util;
	util.scrollTo($$.backY);
	$$.hideBackBtn({force: true});
},

// FindRes ///////////////////////////
hideBackBtn: function(e) {
	var $$ = this;
	if (e.force || $$.backY && $$.backY <= $$.$win.scrollTop()) {
		$$.backY = 0;
		$$.$win.off('scrollend.hideBackBtn');
		$$.$backBtn.addClass('slide-out-h');
	}
},
showBackBtn: function() {
	var $$ = this;
	if ($$.backY) return;
	$$.backY = $$.$win.scrollTop();
	$$.$backBtn.removeClass('slide-out-h');
	$$.$win.on('scrollend.hideBackBtn', $$.hideBackBtn.bind($$));
},
findRes: function(target, $from) {
	var $ = this.$;
	$('.found').removeClass('found');
	while ($from[0]) {
		if ($from.prop('tagName') === 'TABLE') {
			break;
		}
		$from = $from.parent();
	}
	if (!$from[0]) return;
	var $table = $from.prev('table');
	while($table[0]) {
		if ($table.text().indexOf(target) !== -1) {
			return $table;
		}
		$table = $table.prev('table');
	}
	var $bq = $('blockquote:first');
	if ($bq.text.indexOf(target) !== -1) {
		return $bq;
	}
	return false;
},
quotedResOnClick: function(e) {
	var $$ = this, $ = this.$, util = this.util;
	var $target = $(e.target);
	if ($target[0].tagName === 'A') return;
	var $found = $$.findRes($.trim($target.text().replace('>', '')), $target);
	if (!$found) return;
	var y = 0;
	if ($found[0].tagName === 'TABLE') {
		y = $found.offset().top;
		$found = $found.find('blockquote');
	}
	$$.showBackBtn(); // TODO:
	util.scrollTo(y, function() {
		$found.addClass('found');
	});
},

// Modifi Blockquotes ////////////////
SIO_PREFIX: {
	su: 'http://www.nijibox5.com/futabafiles/tubu/src/',
	ss: 'http://www.nijibox5.com/futabafiles/kobin/src/',
	sa: 'http://www.nijibox6.com/futabafiles/001/src/',
	sp: 'http://www.nijibox6.com/futabafiles/003/src/',
	sq: 'http://www.nijibox6.com/futabafiles/mid/src/',
	f:  'http://dec.2chan.net/up/src/',
	fu: 'http://dec.2chan.net/up2/src/'
},
autoLinkRegex: /(https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-]+)|\b((s[usapq]|fu?)([0-9]{4,})((\.[_a-zA-Z0-9]+)?))/gi,
autoLinkFunc: function(all, url, filename, pref, filenum, ext) {
	var $$ = this, util = this.util;
	if (url) {
		return util.format('<a href="{0}" target="_blank" class="noref">{1}</a>', util.html(url), util.escapeWithoutAmp(url));
	} else {
		return util.format('<a href="{0}{1}" target="_blank">{1}</a>', $$.SIO_PREFIX[pref], filename);
	}
},
norefOnClick: function(e) {
	var $$ = this, util = this.util;
	e.preventDefault();
	var href = e.target.href;
	var html = util.format('<html><head><meta http-equiv="Refresh" content="0; url={0}"></head><body></body></html>', href);
	$$.win.open('data:text/html; charset=utf-8,' + encodeURIComponent(html));
},
autoLinkTextNode: function($elm) {
	var $$ = this, $ = this.$;
	$($elm.contents().filter(function() { return this.nodeType == 3; })).each(function() {
		var a = this.nodeValue;
		var b = a.replace($$.autoLinkRegex, $$.autoLinkFunc.bind($$));
		if (a != b) {
			var $b = $('<span>');
			$b.html(b);
			this.nodeValue = '';
			$(this).after($b);
		}
	});
},
modifiBq: function($bq) {
	var $$ = this, $ = this.$;
	if ($bq.attr('data-are4are')) return;
	$bq.attr('data-are4are', '1');
	// image res
	var imageRes = $bq.prev('a').find('img')[0];
	if (imageRes) {
		imageRes.align = '';
		$bq.css('margin-left', '0');
	}
	// auto link
	$$.autoLinkTextNode($bq);
	$bq.find('font').each(function() { $$.autoLinkTextNode($(this)); });
	$bq.find('.noref').on('click', $$.norefOnClick.bind($$));
	// Mail and del
	var $a = $bq.prev();
	for (var i = 0; i < 5; i ++) { // when over 5, it's may be HOKANKO...
		$a = $a.prev();
		if (!$a[0] || $a.attr('value') === 'delete') {
			// find Delete-Checkbox
			break;
		}
		if ($a.hasClass('del')) {
			// <a onclick="del(1234)">
			//   to...
			// <onclick='window.open("/del.php?b="+b+"&d=1234", "del_form")'>
			// ('b' is global variable)
			$a.attr('onclick',  $a.attr('onclick').replace(/del\(([0-9]+)\)/, 'window.open("/del.php?b="+b+"&d=$1", "del_form")'));
			continue;
		}
		var href = $a.attr('href');
		if (/^mailto:/.test(href)) {
			$a.before('<span>' + $a.text() + '</span>');
			$a.text(href.replace('mailto:', ' ') + ' ');
			if (href.indexOf('mailto:http') === 0) {
				$a.attr('href', href.replace('mailto:', ''));
			}
		}
	}
	// find Qutoted Res
	$bq.find('font[color="#789922"]').on('click', $$.quotedResOnClick.bind($$));
},
modifiTables: function($table) {
	var $$ = this;
	for (var i = 0; i < 20; i ++) {
		var $bq = $table.find('.rtd').find('blockquote');
		if ($bq[0]) {
			$$.modifiBq($bq);
		}
		$table = $table.next('table[border="0"]');
		if (!$table[0]) {
			break;
		}
	}
},
modifiTablesFromPageLeftTop: function() {
	var $$ = this, $ = this.$;
	// find left-top TABLE and modifi.
	var x = 0, y = 0;
	for (var i = 0; i < 10; i ++) {
		var table = $$.doc.elementFromPoint(x, y);
		if (table.tagName === 'A') table = table.parentNode;
		if (table.tagName === 'BLOCKQUOTE') table = table.parentNode;
		if (table.tagName === 'TD') table = table.parentNode;
		if (table.tagName === 'TR') table = table.parentNode;
		if (table.tagName === 'TBODY') table = table.parentNode;
		if (table.tagName === 'TABLE' && table.border === '0') {
			$$.modifiTables($(table));
			return;
		}
		x += 3;
		y += 3;
	}
},

// Modify Form ///////////////////////
onSubmit: function(e) {
	var $$ = this, $ = this.$, util = this.util;
	var $contents = $(e.target).contents();
	if ($contents[0].URL.indexOf('http') !== 0) return;
	if ($contents.find('meta[http-equiv="refresh"]')[0]) {
		$contents[0].defaultView.stop();
		$$.doc.getElementById('ftxa').value = '';
		$$.$writeBtn.removeClass('active');
		$$.$ftbl.fadeOut();
		$$.win.setTimeout(function() { $$.reloadBtnOnClick(); }, 2000);
	} else {
		var msg = $contents.find('div')[0] || $contents.find('body')[0];
		util.toast(msg ? msg.textContent.replace(/リロード$/, '') : '__MSG_writeError__');
	}
	$contents.find('html').html('');
},
modifyForm: function() {
	var $$ = this, $ = this.$;
	var ftxa = $$.doc.getElementById('ftxa');
	if (!ftxa) {
		$$.$writeBtn.addClass('disable');
		return;
	}
	$$.$ftbl = $('#ftbl');
	if (!$$.$ftbl[0]) {
		$$.$writeBtn.addClass('disable');
		return;
	}
	// change id
	$$.$ftbl.attr('id', 'ftbl_fixed');
	$$.$ftbl.attr('style', '');
	$$.$ftbl.hide();
	var $dummy = $('<div>');
	$dummy.attr('id', 'ftbl');
	$('body').append($dummy);
	// toolbtn
	$$.$writeBtn.on('click', function() {
		if ($$.$ftbl.is(':hidden')) {
			$$.$writeBtn.addClass('active');
			$$.$ftbl.fadeIn('normal', function() {
				$$.doc.getElementById('ftxa').focus();
			});
		} else {
			$$.$writeBtn.removeClass('active');
			$$.$ftbl.fadeOut();
		}
	});
	// Post with iFrame
	var $form = $(ftxa.form);
	$form.attr('target', 'areIframe');
	var $iframe = $('<iframe>');
	$iframe.attr({
		id: 'areIframe',
		name: 'areIframe',
		style: 'display:none',
		src: 'about:blank'
	});
	$('body').append($iframe);
	$iframe[0].onload = $$.onSubmit.bind($$);
},

// Others ////////////////////////////
scrollToThreadImage: function() {
	var $ = this.$;
	var img = ($('.thread-image').parent().prevAll('a'))[0] || $('input[value="delete"]:first')[0];
	if (img) {
		this.util.scrollTo($(img).offset().top);
		return;
	}
},

// Main ////////////////////////////////
exec: function(window, $) {
	// setup fields
	this.win = window;
	this.doc = window.document;
	this.$ = $;
	this.$win = $(window);
	this.util = new Are4AreUtil().init(window, $);
	this.$win.unload(function() { this.$ = this.$win = this.doc = this.win = null; });

	var $$ = this, util = this.util;

	// StyleSheet
	util.addCssFile('content_scripts/thread.css');

	// Resize AD
	$('div[class="tue"], div[style="width:468px;height:60px;margin:2px"], div[style^="width:728px;height:90px;"]').each(function() {
		this.setAttribute('style', 'width:234px;height:30px;margin:auto;max-width:234px;max-height:30px;overflow:auto;');
		var child = this.firstChild;
		while (child) {
			if (child.width == '468') {
				child.width = '234';
				child.height = '30';
			}
			child = child.firstChild;
		}
	});
	$('#rightad').find('div').attr('style', '');

	// ToolButtons
	$$.$backBtn = $(util.addToolButton('back', $$.backBtnOnClick.bind($$)));
	$$.$backBtn.addClass('slide-out-h');
	$$.$writeBtn = $(util.addToolButton('write'));
	util.addToolButton('reload', $$.reloadBtnOnClick.bind($$));
	$$.$pageDownBtn = $(util.addToolButton('pagedown'));
	$$.$pageDownBtn.on('touchstart mousedown', $$.pageDownBtnOnTouchstart.bind($$));
	$$.$pageDownBtn.on('touchend mouseup', $$.pageDownBtnOnTouchend.bind($$));
	util.addToolButton('bottom', $$.bottomBtnOnClick.bind($$));

	// MinThumbnail
	$$.appendMinThumbnail();
	$$.$win.on('scrollend', $$.showMinTumbnail.bind($$));

	// Modifi Blockquote (visible)
	$$.modifiBq($('blockquote:first'));
	$$.modifiTables($('table[border="0"]:first'));
	$$.$win.on('scrollend', $$.modifiTablesFromPageLeftTop.bind($$));

	// Newer Border
	$('body').append('<div id="newer_border"></div>');
	$$.$newerBorder = $('#newer_border');

	// Modifi Form
	$$.modifyForm();

	// On repainted all //////////////////
	$$.win.setTimeout(function() {
		// Modifi Blockquote (visible)
		$$.modifiTablesFromPageLeftTop();
		// scroll to Thread-Image
		$$.scrollToThreadImage();
	}, 500);
}
}; // end of my extension

// url check ///////////////////////////
// default target URL
var href = document.location.href;
if (href.match(/http:\/\/([a-z]+)\.2chan\.net\/[^\/]+\/(res\/[0-9]+|futaba\.php)/) && href.indexOf('mode=cat') == -1) {
	jQuery.noConflict();
	var myExt = new Are4AreThread();
	myExt.exec(window, jQuery);
	return;
}
// addtional URL
chrome.storage.local.get('are4are_targetUrls', function(res) {
	var targetUrls = res.are4are_targetUrls;
	if (!targetUrls) {
		return false;
	}
	targetUrls = targetUrls.replace(/\n/g, '|').replace(/(^\s+|\s+$)/, '');
	if (targetUrls.match(/^\|*$/)) {
		return false;
	}
	var reg = new RegExp(targetUrls);
	if (href.replace(/[#\?].*$/, '').match(reg)) {
		jQuery.noConflict();
		var myExt = new Are4AreThread();
		myExt.exec(window, jQuery);
	}
});
})();

