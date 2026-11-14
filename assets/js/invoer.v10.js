/* T-091 invoercontrole v10 (Thomas 27-10-2026 via Claudia: "tussenvoegsels zijn altijd met kleine letters"; ook in voornaam na het
   eerste woord en als laatste woord; regel review N3 vervallen). v9 (review M1: kiss_bron is al de opgeschoonde bronstring). v8 (release 2: bron (UTM) van de eerste landing per sessie uit sessionStorage kiss_bron, gezet door het
   inline script, gaat mee in het veld bron, ook na meerdere klikken). v7: (deltareview 403e9b5 J2: gedeelde naamopmaak window.KISS_NAAMOPMAAK voor tip.v5.js; dit script laadt
   daarom vóór tip.v5.js, ook op wervingspagina's zonder formulier). v6: (Thomas 25-10-2026 via Claudia: "ik wil nooit een kandidaat missen, maar de velden moeten zorgen dat
   de invoer uniform is en de kandidaat dwingen onze schrijfwijze aan te houden"; reviews c3d4296, 07ec9b8, 9b1f59d verwerkt).
   Het veld vormt de invoer tijdens typen en plakken. Velden met data-opmaak:
   - telefoon: alleen cijfers en + aan het begin. NL: +31 / 0031 / +0031 / +06 worden 0…, precies 9 cijfers met 6 worden 06…;
     weergave "06 12345678", "070 1234567", "0174 123456". Buitenland: 00 wordt +, "+32 470123456". Niets wordt afgekapt:
     meer dan 10 cijfers zonder + geeft de hint "Een Nederlands nummer heeft 10 cijfers. Woon je in het buitenland? Begin met +
     en de landcode." Verzonden (formdata): 0XXXXXXXXX of +CCNNNN. Compleet: NL 10 cijfers met 0, buitenland 8 tot 15.
     Teller tijdens typen (aria-live uit), melding pas bij verlaten of versturen.
   - voornaam / achternaam / naam: alleen letters, spatie, - ' en punt; elk woord met hoofdletter, ook na - en ' (Anne-Marie,
     O'Brien); initialen hoofdletter (J.W., ook J.W); "ij" aan het begin wordt "IJ" alleen als het klein getypt is (Ijaz blijft
     Ijaz); woorden in hoofdletters ("JAN") worden "Jan" bij verlaten of plakken. Tussenvoegsels (van, de, der, den, ter, ten,
     't, in, op, aan, la, le, du, d') zijn altijd klein: in achternaam overal, in voornaam en naam na het eerste woord
     ("jan van der berg" in voornaam wordt "Jan van der Berg"), ook als laatste of enige woord ("van", "Berg van der",
     "Thi le"). Het eerste woord van voornaam en naam krijgt altijd een hoofdletter. Voornaam en achternaam minstens 2 letters.
   - email: kleine letters, geen spaties (cursor blijft staan waar dat kan); controle als FILTER_VALIDATE_EMAIL met hint
     (blokkeert op de wervingsformulieren niet: de server bewaart een ongeldig adres als opmerking); tikfoutsuggestie.
   sessionStorage kiss_invoer: bij versturen de korte velden (nooit motivatie, toelichting, bericht of bijlage); na een
   serverfout (?error=…) teruggezet als jonger dan 15 minuten; altijd gewist bij het laden van een formulierpagina, op pageshow
   zonder ?error= en (door site.js) op de bedankpagina's. ?error=pogingen: eerlijke melding (niets binnengekomen).
   Zelfde regels als de server (kiss_telefoon, kiss_naam_opmaak, kiss_email_schoon/kiss_is_email); spiegeltest in de
   regressiepoort. Buiten site.js (JS-budget vol); zonder defer aan het eind van <main>, vóór tip.v5.js. Tijdens IME-compositie
   pas na compositionend opmaken. */
(function () {
  var d = document, w = window;
  var TV = ['van', 'de', 'der', 'den', 'ter', 'ten', "'t", 'in', 'op', 'aan', 'la', 'le', 'du', "d'"];
  var KORT = ['010', '013', '015', '020', '023', '024', '026', '030', '033', '035', '036', '038', '040', '043', '045', '046', '050',
    '053', '055', '058', '070', '071', '072', '073', '074', '075', '076', '077', '078', '079', '084', '085', '087', '088', '097'];
  var CC2 = '20 27 30 31 32 33 34 36 39 40 41 43 44 45 46 47 48 49 51 52 53 54 55 56 57 58 60 61 62 63 64 65 66 81 82 84 86 90 91 92 93 94 95 98';
  var BUITEN = 'Een Nederlands nummer heeft 10 cijfers. Woon je in het buitenland? Begin met + en de landcode.';
  var NAMEN = { gmial: 'gmail', gmal: 'gmail', gamil: 'gmail', gmaill: 'gmail', gnail: 'gmail', gmai: 'gmail', gmali: 'gmail', gmil: 'gmail', gmeil: 'gmail',
    hotmal: 'hotmail', hotmial: 'hotmail', hotmai: 'hotmail', hotnail: 'hotmail', hormail: 'hotmail', hotmaill: 'hotmail', homail: 'hotmail', hotmil: 'hotmail', hotamil: 'hotmail',
    outlok: 'outlook', outllok: 'outlook', oulook: 'outlook', outloo: 'outlook', outlool: 'outlook', iclod: 'icloud', icoud: 'icloud', icluod: 'icloud',
    yaho: 'yahoo', yahooo: 'yahoo', zigo: 'ziggo', ziggoo: 'ziggo', kpnmal: 'kpnmail', kpmail: 'kpnmail' };
  var TLD = { con: 'com', cm: 'com', comm: 'com', cpm: 'com', vom: 'com', xom: 'com', cim: 'com', ocm: 'com', om: 'com', nll: 'nl', nk: 'nl', nl1: 'nl' };

  /* ---------- telefoon (zelfde regels als kiss_telefoon in api/_lib.php) ---------- */
  function telNorm(raw) {
    var v = String(raw).replace(/[^\d+]/g, ''), plus = v.charAt(0) === '+', n = v.replace(/\D/g, '');
    if (!plus && n.slice(0, 2) === '00') { plus = true; n = n.slice(2); }
    if (plus) {
      var z = /^0*/.exec(n)[0].length; n = n.slice(z);
      if (n.slice(0, 2) === '31') { plus = false; n = n.slice(2); if (n.charAt(0) !== '0') n = '0' + n; }
      else if (z === 1) { plus = false; n = '0' + n; } /* "+06…" is bedoeld als 06… */
    } else if (n.charAt(0) === '6' && n.length === 9) n = '0' + n;
    return { plus: plus, n: n.slice(0, 15) };
  }
  function telKanon(raw) { var t = telNorm(raw); return (t.plus ? '+' : '') + t.n; }
  function telGeldig(k) { return /^\+[1-9][0-9]{7,14}$/.test(k) || /^0[0-9]{9}$/.test(k); }
  function ccLen(n) { return /^[17]/.test(n) ? 1 : CC2.indexOf(n.slice(0, 2)) > -1 && n.length >= 2 ? 2 : 3; }
  function telFmt(t) {
    var n = t.n, a;
    if (t.plus) { a = ccLen(n); return '+' + n.slice(0, a) + (n.length > a ? ' ' + n.slice(a) : ''); }
    if (n.charAt(0) !== '0' || n.length > 10) return n; /* niet stil omzetten of groeperen: de hint legt het uit */
    a = n.slice(0, 2) === '06' ? 2 : KORT.indexOf(n.slice(0, 3)) > -1 ? 3 : 4;
    return n.length > a ? n.slice(0, a) + ' ' + n.slice(a) : n;
  }
  function telRest(t) { /* '' = compleet (of leeg), anders de hint */
    var n = t.n, r;
    if (t.plus) {
      if (!n) return 'Vul na de + de landcode en je nummer in.';
      r = 8 - n.length; return r > 0 ? 'Nog minimaal ' + r + (r === 1 ? ' cijfer.' : ' cijfers.') : '';
    }
    if (!n) return '';
    if (n.length > 10 || (n.charAt(0) === '6' && n.length > 9)) return BUITEN;
    if (n.charAt(0) === '6') { r = 9 - n.length; return 'Nog ' + r + (r === 1 ? ' cijfer.' : ' cijfers.'); }
    if (n.charAt(0) !== '0') return 'Begin met 0, of met + en de landcode.';
    r = 10 - n.length; return r > 0 ? 'Nog ' + r + (r === 1 ? ' cijfer.' : ' cijfers.') : '';
  }

  /* ---------- namen (zelfde regels als kiss_naam_opmaak) ---------- */
  function naamFilter(v) {
    return v.replace(/[’‘´`ʼ]/g, "'").replace(/[^\p{L}\p{M} .'\-]/gu, '').replace(/\s+/g, ' ').replace(/^ /, '');
  }
  function deel(s, klaar) { /* hoofdletterwoord ("JAN") pas bij verlaten/plakken klein maken: per toets zou "JA" -> "Ja" -> "JaN" geven */
    if (klaar && s.length > 1 && s === s.toLocaleUpperCase('nl') && s !== s.toLocaleLowerCase('nl')) s = s.toLocaleLowerCase('nl');
    if (!klaar && s === 'i') return s; /* tijdens typen een losse i laten staan: kan nog "ij" worden (IJsbrand) */
    if (/^ij/.test(s)) s = 'IJ' + s.slice(2); /* alleen als "ij" klein getypt is: Ijaz blijft Ijaz */
    else s = s.charAt(0).toLocaleUpperCase('nl') + s.slice(1);
    /* initialen: J.W.; "J.W" (zonder slotpunt) pas bij verlaten/plakken, anders wordt "j.de" tijdens typen "J.De" */
    return s.replace(klaar ? /\.(\p{L})(?=\.|$)/gu : /\.(\p{L})(?=\.)/gu, function (m, l) { return '.' + l.toLocaleUpperCase('nl'); });
  }
  function woord(x, klaar) { return x.split(/([\-'])/).map(function (s) { return s === '-' || s === "'" ? s : deel(s, klaar); }).join(''); }
  function naamOpmaak(v, soort, klaar) {
    if (klaar) v = v.normalize('NFC').trim();
    var ws = v.split(' ');
    for (var i = 0; i < ws.length; i++) {
      if (!ws[i]) continue;
      var l = ws[i].toLocaleLowerCase('nl'), voor = i === 0 && (soort === 'voornaam' || soort === 'naam'); /* v10: voornaam als naam */
      if (!voor) {
        if (TV.indexOf(l) > -1) { ws[i] = l; continue; }
        if (/^d'./.test(l)) { ws[i] = "d'" + woord(ws[i].slice(2), klaar); continue; }
        if (!klaar && i === ws.length - 1 && (l === "d'" || TV.some(function (t) { return t.indexOf(l) === 0; }))) continue; /* nog bezig */
      }
      ws[i] = woord(ws[i], klaar);
    }
    /* v10 (Thomas 27-10-2026): tussenvoegsels altijd klein, ook als laatste of enige woord; de regel review N3 (dan hoofdletter) vervalt */
    return ws.join(' ');
  }
  function letters(v) { return (v.match(/\p{L}/gu) || []).length; }

  /* ---------- e-mail (zelfde regels als kiss_email_schoon + kiss_is_email) ---------- */
  function mailOpmaak(v, klaar) { v = v.replace(/\s+/g, '').toLowerCase(); return klaar ? v.replace(/\.+$/, '') : v; }
  function mailFout(v) { /* '' = goed of leeg */
    if (!v) return '';
    if (/\.@/.test(v)) return 'Er staat een punt vlak voor de @.';
    if (/\.\./.test(v)) return 'Er staan twee punten achter elkaar.';
    if (!/^[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(v) || v.length > 254)
      return 'Dit e-mailadres lijkt niet te kloppen. Controleer de @ en de punt.';
    return '';
  }
  function suggestie(v) {
    var m = /^([^@\s]+)@([^@\s]+)$/.exec(v);
    if (!m) return '';
    var p = m[2].toLowerCase().replace(/,/g, '.').split('.');
    if (p.length < 2) return '';
    var tld = p.pop(), dom = p.join('.');
    dom = NAMEN[dom] || dom; tld = TLD[tld] || tld;
    if ((dom === 'gmail' || dom === 'hotmail') && tld === 'co') tld = 'com';
    if (dom === 'gmail' && tld === 'nl') tld = 'com';
    var s = m[1] + '@' + dom + '.' + tld;
    return s.toLowerCase() !== v.toLowerCase() ? s : '';
  }

  /* Alleen voor de spiegeltest (regressiepoort, Node): pure functies, geen DOM. */
  if (w.KISS_INVOER_TEST) { w.KISS_INVOER_TEST = { telKanon: telKanon, telGeldig: telGeldig, telFmt: function (v) { return telFmt(telNorm(v)); }, telRest: function (v) { return telRest(telNorm(v)); },
    naam: function (v, s) { return naamOpmaak(naamFilter(v).trim(), s, true); }, mail: function (v) { return mailOpmaak(v, true); }, mailFout: mailFout }; return; }

  /* Gedeelde helper (J2): naam opmaken zoals het veld getipt_door en kiss_naam_opmaak(…, 'naam') op de server; tip.v5.js gebruikt
     hem voor de regel "Getipt door: <naam>", het verborgen veld en het WhatsApp-bericht. */
  w.KISS_NAAMOPMAAK = function (v) { return naamOpmaak(naamFilter(String(v || '')).trim(), 'naam', true); };

  var form = d.querySelector('form[data-validate]');
  if (!form) return;
  var rec = form.querySelector('[name="voornaam"]') !== null; /* wervingsformulier: je-vorm; anders u-vorm */

  function hint(f, soort, tekst, live) {
    var id = f.id + '-' + soort, p = d.getElementById(id);
    if (!p && !tekst) return null;
    if (!p) { p = d.createElement('p'); p.id = id; p.className = soort === 'teller' ? 'c-field__hint' : 'c-field__warn'; f.insertAdjacentElement('afterend', p);
      f.setAttribute('aria-describedby', ((f.getAttribute('aria-describedby') || '') + ' ' + id).trim()); }
    p.setAttribute('aria-live', live ? 'polite' : 'off');
    p.textContent = tekst;
    return p;
  }
  function teller(f, t, klaar) {
    var h = telRest(t), p = hint(f, 'teller', h, klaar);
    f.setCustomValidity(h && klaar ? h : '');
    f.dataset.msgInvalid = h ? (h === BUITEN ? h : h + (t.plus ? ' Bijvoorbeeld: +32 470123456.' : ' Bijvoorbeeld: 06 12345678.')) : '';
    /* Bij verlaten/versturen toont site.js dezelfde tekst als melding: teller direct verbergen (geen verschuiving tussen
       mousedown en mouseup, anders mist de klik op de verzendknop). */
    if (p) p.hidden = !!(h && klaar);
  }
  function toonSuggestie(f) {
    var id = f.id + '-suggestie', p = d.getElementById(id), s = suggestie(f.value);
    if (!s) { if (p) p.remove(); return; }
    if (!p) { p = d.createElement('p'); p.id = id; p.className = 'c-field__warn'; p.setAttribute('aria-live', 'polite'); f.insertAdjacentElement('afterend', p); }
    p.textContent = rec ? 'Bedoel je ' : 'Bedoelt u ';
    var b = d.createElement('strong'); b.textContent = s; p.appendChild(b);
    p.appendChild(d.createTextNode('? '));
    var k = d.createElement('button'); k.type = 'button'; k.className = 'btn btn--secondary btn--compact'; k.textContent = 'Ja, pas aan';
    k.addEventListener('click', function () { f.value = s; p.remove(); f.dispatchEvent(new Event('input', { bubbles: true })); f.focus(); });
    p.appendChild(k);
  }

  /* ---------- toepassen met behoud van de cursorpositie ---------- */
  var TEKEN = { telefoon: /[0-9+]/, email: /\S/, voornaam: /\S/, achternaam: /\S/, naam: /\S/ };
  function zet(f, nieuw) {
    var oud = f.value;
    if (nieuw === oud) return;
    var c = null;
    try { c = typeof f.selectionStart === 'number' && d.activeElement === f ? f.selectionStart : null; } catch (e) {}
    var re = TEKEN[f.dataset.opmaak], k = 0, i;
    if (c !== null) for (i = 0; i < c && i < oud.length; i++) if (re.test(oud.charAt(i))) k++;
    f.value = nieuw;
    if (c === null) return;
    if (c >= oud.length) { k = nieuw.length; } else { for (i = 0; i < nieuw.length && k > 0; i++) if (re.test(nieuw.charAt(i))) k--; k = i; }
    try { f.setSelectionRange(k, k); } catch (e) {}
  }
  function opmaak(f, klaar, e) {
    var s = f.dataset.opmaak, v = f.value, h;
    if (s === 'telefoon') {
      zet(f, !v.replace(/[^\d]/g, '') && v.indexOf('+') < 0 ? '' : telFmt(telNorm(v)));
      teller(f, telNorm(f.value), klaar);
    } else if (s === 'email') {
      /* type=email (contact) geeft geen cursorpositie: daar tijdens typen alleen opmaken als er aan het eind getypt of geplakt
         is; op de wervingsformulieren (type=text, inputmode=email) altijd, met behoud van de cursor */
      var cur = false; try { cur = typeof f.selectionStart === 'number'; } catch (x) {}
      var eind = !e || cur || e.inputType === 'insertFromPaste' || (typeof e.data === 'string' && v.slice(-e.data.length) === e.data);
      if (klaar || eind) zet(f, mailOpmaak(v, klaar));
      if (klaar) {
        h = mailFout(f.value);
        hint(f, 'controle', h, true);
        if (!rec) f.setCustomValidity(h); /* contact (opdrachtgevers): blokkeert; werving: alleen hint, server bewaart ruw */
        toonSuggestie(f);
      }
    } else if (s) {
      zet(f, naamOpmaak(klaar ? naamFilter(v).trim() : naamFilter(v), s, klaar));
      if (s === 'voornaam' || s === 'achternaam') {
        h = f.value && letters(f.value) < 2 ? 'Vul minstens 2 letters in.' : '';
        f.setCustomValidity(h && klaar ? h : '');
        f.dataset.msgInvalid = h;
      }
    }
  }
  function velden() { return form.querySelectorAll('[data-opmaak]'); }
  form.addEventListener('input', function (e) {
    var f = e.target; if (!f.dataset || !f.dataset.opmaak || e.isComposing) return;
    if (f.dataset.opmaak === 'email') { var p = d.getElementById(f.id + '-suggestie'); if (p) p.remove(); }
    opmaak(f, false, e);
  }, true);
  form.addEventListener('compositionend', function (e) { if (e.target.dataset && e.target.dataset.opmaak) opmaak(e.target, false); }, true);
  d.addEventListener('focusout', function (e) { var f = e.target; if (f && f.dataset && f.dataset.opmaak && form.contains(f)) opmaak(f, true); }, true);
  d.addEventListener('submit', function (e) { if (e.target === form) Array.prototype.forEach.call(velden(), function (f) { opmaak(f, true); }); }, true);

  /* Verzonden waarde uniform (ook bij de uitgestelde verzending met token) en invoer bewaren voor een eventuele serverfout */
  var OPSLAG = 'kiss_invoer';
  form.addEventListener('formdata', function (e) {
    var bewaar = {};
    Array.prototype.forEach.call(velden(), function (f) {
      if (f.name && e.formData.has(f.name) && f.dataset.opmaak === 'telefoon') e.formData.set(f.name, f.value.trim() ? telKanon(f.value) : '');
    });
    /* Release 2: eerste UTM van deze sessie (first touch) als bron, zelfde opmaak als site.js: source/medium/campaign/content */
    try {
      /* review M1: kiss_bron bevat al 'source/medium/campaign/content' (opgeschoond door het inline script); alleen die tekens toegestaan */
      var b = sessionStorage.getItem('kiss_bron') || '';
      if (/^[a-z0-9._-]+(\/[a-z0-9._-]*){0,3}$/.test(b) && b.length <= 170 && e.formData.has('bron')) e.formData.set('bron', b);
    } catch (x) {}
    Array.prototype.forEach.call(form.elements, function (f) {
      if (!f.name || f.type === 'hidden' || f.type === 'file' || f.type === 'password' || f.tabIndex === -1 || f.name === 'website') return;
      if (f.tagName === 'TEXTAREA' || /^(motivatie|bericht|toelichting)$/.test(f.name)) return; /* review N1: vrije tekst nooit opslaan */
      if ((f.type === 'radio' || f.type === 'checkbox')) { if (f.checked) bewaar[f.name + '=' + f.value] = 1; }
      else if (f.value) bewaar[f.name] = f.value;
    });
    try { sessionStorage.setItem(OPSLAG, JSON.stringify({ t: Date.now(), f: form.id, v: bewaar })); } catch (x) {}
  });
  Array.prototype.forEach.call(velden(), function (f) { if (f.value) opmaak(f, true); }); /* bijv. vooraf ingevuld */
  /* BL 993: de tipnaam wordt sinds v7 door tip.v5.js zelf opgemaakt met window.KISS_NAAMOPMAAK (dit script laadt eerst) */
  /* review N1: ook bij terugkeer uit de terug-cache (pageshow) wissen als er geen ?error= is; site.js wist op de bedankpagina */
  w.addEventListener('pageshow', function () { if (!/[?&]error=/.test(location.search)) { try { sessionStorage.removeItem(OPSLAG); } catch (x) {} } });

  /* ---------- na een serverfout: invoer terugzetten en per veld de melding (na site.js; defer loopt vóór DOMContentLoaded) ---------- */
  d.addEventListener('DOMContentLoaded', function () {
    var q = new URLSearchParams(location.search), oud = null;
    try { oud = JSON.parse(sessionStorage.getItem(OPSLAG) || 'null'); sessionStorage.removeItem(OPSLAG); } catch (x) {}
    if (!q.get('error')) return;
    if (oud && oud.f === form.id && Date.now() - oud.t < 9e5) {
      Array.prototype.forEach.call(form.elements, function (f) {
        if (!f.name || f.type === 'hidden' || f.type === 'file' || f.tabIndex === -1) return;
        if (f.type === 'radio' || f.type === 'checkbox') { if (oud.v[f.name + '=' + f.value]) f.checked = true; }
        else if (oud.v[f.name] !== undefined) { f.value = oud.v[f.name]; if (f.dataset.opmaak) opmaak(f, true); }
      });
      var a18 = d.getElementById('a18n'); if (a18 && a18.checked) a18.dispatchEvent(new Event('change', { bubbles: true }));
    }
    /* T-091 (besluit Thomas 25-10, OP-T091-I5): te veel pogingen in korte tijd (ook mislukte). Eerlijke melding: er is
       niets binnengekomen. site.js toont eerst de algemene servermelding; die vervangen we hier. */
    if (q.get('error') === 'pogingen') {
      var sm = form.querySelector('[data-form-summary]');
      if (sm) { sm.innerHTML = '<h2></h2>'; sm.firstChild.textContent = rec
        ? 'Er is in korte tijd vaak geprobeerd te versturen. Je sollicitatie is nog niet binnen. Probeer het over 10 minuten opnieuw, of app ons via de WhatsApp-knop.'
        : 'Er is in korte tijd vaak geprobeerd te versturen. Uw bericht is nog niet binnen. Probeer het over 10 minuten opnieuw, of mail ons.';
        sm.hidden = false; sm.focus(); }
      return;
    }
    var namen = (q.get('velden') || '').split(',');
    if (q.get('error') !== 'validatie' || !namen[0]) return;
    var ICON = '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"><path d="M12 3l10 18H2zM12 10v5M12 18v.5"/></svg>';
    var items = [];
    namen.forEach(function (n) {
      if (!/^[a-z_]{2,20}$/.test(n)) return;
      var f = form.querySelector('[name="' + n + '"]'); if (!f) return;
      var t = f.closest('fieldset') || f, el = d.getElementById(t.id + '-fout');
      var msg = f.getAttribute('data-msg-server') || f.getAttribute('data-msg-invalid') || t.getAttribute('data-msg-required') || f.getAttribute('data-msg-required') || 'Controleer dit veld.';
      var lab = t.tagName === 'FIELDSET' ? t.querySelector('legend') : form.querySelector('label[for="' + f.id + '"]');
      lab = lab ? (lab.getAttribute('data-label') || lab.textContent.replace(/\(optioneel\)|\(voor- en achternaam\)|\(optioneel, voor een bevestiging\)/, '').trim()) : '';
      if (el) { el.innerHTML = ICON + '<span></span>'; el.lastChild.textContent = msg; }
      if (t.tagName !== 'FIELDSET') t.setAttribute('aria-invalid', 'true');
      var dt = t.closest('details'); if (dt) dt.open = true;
      items.push({ el: t, id: t.id, txt: (lab ? lab + ': ' : '') + msg });
    });
    var sum = form.querySelector('[data-form-summary]');
    if (!items.length || !sum) return;
    items.sort(function (a, b) { return a.el.compareDocumentPosition(b.el) & 4 ? -1 : 1; }); /* volgorde van het formulier */
    sum.innerHTML = '<h2></h2><ul></ul>';
    sum.firstChild.textContent = 'Controleer ' + items.length + (items.length === 1 ? ' veld' : ' velden');
    items.forEach(function (x) { var li = d.createElement('li'), a = d.createElement('a'); a.href = '#' + x.id; a.textContent = x.txt; li.appendChild(a); sum.lastChild.appendChild(li); });
    sum.hidden = false; sum.focus();
  });
})();
