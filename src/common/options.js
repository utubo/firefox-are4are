form = {};
for (let i of document.getElementById('myForm').elements) {
	if (i.id) { form[i.id] = document.getElementById(i.id); }
}

// with new tab //////////////////////
function setupAsNewTab() {
	// ViewPort
	let viewPort = document.createElement('meta');
	viewPort.name = 'viewport';
	viewPort.content = 'width=device-width';
	document.head.insertBefore(viewPort, document.head.firstChild);
	// CSS
	let cssLink = document.createElement('link');
	cssLink.rel = 'stylesheet';
	cssLink.type = 'text/css';
	cssLink.href = chrome.extension.getURL('common/options.css');
	document.head.appendChild(cssLink);
	// Title
	let extensionName = chrome.i18n.getMessage('extensionName');
	let title = document.createElement('title');
	title.textContent = extensionName;
	document.head.appendChild(title);
	let h1 = document.createElement('h1');
	h1.textContent = extensionName;
	document.body.insertBefore(h1, document.body.firstChild);
}
// validator /////////////////////////
function validateUrls() {
	let t = form.urls;
	let targetUrls = t.value.replace(/\n+/g, "\n").replace(/^\s+|\s+$/, '');
	if (!targetUrls) return;
	try {
		targetUrls = targetUrls.replace(/\n/g, '|').replace(/(^\s+|\s+$)/, '');
		if (targetUrls.match(/^\|*$/)) return;
		reg = new RegExp(targetUrls);
		return;
	} catch (e) {
		return chrome.i18n.getMessage('regexSyntaxError').replace('{0}', e.message);
	}
}
function validateTarget(id, func) {
	let msg = func();
	let elm = document.getElementById(id + '_err');
	if (msg) {
		document.getElementById(id).classList.add('invalid');
		if (elm) {
			elm.textContent = msg;
			elm.style.display = 'block';
		}
	} else {
		document.getElementById(id).classList.remove('invalid');
		if (elm) elm.style.display = 'none';
	}
}
function validate() {
	validateTarget('urls', validateUrls);
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
		urls: form.urls.value,
		logsite: form.logsite.value
	});
}
function restoreOptions() {
	chrome.storage.local.get(['urls', 'logsite'], res => {
		form.urls.value = res.urls ? `${res.urls}\n` : '';
		form.logsite.value = res.logsite ? res.logsite : '';
	});
	Array.prototype.forEach.apply(document.querySelectorAll('*[data-message-id]'), [
		(e, i, a) => { e.textContent = chrome.i18n.getMessage(e.getAttribute('data-message-id')); }
	]);
}

// urls //////////////////////////////
function addUrl(url) {
	url= url.replace(/^\s+|\s+$/g, '');
	if (!url) return;
	form.urls.value += (form.urls.value.match(/\n$/) ? '' : "\n") + url;
	correctValues();
}
function makeRegex(url) {
	let urlReg = url.replace(/^\s+|\s+$/g, '');
	if (!urlReg) return;
	urlReg = urlReg
		.replace(/\\/, '\\\\')
		.replace(/([\^\$\*\+\?\.\(\)\{\}])/g, '\\$1') // escape meta
		.replace(/(\b|_)(tmp|dat|zip|cgi|may|nov|img|jun|www|dec)(_|\b)/g, '$1[a-z]{3}$3') // server name without 'up' and 'ipv6'
		.replace(/([\/_=])\d\d+(\\\.html?|\/|$)/, '$1\\d+$2') // thread number
		.replace( // date
			/\/([\d\/\-]+)\//g,
			m1 => {
				let r = '/[\\d';
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
	let FTBUCKET_SUFIX = '/cont/[a-z]{3}\\.2chan\\.net_[a-z\d]+_res_\\d+/index\\.htm$';
	if (urlReg.endsWith(FTBUCKET_SUFIX)) {
		let paths = urlReg.split("/");
		urlReg = paths[0] + `//${paths[2]}/.+${FTBUCKET_SUFIX}`;
	}
	return urlReg;
}
function urlsOnPaste(e) {
	let text = e.clipboardData.getData('text');
	if (text.indexOf('\\') === -1 && text.indexOf('http') === 0) {
		e.preventDefault();
		addUrl(makeRegex(text));
	} else if (text.match(/^\^.+\$$/)) {
		e.preventDefault();
		addUrl(text);
	}
}

// tabs selectbox ////////////////////
function tabsOnChange(e) {
	addUrl(makeRegex(e.target.value));
}
function addOption(sel, value, label) {
	let o = document.createElement('option');
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
	}, tabs => {
		for(let tab of tabs) {
			addOption(form.tabs, tab.url, `${tab.title} ${tab.url}`);
		}
	});
}

// logsite ///////////////////////////
function logsiteOnPaste(e) {
	let text = e.clipboardData.getData('text');
	if (text.indexOf('$') !== -1) return true;
	if (text.indexOf('http') !== 0) return true;
	if (! /\d{5,}/.test(text)) return true;
	e.preventDefault();
	text = text.replace(/\d{5,}/, '\$r');
	if (text.indexOf('.magipoka.') === -1) { // mgpk!
		text = text.replace(/(\b|_)([a-z]|\d{2})(\b|_)/, '$1\$b$3');
	}
	text = text.replace(/(\b|_)(may|nov|img|jun|dec)(_|\b)/g, '$1\$s$3');
	form.logsite.value = text;
}

// main //////////////////////////////
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
if (chrome.tabs) {
	document.getElementById('tabsContainer').style.display = '';
}
form.logsite.addEventListener('paste', logsiteOnPaste);

