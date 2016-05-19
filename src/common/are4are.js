function Are4Are() { }
Are4Are.prototype = {
	// Field ///////////////////////////////
	win: null,
	doc: null,
	$: null,
	$win: null,
	$toast: null,
	toolbar: null,

	// Util ////////////////////////////////
	format: function() {
		var args = arguments;
		var str = args[0].replace(/__MSG_([^_]+)__/g, function(m, c) { return chrome.i18n.getMessage(c); });
		return str.replace(/\{(\d)\}/g, function(m, c) { return args[parseInt(c) + 1]; });
	},
	escapeWithoutAmp: function(str) {
		return str
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	},
	html: function(str) {
		return this.escapeWithoutAmp(str.replace(/&/g, '&amp;'));
	},
	toast: function() {
		var text = this.format.apply(this, arguments);
		if (!this.$toast) {
			this.$toast = this.$('<div>');
			this.$toast.addClass('are_toast');
			this.$toast.hide();
			this.$body.append(this.$toast);
		}
		this.$toast.html(text);
		this.$toast.fadeIn();
		var t = this.$toast;
		this.win.setTimeout((function() { t.fadeOut('slow'); t = null;}), 3000);
	},

	// DOM & HTML Util /////////////////////
	addCssFile: function(cssFile) {
		var cssLink = this.doc.createElement('link');
		cssLink.rel = 'stylesheet';
		cssLink.type = 'text/css';
		cssLink.href = chrome.extension.getURL(cssFile);
		this.doc.getElementsByTagName('head')[0].appendChild(cssLink);
	},

	clearTimeout: function(id) {
		if (id) this.win.clearTimeout(id);
		return null;
	},

	_scrollendTimer: null,
	_scrollendEventTrigger: null,
	scrollendEventTrigger: function() {
		var $$ = this;
		$$.clearTimeout($$._scrollendTimer);
		$$._scrollendTimer = $$.win.setTimeout((function() {
			this.trigger('scrollend');
		}).bind($$.$win), 50);
	},
	scrollTo: function(y, func) {
		this.scrollToNoMargin(Math.max(y - 2, 0), func);
	},
	scrollToNoMargin: function(targetY, func) {
		var $$ = this, $ = this.$;
		var y = Math.min(targetY, $$.doc.body.clientHeight - $$.win.innerHeight);
		var _func = (function() {
			try {
				func && func();
			} finally {
				$$.$win.on('scroll.scrollendTrigger', $$._scrollendEventTrigger);
				$$.$win.trigger('scrollend', [targetY, y]);
			}
		}).bind($$);
		$$.$win.off('scroll.scrollendTrigger');
		$$.clearTimeout($$._scrollendTimer);
		if ($$.$win.scrollTop() != y) {
			$('html,body').animate({scrollTop: y}, 'slow', 'easeOutCubic').promise().then(_func);
		} else {
			_func();
		}
	},

	// ToolBar /////////////////////////////
	addToolButton: function(label, onclick) {
		var btn = this.toolbar.appendChild(this.doc.createElement('a'), this.toolbar.firstChild);
		btn.textContent = chrome.i18n.getMessage(label);
		btn.id = 'are_toolbtn_' + label;
		btn.href = 'javascript:void(0);';
		btn.classList.add('are_toolbtn');
		if (onclick) {
			btn.onclick = onclick;
		}
		return btn;
	},
	activateToolBar: function() {
		this.toolbar.classList.add('active');
	},
	noactivateToolBar: function() {
		this.toolbar.classList.remove('active');
	},

	// init ////////////////////////////////
	init: function(window, $) {
		// setup fields
		this.win = window;
		this.doc = window.document;
		this.$ = $;
		this.$win = $(window);
		this.$body = $(window.document.body);
		this.$win.unload(function() { this.$ = this.$win = this.$body = this.doc = this.win = null; });

		// jQuery extend
		$.extend($.easing, {
			def: 'easeOutCubic',
			easeOutCubic: function (x, t, b, c, d) {
				return c*((t=t/d-1)*t*t + 1) + b;
			}
		});
		new $.Event('scrollend');
		this._scrollendEventTrigger = this.scrollendEventTrigger.bind(this);
		this.$win.on('scroll.scrollendTrigger', this._scrollendEventTrigger);
		this.$body.on('touchmove', this._scrollendEventTrigger);

		// ViewPort
		var head = this.doc.getElementsByTagName('head')[0];
		var viewPort = this.doc.createElement('meta');
		viewPort.name = 'viewport';
		viewPort.content = 'width=device-width';
		head.insertBefore(viewPort, head.firstChild);

		// CSS
		this.addCssFile('common/are4are.css');

		// ToolBar
		this.toolbar = this.doc.createElement('div');
		this.toolbar.id = 'are_toolbar';
		this.doc.body.appendChild(this.toolbar);
		return this;
	}
};

