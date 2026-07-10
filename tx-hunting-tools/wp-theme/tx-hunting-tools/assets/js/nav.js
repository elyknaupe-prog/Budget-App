(function () {
	var nav = document.getElementById('site-nav');
	if (!nav) return;

	var toggle = nav.querySelector('.nav-toggle');
	if (toggle) {
		toggle.addEventListener('click', function () {
			var open = nav.classList.toggle('is-open');
			toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
			toggle.textContent = open ? 'CLOSE' : 'MENU';
		});
	}

	// Close the mobile menu after choosing an anchor link.
	nav.addEventListener('click', function (e) {
		if (e.target.tagName === 'A' && nav.classList.contains('is-open')) {
			nav.classList.remove('is-open');
			if (toggle) {
				toggle.setAttribute('aria-expanded', 'false');
				toggle.textContent = 'MENU';
			}
		}
	});
})();
