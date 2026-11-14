/* T-099 (opdracht Thomas 25-10-2026): doorstuurpagina's /werken/ en /werken/1/ (build.py, layout: doorstuur). WhatsApp toont de
   eigen linkpreview van die pagina; de bezoeker gaat direct door naar het doel in html[data-doorstuur] (vacature met UTM-codes),
   met het #fragment erbij (#tip=<naam>; tip.v2.js op de vacaturepagina vult daarmee "Getipt door een collega?" in en haalt het
   uit de adresbalk). Alleen een intern pad. Geen GA op de doorstuurpagina. Versie in de bestandsnaam (cache immutable). */
(function () {
  var d = document.documentElement.getAttribute('data-doorstuur') || '';
  if (d.charAt(0) === '/' && d.charAt(1) !== '/') location.replace(d + location.hash);
})();
