// with new tab //////////////////////
function setupAsNewTab() {
	var head = document.getElementsByTagName('head')[0];
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
	var t = document.getElementById('urls');
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
		document.getElementById('save').setAttribute('disabled', 'true');
	} else {
		document.getElementById('save').removeAttribute('disabled');
	}
}

// util //////////////////////////////
function correctValues() {
	var t = document.getElementById('urls');
	t.value = t.value.replace(/\n+/g, "\n").replace(/^\s+|\s+$/, '');
}
// save and load /////////////////////
function saveOptions(e) {
	correctValues();
	chrome.storage.local.set({
		urls: document.getElementById('urls').value
	});
}
function restoreOptions() {
	chrome.storage.local.get('urls', function(res) {
		document.getElementById('urls').value = (res.urls || '') + (res.urls ? "\n" : '');
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
		.replace(/([\^\$\*\+\?\.\(\)\{\}])/g, '\\$1')
	;
	if (urlReg.match(/(html?|\/)$/)) {
		urlReg = urlReg + '$';
	}
	if (urlReg.match(/([\/_])[0-9][0-9]+(\\\.html?|\/|$)/)) { /* thread number */
		urlReg = urlReg.replace(/([\/_])[0-9][0-9]+(\\\.html?|\/|$)/, '$1[0-9]+$2');
	}
	if (urlReg.match(/\/[0-9\/\-]+\//)) { /* date */
		urlReg = urlReg.replace(
			/\/([0-9\/\-]+)\//g,
			function(m1) {
				var r = '/[0-9';
				if (m1.indexOf('/') != -1)
					r += '/';
				if (m1.indexOf('-') != -1)
					r += '\\-';
				r += ']+/';
				return r;
			}
		);
	}
	urlReg = '^' + urlReg;
	document.getElementById('urls').value += "\n" + urlReg;
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
	var sel = document.getElementById('tabs');
	sel.style = "width:100%;";
	while(sel.firstChild) {
		sel.removeChild(sel.firstChild);
	}
	addOption(sel, '', chrome.i18n.getMessage('selectTargetUrlTab'));
	chrome.tabs.query({
		"url": ["http://*/*", "https://*/*"]
	}, function(tabs) {
		for(var tab of tabs) {
			addOption(sel, tab.url, tab.title + ' ' + tab.url);
		}
	});
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector('form').addEventListener('submit', saveOptions);
document.getElementById('tabsBtn').addEventListener('click', tabsBtnOnClick);
document.getElementById('tabs').addEventListener('change', tabsOnChange);
document.getElementById('urls').addEventListener('change', validate);
document.getElementById('urls').addEventListener('keyup', validate);
document.getElementById('urls').addEventListener('paste', urlsOnPaste);
if (document.location.href.indexOf('options.html') !== -1) {
	setupAsNewTab();
}
if (!chrome.tabs) {
	document.getElementById('tabsBtn').setAttribute('disabled', 'disabled');
}

