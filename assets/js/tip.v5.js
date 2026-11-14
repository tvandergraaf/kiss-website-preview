/* T-099 / BL 993 (Thomas 25-10-2026): "Getipt door een collega" werkt alleen nog via de tiplink. Er is geen invulveld meer.
   De naam van de collega staat in het fragment (#tip=<naam>; terugval ?tip=<naam>) van de link die de collega via /aanbrengen/
   deelde. Eerst gaat tip uit de adresbalk (replaceState, vóór site.js en GA4; het fragment gaat niet naar de server), daarna
   wordt de opgeschoonde naam bewaard in sessionStorage kiss_tip (alleen dit tabblad) voor de volgende pagina.
   Met een naam: het blok #tip-blok wordt zichtbaar met "Getipt door: <naam>" en de zin over de regeling (art. 11 voorwaarden:
   de kandidaat ziet dat de naam wordt vastgelegd); de naam gaat mee in het verborgen veld getipt_door. Met "Niet getipt?
   Verwijderen" haalt de kandidaat de naam weg (veld leeg, kiss_tip gewist, blok verborgen). De server schoont opnieuw op
   (kiss_naam_opmaak) en accepteert alleen een geldige naam. Opschonen hier: NFC, letters met tekens, spatie, - ' ’ . (max. 80).
   Staat buiten site.js (JS-budget vol); alleen op pagina's met een sollicitatieformulier, zonder defer aan het eind van <main>.
   Versie in de bestandsnaam (cache immutable). Vervangt tip.v4.js.
   v5 (deltareview 403e9b5 J2): de naam wordt opgemaakt met window.KISS_NAAMOPMAAK uit invoer.v7.js (dat vóór dit script laadt),
   zoals het veld getipt_door: "thomas van der graaf" wordt "Thomas van der Graaf", ook in het WhatsApp-bericht.
   v4 (audit kandidaatreis 25-10): met een tip krijgt het vooringevulde bericht van elke "App ons"-knop (wa.me naar KISS) een
   regel "Getipt door: <naam>", zodat de tip ook via WhatsApp niet wegvalt; zonder tip (of na Verwijderen) het oorspronkelijke
   bericht. Daarom ook geladen op wervingspagina's zonder formulier (met een App ons-knop). Deelknoppen (wa.me/?text=) blijven. */
(function () {
  var K = 'kiss_tip', t = '', ss = null, d = document;
  var schoon = function (s) { return (s || '').normalize('NFC').replace(/[^\p{L}\p{M} .'’-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 80); };
  try { ss = window.sessionStorage; } catch (e) {}
  var h = new URLSearchParams(location.hash.slice(1)).get('tip'), q = new URLSearchParams(location.search).get('tip');
  if (h || q) {
    t = schoon(h || q);
    try {
      var u = new URL(location.href);
      if (h) u.hash = '';
      u.searchParams.delete('tip');
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) {}
    try { if (t) ss.setItem(K, t); } catch (e) {}
  } else {
    try { t = schoon(ss.getItem(K)); } catch (e) {}
  }
  if (t && typeof window.KISS_NAAMOPMAAK === 'function') t = window.KISS_NAAMOPMAAK(t);
  var geldig = t && t.replace(/[^\p{L}]/gu, '').length >= 2;
  /* App ons-knoppen (wa.me/<nummer KISS>?text=…): regel "Getipt door: <naam>" erbij, of terug naar het origineel */
  var waKnoppen = Array.prototype.filter.call(d.querySelectorAll('a[href^="https://wa.me/"]'), function (a) { return /^https:\/\/wa\.me\/\d+/.test(a.href); });
  var waTip = function (n) {
    waKnoppen.forEach(function (a) {
      if (!a.dataset.waOrigineel) a.dataset.waOrigineel = a.href;
      try {
        var u = new URL(a.dataset.waOrigineel);
        if (n) u.searchParams.set('text', (u.searchParams.get('text') || '') + '\nGetipt door: ' + n);
        a.href = u.toString();
      } catch (e) {}
    });
  };
  if (geldig) waTip(t);
  var veld = d.querySelector('input[name="getipt_door"]'), blok = d.getElementById('tip-blok'), naam = d.getElementById('tip-naam'), weg = d.getElementById('tip-weg');
  if (!veld) return;
  if (geldig) {
    veld.value = t;
    if (naam) naam.textContent = t;
    if (blok) blok.hidden = false;
  }
  if (weg) weg.addEventListener('click', function () {
    veld.value = '';
    try { ss.removeItem(K); } catch (e) {}
    waTip('');
    if (!blok) return;
    /* focus naar het volgende veld, zodat toetsenbord- en schermlezergebruikers niet in het niets uitkomen */
    var volgende = null, n = blok.nextElementSibling;
    while (n && !volgende) { volgende = n.matches('input:not([type="hidden"]),select,textarea,button,summary,a[href]') ? n : n.querySelector('input:not([type="hidden"]),select,textarea,button,summary,a[href]'); n = n.nextElementSibling; }
    blok.hidden = true;
    if (volgende) volgende.focus();
  });
})();
