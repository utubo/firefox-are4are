function Are4Are() { }
Are4Are.prototype = {
	// Field ///////////////////////////////
	win: null,
	doc: null,
	body: null,
	toolbar: null,
	exec: null,
	timeoutIds: {},

	// Util ////////////////////////////////
	format: function() {
		var args = arguments;
		var str = args[0].replace(/__MSG_([^_]+)__/g, function(m, c) { return chrome.i18n.getMessage(c); });
		return str.replace(/\{(\d+)\}/g, function(m, c) { return args[parseInt(c) + 1]; });
	},
	regEscape: function(s) {
		return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	},

	// DOM & HTML Util /////////////////////
	id: function(_id) {
		return this.doc.getElementById(_id);
	},
	firstTag: function(elm, tagName) {
		return elm.getElementsByTagName(tagName)[0];
	},
	firstClass: function(elm, className) {
		return elm.getElementsByClassName(className)[0];
	},
	first: function(query) {
		return this.doc.querySelector(query);
	},
	all: function(query) {
		return this.doc.querySelectorAll(query);
	},
	findTag: function(elm, tag, func) {
		var e = elm;
		while(true) {
			e = func(e);
			if (!e) return null;
			if (e.nodeType !== 1) continue;
			if (e.tagName === tag) return e;
		}
		return null;
	},
	prev: function(elm, tag) { return this.findTag(elm, tag, function(e) { return e.previousSibling; }); },
	next: function(elm, tag) { return this.findTag(elm, tag, function(e) { return e.nextSibling; }); },
	parentNode: function(elm, tag) { return this.findTag(elm, tag, function(e) { return e.parentNode; }); },
	create: function(tag, attrs, text) {
		var elm = this.doc.createElement.call(this.doc, tag);
		if (attrs) {
			for (var attr in attrs) {
				elm.setAttribute(attr, attrs[attr]);
			}
		}
		if (text) {
			elm.textContent = text;
		}
		return elm;
	},
	addCssFile: function(cssFile) {
		var cssLink = this.create('LINK', {
			rel: 'stylesheet',
			type: 'text/css',
			href: chrome.extension.getURL(cssFile)
		});
		this.firstTag(this.doc, 'HEAD').appendChild(cssLink);
	},
	on: function(elm, names, func) {
		for (var name of names.split(' ')) {
			elm.addEventListener(name, func.bind(this));
		}
	},
	setTimeout: function(id, func, msec) {
		if (id) {
			this.clearTimeout(id);
			this.timeoutIds[id] = this.win.setTimeout(func, msec);
		} else {
			this.win.setTimeout(func, msec);
		}
	},
	clearTimeout: function(id) {
		var t = this.timeoutIds[id];
		if (t) this.win.clearTimeout(t);
		this.timeoutIds[id] = null;
	},
	queue: function(func) {
		this.setTimeout(null, func, 1);
	},
	// Ajax ////////////////////////////////
	getDoc: function(href, func, errorMessages) {
		var $$ = this;
		$$.activateToolBar();
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (this.readyState !== 4) return;
			$$.noactivateToolBar();
			if (this.status == 200 && this.responseXML) {
				func(xhr.responseXML);
				return;
			}
			var errorMessage = errorMessages[this.status] || '__MSG_networkError__(' + this.status + ')';
			$$.toast(errorMessage);
		};
		xhr.onabort = xhr.onerror = xhr.ontimeout = function() {
			$$.toast('__MSG_networkError__(timeout)');
			$$.noactivateToolBar();
		};
		xhr.timeout = 15 * 1000;
		try {
			xhr.open("GET", href);
			xhr.responseType = 'document';
			xhr.send();
		} catch (e) {
			$$.toast('__MSG_networkError__');
			$$.noactivateToolBar();
		}
	},

	// UI //////////////////////////////////
	// Scrollend event
	scrollendEventTrigger: function() {
		var $$ = this;
		$$.setTimeout('scrollend', function() {
			try {
				if ($$.scrollendFunc) { $$.scrollendFunc(); }
				$$.win.dispatchEvent(new CustomEvent('scrollend', { detail: $$.scrollendDetail }));
			} finally {
				$$.scrollendFunc = null;
				$$.scrollendDetail = null;
			}
		}, 200);
	},
	// Scroll
	scrollTo: function(y, func, triggerSrc) {
		this.scrollToNoMargin(Math.max(y - 2, 0), func, triggerSrc);
	},
	scrollToNoMargin: function(targetY, func, triggerSrc) {
		var $$ = this;
		var y = Math.min(targetY, $$.body.clientHeight - $$.win.innerHeight);
		$$.scrollendFunc = func;
		$$.scrollendDetail = { y: targetY, triggerSrc: triggerSrc};
		if ($$.win.scrollY == y) {
			if (func) { func(); }
		} else {
			$$.win.scrollTo(0, y);
		}
	},
	// Fade
	fadeOut: function(elm) {
		elm.classList.add('fade-effect', 'transparent');
	},
	fadeIn: function(elm) {
		elm.classList.add('fade-effect');
		elm.classList.remove('transparent');
	},
	// Toast
	toast: function() {
		var $$ = this;
		var text = $$.format.apply($$, arguments);
		if (!$$.toastDiv) {
		}
		$$.toastDiv.textContent = text;
		$$.fadeIn($$.toastDiv);
		$$.setTimeout('fadeOutToast', (function() { $$.fadeOut($$.toastDiv);}), 3000);
	},
	// ToolBar
	addToolButton: function(label, onclick) {
		var btn = this.create('A');
		btn.textContent = chrome.i18n.getMessage(label);
		btn.id = 'areToolbtn_' + label;
		btn.href = 'javascript:void(0);';
		btn.classList.add('are-toolbtn');
		if (onclick) {
			btn.onclick = onclick.bind(this);
		}
		this.toolbar.appendChild(btn, this.toolbar.firstChild);
		return btn;
	},
	activateToolBar: function() {
		this.toolbar.classList.add('active');
	},
	noactivateToolBar: function() {
		this.toolbar.classList.remove('active');
	},

	// Init ////////////////////////////////
	onDOMContentLoaded: function() {
		var $$ = this;
		$$.body = window.document.body;

		// Viewport
		var head = $$.firstTag($$.doc, 'HEAD');
		var viewport = $$.create('META', {
			name: 'viewport',
			content: 'width=device-width'
		});
		head.insertBefore(viewport, head.firstChild);

		// CSS
		$$.addCssFile('common/are4are.css');

		// Scrollend Event
		$$._scrollendEventTrigger = $$.scrollendEventTrigger.bind($$);
		$$.win.addEventListener('scroll', $$._scrollendEventTrigger);
		$$.body.addEventListener('touchmove', $$._scrollendEventTrigger);

		// Toast
		$$.toastDiv = $$.create('DIV', {'class': 'are-toast transparent'});
		$$.body.appendChild($$.toastDiv);

		// Toolbar
		$$.toolbar = $$.create('DIV', {
			id: 'areToolbar',
			style: 'display:none'
		});
		$$.body.appendChild($$.toolbar);
		$$.queue(function() { $$.toolbar.style = ''; });

		// modify ThreadPage, CatalogPage, etc ...
		$$.exec();
	},

	// Start ///////////////////////////////
	start : function(window) {
		var $$ = this;
		$$.win = window;
		$$.doc = window.document;
		//$$.body = window.document.body; // document.body don't exist yet.

		if ($$.doc.readyState != 'complete') {
			try {
				// Hide body
				var cover = 'body::before {'
					+ 'background: #fff;'
					+ 'content: " ";'
					+ 'display: block;'
					+ 'height: 100%;'
					+ 'left: 0;'
					+ 'opacity: 1;'
					+ 'pointer-events: none;'
					+ 'position: fixed;'
					+ 'top: 0;'
					+ 'width: 100%;'
					+ 'z-index: 99;'
					+ '}';
				$$.doc.styleSheets[0].insertRule(cover, 0);
				// Show body
				$$.win.addEventListener('load', function() {
					$$.doc.styleSheets[0].insertRule('body::before { opacity: 0 !important; transition: all .3s; }', 0);
				});
			} catch (e) {
				// nop
			}
		}

		// Modify futaba
		if ($$.doc.readyState == 'interactive' || $$.doc.readyState == 'complete') {
			$$.onDOMContentLoaded();
		} else {
			$$.doc.addEventListener('DOMContentLoaded', $$.onDOMContentLoaded.bind($$));
		}
	}
};

