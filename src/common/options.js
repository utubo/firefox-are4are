// validator /////////////////////////
function isValidTargetUri() {
	var t = document.getElementById('targetUri');
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
	validateTarget('targetUri', isValidTargetUri);
	if (document.querySelector('.invalid')) {
		document.getElementById('save').setAttribute('disabled', 'true');
	} else {
		document.getElementById('save').removeAttribute('disabled');
	}
}

// util //////////////////////////////
function correctValues() {
	var t = document.getElementById('targetUri');
	t.value = t.value.replace(/\n+/g, "\n").replace(/^\s+|\s+$/, '');
}
// save and load /////////////////////
function saveOptions(e) {
	correctValues();
	chrome.storage.local.set({
		are4are_targetUrls: document.getElementById('targetUri').value
	});
}
function restoreOptions() {
	chrome.storage.local.get('are4are_targetUrls', function(res) {
		document.getElementById('targetUri').value = res.are4are_targetUrls || '';
	});
	Array.prototype.forEach.apply(document.querySelectorAll('*[data-message-id]'), [
		function (e, i, a) {
			e.textContent = chrome.i18n.getMessage(e.getAttribute('data-message-id'));
		}
	]);
}

// tabs //////////////////////////////
function tabsOnChange(e) {
	var urlReg = e.target.value
		.replace(/\\/, '\\\\')
		.replace(/([\^\$\*\+\?\.\(\)\{\}])/g, '\\$1')
	;
	if (urlReg === '') {
		return;
	}
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
	document.getElementById('targetUri').value += "\n" + urlReg;
	correctValues();
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
	addOption(sel, '', chrome.i18n.getMessage('selectTargetUriTab'));
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
document.getElementById('targetUri').addEventListener('change', validate);
document.getElementById('targetUri').addEventListener('keyup', validate);

