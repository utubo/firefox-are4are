form = {};
for (var i of document.getElementById('myForm').elements) {
	if (i.id) { form[i.id] = document.getElementById(i.id); }
}

// with new tab //////////////////////
function setupAsNewTab() {
	var head = document.querySelector('head');
	// ViewPort
	var viewPort = document.createElement('meta');
	viewPort.name = 'viewport';
	viewPort.content = 'width=device-width';
	head.insertBefore(viewPort, head.firstChild);
	// CSS
	var cssLink = document.createElement('link');
	cssLink.rel = 'stylesheet';
	cssLink.type = 'text/css';
	cssLink.href = chrome.extension.getURL('common/options.css');
	head.appendChild(cssLink);
	// Title
	var extensionName = chrome.i18n.getMessage('extensionName');
	var title = document.createElement('title');
	title.textContent = extensionName;
	head.appendChild(title);
	var h1 = document.createElement('h1');
	h1.textContent = extensionName;
	document.body.insertBefore(h1, document.body.firstChild);
}
// validator /////////////////////////
function isValidUrls() {
	var t = form.urls;
	var targetUrls = t.value.replace(/\n+/g, "\n").replace(/^\s+|\s+$/, '');
	if (!targetUrls) return true;
	try {
		targetUrls = targetUrls.replace(/\n/g, '|').replace(/(^\s+|\s+$)/, '');
		if (targetUrls.match(/^\|*$/)) return true;
		reg = new RegExp(targetUrls);
		return true;
	} catch (e) {
	}
	return false;
}
function validateTarget(id, func) {
	if (func()) {
		document.getElementById(id).classList.remove('invalid');
	} else {
		document.getElementById(id).classList.add('invalid');
	}
}
function validate() {
	validateTarget('urls', isValidUrls);
	if (document.querySelector('.invalid')) {
		form.save.setAttribute('disabled', 'true');
	} else {
		form.save.removeAttribute('disabled');
	}
}

// util //////////////////////////////
function correctValues() {
	form.urls.value = form.urls.value.replace(/\n+/g, "\n").replace(/^\s+|\s+$/, '');
}
// save and load /////////////////////
function saveOptions(e) {
	correctValues();
	chrome.storage.local.set({
		urls: form.urls.value
	});
}
function restoreOptions() {
	chrome.storage.local.get('urls', function(res) {
		form.urls.value = (res.urls || '') + (res.urls ? "\n" : '');
	});
	Array.prototype.forEach.apply(document.querySelectorAll('*[data-message-id]'), [
		function (e, i, a) {
			e.textContent = chrome.i18n.getMessage(e.getAttribute('data-message-id'));
		}
	]);
}

// urls //////////////////////////////
function addUrl(url) {
	var urlReg = url.replace(/^\s+|\s+$/g, '');
	if (!urlReg) return;
	urlReg = urlReg
		.replace(/\\/, '\\\\')
		.replace(/([\^\$\*\+\?\.\(\)\{\}])/g, '\\$1') // escape meta
		.replace(/(\b|_)(tmp|dat|zip|cgi|may|nov|img|jun|www|dec)(_|\b)/g, '$1[a-z]{3}$3') // server name without 'up' and 'ipv6'
		.replace(/([\/_])\d\d+(\\\.html?|\/|$)/, '$1\\d+$2') // thread number
		.replace( // date
			/\/([\d\/\-]+)\//g,
			function(m1) {
				var r = '/[\\d';
				if (m1.indexOf('/') != -1)
					r += '/';
				if (m1.indexOf('-') != -1)
					r += '\\-';
				r += ']+/';
				return r;
			}
		)
		.replace(/^/, '^')
		.replace(/(html?|\/)$/, '$1$');
	// FTBucket
	var FTBUCKET_SUFIX = '/cont/[a-z]{3}\\.2chan\\.net_b_res_\\d+/index\\.htm$';
	if (urlReg.endsWith(FTBUCKET_SUFIX)) {
		var paths = urlReg.split("/");
		urlReg = paths[0] + '//' + paths[2] + '/.+' + FTBUCKET_SUFIX;
	}

	form.urls.value += (form.urls.value.match(/\n$/) ? '' : "\n") + urlReg;
	correctValues();
}
function urlsOnPaste(e) {
	var text = e.clipboardData.getData('text');
	if (text.indexOf('\\') === -1 && text.indexOf('http') === 0) {
		e.preventDefault();
		addUrl(e.clipboardData.getData('text'));
	}
}

// tabs selectbox ////////////////////
function tabsOnChange(e) {
	addUrl(e.target.value);
}
function addOption(sel, value, label) {
	var o = document.createElement('option');
	o.appendChild(document.createTextNode(label));
	o.setAttribute('value', value);
	sel.appendChild(o);
}
function tabsBtnOnClick(e) {
	e.preventDefault();
	form.tabs.style = "width:100%;";
	while(form.tabs.firstChild) {
		form.tabs.removeChild(form.tabs.firstChild);
	}
	addOption(form.tabs, '', chrome.i18n.getMessage('selectTargetUrlTab'));
	chrome.tabs.query({
		"url": ["http://*/*", "https://*/*"]
	}, function(tabs) {
		for(var tab of tabs) {
			addOption(form.tabs, tab.url, tab.title + ' ' + tab.url);
		}
	});
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('myForm').addEventListener('submit', saveOptions);
form.urls.addEventListener('change', validate);
form.urls.addEventListener('keyup', validate);
form.urls.addEventListener('paste', urlsOnPaste);
form.tabsBtn.addEventListener('click', tabsBtnOnClick);
form.tabs.addEventListener('change', tabsOnChange);
if (document.location.hash === '#tabpage') {
	setupAsNewTab();
}
if (!chrome.tabs) {
	form.tabsBtn.setAttribute('disabled', 'disabled');
}

