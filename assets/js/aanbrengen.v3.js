/* T-099 /aanbrengen/ (opdracht Thomas 25-10-2026, review ORANJE verwerkt): de tv-QR in de kantine wijst hierheen. Eén keer naam
   invullen, daarna onthouden op deze telefoon: localStorage kiss_aanbrenger = {n: naam, ts: tijdstip}, na 6 maanden gewist, en
   wissen met "Niet jij?". De knop opent WhatsApp met het kant-en-klare bericht ("zoeken we", ondertekend met de voornaam).
   De vacaturelink is een kort pad (v3, Thomas 25-10-2026): https://kiss-marketingsales.nl/werken (via de tv-QR /werken/1). De server
   stuurt met 302 door naar de vacature met de UTM-codes van BRONCODES (referral/medewerker/aanbrengen-2026q4, tv-QR utm_content=v1;
   savvii/htaccess.template). De volledige naam staat in het fragment #tip=<naam>: blijft bij de doorverwijzing staan, gaat niet naar de server (M1). Opschonen: NFC, letters met tekens, spatie, - ' ’ . (L5).
   Alleen op deze pagina geladen (JS-budget site.js vol). Zonder JS werkt de knop met het bericht zonder naam (L6). */
(function () {
  var d = document, K = 'kiss_aanbrenger', MAX = 182 * 864e5;
  var $ = function (id) { return d.getElementById(id); };
  var veld = $('aanbreng-veld'), naam = $('aanbreng-naam'), fout = $('aanbreng-naam-fout'), bekend = $('aanbreng-bekend'),
      toon = $('aanbreng-toon'), wis = $('aanbreng-wis'), wa = $('aanbreng-wa'), vw = $('aanbreng-voorwaarden');
  if (!naam || !wa) return;
  var q = new URLSearchParams(location.search);
  var link = 'https://kiss-marketingsales.nl/werken' + (q.get('utm_medium') === 'tv-qr' ? '/1' : '');
  var schoon = function (s) { return (s || '').normalize('NFC').replace(/[^\p{L}\p{M} .'’-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 80); };
  var bericht = function (n) {
    return 'Hé! Zoek jij een leuke baan? Bij KISS in Rijswijk zoeken we nieuwe collega\'s. Je hoeft geen ervaring te hebben, je leert het vak bij ons. Solliciteren duurt maar 1 minuut: '
      + link + '#tip=' + encodeURIComponent(n).replace(/'/g, '%27') + '\nGroetjes, ' + n.split(' ')[0];
  };
  var bewaar = function (n) { try { if (n) localStorage.setItem(K, JSON.stringify({ n: n, ts: Date.now() })); else localStorage.removeItem(K); } catch (e) {} };
  var lees = function () {
    try {
      var v = JSON.parse(localStorage.getItem(K) || 'null');
      if (!v || typeof v.n !== 'string' || !v.ts || Date.now() - v.ts > MAX) { if (localStorage.getItem(K) !== null) localStorage.removeItem(K); return ''; }
      return schoon(v.n);
    } catch (e) { try { localStorage.removeItem(K); } catch (e2) {} return ''; }
  };
  var geldig = function (n) { return /\p{L}{2,}.* \p{L}/u.test(n); }; // voor- en achternaam: minstens twee delen
  var stand = function () {
    var n = lees();
    veld.hidden = !!n; bekend.hidden = !n; toon.textContent = n;
    if (n) wa.href = 'https://wa.me/?text=' + encodeURIComponent(bericht(n));
  };
  wa.addEventListener('click', function (e) {
    var n = lees() || schoon(naam.value);
    if (!geldig(n)) { e.preventDefault(); fout.textContent = 'Vul je voor- en achternaam in.'; naam.setAttribute('aria-invalid', 'true'); naam.focus(); return; }
    fout.textContent = ''; naam.removeAttribute('aria-invalid');
    bewaar(n); wa.href = 'https://wa.me/?text=' + encodeURIComponent(bericht(n));
    setTimeout(stand, 0);
  });
  wis.addEventListener('click', function (e) { e.preventDefault(); bewaar(''); naam.value = ''; stand(); naam.focus(); });
  if (vw && /^https:\/\//.test(vw.dataset.url || '')) { vw.querySelector('a').href = vw.dataset.url; vw.hidden = false; }
  stand();
})();
