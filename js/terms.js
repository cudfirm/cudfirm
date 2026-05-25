/**
 * CUDFIRM Terms & Conditions — notebook.js
 *
 * ALL content lives here. HTML is just a shell.
 * Three globals for HTML onclick hooks: navigateForward, navigateBack, navigateTo
 * Everything else is scoped inside the IIFE.
 */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════
     PAGE DATA — edit content / placeholder labels here
     ══════════════════════════════════════════════════ */
  var PAGES = [
    {
      id: 'cover', type: 'cover',
      title: 'CUDFIRM GROUP', subtitle: 'Terms &amp; Conditions',
      meta: ['v2.0 — 2025', 'Lagos, Nigeria']
    },
    {
      id: 'a', type: 'intro',
      section: '01', tocLabel: 'Introduction'
    },
    {
      id: 'b', type: 'content',
      section: '02', tocLabel: 'Website &amp; Services',
      heading: 'WEBSITE &amp; SERVICES',
      placeholder: 'Services Visual',
      body: [
        'We are CUDFIRM Inc., doing business as CUDFIRM (“CUDFIRM ,” “we,” “us,” or “our”), a company registered in Lagos State, Nigeria. We operate the website <strong>http://cudfirm.ga</strong> (the “Website”) through which we provide you our services, (collectively, the “Services” which include the provision and use of the Website).',

'You can contact us by phone at (+234) 9056-3177-09, by email at cudfirm@yahoo.com, or by post to CUDFIRM Inc., 7 CUDFIRM ROAD, APAPA, LAGOS - 110011.',

 'These Terms of Use constitute a legally binding agreement made between you, whether personally or on behalf of an entity (“you”) and concerning your access to and use of the Website and the Services. You agree that by accessing the Services, you have read, understood, and agree to be bound by all of these Terms of Use. IF YOU DO NOT AGREE WITH ALL OF THESE TERMS OF USE, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.',

 'Supplemental terms and conditions or documents that may be posted on the Website from time to time are hereby expressly incorporated herein by reference. We reserve the right, in Cudfirm sole discretion, to make changes or modifications to these Terms of Use from time to time. We will alert you about any changes by updating the “Last updated” date of these Terms of Use, and you waive any right to receive specific notice of each such change. It is your responsibility to periodically review these Terms of Use to stay informed as each time you access the Services, you will be subject to, and will be deemed to have been made aware of and to have accepted, the then applicable Terms of Use.',

'The Services are intended for users of all ages. In as much as the user can read and understand the terms of use and keep to it standards. If this is changed by means of introducing content, not usable by such user, they will be notified.',

        'Contact us by phone at <strong>(+234) 9056-3177-09</strong>, by email at <strong>cudfirm@yahoo.com</strong>, or by post to CUDFIRM Inc., 7 CUDFIRM Road, Apapa, Lagos — 110011.',

        'These Terms of Use constitute a legally binding agreement between you and CUDFIRM concerning your access to and use of the Website and Services. <strong>By accessing the Services, you confirm you have read, understood, and agree to be bound by all of these Terms.</strong> IF YOU DO NOT AGREE, DISCONTINUE USE IMMEDIATELY.',

        'We reserve the right to modify these Terms at any time. We will alert you by updating the "Last Updated" date. It is your responsibility to review these Terms periodically.',

        'The Services are intended for users of all ages who can read and understand these Terms. Users will be notified of any age-appropriate content changes.'
      ]
    },
    {
      id: 'c', type: 'content',
      section: '03', tocLabel: 'The Flash',
      heading: 'The Flash',
      placeholder: 'The Flash Poster',
      body: [
        'Barry Allen is a Central City police forensic scientist whose life is upended by a mysterious lightning strike that killed his mother and framed his father. A particle accelerator accident leaves him comatose for nine months.',

        'Emerging with superhuman speed, Barry learns he is one of many affected — most using their powers for evil. Determined to make a difference, he dedicates his life to fighting such threats as <em>The Flash</em>.'
      ]
    },
    {
      id: 'd', type: 'content',
      section: '04', tocLabel: 'Arrow',
      heading: 'Arrow',
      placeholder: 'Arrow Poster',
      body: [
        'Oliver Queen and his father are lost at sea when their luxury yacht sinks. His father dies, but Oliver survives five years on an uncharted island — learning to fight, to survive, and uncovering his father\'s corruption.',
        'He returns changed: hooded, bow in hand, hunting down those who have corrupted his city.'
      ]
    },
    {
      id: 'e', type: 'content',
      section: '05', tocLabel: 'Legends of Tomorrow',
      heading: 'Legends of Tomorrow',
      placeholder: 'Legends Poster',
      body: [
        'When heroes alone are not enough, the world needs legends. Rip Hunter time-travels to assemble a desperate team of heroes and villains to confront an immortal threat.',
        'Not only is the planet at stake — but the timeline itself. Can this ragtag group defeat a threat unlike anything they have ever known?'
      ]
    },
    {
      id: 'f', type: 'content',
      section: '06', tocLabel: 'Cloak &amp; Dagger',
      heading: 'Cloak &amp; Dagger',
      placeholder: 'Cloak &amp; Dagger Poster',
      body: [
        'Tandy Bowen and Tyrone Johnson — two teenagers from different backgrounds — acquire superpowers while forming a romantic relationship.',
        'Their abilities work best in tandem, but their deepening feelings make their already complicated world even more challenging.'
      ]
    },
    {
      id: 'g', type: 'content',
      section: '07', tocLabel: 'Agents of S.H.I.E.L.D',
      heading: 'Agents of S.H.I.E.L.D',
      placeholder: 'Agents Poster',
      body: [
        'After the Battle of New York, Phil Coulson assembles an elite covert team within the Strategic Homeland Intervention, Enforcement and Logistics Division.',
        'As the world grows rapidly more dangerous and supervillains rise, these agents are ready to protect it.'
      ]
    },
    {
      id: 'h', type: 'content',
      section: '08', tocLabel: 'Van Helsing',
      heading: 'Van Helsing',
      placeholder: 'Van Helsing Poster',
      body: [
        'Vanessa Helsing — daughter of legendary vampire hunter Abraham Van Helsing — is resurrected five years in the future to find vampires have seized the world.',
        'Possessing a unique power over them, she is humanity\'s last hope to reclaim what has been lost.'
      ]
    },
    {
      id: 'i', type: 'content',
      section: '09', tocLabel: 'The Walking Dead',
      heading: 'The Walking Dead',
      placeholder: 'Walking Dead Poster',
      body: [
        'Sheriff Deputy Rick Grimes wakes from a coma into a zombie apocalypse. He sets out to find his family and becomes leader of a survivor group.',
        'This show is about survival, its risks, and the brutal cost of enduring.'
      ]
    },
    {
      id: 'j', type: 'content',
      section: '10', tocLabel: 'Doctor Who',
      heading: 'Doctor Who',
      placeholder: 'Doctor Who Poster',
      body: [
        'The Doctor — a Time Lord from Gallifrey — travels through time and space in the T.A.R.D.I.S. (Time and Relative Dimension In Space) with numerous companions.',
        'The Doctor periodically regenerates into a new form, a device that has kept the series running since William Hartnell\'s departure in 1966.'
      ]
    },
    {
      id: 'backCover', type: 'back',
      section: '12', tocLabel: 'Closing',
      quote: 'Life moves so fast, and we\'re so distracted, that sometimes we just need to slow down, feel, think — and just be.'
    }
  ];

  var TOTAL = PAGES.length; // 12

  /* ══════════════════════════════════════════════════
     Z-INDEX HELPERS
     ══════════════════════════════════════════════════ */
  var unturnedZ = function (i) { return (TOTAL - 1) - i; };
  var turnedZ   = function (i) { return TOTAL + i; };

  /* ══════════════════════════════════════════════════
     BUILD HTML
     ══════════════════════════════════════════════════ */
  function buildPages() {
    var nb  = document.getElementById('notebook');
    var toc = document.getElementById('tocList');
    if (!nb || !toc) return;

    var nbHTML  = '';
    var tocHTML = '';

    PAGES.forEach(function (pg, i) {
      var z = unturnedZ(i);

      /* ── TOC item ── */
      var num = pg.section ? pg.section : '00';
      tocHTML +=
        '<li role="listitem">' +
        '<button class="toc-btn' + (i === 0 ? ' active' : '') + '" ' +
        'data-index="' + i + '" ' +
        'aria-current="' + (i === 0 ? 'page' : 'false') + '" ' +
        'aria-label="Go to section: ' + (pg.tocLabel || 'Cover') + '">' +
        '<span class="toc-num" aria-hidden="true">' + num + '</span>' +
        '<span>' + (pg.tocLabel || 'Cover') + '</span>' +
        '</button></li>';

      /* ── Cover ── */
      if (pg.type === 'cover') {
        nbHTML +=
          '<div id="' + pg.id + '" class="page cover-page" style="z-index:' + z + '" ' +
          'role="region" aria-label="Cover page">' +
          '<div class="cover-inner">' +
          '<div class="cover-content">' +
          '<p class="cover-eye" aria-hidden="true">// OFFICIAL DOCUMENT</p>' +
          '<h1 class="cover-title">' + pg.title + '<span>' + pg.subtitle + '</span></h1>' +
          '<div class="cover-meta">' +
            pg.meta.map(function(m){ return '<span>'+m+'</span>'; }).join('') +
          '</div>' +
          '<p class="cover-cta" aria-hidden="true">Open to read &rarr;</p>' +
          '</div>' +
          '<div class="cover-spine" aria-hidden="true"></div>' +
          '</div>' +
          '<button class="pg-arrow arr-r" onclick="navigateForward()" aria-label="Open document">' +
          '<i class="fa fa-arrow-circle-right" aria-hidden="true"></i></button>' +
          '</div>';

      /* ── Intro ── */
      } else if (pg.type === 'intro') {
        nbHTML +=
          '<div id="' + pg.id + '" class="page" style="z-index:' + z + '" ' +
          'role="region" aria-label="Page ' + i + ': Introduction">' +
          '<div class="page-inner">' +
          '<p class="page-eyebrow" aria-hidden="true">' + pg.section + ' — Introduction</p>' +
          '<div class="prop-of">Property of HiCUD</div>' +
          '</div>' +
          arrowPair() +
          '</div>';

      /* ── Content pages ── */
      } else if (pg.type === 'content') {
        var bodyHTML = pg.body.map(function(t){ return '<p>'+t+'</p>'; }).join('');
        nbHTML +=
          '<div id="' + pg.id + '" class="page" style="z-index:' + z + '" ' +
          'role="region" aria-label="Page ' + i + ': ' + stripTags(pg.heading) + '">' +
          '<div class="page-inner">' +
          '<p class="page-eyebrow" aria-hidden="true">' + pg.section + ' — ' + stripTags(pg.heading) + '</p>' +
          '<div class="img-ph" contenteditable="true" ' +
            'aria-label="Image placeholder — replace with your image. Current label: ' + stripTags(pg.placeholder) + '" ' +
            'title="Click to edit placeholder label">' +
            pg.placeholder +
          '</div>' +
          '<p class="movie-title">' + pg.heading + '</p>' +
          bodyHTML +
          '</div>' +
          arrowPair() +
          '</div>';

      /* ── Back cover ── */
      } else if (pg.type === 'back') {
        nbHTML +=
          '<div id="' + pg.id + '" class="page back-cover" style="z-index:' + z + '" ' +
          'role="region" aria-label="Closing page">' +
          '<div id="secretPaper" role="button" tabindex="0" ' +
          'aria-label="Reveal or hide closing message" aria-expanded="false">' +
          '<q>' + pg.quote + '</q>' +
          '</div>' +
          '<div id="hideout" aria-hidden="true"></div>' +
          '<button class="pg-arrow arr-l" id="lastArrow" onclick="navigateBack()" aria-label="Previous page">' +
          '<i class="fa fa-arrow-circle-left" aria-hidden="true"></i></button>' +
          '</div>';
      }
    });

    nb.innerHTML  = nbHTML;
    toc.innerHTML = tocHTML;

    /* Wire up TOC clicks after injection */
    toc.querySelectorAll('.toc-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        navigateTo(parseInt(btn.dataset.index, 10));
        closeSidebar();
      });
      btn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
      });
    });

    /* Wire secret paper */
    var sp = document.getElementById('secretPaper');
    if (sp) {
      sp.addEventListener('click', secretPage);
      sp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); secretPage(); }
      });
    }
  }

  /* Reusable back + forward arrow pair HTML */
  function arrowPair() {
    return (
      '<button class="pg-arrow arr-l" onclick="navigateBack()" aria-label="Previous page">' +
      '<i class="fa fa-arrow-circle-left" aria-hidden="true"></i></button>' +
      '<button class="pg-arrow arr-r" onclick="navigateForward()" aria-label="Next page">' +
      '<i class="fa fa-arrow-circle-right" aria-hidden="true"></i></button>'
    );
  }

  /* Strip HTML tags for aria labels */
  function stripTags(s) { return s ? s.replace(/<[^>]*>/g, '') : ''; }

  /* ══════════════════════════════════════════════════
     NAVIGATION ENGINE
     ══════════════════════════════════════════════════ */
  var current     = 0;
  var isAnimating = false;

  function el(id) { return document.getElementById(id); }

  function flipForward(i) {
    var node = el(PAGES[i].id);
    if (!node) return;
    node.style.transform = 'rotateY(-90deg)';
    node.style.color     = 'transparent';
    setTimeout(function () { node.style.zIndex = turnedZ(i); }, 440);
  }

  function flipBack(i) {
    var node = el(PAGES[i].id);
    if (!node) return;
    node.style.zIndex    = turnedZ(i);
    node.style.transform = 'rotateY(0deg)';
    node.style.color     = '';
    setTimeout(function () { node.style.zIndex = unturnedZ(i); }, 440);
  }

  /* Core: jump to any page index */
  function navigateTo(target) {
    if (isAnimating)                       return;
    if (target === current)                return;
    if (target < 0 || target >= TOTAL)     return;

    isAnimating = true;
    var steps     = Math.abs(target - current);
    var stagger   = steps > 1 ? Math.min(55, 110 / steps) : 0;

    if (target > current) {
      for (var i = current; i < target; i++) {
        (function (idx, d) { setTimeout(function () { flipForward(idx); }, d); }(i, (i - current) * stagger));
      }
    } else {
      for (var i = current - 1; i >= target; i--) {
        (function (idx, d) { setTimeout(function () { flipBack(idx); }, d); }(i, (current - 1 - i) * stagger));
      }
    }

    current = target;
    syncUI();
    setTimeout(function () { isAnimating = false; }, 940 + (steps - 1) * stagger);
  }

  /* Public wrappers (called by HTML onclick) */
  window.navigateForward = function () { navigateTo(current + 1); };
  window.navigateBack    = function () { navigateTo(current - 1); };
  window.navigateTo      = navigateTo;

  /* ══════════════════════════════════════════════════
     SYNC UI AFTER NAVIGATION
     ══════════════════════════════════════════════════ */
  function syncUI() {
    /* Counter */
    var ctr = el('pgCounter');
    if (ctr) ctr.textContent = pad(current + 1) + ' / ' + pad(TOTAL);

    /* TOC active state */
    document.querySelectorAll('.toc-btn').forEach(function (btn) {
      var active = parseInt(btn.dataset.index, 10) === current;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-current', active ? 'page' : 'false');
    });

    /* Show/hide Close Book button — only visible after cover is turned */
    var cbBtn = el('closeBookBtn');
    if (cbBtn) cbBtn.style.visibility = current > 0 ? 'visible' : 'hidden';
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  /* ══════════════════════════════════════════════════
     SECRET PAPER
     ══════════════════════════════════════════════════ */
  var secretVisible = false;
  function secretPage() {
    var sp  = el('secretPaper');
    var la  = el('lastArrow');
    if (!sp) return;
    if (!secretVisible) {
      sp.style.top = '-110%'; sp.style.transform = 'rotate(0deg)';
      sp.setAttribute('aria-expanded', 'true');
      if (la) la.style.display = 'none';
      setTimeout(function () { sp.style.top = '25%'; sp.style.zIndex = '5'; secretVisible = true; }, 1300);
    } else {
      sp.style.top = '-110%'; sp.style.transform = 'rotate(11deg)';
      sp.setAttribute('aria-expanded', 'false');
      setTimeout(function () { sp.style.top = '30%'; sp.style.zIndex = '-1'; if (la) la.style.display = ''; secretVisible = false; }, 1300);
    }
  }

  /* ══════════════════════════════════════════════════
     CLOSE BOOK BUTTON  → snap all pages back to cover
     ══════════════════════════════════════════════════ */
  function bindCloseBook() {
    ['closeBookBtn', 'mobHomeBtn'].forEach(function (id) {
      var btn = el(id);
      if (btn) btn.addEventListener('click', function () { navigateTo(0); });
    });
  }

  /* ══════════════════════════════════════════════════
     MOBILE SIDEBAR
     Accessible: aria-expanded, focus management, Escape
     ══════════════════════════════════════════════════ */
  function openSidebar() {
    var sb  = el('sidebar');
    var ov  = el('overlay');
    var ham = el('hamBtn');
    if (!sb) return;
    sb.classList.add('open');
    ov.classList.add('active');
    ov.setAttribute('aria-hidden', 'false');
    ham.setAttribute('aria-expanded', 'true');
    ham.setAttribute('aria-label', 'Close navigation menu');
    var first = sb.querySelector('.toc-btn');
    if (first) first.focus();
  }

  function closeSidebar() {
    var sb  = el('sidebar');
    var ov  = el('overlay');
    var ham = el('hamBtn');
    if (!sb || !sb.classList.contains('open')) return;
    sb.classList.remove('open');
    ov.classList.remove('active');
    ov.setAttribute('aria-hidden', 'true');
    if (ham) {
      ham.setAttribute('aria-expanded', 'false');
      ham.setAttribute('aria-label', 'Open navigation menu');
      ham.focus();
    }
  }

  function bindSidebar() {
    var ham = el('hamBtn');
    var ov  = el('overlay');
    var toc = el('mobTocBtn');
    if (ham) ham.addEventListener('click', function () {
      el('sidebar').classList.contains('open') ? closeSidebar() : openSidebar();
    });
    if (ov) ov.addEventListener('click', closeSidebar);
    if (toc) toc.addEventListener('click', openSidebar);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSidebar(); });
  }

  /* ══════════════════════════════════════════════════
     KEYBOARD NAVIGATION (← → on book, when sidebar closed)
     ══════════════════════════════════════════════════ */
  function bindKeyboard() {
    document.addEventListener('keydown', function (e) {
      var sb = el('sidebar');
      if (sb && sb.classList.contains('open')) return;
      if (sb && sb.contains(document.activeElement)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); window.navigateForward(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); window.navigateBack(); }
    });
  }

  /* ══════════════════════════════════════════════════
     INIT
     ══════════════════════════════════════════════════ */
  buildPages();
  syncUI();
  bindCloseBook();
  bindSidebar();
  bindKeyboard();

}());
