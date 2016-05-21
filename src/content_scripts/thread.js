(function() {
function Are4AreThread() {}
Are4AreThread.prototype = {
__proto__ : Are4Are.prototype,

// MinThumbnail //////////////////////
MINTHUMBNAIL_SIZE: 60,
MINTHUMBNAIL_HIDE_SCROLLTOP: 300,
showMinTumbnail: function(e) {
	var $$ = this;
	var y = $$.win.scrollY;
	if (
		y < $$.MINTHUMBNAIL_HIDE_SCROLLTOP ||
		e.detail && e.detail.triggerSrc !== 'pageDownBtn' && e.detail.y && e.detail.y - y < $$.MINTHUMBNAIL_SIZE
	) {
		$$.fadeOut($$.minThumbnail);
	} else {
		$$.fadeIn($$.minThumbnail);
	}
},
appendMinThumbnail: function() {
	var $$ = this;
	// find thread-image
	var threadImage = $$.firstTag($$.doc, 'BLOCKQUOTE'), href;
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
	var img = $$.create('IMG', {
		src: threadImage.src,
		'class': 'min-thumbnail-img'
	});
	$$.minThumbnail = $$.create('A', {
		href: href,
		target: '_blank',
		id: 'minThumbnail',
		'class': 'transparent'
	});
	$$.minThumbnail.appendChild(img);
	$$.doc.body.appendChild($$.minThumbnail);

	// favicon
	var faviconLink = $$.create('LINK', {rel:'shortcut icon', href: threadImage.src});
	$$.firstTag($$.doc, 'HEAD').appendChild(faviconLink);
},

// Newer Border ///////////////////////
showNewerBorder: function() {
	var $$ = this;
	$$.newerBorder.style = 'opacity: 1; width: 100%; top:' + $$.newerBorder.style.top + ';';
},
hideNewerBorder: function() {
	var $$ = this;
	$$.newerBorder.style = 'top:' + $$.newerBorder.style.top + ';';
},

// ToolButtons ///////////////////////
_pageDownTimeout: null,
pageDownBtnOnTouchstart: function(e) {
	e && e.preventDefault();
	var $$ = this;
	$$.pageDownBtn.classList.add('active');
	$$.pageDownY = $$.win.scrollY + Math.round($$.win.innerHeight / 2);
	$$.scrollTo($$.pageDownY, null, 'pageDownBtn');
	$$.clearTimeout($$._pageDownTimeout);
	$$._pageDownTimeout = $$.win.setTimeout(function() { $$.pageDownBtnOnTouchstart(); }, 1000);
},
pageDownBtnOnTouchend: function(e) {
	var $$ = this;
	$$._pageDownTimeout = $$.clearTimeout($$._pageDownTimeout);
	$$.pageDownBtn.classList.remove('active');
	$$.pageDownY = null;
},
reloadBtnOnClick: function(e) {
	var $$ = this;
	$$.activateToolBar();
	$$.hideNewerBorder();
	$$.getDoc($$.doc.location.href.replace(/#.*$/, ''), function(doc) {
		// update contdisp
		var contdisp = $$.id('contdisp');
		var newContdisp = contdisp && doc.getElementById('contdisp');
		if (newContdisp) {
			contdisp.textContent = newContdisp.textContent;
		}
		// find last Res
		var checkboxs = $$.all('INPUT[type="checkbox"][value="delete"]');
		var lastCheckbox = checkboxs[checkboxs.length - 1];
		var lastResNumber = lastCheckbox .name;
		var lastResMarker = $$.parentNode(lastCheckbox, 'TABLE').nextSibling;
		// new reses
		var newReses = $$.doc.createDocumentFragment();
		var count = 0;
		var table = doc.querySelector('INPUT[type="checkbox"][value="delete"][name="' + lastResNumber + '"]');
		if (table) {
			table = $$.parentNode(table, 'TABLE').nextSibling;
			while (table) {
				var next = table.nextSibling;
				if (table.nodeType === 3) {
					// skip
				} else if (table.tagName === 'TABLE' && table.querySelector('INPUT[type="checkbox"][value="delete"]')) {
					count ++;
					newReses.appendChild(table);
				} else if (table.tagName === 'DIV' && table.style.clear == 'left') {
					break;
				}
				table = next;
			}
		}
		if (!count) {
			$$.toast('__MSG_notModified__');
			return;
		}
		var newerBorderY = lastResMarker.nextSibling.offsetTop;
		$$.newerBorder.style.top = newerBorderY + 'px';
		lastResMarker.parentNode.insertBefore(newReses, lastResMarker);
		$$.queue(function() {
			$$.scrollTo(newerBorderY, $$.showNewerBorder.bind($$));
		});
	}, {
		'304': '__MSG_notModified__',
		'404': '__MSG_threadNotFound__'
	});
},
bottomBtnOnClick: function(e) {
	var $$ = this;
	$$.activateToolBar();
	$$.scrollTo($$.doc.body.clientHeight - $$.win.innerHeight);
	$$.noactivateToolBar();
},
backBtnOnClick: function() {
	var $$ = this;
	$$.scrollTo($$.backY);
	$$.hideBackBtn({force: true});
},

// FindRes ///////////////////////////
hideBackBtn: function(e) {
	var $$ = this;
	if (e.force || $$.backY && $$.backY <= $$.win.scrollY) {
		$$.backY = 0;
		$$.win.removeEventListener('scrollend', $$._hideBackBtn);
		$$.backBtn.classList.add('slide-out-h');
	}
},
showBackBtn: function() {
	var $$ = this;
	if ($$.backY) return;
	$$.backY = $$.win.scrollY;
	$$.backBtn.classList.remove('slide-out-h');
	$$._hideBackBtn = $$._hideBackBtn || $$.hideBackBtn.bind($$);
	$$.win.addEventListener('scrollend', $$._hideBackBtn);
},
findRes: function(target, from) {
	var $$ = this;
	while (from) {
		if (from.tagName === 'TABLE') {
			break;
		}
		from = from.parentNode;
	}
	if (!from) return;
	var table = $$.prev(from, 'TABLE');
	while(table) {
		if (table.textContent.indexOf(target) !== -1) {
			return table;
		}
		table = $$.prev(table, 'TABLE');
	}
	var bq = $$.firstTag($$.doc, 'BLOCKQUOTE');
	if (bq.textContent.indexOf(target) !== -1) {
		return bq;
	}
	return false;
},
quoteTextOnClick: function(e) {
	var $$ = this;
	if (e.target.tagName === 'A') return;
	var found = $$.findRes(e.target.textContent.replace(/^\s+|\s+$/g, '').replace('>', ''), e.target);
	if (!found) return;
	var y;
	if (found.tagName === 'TABLE') {
		$$.modifyTables(found);
		y = found.offsetTop;
		found = $$.firstTag(found, 'BLOCKQUOTE');
	} else {
		y = $$.prev(found, 'INPUT').offsetTop;
	}
	// bookmark
	if ($$.found) {
		$$.found.classList.remove('bookmark', 'found');
	}
	$$.found = found;
	if ($$.backY < $$.parentNode(e.target, 'TABLE').offsetTop) {
		$$.backY = 0;
	}
	if (!$$.backY) {
		$$.foundFrom && $$.foundFrom.classList.remove('bookmark');
		$$.foundFrom = $$.parentNode(e.target, 'BLOCKQUOTE');
		$$.foundFrom.classList.add('bookmark');
	}
	// scroll
	$$.showBackBtn();
	$$.scrollTo(y, function() { found.classList.add('bookmark', 'found'); }, 'quoteText');
},

// Modify Blockquotes ////////////////
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
	var $$ = this;
	var text = after || node.nodeValue;
	var m = $$.autoLinkRegexp.exec(text);
	if (!m) return null;
	if (!after) {
		node = $$.doc.createDocumentFragment();
	}
	// before
	node.appendChild($$.doc.createTextNode(text.substring(0, m.index)));
	// link
	if (m[1]) {
		node.appendChild($$.create('A', { href: m[1], target: '_blank', 'class': 'noref' }, m[1]));
	} else {
		node.appendChild($$.create('A', { href: $$.SIO_PREFIX[m[3]] + m[2], target: '_blank' }, m[2]));
	}
	// after
	$$.autoLinkNode(node, text.substring(m.index + m[0].length));
	return node;
},
autoLinkTextNode: function(elm) {
	var $$ = this;
	var textNode = elm.lastChild;
	while (textNode) {
		var prev = textNode.previousSibling;
		if (textNode.nodeType === 3) {
			var fragment = $$.autoLinkNode(textNode);
			if (fragment) {
				textNode.nodeValue = '';
				elm.insertBefore(fragment, textNode);
			}
		}
		textNode = prev;
	}
},
norefOnClick: function(e) {
	var $$ = this;
	e.preventDefault();
	var href = e.target.href;
	var html = $$.format('<html><head><meta http-equiv="Refresh" content="0; url={0}"></head><body></body></html>', href);
	$$.win.open('data:text/html; charset=utf-8,' + encodeURIComponent(html));
},
modifyBq: function(bq) {
	var $$ = this;
	if (!bq || bq.getAttribute('data-are4are')) return;
	bq.setAttribute('data-are4are', '1');
	// auto link
	$$.autoLinkTextNode(bq);
	Array.forEach(bq.getElementsByTagName('font'), function(font) { $$.autoLinkTextNode(font); });
	// Mail and del
	var a = bq;
	for (var i = 0; i < 10; i ++) { // when over 10, it's may be HOKANKO...
		a = a.previousSibling;
		if (a.nodeType === 3) continue;
		if (!a || a.value === 'delete') {
			// find Delete-Checkbox
			break;
		}
		if (a.classList.contains('del')) {
			// <a onclick="del(1234)">
			//   to...
			// <onclick='window.open("/del.php?b="+b+"&d=1234", "del_form")'>
			// ('b' is global variable)
			a.setAttribute('onclick', a.getAttribute('onclick').replace(/del\(([0-9]+)\)/, 'window.open("/del.php?b="+b+"&d=$1", "del_form")'));
			continue;
		}
		if (a.href && /^mailto:/.test(a.href)) {
			a.parentNode.insertBefore($$.create('SPAN', null, a.textContent), a);
			a.textContent = a.href.replace('mailto:', ' ') + ' ';
			if (a.href.indexOf('mailto:http') === 0) {
				a.href = a.href.replace('mailto:', '');
			}
		}
	}
	// find Qutoted Res
	Array.forEach(bq.querySelectorAll('FONT[color="#789922"]'), function(font) {
		font.classList.add('quote-text');
	});
},
modifyTables: function(table) {
	var $$ = this;
	for (var i = 0; i < 20; i ++) {
		var rtd = $$.firstClass(table, 'rtd');
		if (!rtd) continue;
		$$.modifyBq($$.firstTag(rtd, 'BLOCKQUOTE'));
		table = $$.next(table, 'TABLE');
		if (!table) {
			break;
		}
	}
},
modifyTablesFromPageLeftTop: function() {
	var $$ = this;
	// find left-top TABLE and modify.
	var x = 0, y = 0;
	for (var i = 0; i < 10; i ++) {
		var table = $$.doc.elementFromPoint(x, y);
		if (table.tagName === 'A') table = table.parentNode;
		if (table.tagName === 'BLOCKQUOTE') table = table.parentNode;
		if (table.tagName === 'TD') table = table.parentNode;
		if (table.tagName === 'TR') table = table.parentNode;
		if (table.tagName === 'TBODY') table = table.parentNode;
		if (table.tagName === 'TABLE' && table.border === '0') {
			$$.modifyTables(table);
			return;
		}
		x += 3;
		y += 3;
	}
},

// Modify Form ///////////////////////
onSubmit: function(e) {
	var $$ = this;
	if ($$.areIframe.contentDocument.URL.indexOf('http') !== 0) return;
	$$.areIframe.contentDocument.defaultView.stop();
	var msg = $$.areIframe.contentDocument.getElementsByTagName('DIV')[0] || $$.areIframe.contentDocument.body;
	$$.toast(msg ? msg.textContent.replace(/リロード$/, '') : '__MSG_writeError__');
	$$.areIframe.contentDocument.location.href = 'about:blank';
	if ($$.areIframe.contentDocument.querySelector('META[http-equiv="refresh"]')) {
		$$.doc.getElementById('ftxa').value = '';
		$$.writeBtn.classList.remove('active');
		$$.fadeOut($$.ftbl);
		$$.win.setTimeout(function() { $$.reloadBtnOnClick(); }, 2000);
	}
},
modifyForm: function() {
	var $$ = this;
	var ftxa = $$.id('ftxa');
	if (!ftxa) {
		$$.writeBtn.classList.add('disable');
		return;
	}
	$$.ftbl = $$.id('ftbl');
	if (!$$.ftbl) {
		$$.writeBtn.classList.add('disable');
		return;
	}
	// change id
	$$.ftbl.id = 'ftbl_fixed';
	$$.ftbl.style = '';
	$$.ftbl.classList.add('transparent');
	$$.doc.body.appendChild($$.create('DIV', {id: 'ftbl' })); // dummy #ftbl
	// toolbtn
	$$.on($$.writeBtn, 'click', function() {
		if ($$.ftbl.classList.contains('transparent')) {
			$$.writeBtn.classList.add('active');
			$$.fadeIn($$.ftbl);
			$$.id('ftxa').focus();
		} else {
			$$.writeBtn.classList.remove('active');
			$$.fadeOut($$.ftbl);
		}
	});
	// Post with iFrame
	ftxa.form.setAttribute('target', 'areIframe');
	$$.areIframe = $$.create(
		'IFRAME', {
		id: 'areIframe',
		name: 'areIframe',
		style: 'display:none',
		src: 'about:blank'
	});
	$$.on($$.areIframe, 'load', $$.onSubmit);
	$$.doc.body.appendChild($$.areIframe);
},

// Others ////////////////////////////
scrollToThreadImage: function() {
	var $$ = this;
	var i = $$.firstClass($$.doc, 'thread-image');
	i = i && $$.prev(i.parentNode, 'A') || $$.first('INPUT[value="delete"]');
	if (i) { $$.scrollTo(i.offsetTop); }
},

// Main ////////////////////////////////
exec: function(window) {
	var $$ = this;
	$$.init(window);

	// StyleSheet
	$$.addCssFile('content_scripts/thread.css');

	// AD
	// remove `style="float:right"`
	var rightad = $$.id('rightad');
	rightad && rightad.setAttribute('style', '');

	// ToolButtons
	$$.backBtn = $$.addToolButton('back', $$.backBtnOnClick);
	$$.backBtn.classList.add('slide-out-h');
	$$.writeBtn = $$.addToolButton('write');
	$$.addToolButton('reload', $$.reloadBtnOnClick);
	$$.pageDownBtn = $$.addToolButton('pagedown');
	$$.on($$.pageDownBtn, 'touchstart mousedown', $$.pageDownBtnOnTouchstart);
	$$.on($$.pageDownBtn, 'touchend mouseup', $$.pageDownBtnOnTouchend);
	$$.addToolButton('bottom', $$.bottomBtnOnClick);

	// MinThumbnail
	$$.appendMinThumbnail();
	$$.on($$.win, 'scrollend', $$.showMinTumbnail);

	// Modify Blockquote (visible)
	$$.modifyBq($$.firstTag($$.doc, 'BLOCKQUOTE'));
	$$.modifyTables($$.first('TABLE[border="0"]'));
	$$.on($$.win, 'scrollend', $$.modifyTablesFromPageLeftTop);

	// Newer Border
	$$.newerBorder = $$.create('DIV', { id: 'newer_border' });
	$$.doc.body.appendChild($$.newerBorder);

	// Modify Form
	$$.modifyForm();

	// Click Events
	$$.on($$.doc.body, 'click', function(e) {
		if (!e.target) return;
		if (e.target.classList.contains('noref')) {
			$$.norefOnClick(e);
		} else if (e.target.classList.contains('quote-text')) {
			$$.quoteTextOnClick(e);
		}
	});

	// after repainted
	$$.on($$.win, 'load', function() {
		$$.scrollToThreadImage();
		$$.modifyTablesFromPageLeftTop();
	});
}
}; // end of my extension

// start ///////////////////////////////
chrome.storage.local.get('urls', function(r) {
	var href = document.location.href;
	if (href.indexOf('mode=cat') === -1 && href.match(/^http:\/\/([a-z]+)\.2chan\.net\/[^\/]+\/(res\/[0-9]+|futaba\.php)/)) {
		// default URL
	} else {
		// addtional URL
		if (!(r.urls)) return;
		var reg = new RegExp(r.urls.replace(/\n/g, '|'));
		if (!href.replace(/[#\?].*$/, '').match(reg)) return;
	}
	// url matched
	var myExt = new Are4AreThread();
	myExt.exec(window);
});
})();

