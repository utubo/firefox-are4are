function Are4Are() { }
Are4Are.prototype = {
	// Field ///////////////////////////////
	win: null,
	doc: null,
	toolbar: null,

	// Util ////////////////////////////////
	format: function() {
		var args = arguments;
		var str = args[0].replace(/__MSG_([^_]+)__/g, function(m, c) { return chrome.i18n.getMessage(c); });
		return str.replace(/\{(\d)\}/g, function(m, c) { return args[parseInt(c) + 1]; });
	},
	fadeOut: function(elm) {
		elm.classList.add('fade-effect', 'transparent');
	},
	fadeIn: function(elm) {
		elm.classList.add('fade-effect');
		elm.classList.remove('transparent');
	},
	toast: function() {
		var $$ = this;
		var text = $$.format.apply($$, arguments);
		if (!$$.toastDiv) {
		}
		$$.toastDiv.textContent = text;
		$$.fadeIn($$.toastDiv);
		$$.win.setTimeout((function() { $$.fadeOut($$.toastDiv);}), 3000);
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
		var elm = this.doc.createElement(tag);
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
	clearTimeout: function(id) {
		if (id) this.win.clearTimeout(id);
		return null;
	},
	queue: function(func) {
		this.win.setTimeout(func, 1);
	},
	// scrollend event
	scrollendEventTrigger: function() {
		var $$ = this;
		$$.clearTimeout($$._scrollendTimer);
		$$._scrollendTimer = $$.win.setTimeout(function() {
			try {
				$$.scrollendFunc && $$.scrollendFunc();
				$$.win.dispatchEvent(new CustomEvent('scrollend', { detail: $$.scrollendDetail }));
			} finally {
				$$.scrollendFunc = null;
				$$.scrollendDetail = null;
			}
		}, 200);
	},
	scrollTo: function(y, func, opt) {
		this.scrollToNoMargin(Math.max(y - 2, 0), func, opt);
	},
	scrollToNoMargin: function(targetY, func, triggerSrc) {
		var $$ = this;
		var y = Math.min(targetY, $$.doc.body.clientHeight - $$.win.innerHeight);
		$$.scrollendFunc = func;
		$$.scrollendDetail = { y: targetY, triggerSrc: triggerSrc};
		if ($$.win.scrollY == y) {
			func();
		} else {
			$$.win.scrollTo(0, y);
		}
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
		}
		xhr.onabort = xhr.onerror = xhr.ontimeout = function() {
			$$.toast('__MSG_networkError__(timeout)');
			$$.noactivateToolBar();
		}
		xhr.timeout = 30 * 1000;
		try {
			xhr.open("GET", href);
			xhr.responseType = 'document';
			xhr.send();
		} catch (e) {
			$$.toast('__MSG_networkError__');
			$$.noactivateToolBar();
		}
	},

	// ToolBar /////////////////////////////
	addToolButton: function(label, onclick) {
		var btn = this.create('A');
		btn.textContent = chrome.i18n.getMessage(label);
		btn.id = 'are_toolbtn_' + label;
		btn.href = 'javascript:void(0);';
		btn.classList.add('are_toolbtn');
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

	// init ////////////////////////////////
	init: function(window) {
		var $$ = this;
		// setup fields
		$$.win = window;
		$$.doc = window.document;

		// ViewPort
		var head = $$.doc.getElementsByTagName('HEAD')[0];
		var viewPort = $$.create('META', {
			name: 'viewport',
			content: 'width=device-width'
		});
		head.insertBefore(viewPort, head.firstChild);

		// CSS
		$$.addCssFile('common/are4are.css');

		// Scrollend Event
		$$._scrollendEventTrigger = $$.scrollendEventTrigger.bind($$);
		$$.win.addEventListener('scroll', $$._scrollendEventTrigger);
		$$.doc.body.addEventListener('touchmove', $$._scrollendEventTrigger);

		// Toast
		$$.toastDiv = $$.create('DIV', {'class': 'are_toast transparent'});
		$$.doc.body.appendChild($$.toastDiv);

		// ToolBar
		$$.toolbar = $$.create('DIV', {
			id: 'are_toolbar',
			style: 'display:none'
		});
		$$.doc.body.appendChild($$.toolbar);
		$$.queue(function() { $$.toolbar.style = ''; });
	}
};

