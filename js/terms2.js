/**
 * CUDFIRM Terms & Conditions — terms.js
 *
 * ALL content lives here. HTML is just a shell.
 * Three globals for HTML onclick hooks: navigateForward, navigateBack, navigateTo
 * Everything else is scoped inside the IIFE.
 */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════
     PAGE DATA — 10 Terms & Conditions Sections
     Cover (0) + Intro (1) + Sections 02-11 + Back Cover = 13 pages
     ══════════════════════════════════════════════════ */
  var PAGES = [

    /* 0 — COVER */
    {
      id: 'cover', type: 'cover',
      title: 'CUDFIRM GROUP', subtitle: 'Terms &amp; Conditions',
      meta: ['v2.0.1 — 2025', 'Lagos, Nigeria']
    },

    /* 1 — INTRO */
    {
      id: 'a', type: 'intro',
      section: '01', tocLabel: 'Introduction'
    },

    /* 2 — SECTION 01: ABOUT US & AGREEMENT */
    {
      id: 'b', type: 'content',
      section: '02', tocLabel: 'About Us &amp; Agreement',
      heading: 'ABOUT US &amp; AGREEMENT',
      body: [
        'We are <strong>CUDFIRM Inc.</strong>, doing business as CUDFIRM ("we," "us," or "our"), a company registered in Lagos State, Nigeria. We operate the website <strong>cudfirm.netlify.app</strong> and all related services (collectively, the "Services").',
        'You can reach us at:<br><strong>Phone:</strong> +234 905 631 7709 &nbsp;&bull;&nbsp; <strong>Email:</strong> cudfirm@gmail.com<br><strong>Post:</strong> CUDFIRM Inc., 7 CUDFIRM Road, Apapa, Lagos — 110011.',
        'These Terms constitute a legally binding agreement between you and CUDFIRM covering your access to and use of our Website and Services. <strong>By accessing the Services, you confirm you have read, understood, and agreed to be bound by these Terms.</strong>',
        '<strong>If you do not agree with any part of these Terms, stop using the Services immediately.</strong>',
        'We may update these Terms at any time. Changes take effect when posted, identified by an updated "Last Updated" date. It is your responsibility to check periodically. Continued use of the Services means you accept the updated Terms.',
        'Our Services are open to users of all ages who can read and understand these Terms. If age-restricted content is ever introduced, affected users will be notified in advance.'
      ]
    },

    /* 3 — SECTION 02: OUR WEBSITE & SERVICES */
    {
      id: 'c', type: 'content',
      section: '03', tocLabel: 'Our Services',
      heading: 'OUR WEBSITE &amp; SERVICES',
      body: [
        'CUDFIRM is a multifaceted company offering a wide range of products and services locally and internationally, including Logistics, Health, Housing, Food Export, Technology, Wellness, Creative services, and more.',
        'The Services include access to our online platform, service directories, and any tools or features made available through the Website. <strong>GREEN listings</strong> on our platform are CUDFIRM-sponsored. <strong>&#174; listings</strong> are registered with verified physical addresses. Other listed services are independent and not directly vetted or affiliated with CUDFIRM.',
        'Please note: CUDFIRM is not directly affiliated with any listed third-party sites that do not carry our registered trademark. We are not liable for changes to their terms or functionality.',
        'We reserve the right to add, modify, or remove any feature, service, or listing from the platform at any time. Additional features will be introduced progressively and users will be informed accordingly.'
      ]
    },

    /* 4 — SECTION 03: USER REPRESENTATIONS & REGISTRATION */
    {
      id: 'd', type: 'content',
      section: '04', tocLabel: 'User Representations',
      heading: 'USER REPRESENTATIONS &amp; REGISTRATION',
      body: [
        'By using the Services, you confirm and warrant that: (1) all information you provide is true, accurate, and complete; (2) you will keep your information up to date; (3) you have the legal capacity to agree to these Terms; (4) you will not access the Services through bots, scripts, or non-human automated means; (5) you will not use the Services for any illegal or unauthorised purpose; and (6) your use will comply with all applicable laws.',
        'If you provide false or misleading information, we reserve the right to suspend or permanently terminate your account and refuse all future use of the Services.',
        '<strong>Account Registration:</strong> Some features require you to register. You agree to keep your password confidential and accept full responsibility for all activity under your account. We reserve the right to remove or change any username deemed inappropriate, offensive, or objectionable.',
        '<strong>Account Security:</strong> Notify us immediately if you suspect unauthorised access to your account. CUDFIRM is not liable for losses resulting from your failure to safeguard your credentials.'
      ]
    },

    /* 5 — SECTION 04: PROHIBITED ACTIVITIES */
    {
      id: 'e', type: 'content',
      section: '05', tocLabel: 'Prohibited Activities',
      heading: 'PROHIBITED ACTIVITIES',
      body: [
        'You may use the Services only for their intended purpose. Commercial use is permitted only where explicitly approved by CUDFIRM in writing.',
        '<strong>The following are strictly prohibited:</strong><br>&bull; Scraping, harvesting, or collecting data or user information without written permission.<br>&bull; Sending unsolicited messages or creating accounts by automated or false means.<br>&bull; Bypassing, disabling, or interfering with any security feature of the Services.<br>&bull; Framing or deep-linking to the Services without authorisation.',
        '&bull; Impersonating another user, person, or entity.<br>&bull; Uploading or transmitting viruses, malware, spyware, or any harmful code.<br>&bull; Using the Services to harass, abuse, threaten, or harm any person — including CUDFIRM staff.<br>&bull; Reproducing, copying, or adapting the Website design, code, or content without authorisation.',
        '&bull; Reverse-engineering or decompiling any part of the Services.<br>&bull; Using the Services to compete with CUDFIRM or for any commercial purpose beyond the licence granted herein.<br>&bull; Using the Services in any manner that violates applicable Nigerian or international law.',
        'Violations may result in immediate account suspension, permanent banning, and/or legal action including civil and criminal proceedings.'
      ]
    },

    /* 6 — SECTION 05: INTELLECTUAL PROPERTY RIGHTS */
    {
      id: 'f', type: 'content',
      section: '06', tocLabel: 'Intellectual Property',
      heading: 'INTELLECTUAL PROPERTY RIGHTS',
      body: [
        'All content on the Website — including graphics, interfaces, software, text, photographs, logos, trademarks, audio, and video — is owned by CUDFIRM Inc. or its licensors and is protected by Nigerian and international copyright law. These Terms do not transfer any intellectual property rights to you.',
        '<strong>Your Licence:</strong> Subject to compliance with these Terms, we grant you a limited, non-exclusive, non-transferable licence to access and use the Services for your personal or internal business purposes. Where you have purchased a CUDFIRM product or project, your specific licence rights are defined in that purchase agreement.',
        '<strong>Content You Submit:</strong> Any feedback, ideas, or suggestions you share with us ("Feedback") are non-confidential. By submitting Feedback, you grant CUDFIRM a perpetual, irrevocable, royalty-free licence to use it in any way, without obligation to credit or compensate you.',
        'You must not remove, alter, or obscure any copyright, trademark, or proprietary notice from any part of the Website or its content.'
      ]
    },

    /* 7 — SECTION 06: THIRD-PARTY WEBSITES & CONTENT */
    {
      id: 'g', type: 'content',
      section: '07', tocLabel: 'Third-Party Content',
      heading: 'THIRD-PARTY WEBSITES &amp; CONTENT',
      body: [
        'The Services may include links or references to third-party websites and content ("Third-Party Content"). We do not investigate, monitor, or verify the accuracy, reliability, or appropriateness of Third-Party Content. Linking to a third-party site does not imply our endorsement or approval.',
        'If you choose to leave our Services and visit a third-party site, you do so entirely at your own risk. These Terms no longer apply once you leave our platform. We strongly recommend reviewing the terms and privacy policies of any third-party site.',
        'Any transactions made through third-party sites are solely between you and that third party. CUDFIRM accepts no responsibility for such transactions, and you agree to hold us harmless from any resulting loss or harm.',
        'You should review the applicable terms, privacy, and data practices of any website or application you access through links on our platform.'
      ]
    },

    /* 8 — SECTION 07: SERVICES MANAGEMENT & MODIFICATIONS */
    {
      id: 'h', type: 'content',
      section: '08', tocLabel: 'Services Management',
      heading: 'SERVICES MANAGEMENT &amp; MODIFICATIONS',
      body: [
        '<strong>Management:</strong> We reserve the right (but not the obligation) to: (1) monitor the Services for Terms violations; (2) take legal action against violators including reporting them to authorities; (3) restrict, limit, or disable access to any content or account; (4) remove content that is excessive or harmful; and (5) manage the Services in any way needed to protect our rights and ensure proper functioning.',
        '<strong>Modifications:</strong> We may change, update, suspend, or discontinue any part of the Services at any time — to comply with new laws, update our offerings, or if CUDFIRM changes its business model. We will not be liable to you or any third party for such changes.',
        '<strong>Interruptions:</strong> We cannot guarantee that the Services will always be available. Maintenance, hardware/software issues, or unforeseen events may cause downtime. We will endeavour to give advance notice of planned interruptions. CUDFIRM accepts no liability for any loss or inconvenience caused by downtime.',
        '<strong>Corrections:</strong> The Services may occasionally contain typographical errors or inaccuracies. We reserve the right to correct these at any time without prior notice.'
      ]
    },

    /* 9 — SECTION 08: PRIVACY & USER DATA */
    {
      id: 'i', type: 'content',
      section: '09', tocLabel: 'Privacy &amp; Data',
      heading: 'PRIVACY &amp; USER DATA',
      body: [
        'We take data privacy and security seriously. Please read our full <strong>Privacy Notice</strong> to understand how we collect, use, and protect your personal information. By using the Services, you confirm you have reviewed and understood our Privacy Notice.',
        '<strong>Data Location:</strong> The Services are hosted in Nigeria. If you access the Services from outside Nigeria, you acknowledge that your data will be transferred to and processed in Nigeria, subject to Nigerian law.',
        '<strong>Your Data:</strong> We maintain data you transmit to the Services to help manage performance and your user experience. While we perform routine backups, <strong>you are solely responsible for all data you transmit</strong> and for maintaining independent backups of your own data.',
        'CUDFIRM accepts no liability for loss or corruption of your data. By using the Services, you waive any claim against us arising from data loss or corruption.'
      ]
    },

    /* 10 — SECTION 09: DISCLAIMER & LIMITATIONS */
    {
      id: 'j', type: 'content',
      section: '10', tocLabel: 'Disclaimer',
      heading: 'DISCLAIMER &amp; LIMITATIONS',
      body: [
        '<strong>As-Is Basis:</strong> THE SERVICES ARE PROVIDED "AS-IS" AND "AS-AVAILABLE." YOUR USE IS AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, CUDFIRM DISCLAIMS ALL WARRANTIES — EXPRESS OR IMPLIED — INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.',
        '<strong>No Liability:</strong> CUDFIRM WILL NOT BE LIABLE FOR: (1) ERRORS OR INACCURACIES IN CONTENT; (2) PERSONAL INJURY OR PROPERTY DAMAGE FROM USE OF THE SERVICES; (3) UNAUTHORISED ACCESS TO OUR SERVERS OR YOUR PERSONAL/FINANCIAL DATA; (4) SERVICE INTERRUPTIONS OR TRANSMISSION FAILURES; (5) VIRUSES OR MALICIOUS CODE TRANSMITTED THROUGH THE SERVICES BY THIRD PARTIES.',
        '<strong>Third-Party Products:</strong> We do not warrant, endorse, or assume responsibility for any product or service advertised by a third party. Exercise caution and your own judgement in any third-party transaction.',
        '<strong>Force Majeure:</strong> CUDFIRM will not be in breach of these Terms for any delay or failure caused by events beyond our reasonable control — including acts of God, pandemics, war, government actions, infrastructure failures, or civil disorder.'
      ]
    },

    /* 11 — SECTION 10: TERMINATION & GENERAL PROVISIONS */
    {
      id: 'k', type: 'content',
      section: '11', tocLabel: 'Termination &amp; General',
      heading: 'TERMINATION &amp; GENERAL PROVISIONS',
      body: [
        '<strong>Duration & Termination:</strong> These Terms remain in effect for as long as you use the Services. We may deny access, suspend, or terminate your account at any time — without notice — if we reasonably believe you have breached these Terms or any applicable law.',
        '<strong>After Termination:</strong> If your account is terminated, you are prohibited from creating a new account using your own name, a fake name, or a third party\'s name. We reserve the right to pursue civil, criminal, or injunctive legal action.',
        '<strong>Entire Agreement:</strong> These Terms, together with any policies posted on the Services, constitute the entire agreement between you and CUDFIRM. You confirm you have not relied on any prior oral or written statement to enter into this agreement.',
        '<strong>Other Provisions:</strong> Our failure to enforce any right is not a waiver of that right. If any provision is found unenforceable, the remaining Terms stay valid. You and CUDFIRM are independent parties — no partnership, employment, or agency relationship is created. We may assign our rights at any time. Notices from us are deemed received 24 hours after emailing you. Notices to us at <strong>cudfirm@gmail.com</strong> are deemed received 72 hours after sending.'
      ]
    },

    /* 12 — BACK COVER (Contact Us) */
    {
      id: 'backCover', type: 'back',
      section: '12', tocLabel: 'Contact Us',
      quote: 'Questions about these Terms? Reach us at cudfirm@gmail.com or call +234 905 631 7709. CUDFIRM Inc., 7 CUDFIRM Road, Apapa, Lagos — 110011, Nigeria.'
    }
  ];

  var TOTAL = PAGES.length; // 13

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

    /* Update sidebar page count */
    var pgCount = document.getElementById('pgCount');
    if (pgCount) pgCount.textContent = TOTAL;

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

      /* ── Intro page ── */
      } else if (pg.type === 'intro') {
        nbHTML +=
          '<div id="' + pg.id + '" class="page" style="z-index:' + z + '" ' +
          'role="region" aria-label="Page ' + i + ': Introduction">' +
          '<div class="page-inner">' +
          '<p class="page-eyebrow" aria-hidden="true">' + pg.section + ' — Introduction</p>' +
          '<div class="intro-block">' +
          '<p class="intro-label">LAST UPDATED</p>' +
          '<p class="intro-date">January 1, 2025</p>' +
          '<p class="intro-body">These Terms of Use govern your access to and use of CUDFIRM\'s website and services. By using our platform, you agree to be bound by these Terms. Please read them carefully.</p>' +
          '<p class="intro-body">This document contains <strong>10 sections</strong>. Use the sidebar contents or the arrows below to navigate.</p>' +
          '<div class="intro-divider"></div>' +
          '<p class="intro-notice"><strong>CUDFIRM Inc.</strong><br>Lagos, Nigeria<br>cudfirm@gmail.com</p>' +
          '</div>' +
          '</div>' +
          arrowPair() +
          '</div>';

      /* ── Content pages ── */
      } else if (pg.type === 'content') {
        var bodyHTML = pg.body.map(function(t){ return '<p>'+t+'</p>'; }).join('');
        nbHTML +=
          '<div id="' + pg.id + '" class="page" style="z-index:' + z + '" ' +
          'role="region" aria-label="Section ' + pg.section + ': ' + stripTags(pg.heading) + '">' +
          '<div class="page-inner">' +
          '<p class="page-eyebrow" aria-hidden="true">SECTION ' + pg.section + ' — ' + stripTags(pg.heading) + '</p>' +
          '<p class="section-heading">' + pg.heading + '</p>' +
          bodyHTML +
          '</div>' +
          arrowPair() +
          '</div>';

      /* ── Back cover ── */
      } else if (pg.type === 'back') {
        nbHTML +=
          '<div id="' + pg.id + '" class="page back-cover" style="z-index:' + z + '" ' +
          'role="region" aria-label="Closing page — Contact Us">' +
          '<div id="secretPaper" role="button" tabindex="0" ' +
          'aria-label="Reveal contact details" aria-expanded="false">' +
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
     SECRET PAPER (back cover contact reveal)
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
     CLOSE BOOK BUTTON → snap all pages back to cover
     ══════════════════════════════════════════════════ */
  function bindCloseBook() {
    ['closeBookBtn', 'mobHomeBtn'].forEach(function (id) {
      var btn = el(id);
      if (btn) btn.addEventListener('click', function () { navigateTo(0); });
    });
  }

  /* ══════════════════════════════════════════════════
     MOBILE SIDEBAR
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