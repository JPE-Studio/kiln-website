/* KIWN System-Check – Konfigurator-Logik
   Regelwerk bewusst einfach & deterministisch gehalten:
   Empfehlungen sind demonstrativ; vor Bestellung wird jede Kombination
   in der Werkstatt geprüft ("Geprüft") oder klar als Schätzung markiert. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const STEPS = ['Euer Profil', 'Eure Aufgaben', 'Eure KI', 'Eure Daten', 'Budget & Hardware', 'Euer Ergebnis'];
  const TIERS = [
    { name: 'Kiwn One', img: 'img/generated-2.png', max: 3, price: 1490, care: 190 },
    { name: 'Kiwn One Max', img: 'img/generated-2.png', max: 5, price: 2490, care: 290 },
    { name: 'Kiwn Studio 128', img: 'img/generated-1.png', max: 12, price: 2990, care: 290 },
    { name: 'Kiwn Studio Ultra 256', img: 'img/generated-1.png', max: 30, price: 5990, care: 290 },
    { name: 'Kiwn Forge', img: 'img/generated-3.png', max: 60, price: 5490, care: 390 },
    { name: 'Kiwn Forge Pro', img: 'img/generated-3.png', max: 999, price: 8990, care: 390 }
  ];
  const HEAVY = ['images', 'video', 'agents']; // Jobs, die unsere Basis-Konfigurationen an ihre Grenzen bringen

  let state = {
    step: 0, maxStep: 0, users: 3,
    industry: '', size: '', it: 'Nein, gar nicht', country: 'Deutschland', expertise: 'kaum',
    ucs: [], ucEscape: false, families: ['offen'], context: 'mittel', qual: 'ausgewogen',
    conc: 2, kiEscape: false, deploy: '', sensitive: 'Normale Geschäftsdaten', backup: 'KIWN – fernwartung nur mit meiner Freigabe',
    budget: 3000
  };
  const eur = (n) => n.toLocaleString('de-DE') + ' €';

  /* ---------- Persistenz ---------- */
  const KEY = 'kiln-config';
  const save = (quiet) => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    if (!quiet) { const t = $('#toast'); t.textContent = 'Zwischenstand gespeichert – ihr könnt jederzeit weitermachen.'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2600); } };
  try { const raw = localStorage.getItem(KEY); if (raw) state = { ...state, ...JSON.parse(raw) }; } catch (e) {}
  const persist = () => { $('#stateField').value = JSON.stringify(state);
    $('#autoSave').textContent = 'Wird automatisch gespeichert'; setTimeout(() => ($('#autoSave').textContent = ''), 1800); save(true); };

  /* ---------- Schrittnavigation ---------- */
  const stepEls = $$('.step');
  function render() {
    stepEls.forEach((s, i) => { s.hidden = i !== state.step; });
    $('#stepCount').textContent = `Schritt ${state.step + 1} von 6`;
    $('#progressBar').style.width = ((state.step + 1) / 6 * 100) + '%';
    const rail = $('#rail'); rail.innerHTML = '';
    STEPS.forEach((label, i) => {
      const d = document.createElement('div');
      d.className = 'rail-item' + (i < state.step ? ' done' : i === state.step ? ' current' : '');
      d.innerHTML = `<span class="ri-ic" aria-hidden="true"></span>${label}`;
      if (i <= state.maxStep) {
        d.style.cursor = 'pointer';
        d.tabIndex = 0; d.setAttribute('role', 'button');
        const go = () => { if (valid(state.step) || i < state.step) { state.step = i; persist(); render(); } };
        d.addEventListener('click', go);
        d.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      }
      rail.appendChild(d);
    });
    $('#backBtn').style.visibility = state.step === 0 ? 'hidden' : 'visible';
    const next = $('#nextBtn');
    next.textContent = state.step === 5 ? 'Fertig' : 'Weiter';
    next.disabled = !valid(state.step);
    if (state.step === 4) renderPlatforms();
    if (state.step === 5) renderResults();
    $$('.err-msg').forEach((e) => (e.style.display = 'none'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function valid(i) {
    switch (i) {
      case 0: return !!$('#industry').value && !!$('#size').value;
      case 1: return state.ucs.length > 0 || state.ucEscape;
      case 2: return true;
      case 3: return !!state.deploy;
      case 4: return computePlatforms().some((p) => p.v === 'ok');
      default: return true;
    }
  }
  function showError(i) {
    const e = $('#err' + i); if (e) { e.style.display = 'block'; e.focus?.(); }
  }

  /* ---------- A: Profil ---------- */
  $('#industry').addEventListener('change', (e) => { state.industry = e.target.value; persist(); refresh(); });
  $('#size').addEventListener('change', (e) => { state.size = e.target.value; persist(); refresh(); });
  $('#it').addEventListener('change', (e) => { state.it = e.target.value; persist(); });
  $('#country').addEventListener('change', (e) => { state.country = e.target.value; persist(); });
  $$('input[name="expertise"]').forEach((r) => r.addEventListener('change', (e) => { state.expertise = e.target.value; persist(); }));
  function setUsers(n) { state.users = Math.min(200, Math.max(1, n)); $('#usersVal').textContent = state.users;
    state.conc = Math.min(state.conc, state.users); $('#concVal').textContent = state.conc;
    $('#usersMinus').disabled = state.users <= 1; $('#usersPlus').disabled = state.users >= 200; persist(); refresh(); }
  $('#usersMinus').addEventListener('click', () => setUsers(state.users - 1));
  $('#usersPlus').addEventListener('click', () => setUsers(state.users + 1));

  /* ---------- B: Aufgaben ---------- */
  $$('#useCases .opt-card').forEach((c) => c.addEventListener('click', () => {
    const uc = c.dataset.uc, on = c.getAttribute('aria-pressed') === 'true';
    c.setAttribute('aria-pressed', String(!on));
    state.ucs = on ? state.ucs.filter((x) => x !== uc) : [...state.ucs, uc];
    persist(); refresh();
  }));
  $('#ucEscape').addEventListener('change', (e) => { state.ucEscape = e.target.checked; persist(); refresh(); });

  /* ---------- C: KI ---------- */
  $$('#families input').forEach((c) => c.addEventListener('change', () => {
    state.families = $$('#families input:checked').map((i) => i.value); persist();
  }));
  $$('.seg [data-k]').forEach((b) => b.addEventListener('click', () => {
    $$('.seg [data-k]').forEach((x) => x.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', 'true'); state.context = b.dataset.k; persist();
  }));
  $$('.seg [data-qual]').forEach((b) => b.addEventListener('click', () => {
    $$('.seg [data-qual]').forEach((x) => x.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', 'true'); state.qual = b.dataset.qual; persist();
  }));
  function setConc(n) { state.conc = Math.min(state.users, Math.max(1, n)); $('#concVal').textContent = state.conc;
    $('#concMinus').disabled = state.conc <= 1; $('#concPlus').disabled = state.conc >= state.users; persist(); }
  $('#concMinus').addEventListener('click', () => setConc(state.conc - 1));
  $('#concPlus').addEventListener('click', () => setConc(state.conc + 1));
  $('#kiEscape').addEventListener('change', (e) => {
    state.kiEscape = e.target.checked;
    if (state.kiEscape) {
      state.context = 'mittel'; state.qual = 'ausgewogen'; state.conc = Math.max(1, Math.min(4, Math.round(state.users / 2)));
      $$('.seg [data-k]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.k === 'mittel')));
      $$('.seg [data-qual]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.qual === 'ausgewogen')));
      setConc(state.conc);
      const t = $('#toast'); t.textContent = 'Alles klar – wir empfehlen eine sinnvolle Einstellung.'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2400);
    }
    persist();
  });

  /* ---------- D: Daten ---------- */
  $$('#deploy .opt-card').forEach((c) => c.addEventListener('click', () => {
    $$('#deploy .opt-card').forEach((x) => x.setAttribute('aria-pressed', 'false'));
    c.setAttribute('aria-pressed', 'true'); state.deploy = c.dataset.deploy; persist(); refresh();
  }));
  $('#sensitive').addEventListener('change', (e) => { state.sensitive = e.target.value; persist(); });
  $('#backup').addEventListener('change', (e) => { state.backup = e.target.value; persist(); });

  /* ---------- E: Budget & Hardware-Prüfung ---------- */
  $$('input[name="budget"]').forEach((r) => r.addEventListener('change', (e) => { state.budget = +e.target.value; persist(); refresh(); }));
  function computePlatforms() {
    const heavy = state.ucs.some((u) => HEAVY.includes(u));
    const budget = state.budget;
    return [
      { name: 'KIWN-Bausatz (eigene Werkstatt)', v: 'ok', why: 'Unsere gebauten und geprüften Konfigurationen – genau dafür sind wir da.' },
      { name: 'Apple Silicon – Mac Studio als Basis', v: state.users <= 30 ? (heavy ? 'mid' : 'ok') : 'no',
        why: state.users <= 30 ? (heavy ? 'Für eure Bilder-/Video-/Automatisierungs-Wünsche können wir noch nicht alles versprechen – Schätzung.' : 'Läuft in unseren Tests stabil für Teams bis 30 – auch ohne Internet.') : 'Für eure Größe reichen unsere Erfahrungswerte nicht – das sagen wir lieber ehrlich.' },
      { name: 'NVIDIA DGX Spark', v: budget >= 10000 || ((state.ucs.includes('code') || state.ucs.includes('agents')) && budget >= 6000) ? 'ok' : budget >= 6000 ? 'mid' : 'no',
        why: budget >= 6000 ? 'Stark für Entwicklung und Automatisierung – aber über eurem angestrebten Rahmen, wenn ihr uns genau so baut.' : 'Unter 6.000 € können wir keine getestete Konfiguration anbieten.' },
      { name: 'AMD Ryzen AI Max / Strix Halo', v: state.users <= 5 && budget >= 2500 ? 'ok' : state.users <= 10 ? 'mid' : 'no',
        why: state.users <= 5 ? 'Günstiger Einstieg mit überraschend viel Kraft – für kleine Teams getestet.' : state.users <= 10 ? 'Grenzfall: für einzelne Aufgaben okay, nicht für das ganze Team gleichzeitig.' : 'Reicht nicht für eure gleichzeitige Nutzung – würden wir euch nicht verkaufen.' },
      { name: 'GPU-Workstation', v: state.ucs.includes('video') ? 'ok' : state.ucs.includes('images') ? 'mid' : 'no',
        why: state.ucs.includes('video') ? 'Für Video- und Medienarbeit die richtige Werkbank – laut, warm, stark.' : 'Nur für Spezialaufgaben sinnvoll – eure Aufgaben brauchen das nicht.' }
    ];
  }
  function renderPlatforms() {
    const wrap = $('#platforms'); wrap.innerHTML = '';
    const ICONS = { ok: ['dot-ok', 'Geprüft'], mid: ['dot-mid', 'Schätzung'], no: ['dot-no', "Passt nicht – ehrlich"] };
    computePlatforms().forEach((p) => {
      const [dot, label] = ICONS[p.v];
      const el = document.createElement('div');
      el.className = 'plat-card' + (p.v === 'no' ? ' disabled' : '');
      el.innerHTML = `<span class="v ${p.v}"><span class="dot ${dot}" style="margin:0 7px 0 0"></span>${label}</span>
        <h4>${p.name}</h4><p>${p.why}</p>`;
      wrap.appendChild(el);
    });
    $('#err4').style.display = computePlatforms().some((p) => p.v === 'ok') ? 'none' : 'block';
  }

  /* ---------- F: Ergebnis ---------- */
  function bestTier() {
    return TIERS.find((t) => state.users <= t.max) || TIERS[TIERS.length - 1];
  }
  function tierVerdict(t) {
    const heavy = state.ucs.some((u) => HEAVY.includes(u));
    const verified = !heavy && (state.deploy !== 'apis') && t.max >= state.users;
    return verified ? 'ok' : 'mid';
  }
  function renderResults() {
    const i = TIERS.indexOf(bestTier());
    const best = TIERS[i], alt = TIERS[Math.min(i + 1, TIERS.length - 1)];
    const wrap = $('#results'); wrap.innerHTML = '';
    const ucs = state.ucEscape ? ['docs', 'knowledge', 'chat'] : state.ucs;
    const ucText = { docs: 'Papierkram', knowledge: 'verstreutes Wissen', chat: 'Fragen beantworten', notes: 'Protokolle', code: 'Software-Arbeit', images: 'Bilder & Grafik', agents: 'Arbeitsabläufe', video: 'Video & Medien' };
    const deployText = { offline: 'Komplett ohne Internet', lan: 'Nur euer Büronetz', remote: 'Auch von unterwegs', apis: 'Mit freigegebenen externen Diensten' };
    function card(t, bestFit) {
      const v = tierVerdict(t);
      const total = t.price + 390 + t.care;
      const el = document.createElement('div');
      el.className = 'verdict' + (bestFit ? ' best' : '');
      const why = bestFit ? [
        `Trägt eure ${state.users} Nutzer heute${t.max >= state.users * 2 ? ' – und hat Luft, falls ihr wächst' : ''}.`,
        `${deployText[state.deploy] || 'Betrieb bei euch im Haus'} – ${v === 'ok' ? 'von uns geprüft, nicht behauptet' : 'nach unserer Erfahrung; wir prüfen es bei Bestellung konkret'}.`,
        `Passt zu: ${ucs.slice(0, 3).map((u) => ucText[u]).join(', ') || 'eurem Arbeitsalltag'}.`
      ] : [
        'Falls ihr bald wachst oder mehr gleichzeitig loslegt.',
        'Schätzung: Diese Stufe rechnen wir für eure Aufgaben erst bei Bestellung durch.',
        'Ihr könnt jederzeit mit dem kleineren System starten.'
      ];
      el.innerHTML = `
        <div class="v-head">
          <span class="badge ${bestFit ? 'blue' : ''}">${bestFit ? 'Am besten für euch' : 'Eine Stufe größer'}</span>
          <span class="badge"><span class="dot ${v === 'ok' ? 'dot-ok' : 'dot-mid'}" style="margin:0 6px 0 0"></span>${v === 'ok' ? 'Geprüft' : 'Schätzung'}</span>
        </div>
        <h3>${t.name}</h3>
        <ul>${why.map((w) => `<li class="${bestFit ? '' : 'soft'}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="${bestFit ? 'M20 6 9 17l-5-5' : 'M5 12h14'}"/></svg>${w}</li>`).join('')}</ul>
        <div class="cost">
          <div class="crow"><span class="k">Hardware & Aufbau</span><span>${eur(t.price)}</span></div>
          <div class="crow"><span class="k">Einrichtung bei euch</span><span>${eur(390)}</span></div>
          <div class="crow"><span class="k">Sorglos-Paket, Jahr 1</span><span>${eur(t.care)}</span></div>
          <div class="total"><span>Erstes Jahr, alles drin</span><span>${eur(total)}</span></div>
        </div>`;
      return el;
    }
    wrap.appendChild(card(best, true));
    if (alt !== best) wrap.appendChild(card(alt, false));
    const summary = `KIWN-System-Check: ${state.industry || '–'} · ${state.users} Nutzer · ${(ucs.map((u) => ucText[u]).join(', ')) || '–'} · ${deployText[state.deploy] || '–'} · Budget bis ${eur(state.budget)} · Empfehlung: ${best.name} (${eur(best.price + 390 + best.care)} im 1. Jahr)`;
    sessionStorage.setItem('kiln-summary', summary);
    $('#toHuman').href = 'beratung.html#prefill';
  }

  /* ---------- Footer-Navigation ---------- */
  function refresh() { $('#nextBtn').disabled = !valid(state.step); }
  $('#nextBtn').addEventListener('click', () => {
    if (!valid(state.step)) { showError(state.step); return; }
    if (state.step === 5) { save(); const t = $('#toast'); t.textContent = 'Danke! Euer System-Check ist gespeichert.'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2600); return; }
    state.step++; state.maxStep = Math.max(state.maxStep, state.step); persist(); render();
  });
  $('#backBtn').addEventListener('click', () => { if (state.step > 0) { state.step--; persist(); render(); } });
  $('#saveBtn').addEventListener('click', () => save());

  /* ---------- Initialisieren ---------- */
  $('#industry').value = state.industry; $('#size').value = state.size; $('#it').value = state.it;
  $('#country').value = state.country; $('#sensitive').value = state.sensitive; $('#backup').value = state.backup;
  $$('input[name="expertise"]').forEach((r) => (r.checked = r.value === state.expertise));
  $$('input[name="budget"]').forEach((r) => (r.checked = +r.value === state.budget));
  $$('#families input').forEach((c) => (c.checked = state.families.includes(c.value)));
  $$('#useCases .opt-card').forEach((c) => c.setAttribute('aria-pressed', String(state.ucs.includes(c.dataset.uc))));
  if (state.deploy) { const el = $(`#deploy [data-deploy="${state.deploy}"]`); el && el.setAttribute('aria-pressed', 'true'); }
  $$('.seg [data-k]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.k === state.context)));
  $$('.seg [data-qual]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.qual === state.qual)));
  $('#ucEscape').checked = state.ucEscape; $('#kiEscape').checked = state.kiEscape;
  setUsers(state.users); setConc(state.conc);
  render();
})();
