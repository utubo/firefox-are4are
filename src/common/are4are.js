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
	funcs: {},
	timeoutIds: {},

	// Util ////////////////////////////////
	format: (s, ...args) => {
		return s
			.replace(/__MSG_([^_]+)__/g, (m, c) => chrome.i18n.getMessage(c))
			.replace(/\{(\d+)\}/g, (m, c) => args[+c]);
	},
	regEscape: s => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'),
	arrayLast: a => a[a.length - 1],
	bindFunc: function(name) {
		let func = this.funcs[name];
		if (!func) {
			func = (this[name]).bind(this);
			this.funcs[name] = func;
		}
		return func;
	},

	// DOM & HTML Util /////////////////////
	id: function(_id) {
		return this.doc.getElementById(_id);
	},
	firstTag: function(elm, tag) {
		return !tag ? this.doc.getElementsByTagName(elm)[0] : elm.getElementsByTagName(tag)[0];
	},
	firstClass: function(elm, className) {
		return !className ? this.doc.getElementsByClassName(elm)[0] : elm.getElementsByClassName(className)[0];
	},
	first: function(query) {
		return this.doc.querySelector(query);
	},
	all: function(query) {
		return this.doc.querySelectorAll(query);
	},
	findTag: function(elm, tag, func) {
		while (true) {
			elm = func(elm);
			if (!elm) return null;
			if (elm.nodeType !== 1) continue;
			if (elm.tagName === tag) return elm;
		}
	},
	prev: function(elm, tag) { return this.findTag(elm, tag, e => e.previousSibling); },
	next: function(elm, tag) { return this.findTag(elm, tag, e => e.nextSibling); },
	parentTag: function(elm, tag) { return this.findTag(elm, tag, e => e.parentNode); },
	create: function(tag, attrs, text) {
		let elm = this.doc.createElement.call(this.doc, tag);
		if (attrs) {
			for (let attr in attrs) {
				elm.setAttribute(attr, attrs[attr]);
			}
			if (attrs.id) {
				this[attrs.id.replace(/^are4are_/, '')] = elm;
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
		this.doc.head.appendChild(cssLink);
	},
	on: function(elm, names, func) {
		if (typeof func === 'string') {
			func = this.bindFunc(func);
		}
		for (let name of names.split(' ')) {
			elm.addEventListener(name, func);
		}
	},
	timeout: function(id, func, msec) { // ??? "setTimeout or setInterval must have function as 1st arg"
		if (typeof func === 'string') {
			func = this.bindFunc(func);
		}
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
		this.timeout(null, func, 10);
	},
	computedPx: function(elm, prop) {
		return parseInt(this.win.getComputedStyle(elm).getPropertyValue(prop), 10);
	},
	y: function(elm) {
		let y = 0;
		while(elm) {
			y += elm.offsetTop;
			elm = elm.offsetParent;
		}
		return y;
	},

	// Ajax ////////////////////////////////
	getDoc: function(href, func) {
		this.activateToolBar();
		let xhr = new XMLHttpRequest();
		xhr.onreadystatechange = () => {
			if (xhr.readyState !== 4) return;
			this.noactivateToolBar();
			if (xhr.status === 200 && xhr.responseXML) {
				func.call(this, xhr.responseXML);
				return;
			}
			switch (xhr.status) {
				case 304: this.toast('__MSG_notModified__'); break;
				case 404: this.toast('__MSG_notFound__'); break;
				default: this.toast(`__MSG_networkError__(${xhr.status})`);
			}
		};
		xhr.ontimeout = () => {
			this.toast('__MSG_networkError__(timeout)');
			this.noactivateToolBar();
		};
		xhr.onabort = xhr.onerror = () => {
			this.toast('__MSG_networkError__');
			this.noactivateToolBar();
		};
		xhr.timeout = 15 * 1000;
		try {
			xhr.open("GET", href);
			xhr.responseType = 'document';
			xhr.send();
		} catch (e) {
			this.toast(`__MSG_networkError__(${e.message})`);
			this.noactivateToolBar();
		}
	},

	// UI //////////////////////////////////
	// Scroll
	scrollendEventTrigger: function() {
		this.timeout('scrollend', () => {
			this._scrollY = null;
			try {
				if (this.scrollendFunc) { this.scrollendFunc(); }
				this.win.dispatchEvent(new CustomEvent('scrollend', { detail: this.scrollendDetail }));
			} finally {
				this.scrollendFunc = null;
				this.scrollendDetail = null;
			}
		}, 200);
	},
	scrollY: function() {
		if (this._scrollY) return this._scrollY;
		this._scrollY = this.win.scrollY;
		return this._scrollY;
	},
	clientHeight: function() {
		return this.body && this.body.clientHeight || this.win.innerHeight;
	},
	_scrollMax: null,
	resetScrollMax: function() {
		this._scrollMax = null;
	},
	scrollMax: function() {
		if (this._scrollMax) return this._scrollMax;
		this._scrollMax = this.clientHeight() - this.y(this.toolbar);
		this.timeout(null, 'resetScrollMax', 5000);
		return this._scrollMax;
	},
	scrollTo: function(y, func, triggerSrc) {
		this.scrollToNoMargin(Math.max(y - 2, 0), func, triggerSrc);
	},
	scrollToNoMargin: function(targetY, func, triggerSrc) {
		this._scrollY = null;
		let y = Math.min(targetY, this.scrollMax());
		this.scrollendFunc = func;
		this.scrollendDetail = { y: targetY, triggerSrc: triggerSrc};
		if (Math.round(this.win.scrollY) === Math.round(y)) {
			if (func) { func.call(this); }
		} else {
			this.win.scrollTo(0, y);
		}
	},
	// Fade
	fadeOut: function(elm) {
		elm.classList.add('are4are-fade-effect', 'are4are-transparent');
	},
	fadeIn: function(elm) {
		elm.classList.add('are4are-fade-effect');
		elm.classList.remove('are4are-transparent');
	},
	// Toast
	toast: function(...args) {
		let text = this.format.apply(this, args);
		this.toastDiv.textContent = text;
		this.fadeIn(this.toastDiv);
		this.timeout('fadeOutToast', () => { this.fadeOut(this.toastDiv); }, 3000);
	},
	// ToolBar
	addToolButton: function(label, onclick, ...clazz) {
		let btn = this.create('A');
		btn.textContent = chrome.i18n.getMessage(label);
		btn.href = 'javascript:void(0);';
		clazz.push('are4are-toolbtn');
		clazz.push(`are4are-toolbtn-${label}`);
		btn.classList.add.apply(btn.classList, clazz);
		if (onclick) {
			this.on(btn, 'click', onclick);
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

	// Cover ///////////////////////////////
	coverSS: null,
	coverBody: function () {
		try {
			let cover = `body::before {
				background: #fff;
				content: " ";
				display: block;
				height: 100%;
				left: 0;
				opacity: 1;
				pointer-events: none;
				position: fixed;
				top: 0;
				transition: opacity .3s ease-in;
				width: 100%;
				z-index: 99;
			}`;
			this.doc.documentElement.appendChild(this.create('STYLE'));
			this.coverSS = this.arrayLast(this.doc.styleSheets);
			this.coverSS.insertRule(cover, 0);
			// Show body
			this.on(this.win, 'load', 'removeCover');
		} catch (e) {
			// nop
		}
	},
	removeCover: function() {
		this.win.removeEventListener('load', this.bindFunc('removeCover'));
		this.coverSS.insertRule('body::before { opacity: 0 !important; }', 0);
	},

	// Init ////////////////////////////////
	onDOMContentLoaded: function() {
		this.body = this.doc.body;

		// Scrollend Event
		this.on(this.win, 'scroll', 'scrollendEventTrigger');
		this.on(this.body, 'touchmove', 'scrollendEventTrigger');

		// Toast
		this.toastDiv = this.create('DIV', {'class': 'are4are-toast are4are-transparent'});
		this.body.appendChild(this.toastDiv);

		// Toolbar
		this.toolbar = this.create('DIV', {
			id: 'are4are_toolbar',
			'class': 'are4are-toolbar',
			style: 'display:none'
		});
		this.body.appendChild(this.toolbar);

		// modify ThreadPage, CatalogPage, etc ...
		this.exec();

		// after modfied
		this.queue(() => {
			this.toolbar.style = '';
			this.body.style.scrollBehavior = 'smooth';
			this.removeCover();
		});

		// other events
		this.on(this.win, 'resize', 'resetScrollMax');
	},

	// Start ///////////////////////////////
	start : function(win) {
		if (win.document.getElementById('are4are_viewport')) return;
		this.win = win;
		this.doc = this.win.document;
		//this.body = this.doc.document.body; // document.body doesn't exist yet.
		// cover body
		if (this.doc.readyState !== 'complete') {
			this.coverBody();
		}
		// Viewport
		let viewport = this.create('META', { name: 'viewport', content: 'width=device-width' });
		viewport.id = 'are4are_viewport';
		this.doc.head.insertBefore(viewport, this.doc.head.firstChild);
		// CSS
		this.addCssFile('common/are4are.css');
		if (this.cssFile) this.addCssFile(this.cssFile);
		// Modify futaba
		if (this.doc.readyState === 'interactive' || this.doc.readyState === 'complete') {
			this.onDOMContentLoaded();
		} else {
			this.on(this.doc, 'DOMContentLoaded', 'onDOMContentLoaded');
		}
	}
};
})();

