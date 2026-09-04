/* Some Memories Stay — interaction layer */
(() => {
  'use strict';

  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const $ = (selector, root = document) => root.querySelector(selector);
  const start = new Date('2025-08-17T11:09:00+05:30').getTime();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Intro
  window.addEventListener('load', () => {
    window.setTimeout(() => {
      document.body.classList.remove('is-loading');
      $('#home')?.classList.add('hero-loaded');
    }, 650);
  });

  // Time is intentionally live throughout the archive.
  const comma = new Intl.NumberFormat('en-US');
  const pad = (value, length = 2) => String(value).padStart(length, '0');
  function getTime() {
  const now = new Date();
  const ms = Math.max(0, now.getTime() - start);

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const startDate = new Date(start);

  /*
   * LIVE CALENDAR MONTH CALCULATION
   *
   * 17 Aug 2025 11:09 AM
   * → 17 Aug 2026 11:09 AM = 12 months
   * → 17 Sep 2026 11:09 AM = 13 months
   * → 17 Aug 2027 11:09 AM = 24 months
   */

  let totalMonths =
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth());

  // Create the exact anniversary for the calculated month.
  const anniversary = new Date(startDate);
  anniversary.setMonth(startDate.getMonth() + totalMonths);

  // If the anniversary hasn't happened yet this month,
  // the current month isn't complete.
  if (now < anniversary) {
    totalMonths--;
  }

  totalMonths = Math.max(0, totalMonths);

  return {
    ms,
    seconds,
    minutes,
    hours,
    days,

    // Live calendar values
    years: Math.floor(totalMonths / 12),
    months: totalMonths,

    // Total elapsed weeks
    weeks: Math.floor(days / 7),

    // Remaining time for the hero timer
    remainderHours: hours % 24,
    remainderMinutes: minutes % 60,
    remainderSeconds: seconds % 60
  };
  }

  function updateTime() {
    const t = getTime();
    const values = {
      days: pad(t.days, 3),
      hours: pad(t.remainder      minutes: pad(t.remainderMinutes),
      seconds: pad(t.remainderSeconds),
      years: pad(t.years),
      months: pad(t.months),
      weeks: pad(t.weeks, 3),
      totalDays: comma.format(t.days),
      totalHours: comma.format(t.hours),
      totalMinutes: comma.format(t.minutes),
      totalSeconds: comma.format(t.seconds)
    };
    $$('[data-time]').forEach((node) => {
      const key = node.dataset.time;
      if (Object.prototype.hasOwnProperty.call(values, key)) node.textContent = values[key];
    });
    const apologyCounter = $('#sorry-count');
    if (apologyCounter) apologyCounter.textContent = comma.format(t.seconds);
  }
  updateTime();
  window.setInterval(updateTime, 1000);

  // Progress and quiet parallax.
  const progress = $('.scroll-progress span');
  const header = $('[data-header]');
  const parallaxItems = $$('[data-parallax]');
  let raf = 0;
  function updateScroll() {
    raf = 0;
    const y = window.scrollY || window.pageYOffset;
    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - window.innerHeight);
    if (progress) progress.style.width = `${(y / max) * 100}%`;
    if (header) header.classList.toggle('is-scrolled', y > 36);
    if (!reduceMotion) {
      parallaxItems.forEach((item) => {
        const speed = Number(item.dataset.parallax || 0);
        const rect = item.getBoundingClientRect();
        const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
        const translate = Math.max(-48, Math.min(48, centerOffset * speed));
        // transform is intentionally only used on decorative elements.
        item.style.transform = `translate3d(0, ${translate}px, 0)`;
      });
    }
  }
  window.addEventListener('scroll', () => {
    if (!raf) raf = requestAnimationFrame(updateScroll);
  }, { passive: true });
  updateScroll();

  // Pointer halo and gentle magnetic behavior.
  const cursorGlow = $('.cursor-glow');
  if (!reduceMotion && cursorGlow && window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('pointermove', (event) => {
      cursorGlow.style.left = `${event.clientX}px`;
      cursorGlow.style.top = `${event.clientY}px`;
    }, { passive: true });

    $$('.magnetic').forEach((element) => {
      element.addEventListener('pointermove', (event) => {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        element.style.transform = `translate(${x * 4}px, ${y * 4}px)`;
      });
      element.addEventListener('pointerleave', () => { element.style.transform = ''; });
    });
  }

  // Reveal sections with intersection observer.
  const revealItems = $$('.reveal, .reveal-scale');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -9% 0px', threshold: .08 });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  // Dock tracks the broader pages rather than every individual beat.
  const dockButtons = $$('[data-dock]');
  const dockMap = {
    home: 'home', beginning: 'between', between: 'between', seconds: 'between',
    'little-things': 'between', unsaid: 'between', distance: 'between', lessons: 'between',
    archive: 'archive', letter: 'archive', numbers: 'numbers', final: 'numbers'
  };
  if ('IntersectionObserver' in window) {
    const chapterObserver = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
        const id = entry.target.id || entry.target.dataset.section;
        const active = dockMap[id];
        if (!active) return;
        dockButtons.forEach((button) => button.classList.toggle('active', button.dataset.dock === active));
      });
    }, { rootMargin: '-42% 0px -47% 0px', threshold: .01 });
    $$('[data-section]').forEach((section) => chapterObserver.observe(section));
  }

  // Menu.
  const menu = $('[data-mobile-menu]');
  const menuToggle = $('[data-menu-toggle]');
  const closeMenu = () => {
    if (!menu) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    menuToggle?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-menu-open');
  };
  const openMenu = () => {
    if (!menu) return;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    menuToggle?.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-menu-open');
  };
  menuToggle?.addEventListener('click', () => menu?.classList.contains('is-open') ? closeMenu() : openMenu());
  $('[data-menu-close]')?.addEventListener('click', closeMenu);
  $$('[data-mobile-menu] a').forEach((link) => link.addEventListener('click', closeMenu));

  // Ambient player: kept visual and calm so the archive never starts unexpected audio.
  const soundToggle = $('[data-sound-toggle]');
  const ambientPlayer = $('[data-ambient-player]');
  const closeAmbientPlayer = () => {
    ambientPlayer?.classList.remove('is-open');
    ambientPlayer?.setAttribute('aria-hidden', 'true');
    soundToggle?.classList.remove('active');
    soundToggle?.setAttribute('aria-pressed', 'false');
    document.body.classList.remove('ambient-active');
  };
  soundToggle?.addEventListener('click', () => {
    const isActive = !ambientPlayer?.classList.contains('is-open');
    ambientPlayer?.classList.toggle('is-open', isActive);
    ambientPlayer?.setAttribute('aria-hidden', String(!isActive));
    soundToggle.classList.toggle('active', isActive);
    soundToggle.setAttribute('aria-pressed', String(isActive));
    document.body.classList.toggle('ambient-active', isActive);
  });
  $('[data-ambient-close]')?.addEventListener('click', closeAmbientPlayer);
  $('[data-ambient-play]')?.addEventListener('click', (event) => {
    const paused = ambientPlayer?.classList.toggle('is-paused');
    event.currentTarget.setAttribute('aria-pressed', String(!paused));
    event.currentTarget.setAttribute('aria-label', paused ? 'Play ambient player' : 'Pause ambient player');
  });

  // Voice note visualizer.
  $$('[data-voice-note] .voice-play').forEach((button) => {
    button.addEventListener('click', () => {
      const parent = button.closest('[data-voice-note]');
      const playing = parent?.classList.toggle('is-playing');
      button.setAttribute('aria-pressed', String(Boolean(playing)));
      button.setAttribute('aria-label', playing ? 'Pause visual voice note' : 'Play visual voice note');
    });
  });

  // Archive filters, search and one intentionally restrained expansion state.
  const archiveTabs = $$('[data-filter]');
  const archiveGrid = $('[data-archive-grid]');
  const archiveSearch = $('[data-archive-search]');
  let activeFilter = 'all';
  function applyArchiveFilters() {
    const query = (archiveSearch?.value || '').trim().toLowerCase();
    $$('.archive-card', archiveGrid).forEach((card) => {
      const typeMatch = activeFilter === 'all' || card.dataset.type === activeFilter;
      const phrase = `${card.dataset.title || ''} ${card.dataset.detail || ''}`.toLowerCase();
      card.hidden = !typeMatch || (query && !phrase.includes(query));
    });
  }
  archiveTabs.forEach((tab) => tab.addEventListener('click', () => {
    activeFilter = tab.dataset.filter || 'all';
    archiveTabs.forEach((button) => {
      const selected = button === tab;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-selected', String(selected));
    });
    applyArchiveFilters();
  }));
  archiveSearch?.addEventListener('input', applyArchiveFilters);
  $('[data-year-toggle]')?.addEventListener('click', (event) => {
    const label = $('span', event.currentTarget);
    if (!label) return;
    const allTime = label.textContent === 'All time';
    label.textContent = allTime ? '2025—26' : 'All time';
    event.currentTarget.classList.toggle('is-active', !allTime);
  });

  const moreItems = [
    { type: 'voice', className: 'archive-card--voice', title: 'The room tone', detail: 'Twenty seconds where even the air seemed to be listening.', date: '29.05.26', inner: '<div class="voice-circle"><i></i></div><div class="voice-wave-mini" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>' },
    { type: 'letter', className: 'archive-card--letter', title: 'No conclusion required', detail: 'A reminder that not every chapter needs a final line.', date: '16.06.26', inner: '<div class="paper-grain"></div><div class="letter-scribble" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>' },
    { type: 'photo', className: 'archive-card--sky', title: 'A little more sky', detail: 'A single clear night saved without needing a reason.', date: '03.07.26', inner: '<div class="archive-art image-sky"></div><div class="archive-card-shade"></div>' }
  ];
  $('[data-load-more]')?.addEventListener('click', (event) => {
    const button = event.currentTarget;
    if (!archiveGrid || button.dataset.loaded) return;
    const fragment = document.createDocumentFragment();
    moreItems.forEach((item, index) => {
      const card = document.createElement('article');
      card.className = `archive-card ${item.className} is-visible`;
      card.dataset.type = item.type;
      card.dataset.title = item.title;
      card.dataset.detail = item.detail;
      card.innerHTML = `${item.inner}<div class="archive-card-head"><span class="type-pill">${item.type}</span><span>${item.date}</span></div><div class="archive-card-foot"><h3>${item.title.replace(' ', '<br />')}</h3><button class="round-arrow" aria-label="Open ${item.title}">↗</button></div>`;
      card.style.transitionDelay = `${index * 80}ms`;
      fragment.appendChild(card);
    });
    archiveGrid.appendChild(fragment);
    button.dataset.loaded = 'true';
    button.querySelector('span').textContent = 'Archive complete';
    button.querySelector('i').textContent = '—';
    setTimeout(applyArchiveFilters, 40);
  });

  // Archive item modal.
  const archiveModal = $('[data-archive-modal]');
  const openArchiveItem = (card) => {
    if (!archiveModal || !card) return;
    $('[data-modal-title]', archiveModal).textContent = card.dataset.title || 'Untitled fragment';
    $('[data-modal-detail]', archiveModal).textContent = card.dataset.detail || 'This fragment was kept quietly.';
    $('[data-modal-type]', archiveModal).textContent = card.dataset.type || 'Archive';
    archiveModal.hidden = false;
    document.body.classList.add('is-modal-open');
    $('.modal-close', archiveModal)?.focus();
  };
  archiveGrid?.addEventListener('click', (event) => {
    const card = event.target.closest('.archive-card');
    if (card && !card.hidden) openArchiveItem(card);
  });
  archiveGrid?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      const card = event.target.closest('.archive-card');
      if (card) { event.preventDefault(); openArchiveItem(card); }
    }
  });
  const closeArchiveModal = () => {
    if (!archiveModal) return;
    archiveModal.hidden = true;
    document.body.classList.remove('is-modal-open');
  };
  $$('[data-modal-close]').forEach((button) => button.addEventListener('click', closeArchiveModal));

  // Design system overlay.
  const systemModal = $('[data-system-modal]');
  const openSystem = () => {
    if (!systemModal) return;
    systemModal.hidden = false;
    document.body.classList.add('is-modal-open');
    $('[data-system-close]', systemModal)?.focus();
  };
  const closeSystem = () => {
    if (!systemModal) return;
    systemModal.hidden = true;
    document.body.classList.remove('is-modal-open');
  };
  $('[data-system-open]')?.addEventListener('click', openSystem);
  $$('[data-system-close]').forEach((button) => button.addEventListener('click', closeSystem));

  // Fold interaction on the letter.
  $('[data-letter-toggle]')?.addEventListener('click', (event) => {
    const paper = event.currentTarget.closest('.letter-paper');
    const folded = paper?.classList.toggle('is-folded');
    event.currentTarget.setAttribute('aria-pressed', String(Boolean(folded)));
    event.currentTarget.firstChild.textContent = folded ? 'Open letter ' : 'Fold letter ';
  });

  // Gentle card tilt for the lessons list only.
  if (!reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    $$('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        card.style.transform = `perspective(900px) rotateX(${y * -1.2}deg) rotateY(${x * 1.2}deg)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  // Escape is a quiet way out of any layer.
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeMenu();
    closeArchiveModal();
    closeSystem();
    closeAmbientPlayer();
  });

  // The hero sky: sparse, subtle, and deliberately slow.
  function makeStarfield() {
    const canvas = $('#starfield');
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext('2d');
    let width = 0, height = 0, pixelRatio = 1, stars = [];
    const makeStars = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      const count = Math.min(180, Math.max(70, Math.floor(width * height / 14000)));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.15 + .15,
        alpha: Math.random() * .45 + .12,
        drift: (Math.random() - .5) * .025,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * .004 + .001
      }));
    };
    const draw = (time) => {
      ctx.clearRect(0, 0, width, height);
      const scroll = window.scrollY * .018;
      stars.forEach((star) => {
        const y = (star.y + scroll * star.drift * 8 + height) % height;
        const a = star.alpha * (.62 + Math.sin(time * star.speed + star.phase) * .28);
        ctx.fillStyle = `rgba(240,245,248,${Math.max(0, a)})`;
        ctx.beginPath();
        ctx.arc(star.x, y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(draw);
    };
    makeStars();
    window.addEventListener('resize', makeStars, { passive: true });
    requestAnimationFrame(draw);
  }

  // A field of soft dust behind Every Second.
  function makeApologyField() {
    const canvas = $('#apology-canvas');
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext('2d');
    let width = 0, height = 0, pixelRatio = 1, dust = [];
    const resize = () => {
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      const count = Math.min(125, Math.max(48, Math.floor(width * height / 17000)));
      dust = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.2 + .22,
        a: Math.random() * .44 + .05,
        vx: (Math.random() - .5) * .025,
        vy: (Math.random() - .5) * .018,
        phase: Math.random() * 8
      }));
    };
    const draw = (time) => {
      ctx.clearRect(0, 0, width, height);
      dust.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < -5) particle.x = width + 5;
        if (particle.x > width + 5) particle.x = -5;
        if (particle.y < -5) particle.y = height + 5;
        if (particle.y > height + 5) particle.y = -5;
        const a = particle.a * (.6 + Math.sin(time * .00045 + particle.phase) * .35);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fill();
        // A very occasional fine connecting line keeps the field dimensional.
        if (index % 15 === 0) {
          const partner = dust[(index + 7) % dust.length];
          const dx = particle.x - partner.x;
          const dy = particle.y - partner.y;
          if (dx * dx + dy * dy < 13500) {
            ctx.strokeStyle = 'rgba(255,255,255,.025)';
            ctx.lineWidth = .5;
            ctx.beginPath(); ctx.moveTo(particle.x, particle.y); ctx.lineTo(partner.x, partner.y); ctx.stroke();
          }
        }
      });
      requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    requestAnimationFrame(draw);
  }

  // The textual star field is HTML so it remains legible at any density.
  const swarm = $('[data-sorry-swarm]');
  if (swarm) {
    const fragment = document.createDocumentFragment();
    const count = window.innerWidth < 600 ? 48 : 94;
    for (let i = 0; i < count; i += 1) {
      const word = document.createElement('span');
      word.textContent = 'I’m sorry';
      let x = Math.random() * 100;
      let y = Math.random() * 100;
      // preserve a clear, spacious center for the live count
      if (x > 25 && x < 75 && y > 28 && y < 73) x += x < 50 ? -22 : 22;
      word.style.left = `${Math.max(-4, Math.min(101, x))}%`;
      word.style.top = `${Math.max(0, Math.min(100, y))}%`;
      word.style.setProperty('--word-size', `${Math.round(8 + Math.random() * 10)}px`);
      word.style.setProperty('--word-opacity', `${(.035 + Math.random() * .16).toFixed(2)}`);
      word.style.setProperty('--word-duration', `${15 + Math.random() * 28}s`);
      word.style.setProperty('--word-delay', `${-Math.random() * 25}s`);
      word.style.setProperty('--word-x', `${Math.round(-24 + Math.random() * 48)}px`);
      word.style.setProperty('--word-y', `${Math.round(-32 + Math.random() * 35)}px`);
      fragment.appendChild(word);
    }
    swarm.appendChild(fragment);
  }

  makeStarfield();
  makeApologyField();
})();
