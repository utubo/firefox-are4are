// save and load /////////////////////
function correctValues() {
	var t = document.getElementById('targetUri');
	t.value = t.value.replace(/\n+/g, "\n").replace(/^\s+|\s+$/, '');
}
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
function tabsBtnOnClick(e) {
	e.preventDefault();
	var sel = document.getElementById('tabs');
	sel.style = "width:100%;";
	while(sel.firstChild) {
		sel.removeChild(sel.firstChild);
	}
	chrome.tabs.query({
		"url": ["http://*/*", "https://*/*"]
	}, function(tabs) {
		for(var tab of tabs) {
			var o = document.createElement('option');
			o.appendChild(document.createTextNode(tab.title + ' ' + tab.url));
			o.setAttribute('value', tab.url);
			sel.appendChild(o);
		}
	});
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector('form').addEventListener('submit', saveOptions);
document.getElementById('tabsBtn').addEventListener('click', tabsBtnOnClick);
document.getElementById('tabs').addEventListener('change', tabsOnChange);

