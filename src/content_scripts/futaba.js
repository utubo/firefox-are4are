// other futaba pages
(function() {
	// Viewport
	var viewport = document.createElement('META');
	viewport.setAttribute('name', 'viewport');
	viewport.setAttribute('content', 'width=device-width');
	var head = document.getElementsByTagName('HEAD')[0];
	head.insertBefore(viewport, head.firstChild);
})();

