/* Black Friday: the V3 "I want one like this" / "Choose this design" buttons go to the $99 checkout
   (with the package and the design they picked) instead of copying a Messenger text. */
(function () {
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('#vwWant, #stdView .want, #standard .go, #premium .want, #dmxP3DlgWant');
    if (!a) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    var premium = !!a.closest('#premium');
    var el = document.getElementById(premium ? 'dmxP3Name' : 'vwName');
    var design = (a.closest('#standard') && !a.closest('#stdView')) ? '' : (el && el.textContent.trim()) || '';
    location.href = 'checkout/?pkg=' + (premium ? 'premium' : 'standard') + (design ? '&design=' + encodeURIComponent(design) : '');
  }, true);
})();
