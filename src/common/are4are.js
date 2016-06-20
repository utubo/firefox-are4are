function Are4Are() { }
(function() {

'use strict';

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
		let args = arguments;
		let str = args[0].replace(/__MSG_([^_]+)__/g, (m, c) => { return chrome.i18n.getMessage(c); });
		return str.replace(/\{(\d+)\}/g, (m, c) => { return args[parseInt(c) + 1]; });
	},
	regEscape: function(s) {
		return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	},
	arrayLast: function(a) {
		return a[a.length - 1];
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
		let e = elm;
		while(true) {
			e = func(e);
			if (!e) return null;
			if (e.nodeType !== 1) continue;
			if (e.tagName === tag) return e;
		}
		return null;
	},
	prev: function(elm, tag) { return this.findTag(elm, tag, e => { return e.previousSibling; }); },
	next: function(elm, tag) { return this.findTag(elm, tag, e => { return e.nextSibling; }); },
	parentNode: function(elm, tag) { return this.findTag(elm, tag, e => { return e.parentNode; }); },
	create: function(tag, attrs, text) {
		let elm = this.doc.createElement.call(this.doc, tag);
		if (attrs) {
			for (let attr in attrs) {
				elm.setAttribute(attr, attrs[attr]);
			}
			if (attrs.id) {
				this[attrs.id] = elm;
			}
		}
		if (text) {
			elm.textContent = text;
		}
		return elm;
	},
	addCssFile: function(cssFile) {
		let cssLink = this.create('LINK', {
			rel: 'stylesheet',
			type: 'text/css',
			href: chrome.extension.getURL(cssFile)
		});
		this.firstTag(this.doc, 'HEAD').appendChild(cssLink);
	},
	on: function(elm, names, func) {
		for (let name of names.split(' ')) {
			elm.addEventListener(name, func.bind(this));
		}
	},
	timeout: function(id, func, msec) { // ??? "setTimeout or setInterval must have function as 1st arg"
		if (id) {
			this.clearTimeout(id);
			this.timeoutIds[id] = this.win.setTimeout(func, msec);
		} else {
			this.win.setTimeout(func, msec);
		}
	},
	clearTimeout: function(id) {
		let t = this.timeoutIds[id];
		if (t) this.win.clearTimeout(t);
		this.timeoutIds[id] = null;
	},
	queue: function(func) {
		this.timeout(null, func, 100);
	},
	// Ajax ////////////////////////////////
	getDoc: function(href, func, errorMessages) {
		this.activateToolBar();
		let xhr = new XMLHttpRequest();
		xhr.onreadystatechange = () => {
			if (xhr.readyState !== 4) return;
			this.noactivateToolBar();
			if (xhr.status == 200 && xhr.responseXML) {
				func(xhr.responseXML);
				return;
			}
			let errorMessage = errorMessages[xhr.status] || `__MSG_networkError__(${xhr.status})`;
			this.toast(errorMessage);
		};
		xhr.onabort = xhr.onerror = xhr.ontimeout = () => {
			this.toast('__MSG_networkError__(timeout)');
			this.noactivateToolBar();
		};
		xhr.timeout = 15 * 1000;
		try {
			xhr.open("GET", href);
			xhr.responseType = 'document';
			xhr.send();
		} catch (e) {
			this.toast('__MSG_networkError__');
			this.noactivateToolBar();
		}
	},

	// UI //////////////////////////////////
	// Scrollend event
	scrollendEventTrigger: function() {
		this.timeout('scrollend', () => {
			try {
				if (this.scrollendFunc) { this.scrollendFunc(); }
				this.win.dispatchEvent(new CustomEvent('scrollend', { detail: this.scrollendDetail }));
			} finally {
				this.scrollendFunc = null;
				this.scrollendDetail = null;
			}
		}, 200);
	},
	// Scroll
	scrollTo: function(y, func, triggerSrc) {
		this.scrollToNoMargin(Math.max(y - 2, 0), func, triggerSrc);
	},
	scrollToNoMargin: function(targetY, func, triggerSrc) {
		let y = Math.min(targetY, this.body.clientHeight - this.win.innerHeight);
		this.scrollendFunc = func;
		this.scrollendDetail = { y: targetY, triggerSrc: triggerSrc};
		if (this.win.scrollY == y) {
			if (func) { func(); }
		} else {
			this.win.scrollTo(0, y);
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
		let text = this.format.apply(this, arguments);
		if (!this.toastDiv) {
		}
		this.toastDiv.textContent = text;
		this.fadeIn(this.toastDiv);
		this.timeout('fadeOutToast', () => { this.fadeOut(this.toastDiv);}, 3000);
	},
	// ToolBar
	addToolButton: function(label, onclick) {
		let btn = this.create('A');
		btn.textContent = chrome.i18n.getMessage(label);
		btn.href = 'javascript:void(0);';
		btn.classList.add('are-toolbtn', `are-toolbtn-${label}`);
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
		this.body = window.document.body;

		// Viewport
		let head = this.firstTag(this.doc, 'HEAD');
		let viewport = this.create('META', {
			name: 'viewport',
			content: 'width=device-width'
		});
		head.insertBefore(viewport, head.firstChild);

		// CSS
		this.addCssFile('common/are4are.css');

		// Scrollend Event
		this._scrollendEventTrigger = this.scrollendEventTrigger.bind(this);
		this.win.addEventListener('scroll', this._scrollendEventTrigger);
		this.body.addEventListener('touchmove', this._scrollendEventTrigger);

		// Toast
		this.toastDiv = this.create('DIV', {'class': 'are-toast transparent'});
		this.body.appendChild(this.toastDiv);

		// Toolbar
		this.toolbar = this.create('DIV', {
			'class': 'are-toolbar',
			style: 'display:none'
		});
		this.body.appendChild(this.toolbar);
		this.queue(() => { this.toolbar.style = ''; });

		// modify ThreadPage, CatalogPage, etc ...
		this.exec();
	},

	// Start ///////////////////////////////
	start : function(window) {
		this.win = window;
		this.doc = window.document;
		//this.body = window.document.body; // document.body don't exist yet.

		if (this.doc.readyState != 'complete') {
			try {
				// Hide body
				let cover =
					`body::before {
						background: #fff;
						content: " ";
						display: block;
						height: 100%;
						left: 0;
						opacity: 1;
						pointer-events: none;
						position: fixed;
						top: 0;
						width: 100%;
						z-index: 99;
					}`;
				this.doc.documentElement.appendChild(this.create('STYLE'));
				let ss = this.arrayLast(this.doc.styleSheets);
				ss.insertRule(cover, 0);
				// Show body
				this.win.addEventListener('load', () => {
					ss.insertRule('body::before { opacity: 0 !important; transition: all .3s; }', 0);
				});
			} catch (e) {
				// nop
			}
		}

		// Modify futaba
		if (this.doc.readyState == 'interactive' || this.doc.readyState == 'complete') {
			this.onDOMContentLoaded();
		} else {
			this.doc.addEventListener('DOMContentLoaded', this.onDOMContentLoaded.bind(this));
		}
	}
};
})();

