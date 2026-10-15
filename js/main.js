// KILN V2 – Basis-Interaktionen
(function () {
  // Reveal-Animationen (respektiert prefers-reduced-motion)
  const els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
  } else {
    els.forEach((el) => el.classList.add('in'));
  }

  // Jahr im Footer
  document.querySelectorAll('.foot-bottom span').forEach((s) => {
    s.textContent = s.textContent.replace('2025', new Date().getFullYear());
  });

  // Mobiles Menü
  const btn = document.querySelector('.menu-btn'), menu = document.getElementById('mobileMenu');
  if (btn && menu) {
    const close = () => { menu.setAttribute('hidden', ''); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Menü öffnen'); };
    btn.addEventListener('click', () => {
      const open = menu.hasAttribute('hidden');
      if (open) { menu.removeAttribute('hidden'); btn.setAttribute('aria-expanded', 'true'); btn.setAttribute('aria-label', 'Menü schließen'); } else close();
    });
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }
})();
