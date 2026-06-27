/**
 * ================================================
 *  CUDFIRM GROUP — MASTER SCRIPT
 *  Professional Website Studio · Lagos, Nigeria
 *  "Build a Professional Website for Your Business"
 * ================================================
 */

// =============================================
// GLOBAL STATE
// =============================================
let originalSectionsInOrder = [];
let activeTabIdBeforeSearch = null;

const ALL_TAB_IDS = [
  'tab1','tab2','tab3','tab4','tab5','tab9','tab13','tab17','tab20',
  'explore-content','connect-content'
];
let currentTabIndex = 2;

const TAB_NAMES = {
  'tab1':'Home','tab2':'Who We Help','tab3':'Services','tab4':'Portfolio',
  'tab5':'Our Process','tab9':'Testimonials','tab13':'FAQ',
  'tab17':'Why CUDFIRM','tab20':'About Us',
  'explore-content':'Portfolio','connect-content':'Get A Quote'
};

let breadcrumbHistory = [];

// =============================================
// SIDEBAR TABS DATA
// =============================================
const SIDEBAR_TABS = [
  { id: 'tab1',            label: 'Home' },
  { id: 'tab3',            label: 'Services' },
  { id: 'tab4',            label: 'Portfolio' },
  { id: 'tab2',            label: 'Who We Help' },
  { id: 'tab5',            label: 'Our Process' },
  { id: 'tab17',           label: 'Why CUDFIRM' },
  { id: 'tab9',            label: 'Testimonials' },
  { id: 'tab13',           label: 'FAQ' },
  { id: 'tab20',           label: 'About Us' },
  { id: 'connect-content', label: 'Get A Quote', badge: 'hot' },
];

// =============================================
// FOOTER NAV DATA
// =============================================
const FOOTER_NAV = [
  { id: 'tab1',            icon: 'bi-house-fill',    label: 'Home' },
  { id: 'tab3',            icon: 'bi-briefcase',     label: 'Services' },
  { id: 'tab4',            icon: 'bi-laptop',        label: 'Portfolio' },
  { id: 'tab20',           icon: 'bi-info-circle',   label: 'About' },
  { id: 'connect-content', icon: 'bi-chat-dots',     label: 'Contact' },
];

// =============================================
// 1. RENDER SIDEBAR TABS
// =============================================
function renderSidebarTabs() {
  const container = document.getElementById('sidebarTabsContainer');
  if (!container) return;
  container.innerHTML = SIDEBAR_TABS.map(t => {
    let badge = '';
    if (t.badge === 'hot') badge = '<span class="tab-badge badge-hot ms-1">🔥 HOT</span>';
    if (t.badge === 'new') badge = '<span class="tab-badge badge-new ms-1">NEW</span>';
    return `<button class="tab-button whitenho" onclick="openTab(event,'${t.id}')" data-tab-name="${t.label.toLowerCase()}">${t.label}${badge}</button>`;
  }).join('');
}

// =========================================
// 2. RENDER FOOTER NAV
// =========================================
function renderFooterNav() {
  const nav = document.getElementById('footerNav');
  if (!nav) return;
  nav.innerHTML = FOOTER_NAV.map((item, i) =>
    `<div class="nav-item" onclick="openTab(event,'${item.id}')" data-index="${i}">
      <i class="bi ${item.icon}"></i>
      <span class="nav-label">${item.label}</span>
    </div>`
  ).join('');
}

// =============================================
// 2.5. RENDER MOBILE TAB STRIP
// =============================================
function renderMobileTabStrip() {
  const contentArea = document.querySelector('.content-area');
  const contentHeader = document.querySelector('.content-header');
  if (!contentArea || !contentHeader) return;

  const strip = document.createElement('div');
  strip.className = 'mobile-tab-strip';
  strip.id = 'mobileTabStrip';
  strip.setAttribute('role', 'tablist');
  strip.setAttribute('aria-label', 'Navigation tabs');

  strip.innerHTML = SIDEBAR_TABS.map(t => {
    let badge = '';
    if (t.badge === 'hot') badge = ' 🔥';
    if (t.badge === 'new') badge = ' <span style="font-size:0.6rem;background:var(--n-jade);color:#fff;border-radius:6px;padding:0.05em 0.35em;vertical-align:middle;">NEW</span>';
    return `<button class="mobile-tab-chip" onclick="openTab(event,'${t.id}')" data-tab-id="${t.id}" role="tab">${t.label}${badge}</button>`;
  }).join('');

  contentHeader.insertAdjacentElement('afterend', strip);
}

function updateMobileTabStrip(activeTabId) {
  document.querySelectorAll('.mobile-tab-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.tabId === activeTabId);
    if (chip.dataset.tabId === activeTabId) {
      chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  });
}

function buildAllSections() {
  const main = document.getElementById('contentMain');
  if (!main) return;

  const sections = [
    buildTab1(),
    buildTab2(),
    buildTab3(),
    buildTab4(),
    buildTab5(),
    buildTab9(),
    buildTab13(),
    buildTab17(),
    buildTab20(),
    buildExploreContent(),
    buildConnectContent(),
  ];

  main.innerHTML = sections.join('');
}

// ─────────────────────────────────────────────
// TAB 1: HOME (Updated for clarity & conversion)
// ─────────────────────────────────────────────
function buildTab1() {
  const portfolio = [
    { img: 'https://placehold.co/200x250/1A6B4A/fff?text=CUDFIRM', link: 'https://cudfirm.netlify.app', name: 'CUDFIRM Group', alt: 'CUDFIRM' },
    { img: 'https://placehold.co/200x250/0B3D2E/C8922A?text=BARBER', link: '#', name: 'Barber Shop', alt: 'Barber' },
    { img: 'https://placehold.co/200x250/C8922A/fff?text=FASHION', link: '#', name: 'Fashion Designer', alt: 'Fashion' },
    { img: 'https://placehold.co/200x250/1A6B4A/fff?text=FOOD', link: '#', name: 'Food Vendor', alt: 'Food Vendor' },
    { img: 'https://placehold.co/200x250/4D9E7A/fff?text=COACH', link: '#', name: 'Life Coach', alt: 'Coach' },
    { img: 'https://placehold.co/200x250/E8B84B/0B3D2E?text=PHOTO', link: '#', name: 'Photographer', alt: 'Photographer' },
    { img: 'https://placehold.co/200x250/3A4035/fff?text=REST', link: '#', name: 'Restaurant', alt: 'Restaurant' },
    { img: 'https://placehold.co/200x250/191970/fff?text=+', link: 'connect-content', name: 'Your Business?', alt: 'Get Started' },
  ];

  const services = [
    { img: 'https://placehold.co/200x250/0B3D2E/C8922A?text=LANDING', link: '#', name: 'Landing Page', alt: 'Landing Page' },
    { img: 'https://placehold.co/200x250/1A6B4A/fff?text=BUSINESS', link: '#', name: 'Business Website', alt: 'Business Website' },
    { img: 'https://placehold.co/200x250/C8922A/fff?text=MAINTAIN', link: '#', name: 'Maintenance', alt: 'Maintenance' },
    { img: 'https://placehold.co/200x250/4D9E7A/fff?text=DOMAIN', link: '#', name: 'Domain & Hosting', alt: 'Hosting' },
    { img: 'https://placehold.co/200x250/E8B84B/0B3D2E?text=SEO', link: '#', name: 'SEO Setup', alt: 'SEO' },
    { img: 'https://placehold.co/200x250/0B3D2E/C8922A?text=BRAND', link: '#', name: 'Brand Identity', alt: 'Branding' },
    { img: 'https://placehold.co/200x250/1A6B4A/fff?text=CONTENT', link: '#', name: 'Content Writing', alt: 'Content' },
    { img: 'https://placehold.co/200x250/3A4035/fff?text=MORE', link: 'tab3', name: 'View All', alt: 'More Services' },
  ];

  const gridItems = (items) => items.map(p => {
    const safeImg = p.img.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const safeName = p.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const safeLink = p.link.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    return `<div class="col grid-item" data-img="${safeImg}" data-name="${safeName}" data-link="${safeLink}">
      <img src="${p.img}" alt="${p.alt}" class="img-fluid" loading="lazy" onerror="this.src='https://placehold.co/600x800/0B3D2E/C8922A?text=CUDFIRM'" />
      <span class="text">${p.name}</span>
    </div>`;
  }).join('');

  return `
  <section id="tab1" class="tab-content view">
    <div class="home-hero">
      <span class="hero-eyebrow">Lagos-Based Web Studio</span>
      <h1 class="hero-title">Professional Websites That Grow Your Business</h1>
      <p class="hero-sub">We design fast, modern, and mobile-friendly websites for businesses, professionals, and growing brands. Ready to get online? Let's talk.</p>
      <div class="hero-cta-row">
        <button class="btn-hero-primary" onclick="openTab(event,'tab4')">View Our Portfolio</button>
        <button class="btn-hero-secondary" onclick="openTab(event,'connect-content')">Get a Free Consultation</button>
      </div>
    </div>

    <div class="p-3">
      <h6 class="sticky-top d-flex align-items-center gap-2 py-2">
        <span class="badge text-bg-primary">CUDFIRM</span>
        <span style="font-size:0.72rem;color:var(--n-muted);font-weight:400;">Professional Websites for Nigerian Businesses</span>
      </h6>
      <hr class="my-2 w-25" />

      <!-- Why CUDFIRM (Trust Signals) -->
      <div class="card card-section mb-3">
        <div class="card-header">
          <h3><i class="bi bi-patch-check me-1" style="color:var(--n-gold)"></i>Why Choose CUDFIRM</h3>
        </div>
        <div class="card-content">
          <div class="row g-3 text-center">
            ${[
              { icon:'bi-phone', label:'Mobile-First', sub:'Every site looks great on any device' },
              { icon:'bi-lightning-charge', label:'Fast Delivery', sub:'Sites delivered in 3–7 business days' },
              { icon:'bi-cash-coin', label:'Affordable', sub:'Starting from ₦50,000 — no hidden fees' },
              { icon:'bi-geo-alt', label:'Lagos-Based', sub:'Local support you can actually reach' },
            ].map(w => `
              <div class="col-6 col-md-3">
                <div class="card p-3">
                  <i class="bi ${w.icon}" style="font-size:1.5rem;color:var(--n-gold);margin-bottom:0.5rem;display:block;"></i>
                  <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:0.82rem;">${w.label}</div>
                  <div style="font-size:0.7rem;color:var(--n-muted);margin-top:0.2rem;">${w.sub}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <!-- Portfolio Highlights -->
      <div class="card card-section mb-3">
        <div class="card-header">
          <h3><i class="bi bi-laptop me-1" style="color:var(--n-gold)"></i>Recent Work</h3>
          <button class="btn btn-sm btn-success see-all" onclick="openTab(event,'tab4')">View All</button>
        </div>
        <div class="card-content row icon-grid row-cols-3 row-cols-sm-4 row-cols-md-5 row-cols-lg-7 row-cols-xl-9 quote0">
          ${gridItems(portfolio)}
        </div>
      </div>

      <!-- Services -->
      <div class="card card-section mb-3">
        <div class="card-header">
          <h3><i class="bi bi-briefcase me-1" style="color:var(--n-gold)"></i>What We Build</h3>
          <button class="btn btn-sm btn-primary see-all" onclick="openTab(event,'tab3')">View All</button>
        </div>
        <div class="card-content row icon-grid row-cols-3 row-cols-sm-4 row-cols-md-5 row-cols-lg-7 row-cols-xl-9 quote0">
          ${gridItems(services)}
        </div>
      </div>
    </div>

    <hr class="my-2" />
    <footer class="footin">
      <div class="icons-social">
        <article class="list-social">
          <span class="icons-social__item"><a class="icons-social__link" href="https://codepen.io/cudfirm-group" aria-label="CodePen"><i class="fab fa-codepen"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://instagram.com/cudfirm" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://fb.me/cudfirm" aria-label="Facebook"><i class="fab fa-facebook"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://x.com/cudfirm" aria-label="Twitter/X"><i class="fab fa-twitter"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://linkedin.com/in/cudfirm" aria-label="LinkedIn"><i class="fab fa-linkedin"></i></a></span>
        </article>
      </div>
    </footer>
  </section>`;
}

// ─────────────────────────────────────────────
// TAB 2: SECTORS (who we build for)
// ─────────────────────────────────────────────
function buildTab2() {
  const sectors = [
    { icon: 'bi-scissors',          name: 'Barbers & Salons',       desc: 'Look-book sites, booking info, gallery, and WhatsApp button.' },
    { icon: 'bi-camera',            name: 'Photographers',           desc: 'Portfolio galleries, pricing packages, and contact forms.' },
    { icon: 'bi-bag-heart',         name: 'Fashion Designers',       desc: 'Lookbooks, collection pages, custom orders, and social links.' },
    { icon: 'bi-cup-hot',           name: 'Food Vendors & Caterers', desc: 'Menu pages, delivery info, Instagram integration, and orders.' },
    { icon: 'bi-person-video3',     name: 'Coaches & Consultants',   desc: 'Service pages, testimonials, booking forms, and credibility.' },
    { icon: 'bi-mortarboard',       name: 'Tutors & Teachers',       desc: 'Course listings, class schedules, student testimonials.' },
    { icon: 'bi-shop',              name: 'Small Businesses',        desc: 'Full business sites with about, services, gallery, and contact.' },
    { icon: 'bi-house-door',        name: 'Real Estate & Agents',    desc: 'Property listings, location maps, and inquiry forms.' },
    { icon: 'bi-heart-pulse',       name: 'Wellness & Health',       desc: 'Service menus, appointment booking, and professional profiles.' },
    { icon: 'bi-truck',             name: 'Logistics & Delivery',    desc: 'Service areas, pricing, tracking info, and WhatsApp contact.' },
    { icon: 'bi-lightning-charge',  name: 'Solar & Energy',          desc: 'Solution pages, project showcase, and quote request forms.' },
    { icon: 'bi-briefcase',         name: 'Any Business in Nigeria', desc: 'If you serve customers, you need a website. We build it.' },
  ];

  return `
  <section id="tab2" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Who We Build For</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      Any small business or service provider that needs an online presence. If you have customers, you need a website — and CUDFIRM builds it affordably.
    </p>
    <div class="row g-3 stagger-children">
      ${sectors.map(s => `
        <div class="col-12 col-sm-6 col-lg-4">
          <div class="card p-3 h-100">
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.6rem;">
              <div style="width:40px;height:40px;border-radius:10px;background:var(--n-jade);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;"><i class="bi ${s.icon}"></i></div>
              <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:0.88rem;color:var(--n-forest);">${s.name}</div>
            </div>
            <p style="font-size:0.78rem;color:var(--n-muted);margin:0;">${s.desc}</p>
          </div>
        </div>`).join('')}
    </div>
    <button class="view-more-btn mt-3" onclick="openTab(event,'connect-content')">
      <i class="bi bi-whatsapp me-1"></i>Tell Us About Your Business
    </button>
  </section>`;
}

// ─────────────────────────────────────────────
// TAB 3: SERVICES (Updated with clear pricing & value)
// ─────────────────────────────────────────────
function buildTab3() {
  const items = [
    { icon:'Starter Landing Page',    desc:'A single, focused page for your business — Home, About, Services, Gallery, Contact, and WhatsApp button. Perfect for getting online fast.',  tags:['#Landing','#Starter','#₦50K'], search:'landing page starter single one page fast cheap affordable barber stylist photographer coach', price:'₦50,000' },
    { icon:'Business Website',        desc:'A full multi-page website for your business. Includes up to 6 pages, mobile-friendly design, SEO setup, and 30-day free support.',             tags:['#Full-Site','#Multi-Page','#₦100K'], search:'full business website multi page complete professional sme restaurant', price:'₦100,000' },
    { icon:'Website Maintenance',     desc:'Monthly updates, text changes, image swaps, speed checks, and backup. Keep your site fresh without lifting a finger.',                       tags:['#Monthly','#Support','#₦10K–20K'], search:'maintenance update support monthly changes fix bug backup', price:'₦10K–20K/mo' },
    { icon:'Domain & Hosting Setup',  desc:'Register your .com.ng or .com domain and set up reliable Nigerian hosting — fast, local, affordable.',                                       tags:['#Domain','#Hosting','#Setup'], search:'domain hosting setup register .com .com.ng website address', price:'From ₦15,000' },
    { icon:'SEO Starter Pack',        desc:'Meta tags, Google Search Console setup, site speed optimisation, and local SEO — so customers can actually find you on Google.',            tags:['#SEO','#Google','#Visibility'], search:'seo google search console meta tags visibility local search rank', price:'₦20,000' },
    { icon:'Brand Identity',          desc:'Logo design, colour palette, fonts, and a simple brand guide — everything you need to look professional across all platforms.',             tags:['#Branding','#Logo','#Design'], search:'logo branding identity design colour palette font guide professional', price:'From ₦25,000' },
    { icon:'WhatsApp Business Setup', desc:'Set up a professional WhatsApp Business profile with auto-replies, catalogue, and a direct click-to-chat link for your site.',              tags:['#WhatsApp','#Business','#Free'], search:'whatsapp business setup profile auto reply catalogue chat link', price:'₦5,000' },
    { icon:'Social Media Integration',desc:'Connect your Instagram, Facebook, or TikTok feed to your website — so your site always looks active and up to date.',                       tags:['#Social','#Instagram','#Feed'], search:'social media instagram facebook tiktok feed integration connect', price:'₦8,000' },
    { icon:'Got A Special Request?',  desc:'Have a unique need? Tell us what you want to build — we\'ll review it and come back with a fair price and timeline.',                      tags:['#Custom','#Request'], search:'custom special request unique bespoke build quote', isSpecial: true, price:'Let\'s Talk' },
  ];

  const listItems = items.map(item => `
    <div class="list-item" data-search-text="${item.search || ''}">
      <div class="item-icon">${item.icon}</div>
      <div class="item-content d-flex justify-content-between align-items-center gap-2">
        <div>
          <h6 style="margin:0 0 0.2rem;">${item.desc}</h6>
          <span style="font-family:'Syne',sans-serif;font-weight:800;color:var(--n-gold);font-size:0.82rem;">${item.price}</span>
        </div>
        <a href="#" class="btn btn-sm ${item.isSpecial ? 'btn-primary' : 'btn-success'} flex-shrink-0" onclick="openTab(event,'connect-content')" style="font-size:0.72rem;padding:0.3rem 0.65rem;">${item.isSpecial ? 'Enquire' : 'Request'}</a>
      </div>
      <p class="mb-0" style="font-size:0.72rem;">CUDFIRM &middot; ${item.tags.map(t => `<span class="tag ${t.startsWith('#₦') ? 'green' : 'orange'}">${t}</span>`).join('')}</p>
    </div>`
  ).join('');

  return `
  <section id="tab3" class="tab-content view">
    <h6 class="sticky-top py-2 px-3"><span class="badge text-bg-primary">Services</span></h6>
    <div class="tab3-search-bar sticky-top px-3 py-2">
      <input type="text" class="view-search w-100" data-target-list="#tab3-list" placeholder="Search services (e.g. landing page, logo, SEO)..." />
    </div>
    <div class="p-3" id="tab3-list">
      ${listItems}
    </div>
  </section>`;
}

// ─────────────────────────────────────────────
// GENERIC "UNDER CONSTRUCTION" HELPER
// ─────────────────────────────────────────────
function buildUnderConstruction(tabId, title, desc, badge) {
  return `
  <section id="${tabId}" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">${badge || title}</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">${desc}</p>
    <div class="card">
      <div class="card-content under-construction">
        <i class="bi bi-tools"></i>
        <h3>${title} — Coming Soon</h3>
        <p>We&apos;re building something great here. Have ideas for what should go here? Tell us!</p>
        <button class="btn btn-primary btn-lg mt-2" onclick="openTab(event,'connect-content')">Share Your Ideas</button>
      </div>
    </div>
  </section>`;
}

// ─────────────────────────────────────────────
// TAB 4: PORTFOLIO (Improved showcase)
// ─────────────────────────────────────────────
function buildTab4() {
  const projects = [
    { name:'CUDFIRM Group', type:'Multi-Page Business Site', img:'https://placehold.co/400x280/0B3D2E/C8922A?text=CUDFIRM+Group', link:'https://cudfirm.netlify.app', tags:['#Business','#Multi-Page'] },
    { name:'Barber Shop Demo', type:'Landing Page', img:'https://placehold.co/400x280/1A6B4A/fff?text=Barber+Shop', link:'#', tags:['#Landing','#Demo'] },
    { name:'Fashion Designer Demo', type:'Portfolio Site', img:'https://placehold.co/400x280/C8922A/fff?text=Fashion+Studio', link:'#', tags:['#Fashion','#Portfolio'] },
    { name:'Food Vendor Demo', type:'Landing Page', img:'https://placehold.co/400x280/E8B84B/0B3D2E?text=Food+Vendor', link:'#', tags:['#Food','#Landing'] },
    { name:'Life Coach Demo', type:'Service Site', img:'https://placehold.co/400x280/4D9E7A/fff?text=Life+Coach', link:'#', tags:['#Coach','#Services'] },
    { name:'Your Business Next', type:'Let\'s Build It', img:'https://placehold.co/400x280/3A4035/fff?text=Your+Business+Here', link:'connect-content', tags:['#GetStarted'] },
  ];

  return `
  <section id="tab4" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Portfolio</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      Every site we build is clean, mobile-ready, and designed with your customers in mind. Here's a sample of our work.
    </p>
    <div class="row g-3 stagger-children">
      ${projects.map(p => `
        <div class="col-12 col-md-6 col-lg-4">
          <div class="card h-100" style="overflow:hidden;cursor:pointer;" onclick="${p.link.startsWith('http') ? `window.open('${p.link}','_blank')` : `openTab(event,'${p.link}')`}">
            <img src="${p.img}" alt="${p.name}" style="width:100%;height:160px;object-fit:cover;" loading="lazy" onerror="this.src='https://placehold.co/400x280/0B3D2E/C8922A?text=CUDFIRM'" />
            <div class="card-content">
              <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:0.9rem;margin-bottom:0.2rem;">${p.name}</div>
              <div style="font-size:0.72rem;color:var(--n-muted);margin-bottom:0.5rem;">${p.type}</div>
              <div>${p.tags.map(t => `<span class="tag orange">${t}</span>`).join('')}</div>
            </div>
          </div>
        </div>`).join('')}
    </div>
    <button class="view-more-btn mt-3" onclick="openTab(event,'connect-content')">
      <i class="bi bi-laptop me-1"></i>Let's Build Your Website
    </button>
  </section>`;
}

// ─────────────────────────────────────────────
// TAB 5: OUR PROCESS (Clear, client-focused)
// ─────────────────────────────────────────────
function buildTab5() {
  const steps = [
    { num:'01', title:'You Contact Us', desc:'Send us a WhatsApp or fill the contact form. Tell us what your business does, who your customers are, and what you need.', icon:'bi-whatsapp', color:'#1A6B4A' },
    { num:'02', title:'We Discuss & Quote', desc:'We reply within 24 hours with a fair quote and clear timeline. No jargon, no hidden costs. Just a simple conversation.', icon:'bi-chat-dots', color:'#C8922A' },
    { num:'03', title:'You Approve & Pay 50%', desc:'Once you\'re happy with the plan, you pay 50% upfront so we can get started. The other 50% is due on delivery.', icon:'bi-check-circle', color:'#0B3D2E' },
    { num:'04', title:'We Build Your Site', desc:'We design and develop your site within the agreed timeline — usually 3 to 7 business days for a landing page.', icon:'bi-laptop', color:'#4D9E7A' },
    { num:'05', title:'You Review & Approve', desc:'We send you a preview link. You tell us what to tweak — we\'ll make up to 3 rounds of revisions at no extra cost.', icon:'bi-eye', color:'#E8B84B' },
    { num:'06', title:'We Launch Your Site', desc:'You pay the final 50%, we publish your site live, hand over all files and access, and you\'re open for business.', icon:'bi-rocket-takeoff', color:'#C8922A' },
  ];

  return `
  <section id="tab5" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Our Process</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      Simple, transparent, no surprises. Here's exactly how working with CUDFIRM looks from first contact to launch.
    </p>
    <div class="d-flex flex-column gap-3 stagger-children">
      ${steps.map(s => `
        <div class="card p-3 d-flex flex-row align-items-start gap-3">
          <div style="min-width:44px;height:44px;border-radius:12px;background:${s.color};color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:1rem;flex-shrink:0;">${s.num}</div>
          <div>
            <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:0.92rem;color:var(--n-forest);margin-bottom:0.3rem;"><i class="bi ${s.icon} me-1" style="color:${s.color}"></i>${s.title}</div>
            <p style="font-size:0.8rem;color:var(--n-muted);margin:0;">${s.desc}</p>
          </div>
        </div>`).join('')}
    </div>
    <button class="view-more-btn mt-3" onclick="openTab(event,'connect-content')">
      <i class="bi bi-arrow-right-circle me-1"></i>Start The Process — Contact Us
    </button>
  </section>`;
}

// ─────────────────────────────────────────────
// TAB 6: TEMPLATES (free starter resources)
// ─────────────────────────────────────────────
function buildTab6() {
  const templates = [
    { icon: 'bi-file-earmark-person', name: 'Freelancer CV',      desc: 'Clean, ATS-friendly resume for web designers and creatives.',  color: '#0B3D2E' },
    { icon: 'bi-receipt',            name: 'Website Invoice',      desc: 'Branded invoice template for client website projects.',        color: '#C8922A' },
    { icon: 'bi-envelope-paper',     name: 'Client Proposal',      desc: 'Simple website proposal that wins business — copy & edit.',    color: '#1A6B4A' },
    { icon: 'bi-file-earmark-check', name: 'Service Contract',     desc: 'Basic website design contract to protect you and your client.',color: '#4D9E7A' },
    { icon: 'bi-bar-chart',          name: 'Business Plan Outline',desc: 'One-page plan template for a small web studio.',               color: '#E8B84B' },
    { icon: 'bi-phone',              name: 'WhatsApp Script',      desc: 'Exactly what to say when pitching web services to a business.',color: '#8B4513' },
  ];

  return `
  <section id="tab6" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Templates</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      Free templates to help you run your web business professionally — contracts, invoices, proposals, and more.
    </p>
    <div class="row g-3">
      ${templates.map(t => `
        <div class="col-6 col-md-4 col-lg-3">
          <div class="card p-3 text-center" style="cursor:pointer;transition:all 0.22s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform=''">
            <div style="width:48px;height:48px;border-radius:12px;background:${t.color}22;display:flex;align-items:center;justify-content:center;margin:0 auto 0.7rem;">
              <i class="bi ${t.icon}" style="font-size:1.35rem;color:${t.color}"></i>
            </div>
            <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:0.82rem;margin-bottom:0.25rem;">${t.name}</div>
            <div style="font-size:0.72rem;color:var(--n-muted);">${t.desc}</div>
            <button class="btn btn-sm btn-success w-100 mt-2" style="font-size:0.72rem;" onclick="openTab(event,'connect-content')">Get Template</button>
          </div>
        </div>`).join('')}
    </div>
  </section>`;
}

// ─────────────────────────────────────────────
// TAB 7: RESOURCES (grants, funding, learning)
// ─────────────────────────────────────────────
function buildTab7() {
  const grants = [
    { name:'Tony Elumelu Foundation Grant', amount:'$5,000', deadline:'Dec 2025', sector:'All Entrepreneurs', link:'https://www.tonyelumelufoundation.org' },
    { name:'Google for Startups Africa',    amount:'Up to $100K credits', deadline:'Rolling', sector:'Tech', link:'https://startup.google.com' },
    { name:'CBN MSME Development Fund',     amount:'₦500K–₦5M', deadline:'Rolling', sector:'SMEs', link:'#' },
    { name:'NIRSAL Agro Processing Fund',   amount:'₦1M–₦50M', deadline:'Quarterly', sector:'Agriculture', link:'#' },
    { name:'World Bank Youth Innovation',   amount:'$10,000', deadline:'Mar 2026', sector:'Youth', link:'#' },
    { name:'AfDB Digital Transformation',  amount:'$25,000', deadline:'Jun 2026', sector:'Digital', link:'#' },
  ];
  return `
  <section id="tab7" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Resources</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      Curated grants, funding opportunities, and learning resources for Nigerian entrepreneurs and small business owners.
    </p>
    <div class="d-flex flex-column gap-3">
      ${grants.map(g => `
        <div class="list-item d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <div class="item-icon">${g.name}</div>
            <div style="font-size:0.78rem;color:var(--n-muted);margin-top:0.2rem;">
              <span class="tag green">${g.sector}</span>
              <span class="tag gray"><i class="bi bi-clock me-1"></i>${g.deadline}</span>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span style="font-family:'Syne',sans-serif;font-weight:800;color:var(--n-gold);font-size:0.88rem;">${g.amount}</span>
            <a href="${g.link}" target="_blank" rel="noopener" class="btn btn-sm btn-success" style="font-size:0.72rem;padding:0.3rem 0.65rem;">Apply</a>
          </div>
        </div>`).join('')}
    </div>
    <button class="view-more-btn mt-3" onclick="openTab(event,'connect-content')">
      <i class="bi bi-megaphone me-1"></i>Submit A Resource
    </button>
  </section>`;
}

function buildTab8() {
  return buildUnderConstruction('tab8','Showcase','A space for CUDFIRM clients to show off their live websites, win new customers, and get discovered. Coming soon.','Showcase');
}

// ─────────────────────────────────────────────
// TAB 9: TESTIMONIALS
// ─────────────────────────────────────────────
function buildTab9() {
  const stars = [
    { name:'Adaeze O.', role:'Fashion Designer · Lagos', quote:'CUDFIRM built my website in 5 days. My clients now book me online instead of hunting for my number. Life-changing.', color:'#0B3D2E' },
    { name:'Emeka N.', role:'Solar Installer · Abuja', quote:'I thought a professional website was too expensive for my small business. CUDFIRM proved me completely wrong.', color:'#C8922A' },
    { name:'Fatima U.', role:'Food Vendor · Kano', quote:'My WhatsApp orders doubled in 3 weeks after my site went live. People trust me more because I have a real website.', color:'#1A6B4A' },
    { name:'Chukwudi E.', role:'Photographer · Enugu', quote:'Clean, fast, mobile-ready, and clients actually find me on Google now. Worth every kobo.', color:'#4D9E7A' },
  ];

  return `
  <section id="tab9" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Testimonials</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      Real words from real business owners we've worked with. Their results speak for themselves.
    </p>
    <div class="row g-3 stagger-children">
      ${stars.map(s => `
        <div class="col-12 col-md-6">
          <div class="card p-4">
            <div style="width:44px;height:44px;border-radius:50%;background:${s.color};color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:1.1rem;margin-bottom:0.75rem;">${s.name[0]}</div>
            <p style="font-size:0.85rem;font-style:italic;color:var(--text-color);margin-bottom:0.75rem;">"${s.quote}"</p>
            <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:0.82rem;color:${s.color};">${s.name}</div>
            <div style="font-size:0.72rem;color:var(--n-muted);">${s.role}</div>
          </div>
        </div>`).join('')}
    </div>
    <button class="view-more-btn mt-3" onclick="openTab(event,'connect-content')">
      <i class="bi bi-star me-1"></i>Share Your Experience
    </button>
  </section>`;
}

// ─────────────────────────────────────────────
// TAB 10: LOVE NOTES
// ─────────────────────────────────────────────
function buildTab10() {
  const notes = [
    { text:'My barber shop now gets walk-ins who found me on Google. The site paid for itself in week two.', by:'Kayode, Lagos', stars:5 },
    { text:'Delivered exactly what they promised, on time. No drama, no excuses. Professional.', by:'Ngozi, Port Harcourt', stars:5 },
    { text:'The WhatsApp button alone has been worth it. Customers message me instead of competitors.', by:'Amara, Kano', stars:5 },
    { text:'I was sceptical spending ₦50K on a site. Now I wonder why I waited 3 years.', by:'Daniel, Enugu', stars:4 },
    { text:'They understood my vision quickly. The fashion site looks exactly like I imagined.', by:'Chisom, Abuja', stars:5 },
    { text:'CUDFIRM truly cares. I felt heard and guided all the way through the project.', by:'Grace, Rivers', stars:5 },
  ];
  const starsHtml = (n) => Array(5).fill(0).map((_,i) => `<i class="bi bi-star-fill" style="color:${i<n?'#C8922A':'#ccc'};font-size:0.7rem;"></i>`).join('');

  return `
  <section id="tab10" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Love Notes</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      Short, honest reviews from the community. Real people, real results.
    </p>
    <div class="row g-3 stagger-children">
      ${notes.map(n => `
        <div class="col-12 col-md-6">
          <div class="card p-3">
            <div style="margin-bottom:0.5rem;">${starsHtml(n.stars)}</div>
            <p style="font-size:0.83rem;font-style:italic;margin-bottom:0.5rem;">"${n.text}"</p>
            <div style="font-size:0.72rem;color:var(--n-muted);font-weight:600;">— ${n.by}</div>
          </div>
        </div>`).join('')}
    </div>
    <button class="view-more-btn mt-3" onclick="openTab(event,'connect-content')">
      <i class="bi bi-heart me-1"></i>Leave A Review
    </button>
  </section>`;
}

// ─────────────────────────────────────────────
// TAB 11: LOCAL GUIDES
// ─────────────────────────────────────────────
function buildTab11() {
  const guides = [
    { city:'Lagos', icon:'bi-buildings', tips:['Most customers are on mobile — always build mobile-first','WhatsApp is the number one business tool in Lagos','Low-cost neighbourhoods still need professional-looking sites'] },
    { city:'Abuja', icon:'bi-bank', tips:['Government contractors always need a website for credibility','Wuse 2 & Maitama businesses expect premium online presence','Many Abuja clients pay via transfer — add payment info to your site'] },
    { city:'Kano & North Nigeria', icon:'bi-globe2', tips:['Hausa-language landing pages convert extremely well','B2B agro businesses need simple, clear product sites','Offline-first design matters — keep sites fast and light'] },
    { city:'UK / USA Diaspora', icon:'bi-airplane', tips:['Diaspora businesses need to show Nigerian roots + international trust','English-language sites with local prices attract diaspora investors','CUDFIRM can build and maintain sites remotely from Lagos'] },
  ];

  return `
  <section id="tab11" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Local Guides</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      City-specific tips on how businesses in different Nigerian markets use their websites to win customers.
    </p>
    <div class="row g-3 stagger-children">
      ${guides.map(g => `
        <div class="col-12 col-md-6">
          <div class="card p-3">
            <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.75rem;">
              <div style="width:38px;height:38px;border-radius:10px;background:var(--n-forest);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.1rem;"><i class="bi ${g.icon}"></i></div>
              <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1rem;color:var(--n-forest);">${g.city}</div>
            </div>
            <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.4rem;">
              ${g.tips.map(tip => `<li style="font-size:0.8rem;display:flex;gap:0.5rem;"><i class="bi bi-check-circle-fill" style="color:var(--n-gold);flex-shrink:0;margin-top:2px;"></i>${tip}</li>`).join('')}
            </ul>
          </div>
        </div>`).join('')}
    </div>
    <button class="view-more-btn mt-3" onclick="openTab(event,'connect-content')">
      <i class="bi bi-map me-1"></i>Suggest A Guide
    </button>
  </section>`;
}

// ─────────────────────────────────────────────
// TAB 12: WEB TIPS (was Spark)
// ─────────────────────────────────────────────
function buildTab12() {
  const sparks = [
    { title:'5 Things Every Nigerian Business Website Must Have', tag:'Web Tips', icon:'bi-list-check', color:'#C8922A' },
    { title:'Why Your Canva Link Is Not a Website', tag:'Education', icon:'bi-exclamation-circle', color:'#1A6B4A' },
    { title:'How to Get Clients From Google Without Paying for Ads', tag:'SEO', icon:'bi-search', color:'#0B3D2E' },
    { title:'Landing Page vs Full Website — Which One Do You Need?', tag:'Strategy', icon:'bi-layout-text-window', color:'#4D9E7A' },
    { title:'How Much Does a Website Actually Cost in Nigeria (2025)', tag:'Pricing', icon:'bi-cash-coin', color:'#E8B84B' },
    { title:'Build a Website for Your Food Business in One Week', tag:'How-To', icon:'bi-cup-hot', color:'#8B4513' },
  ];

  return `
  <section id="tab12" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Web Tips 🔥</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      Practical, no-fluff advice on websites, online presence, and growing your business digitally in Nigeria.
    </p>
    <div class="row g-3 stagger-children">
      ${sparks.map(s => `
        <div class="col-12 col-md-6">
          <div class="card p-3 d-flex flex-row align-items-center gap-3" style="cursor:pointer;transition:all 0.22s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
            <div style="width:44px;height:44px;border-radius:12px;background:${s.color}22;display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:${s.color};flex-shrink:0;"><i class="bi ${s.icon}"></i></div>
            <div>
              <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:0.85rem;margin-bottom:0.2rem;">${s.title}</div>
              <span class="tag orange">#${s.tag}</span>
            </div>
            <i class="bi bi-arrow-right ms-auto" style="color:var(--n-muted);"></i>
          </div>
        </div>`).join('')}
    </div>
    <button class="view-more-btn mt-3" onclick="openTab(event,'connect-content')">
      <i class="bi bi-pencil-square me-1"></i>Request A Topic
    </button>
  </section>`;
}

// ─────────────────────────────────────────────
// TAB 13: FAQ (was Discover)
// ─────────────────────────────────────────────
function buildTab13() {
  const faqs = [
    { q:'How long does it take to build a website?', a:'A landing page takes 3–5 business days. A full multi-page business website takes 5–10 business days. We agree on a timeline before starting.' },
    { q:'What do I need to provide to get started?', a:'Your business name, logo (if any), phone number, services or products, and any photos. We guide you through what\'s needed — even if you don\'t have everything ready.' },
    { q:'Do you offer payment in instalments?', a:'Yes. You pay 50% upfront to begin and 50% on delivery. No full payment required before we start work.' },
    { q:'Will my website work on mobile phones?', a:'Yes — every site we build is mobile-first. Over 80% of Nigerians browse on their phones, so this is non-negotiable for us.' },
    { q:'Can I update my website myself after you build it?', a:'We can teach you how to make basic updates. Alternatively, our monthly maintenance plan covers all changes for ₦10,000–₦20,000/month.' },
    { q:'Do you do e-commerce or online stores?', a:'We currently focus on landing pages, business sites, and portfolios. Online stores are complex — we recommend focusing on a simple site first to build trust with customers.' },
    { q:'What if I don\'t have a logo or brand yet?', a:'We offer basic logo and brand identity design as an add-on from ₦25,000. We can start with a simple, clean design and improve it over time.' },
    { q:'Do you host the website too?', a:'Yes. We can handle domain registration and hosting setup for you as part of the project or as a separate add-on service.' },
  ];

  return `
  <section id="tab13" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">FAQ</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      Answers to the most common questions about working with CUDFIRM. Don't see your question here? Contact us directly.
    </p>
    <div class="d-flex flex-column gap-3 stagger-children">
      ${faqs.map((f, i) => `
        <div class="card p-3" style="cursor:pointer;" onclick="this.querySelector('.faq-answer').classList.toggle('d-none')">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:0.75rem;">
            <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:0.88rem;color:var(--n-forest);">${f.q}</div>
            <i class="bi bi-chevron-down" style="color:var(--n-gold);flex-shrink:0;"></i>
          </div>
          <div class="faq-answer d-none" style="margin-top:0.75rem;font-size:0.8rem;color:var(--n-muted);line-height:1.65;">${f.a}</div>
        </div>`).join('')}
    </div>
    <button class="view-more-btn mt-3" onclick="openTab(event,'connect-content')">
      <i class="bi bi-question-circle me-1"></i>Ask Us Anything
    </button>
  </section>`;
}

// ─────────────────────────────────────────────
// TAB 14: DEALS
// ─────────────────────────────────────────────
function buildTab14() {
  const deals = [
    { title:'Free Domain (.com.ng) for First 5 Clients', validity:'Limited — act fast', code:'CUDFIRM-DOMAIN', color:'#C8922A' },
    { title:'₦10,000 Off Any Landing Page', validity:'New clients only', code:'NEWSITE10', color:'#0B3D2E' },
    { title:'Free 3-Month Maintenance After Full Site', validity:'With business website order', code:'MAINTAIN3', color:'#1A6B4A' },
    { title:'Free WhatsApp Business Setup', validity:'With any website order', code:'WA-FREE', color:'#4D9E7A' },
  ];

  return `
  <section id="tab14" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Deals ✨</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      Current promotions available to new and existing clients. Mention the code when you contact us to claim your offer.
    </p>
    <div class="row g-3 stagger-children">
      ${deals.map(d => `
        <div class="col-12 col-md-6">
          <div class="card p-3" style="border-left:4px solid ${d.color};">
            <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:0.92rem;color:${d.color};margin-bottom:0.35rem;">${d.title}</div>
            <div style="font-size:0.75rem;color:var(--n-muted);margin-bottom:0.5rem;"><i class="bi bi-clock me-1"></i>${d.validity}</div>
            <div style="display:flex;align-items:center;gap:0.6rem;">
              <code style="background:${d.color}18;color:${d.color};padding:0.25rem 0.7rem;border-radius:6px;font-weight:700;font-size:0.82rem;letter-spacing:0.05em;">${d.code}</code>
              <button class="btn btn-sm btn-success" style="font-size:0.72rem;" onclick="copyToClipboard('${d.code}','Code copied: ${d.code} ✓')">Copy Code</button>
            </div>
          </div>
        </div>`).join('')}
    </div>
    <button class="view-more-btn mt-3" onclick="openTab(event,'connect-content')">
      <i class="bi bi-tag me-1"></i>Claim A Deal
    </button>
  </section>`;
}

// ─────────────────────────────────────────────
// TAB 15: COMMUNITY
// ─────────────────────────────────────────────
function buildTab15() {
  return `
  <section id="tab15" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Community</span></h6>
    <div class="card mb-3">
      <div class="card-header"><h3><i class="bi bi-megaphone me-1" style="color:var(--n-gold)"></i>Announcement</h3></div>
      <div class="card-content">
        <p style="font-size:0.88rem;">Welcome to the CUDFIRM community! We are building a space for Nigerian business owners who want better online presence. Share your journey, ask questions, and support each other.</p>
        <span class="tag green">#Community</span><span class="tag orange">#Websites</span><span class="tag gray">#Nigeria</span>
      </div>
    </div>
    <div class="card">
      <div class="card-content under-construction">
        <i class="bi bi-chat-heart"></i>
        <h3>Community Forum — Coming Soon</h3>
        <p>A dedicated space for CUDFIRM clients, freelancers, and small business owners to share tips, ask questions, and grow together.</p>
        <button class="btn btn-primary mt-2" onclick="openTab(event,'connect-content')">Join The Waitlist</button>
      </div>
    </div>
  </section>`;
}

// ─────────────────────────────────────────────
// TAB 16: SUBMIT A TIP
// ─────────────────────────────────────────────
function buildTab16() {
  return `
  <section id="tab16" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Submit A Tip</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      Know a web design trick, business tool, or resource that other small business owners in Nigeria should know about? Share it here.
    </p>
    <div class="card">
      <div class="card-content">
        <div class="mb-3">
          <label class="form-label">Your Tip or Resource</label>
          <input type="text" class="form-control" id="tipTitle" placeholder="e.g. Best free logo maker for Nigerian businesses..." />
        </div>
        <div class="mb-3">
          <label class="form-label">More Details</label>
          <textarea class="form-control" id="tipDetails" rows="4" placeholder="Why is this useful? Who does it help? How does it work?"></textarea>
        </div>
        <div class="mb-3">
          <label class="form-label">Link (optional)</label>
          <input type="url" class="form-control" id="tipLink" placeholder="https://..." />
        </div>
        <button class="btn btn-primary w-100" onclick="submitTip()"><i class="bi bi-send me-1"></i>Submit Tip</button>
      </div>
    </div>
  </section>`;
}

// ─────────────────────────────────────────────
// TAB 17: WHY CUDFIRM (was Investment) - Now more client-focused
// ─────────────────────────────────────────────
function buildTab17() {
  const reasons = [
    { icon:'bi-person-circle', title:'We Understand Business, Not Just Code', desc:'CUDFIRM has real-world operations and quality control experience. We know what a business needs from a website — not just what looks good.' },
    { icon:'bi-geo-alt', title:'Lagos-Based, Nigerian-Focused', desc:'We are in the same timezone, speak the same language, and understand Nigerian customer behaviour. No generic "international" agency templates.' },
    { icon:'bi-phone', title:'Mobile-First, Always', desc:'Over 80% of your customers browse on phones. Every site we build works perfectly on mobile — this is non-negotiable.' },
    { icon:'bi-currency-dollar', title:'Honest Pricing, No Surprises', desc:'We tell you the price upfront. No discovery calls that turn into ₦500K proposals. Landing pages from ₦50,000 — that\'s it.' },
    { icon:'bi-headset', title:'You Can Actually Reach Us', desc:'WhatsApp, phone, email — we respond. We don\'t disappear after collecting payment. 30-day post-launch support is standard.' },
    { icon:'bi-rocket-takeoff', title:'Fast Turnaround', desc:'Landing pages in 3–5 days. Business websites in 5–10 days. We respect your time and your urgency to get online.' },
  ];

  return `
  <section id="tab17" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Why CUDFIRM</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      There are hundreds of web designers in Nigeria. Here's why clients choose CUDFIRM and why first-time clients come back.
    </p>
    <div class="row g-3 stagger-children">
      ${reasons.map(r => `
        <div class="col-12 col-md-6">
          <div class="card p-3 h-100">
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.6rem;">
              <div style="width:40px;height:40px;border-radius:10px;background:var(--n-jade);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;"><i class="bi ${r.icon}"></i></div>
              <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:0.88rem;color:var(--n-forest);">${r.title}</div>
            </div>
            <p style="font-size:0.78rem;color:var(--n-muted);margin:0;">${r.desc}</p>
          </div>
        </div>`).join('')}
    </div>
    <button class="view-more-btn mt-3" onclick="openTab(event,'connect-content')">
      <i class="bi bi-arrow-right-circle me-1"></i>Start Working With Us
    </button>
  </section>`;
}

// ─────────────────────────────────────────────
// TAB 20: ABOUT US (Client-first positioning)
// ─────────────────────────────────────────────
function buildTab20() {
  const values = [
    { icon:'bi-people', title:'Client Success First', desc:'Every website we build is measured by one thing: does it help your business get more customers? That is our only metric.' },
    { icon:'bi-geo-alt', title:'Built for Nigeria', desc:'We understand the Nigerian market — mobile-first customers, WhatsApp culture, local trust signals, and local payment habits.' },
    { icon:'bi-eye', title:'Radical Transparency', desc:'You know the price before we start. You know the timeline. You know what you get. No surprises, ever.' },
    { icon:'bi-shield-check', title:'Quality Without Compromise', desc:'Fast, secure, mobile-friendly, and built with clean code. Every site we deliver is one we are proud to put our name on.' },
  ];

  return `
  <section id="tab20" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">About CUDFIRM</span></h6>

    <!-- Mission statement -->
    <div class="card card-section mb-3" style="border-left:4px solid var(--n-gold);">
      <div class="card-content">
        <p style="font-size:1rem;font-family:'Syne',sans-serif;font-weight:700;color:var(--n-forest);margin-bottom:0.75rem;line-height:1.55;">
          Every business in Nigeria deserves a professional online presence — not just the big ones.
        </p>
        <p style="font-size:0.85rem;color:var(--n-muted);line-height:1.7;margin:0;">
          Too many talented people — barbers, photographers, food vendors, coaches, tailors — are losing customers to competitors simply because they don't have a website. CUDFIRM exists to change that.
        </p>
      </div>
    </div>

    <!-- Story -->
    <div class="card card-section mb-3">
      <div class="card-header">
        <h3><i class="bi bi-flag me-1" style="color:var(--n-gold)"></i>Our Story</h3>
      </div>
      <div class="card-content">
        <p style="font-size:0.85rem;color:var(--n-muted);line-height:1.75;margin-bottom:0.75rem;">
          CUDFIRM started in Lagos with a simple observation: small Nigerian businesses were spending time and money on social media pages and Canva flyers, but without a proper website, they had no real online presence they owned or controlled.
        </p>
        <p style="font-size:0.85rem;color:var(--n-muted);line-height:1.75;margin-bottom:0.75rem;">
          We set out to build professional websites that are fast, beautiful, and genuinely useful — designed specifically for how Nigerian customers search, browse, and buy.
        </p>
        <p style="font-size:0.85rem;color:var(--n-muted);line-height:1.75;margin:0;">
          Today, CUDFIRM is a focused web design studio. One clear mission. One service. Done properly.
        </p>
      </div>
    </div>

    <!-- Values -->
    <div class="card card-section mb-3">
      <div class="card-header">
        <h3><i class="bi bi-stars me-1" style="color:var(--n-gold)"></i>What We Stand For</h3>
      </div>
      <div class="card-content">
        <div class="row g-3">
          ${values.map(v => `
            <div class="col-12 col-md-6">
              <div class="card p-3 h-100">
                <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.6rem;">
                  <div style="width:40px;height:40px;border-radius:10px;background:var(--n-jade);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;"><i class="bi ${v.icon}"></i></div>
                  <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:0.88rem;color:var(--n-forest);">${v.title}</div>
                </div>
                <p style="font-size:0.78rem;color:var(--n-muted);margin:0;">${v.desc}</p>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <!-- Quick facts -->
    <div class="card card-section mb-3">
      <div class="card-header">
        <h3><i class="bi bi-info-circle me-1" style="color:var(--n-gold)"></i>Quick Facts</h3>
      </div>
      <div class="card-content">
        <div class="row g-3 text-center">
          ${[
            { label:'Based In', value:'Lagos, Nigeria' },
            { label:'Delivery', value:'3–10 Business Days' },
            { label:'Starting Price', value:'₦50,000' },
            { label:'Support Hours', value:'Mon–Sat, 8am–8pm WAT' },
          ].map(f => `
            <div class="col-6 col-md-3">
              <div class="card p-3">
                <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:0.95rem;color:var(--n-forest);margin-bottom:0.2rem;">${f.value}</div>
                <div style="font-size:0.7rem;color:var(--n-muted);">${f.label}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <button class="view-more-btn" onclick="openTab(event,'connect-content')">
      <i class="bi bi-arrow-right-circle me-1"></i>Work With Us
    </button>

    <footer class="footin mt-4">
      <div class="icons-social">
        <article class="list-social">
          <span class="icons-social__item"><a class="icons-social__link" href="https://codepen.io/cudfirm-group" aria-label="CodePen"><i class="fab fa-codepen"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://instagram.com/cudfirm" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://fb.me/cudfirm" aria-label="Facebook"><i class="fab fa-facebook"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://x.com/cudfirm" aria-label="X / Twitter"><i class="fab fa-twitter"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://linkedin.com/in/cudfirm" aria-label="LinkedIn"><i class="fab fa-linkedin"></i></a></span>
        </article>
      </div>
    </footer>
  </section>`;
}



// ─────────────────────────────────────────────
// EXPLORE CONTENT — Portfolio directory
// ─────────────────────────────────────────────
function buildExploreContent() {
  return `
  <section id="explore-content" class="tab-content view">
    <div class="explore-search-bar sticky-top d-flex align-items-center gap-2 px-3 py-2">
      <h6 class="mb-0 me-2 flex-shrink-0"><span class="badge text-bg-primary">Portfolio</span></h6>
      <input type="text" id="serviceSearchInput" placeholder="Search by business type..." class="view-search flex-1" />
      <button id="clearServiceSearchBtn" class="btn btn-sm btn-outline-secondary d-none" style="border-radius:20px;font-size:0.72rem;">Clear</button>
      <button id="disclaimer-toggle-btn" class="d-lg-none btn btn-sm btn-outline-secondary flex-shrink-0" style="border-radius:20px;font-size:0.72rem;">Info</button>
    </div>
    <div id="main-content-wrapper" class="row gx-lg-4 p-3">
      <div class="col-lg-8 col-xl-9">
        <div id="service-grid" class="row row-cols-2 row-cols-sm-3 row-cols-lg-3 row-cols-xl-4 g-3"></div>
      </div>
      <aside class="d-none d-lg-block col-lg-4 col-xl-3">
        <div id="disclaimer-content-desktop" class="p-4 rounded-3 sticky-top" style="top:70px;">
          <h3 class="h5 fw-bold border-bottom pb-2 mb-3" style="color:var(--n-forest);">About Our Portfolio</h3>
          <div class="disclaimer-text">
            <p style="font-size:0.8rem;">These are websites built by CUDFIRM for real Nigerian businesses. Demo projects are marked — real client sites link to the live version.</p>
            <p style="font-size:0.8rem;">Want your business here? We can build you a site starting from ₦50,000.</p>
            <p style="font-size:0.8rem;"><span style="color:var(--n-jade);font-weight:700;">GREEN</span> tags are live client sites. <span style="color:#C8922A;font-weight:700;">GOLD</span> tags are demo projects.</p>
          </div>
          <div class="position-relative mt-3">
            <i class="bi bi-search position-absolute text-secondary" style="left:10px;top:50%;transform:translateY(-50%);font-size:0.8rem;"></i>
            <input type="text" id="serviceSearchInputDesktop" placeholder="Search portfolio..." class="form-control ps-5" style="font-size:0.82rem;border-radius:20px;" />
          </div>
        </div>
      </aside>
    </div>
  </section>`;
}

// ─────────────────────────────────────────────
// FORUM CONTENT — kept for reference but no longer rendered
// ─────────────────────────────────────────────
function buildForumContent() {
  const brands = ['CUDFIRM','Barber','Fashion','Food','Coach','Photo','Solar','Tutor','Health','Logistics','Events','Design'];
  const brandCards = brands.map((b, i) => `
    <div class="s-card">
      <img src="https://placehold.co/80x80/${['0B3D2E','C8922A','1A6B4A','4D9E7A','E8B84B','8B4513','191970','5f9ea0','A52A2A','2F4F4F','8B008B','3A4035'][i % 12]}/fff?text=${b[0]}" alt="${b}" onerror="this.src='https://placehold.co/80x80/0B3D2E/C8922A?text=N'" />
      <div class="s-name"><span class="badge" style="background:rgba(11,61,46,0.12);color:var(--n-jade);font-size:0.55rem;">${b}</span></div>
    </div>`
  ).join('');

  const forumIcons = [
    { icon:'bi-globe2', label:'Web Design' }, { icon:'bi-phone', label:'Mobile' },
    { icon:'bi-search', label:'SEO' }, { icon:'bi-palette', label:'Branding' },
    { icon:'bi-camera', label:'Photography' }, { icon:'bi-bag-heart', label:'Fashion' },
    { icon:'bi-cup-hot', label:'Food Biz' }, { icon:'bi-person-video3', label:'Coaching' },
    { icon:'bi-shop', label:'SME' }, { icon:'bi-cash-coin', label:'Pricing' },
    { icon:'bi-mortarboard', label:'Learning' }, { icon:'bi-star', label:'Reviews' },
    { icon:'bi-award', label:'Grants' }, { icon:'bi-people', label:'Network' },
    { icon:'bi-chat-dots', label:'General' },
  ];

  return `
  <section id="forum-content" class="tab-content view p-2 m-0">
    <div class="stories mt-0 mb-2 rounded-2">
      <div class="scroll-container d-flex overflow-auto p-2" style="white-space:nowrap;gap:0.25rem;">
        <div class="s-card0 sticky-card">
          <div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,var(--n-forest),var(--n-gold));display:flex;align-items:center;justify-content:center;cursor:pointer;" onclick="openTab(event,'connect-content')">
            <i class="bi bi-plus-lg" style="color:#fff;font-size:1rem;"></i>
          </div>
          <div style="font-size:0.6rem;margin-top:0.2rem;text-align:center;color:var(--n-muted);">You</div>
        </div>
        ${brandCards}
      </div>
    </div>
    <hr class="my-2" />
    <div class="bbgpc whitenho contact px-2">
      <div class="forum-hero-banner">
        <img src="https://raw.githubusercontent.com/farazc60/Project-Images/refs/heads/main/Velocity%20Blog%20Website%20Template/office-spaces-that-actually-inspire-creativity.jpg" alt="CUDFIRM Forum Banner" class="forum-hero-img" loading="lazy" />
        <div class="forum-hero-overlay">
          <div class="forum-hero-text">
            <span class="forum-hero-eyebrow">Welcome to the</span>
            <h2 class="forum-hero-title">CUDFIRM Forum</h2>
            <p class="forum-hero-sub">Websites · Business · Growth</p>
          </div>
          <div class="forum-hero-pills">
            <span class="forum-pill"><i class="bi bi-fire"></i>Trending</span>
            <span class="forum-pill"><i class="bi bi-people-fill"></i>Community</span>
            <span class="forum-pill"><i class="bi bi-chat-dots-fill"></i>Coming Soon</span>
          </div>
        </div>
        <div class="forum-hero-shimmer"></div>
      </div>
    </div>
    <hr class="my-2" />
    <div class="row icon-grid row-cols-4 row-cols-sm-5 row-cols-md-8 row-cols-lg-10 whitenho contact bbgpc d-flex justify-content-center align-items-center">
      ${forumIcons.map(f => `
        <div class="col icon-item" onclick="showToast('${f.label} forum coming soon 🛠️')">
          <div class="icon-box"><i class="bi ${f.icon}"></i></div>
          <div class="icon-label">${f.label}</div>
        </div>`).join('')}
    </div>
    <hr class="my-2" />
    <footer class="footin">
      <div class="icons-social">
        <article class="list-social">
          <span class="icons-social__item"><a class="icons-social__link" href="https://codepen.io/cudfirm-group"><i class="fab fa-codepen"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://instagram.com/cudfirm" target="_blank" rel="noopener"><i class="fab fa-instagram"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://fb.me/cudfirm"><i class="fab fa-facebook"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://x.com/cudfirm"><i class="fab fa-twitter"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://linkedin.com/in/cudfirm"><i class="fab fa-linkedin"></i></a></span>
        </article>
      </div>
    </footer>
  </section>`;
}

// ─────────────────────────────────────────────
// CONNECT CONTENT — Contact / Quote request
// ─────────────────────────────────────────────
function buildConnectContent() {
  return `
  <section id="connect-content" class="tab-content view p-3 p-sm-4">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Get A Quote</span></h6>
    <hr class="my-2 w-25" />
    <div class="contact-container">
      <h4 class="contact-header">Ready to Get Online?</h4>
      <p class="contact-subheader">
        Tell us about your business and what you need. We'll reply within 24 hours with a clear quote and timeline — no jargon, no pressure.
      </p>
      <div class="row g-4">
        <div class="col-12 col-lg-8">
          <form id="contactForm" onsubmit="return false;">
            <div class="mb-3">
              <label for="contactName" class="form-label">Your Name</label>
              <input type="text" class="form-control" id="contactName" name="name" placeholder="e.g. Emeka Okafor" required />
            </div>
            <div class="mb-3">
              <label for="contactInfo" class="form-label">Your Email or WhatsApp Number</label>
              <input type="text" class="form-control" id="contactInfo" name="contact_info" placeholder="email@example.com or +234..." required />
            </div>
            <div class="mb-3">
              <label for="contactMessage" class="form-label">Tell Us About Your Business & What You Need</label>
              <textarea class="form-control" id="contactMessage" name="message" rows="5" placeholder="e.g. I run a barber shop in Lagos and need a simple landing page with my services, gallery, and a WhatsApp button..." required></textarea>
            </div>
            <div class="d-flex flex-column gap-2">
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-primary w-100" onclick="sendToAdmin()">
                  <i class="bi bi-send-check me-1"></i>Send Request
                </button>
                <button type="button" class="btn btn-whatsapp w-100" onclick="sendToWhatsAppWithForm()">
                  <i class="bi bi-whatsapp me-1"></i>WhatsApp
                </button>
              </div>
              <button type="button" class="btn btn-info w-100" onclick="sendToEmail()">
                <i class="bi bi-envelope me-1"></i>Send Via Email
              </button>
            </div>
          </form>
        </div>
        <div class="col-12 col-lg-4">
          <div class="quick-contact-box">
            <h5><i class="bi bi-headset me-1"></i>Talk To Us Directly</h5>
            <p>We are available Monday–Saturday, 8am to 8pm WAT. WhatsApp is the fastest way to reach us.</p>
            <a href="tel:+2349056317709" class="btn btn-warning w-100 mb-2"><i class="bi bi-telephone me-1"></i>Call Us Now</a>
            <button class="btn btn-outline-light w-100" onclick="copyToClipboard('+2349056317709','Number copied! ✓')">
              <i class="bi bi-clipboard me-1"></i>Copy Number
            </button>
            <hr style="border-color:rgba(255,255,255,0.2);margin:1rem 0;" />
            <div style="font-size:0.75rem;opacity:0.8;text-align:center;">
              <i class="bi bi-envelope me-1"></i>info@cudfirm.com<br/>
              <i class="bi bi-geo-alt me-1 mt-1 d-inline-block"></i>Lagos, Nigeria
            </div>
          </div>
        </div>
      </div>
    </div>
    <footer class="footin mt-4">
      <div class="icons-social">
        <article class="list-social">
          <span class="icons-social__item"><a class="icons-social__link" href="https://codepen.io/cudfirm-group"><i class="fab fa-codepen"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://instagram.com/cudfirm" target="_blank" rel="noopener"><i class="fab fa-instagram"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://fb.me/cudfirm"><i class="fab fa-facebook"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://x.com/cudfirm"><i class="fab fa-twitter"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://linkedin.com/in/cudfirm"><i class="fab fa-linkedin"></i></a></span>
        </article>
      </div>
    </footer>
  </section>`;
}

// =============================================
// CORE TAB SWITCHING
// =============================================
function openTab(event, tabId) {
  const appContainer = document.querySelector('.app-container');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  if (event && searchInput && searchInput.value) {
    searchInput.value = '';
    if (clearSearchBtn) clearSearchBtn.style.display = 'none';
    filterContent('');
  }

  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.remove('active');
    el.style.display = 'none';
  });
  document.querySelectorAll('.tab-button, .nav-item').forEach(el => el.classList.remove('active'));

  const isSidebarTab = tabId.startsWith('tab') && !tabId.includes('-content');

  if (isSidebarTab) {
    appContainer.classList.remove('sidebar-hidden');
  } else {
    appContainer.classList.add('sidebar-hidden');
  }

  const targetContent = document.getElementById(tabId);
  if (targetContent) {
    targetContent.classList.add('active');
    targetContent.style.display = 'block';
    if (targetContent.classList.contains('view')) {
      animateView(targetContent);
    }
  }

  if (isSidebarTab) {
    const sidebarButton = document.querySelector(`.tab-button[onclick*="'${tabId}'"]`);
    if (sidebarButton) sidebarButton.classList.add('active');
    if (tabId === 'tab1') {
      const homeFooterButton = document.querySelector('.nav-item[onclick*="tab1"]');
      if (homeFooterButton) homeFooterButton.classList.add('active');
    }
  } else {
    const footerButton = document.querySelector(`.nav-item[onclick*="'${tabId}'"]`);
    if (footerButton) footerButton.classList.add('active');
  }

  const activeNavItem = document.querySelector('.nav-item.active');
  if (activeNavItem) {
    const activeIndex = activeNavItem.dataset.index;
    const footerNav = document.querySelector('.footer-nav');
    if (footerNav) footerNav.style.setProperty('--active-index', activeIndex);
  }

  const idx = ALL_TAB_IDS.indexOf(tabId);
  if (idx !== -1) currentTabIndex = idx;

  try { localStorage.setItem('cudfirm_last_tab', tabId); } catch(e) {}

  updateBreadcrumb(tabId);
  updateMobileTabStrip(tabId);

  const contentMain = document.querySelector('.content-main');
  if (contentMain) contentMain.scrollTop = 0;
}

// =============================================
// GSAP ANIMATION
// =============================================
function animateView(viewElement) {
  if (typeof gsap === 'undefined') return;
  gsap.fromTo(viewElement,
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: 0.38, ease: 'power3.out' }
  );
}

// =============================================
// VIEW-SPECIFIC SEARCH
// =============================================
function handleViewSearch(e) {
  const searchTerm = e.target.value.toLowerCase();
  const targetListSelector = e.target.dataset.targetList;
  if (!targetListSelector) return;
  const listContainer = document.querySelector(targetListSelector);
  if (!listContainer) return;
  listContainer.querySelectorAll('.card, .list-item').forEach(item => {
    const text = (item.dataset.searchText || item.textContent).toLowerCase();
    item.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

// =============================================
// MODAL
// =============================================
function openModal(title, content) {
  const modal = document.getElementById('modal');
  if (!modal) return;
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = content;
  modal.classList.add('visible');
  if (typeof gsap !== 'undefined') gsap.from('.modal-content', { scale: 0.9, opacity: 0, duration: 0.3, ease: 'power2.out' });
}

function closeModal() {
  const modal = document.getElementById('modal');
  if (!modal) return;
  if (typeof gsap !== 'undefined') {
    gsap.to('.modal-content', { scale: 0.9, opacity: 0, duration: 0.2, ease: 'power2.in', onComplete: () => modal.classList.remove('visible') });
  } else {
    modal.classList.remove('visible');
  }
}

// =============================================
// CONTACT FUNCTIONS
// =============================================
function getFormValues() {
  return {
    name: (document.getElementById('contactName') || {}).value?.trim() || '',
    contactInfo: (document.getElementById('contactInfo') || {}).value?.trim() || '',
    message: (document.getElementById('contactMessage') || {}).value?.trim() || '',
  };
}

function validateForm() {
  const { name, contactInfo, message } = getFormValues();
  if (!name || !contactInfo || !message) {
    openModal('Fields Required', '<p style="font-size:0.88rem;">Please fill in all fields — your name, contact info, and what you need — before sending.</p>');
    return false;
  }
  return true;
}

function sendToAdmin() {
  if (!validateForm()) return;
  const { name, contactInfo, message } = getFormValues();
  submitToGoogleSheets(name, contactInfo, message);
  showToast('Request sent ✓ We\'ll reply within 24 hours!');
  setTimeout(() => { window.location.href = 'success.html'; }, 1500);
}

function sendToWhatsAppWithForm() {
  if (!validateForm()) return;
  const { name, contactInfo, message } = getFormValues();
  const yourNumber = '+2348028699824';
  const text = `Hello CUDFIRM,\n\nName: ${name}\nContact: ${contactInfo}\n\nMessage:\n${message}`;
  window.open(`https://wa.me/${yourNumber}?text=${encodeURIComponent(text)}`, '_blank');
}

function sendToEmail() {
  if (!validateForm()) return;
  const { name, contactInfo, message } = getFormValues();
  const subject = encodeURIComponent('Website Quote Request — CUDFIRM');
  const body = encodeURIComponent(`Name: ${name}\nContact Info: ${contactInfo}\n\nMessage:\n${message}`);
  window.location.href = `mailto:info@cudfirm.com?subject=${subject}&body=${body}`;
}

function submitTip() {
  const title = (document.getElementById('tipTitle') || {}).value?.trim();
  const details = (document.getElementById('tipDetails') || {}).value?.trim();
  if (!title || !details) { showToast('Please fill in the tip title and details ✏️'); return; }
  showToast('Thanks for your tip! We\'ll review it shortly 🙌');
  setTimeout(() => {
    ['tipTitle','tipDetails','tipLink'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  }, 1500);
}

// =============================================
// GOOGLE SHEETS SUBMISSION
// =============================================
function submitToGoogleSheets(name, contactInfo, message) {
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxQGJLYV8bR1HeXJJfBPx1boRR-jcW4prS2hojJfxasiDtl6eqfUxYnJEsL1tO52CbM/exec';
  const formData = new FormData();
  formData.append('name', name);
  formData.append('contact_info', contactInfo);
  formData.append('message', message);
  formData.append('timestamp', new Date().toISOString());
  fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: formData })
    .catch(err => console.warn('Google Sheets submission failed:', err));
}

// =============================================
// GLOBAL SEARCH
// =============================================
function unhighlight(container) {
  container.querySelectorAll('mark.highlight').forEach(mark => {
    mark.parentNode.replaceChild(document.createTextNode(mark.textContent), mark);
  });
  container.normalize();
}

function highlightText(node, term) {
  if (!term.trim()) return;
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
  let textNode;
  const replacements = [];
  const lower = term.toLowerCase();
  while ((textNode = walker.nextNode())) {
    const tag = textNode.parentElement.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE') continue;
    const lowerVal = textNode.nodeValue.toLowerCase();
    if (!lowerVal.includes(lower)) continue;
    const frag = document.createDocumentFragment();
    let last = 0, start = 0;
    while ((start = lowerVal.indexOf(lower, last)) > -1) {
      frag.appendChild(document.createTextNode(textNode.nodeValue.substring(last, start)));
      const mark = document.createElement('mark');
      mark.className = 'highlight';
      mark.textContent = textNode.nodeValue.substring(start, start + term.length);
      frag.appendChild(mark);
      last = start + term.length;
    }
    frag.appendChild(document.createTextNode(textNode.nodeValue.substring(last)));
    replacements.push({ original: textNode, replacement: frag });
  }
  replacements.forEach(r => { if (r.original.parentNode) r.original.parentNode.replaceChild(r.replacement, r.original); });
}

function filterContent(term) {
  const lowerTerm = term.toLowerCase();
  const contentMain = document.querySelector('.content-main');
  if (!contentMain) return;
  contentMain.classList.add('content-fading');
  setTimeout(() => {
    unhighlight(contentMain);
    const existing = contentMain.querySelector('.no-results-message');
    if (existing) existing.remove();
    if (!lowerTerm) {
      originalSectionsInOrder.forEach(s => s.style.display = 'none');
      const restore = activeTabIdBeforeSearch || 'tab1';
      openTab(null, restore);
      activeTabIdBeforeSearch = null;
    } else {
      if (activeTabIdBeforeSearch === null) {
        const active = document.querySelector('.tab-content.active');
        activeTabIdBeforeSearch = active ? active.id : 'tab1';
      }
      document.querySelectorAll('.tab-content, .tab-button, .nav-item').forEach(el => {
        el.classList.remove('active');
        if (el.matches('.tab-content')) el.style.display = 'none';
      });
      let found = 0;
      originalSectionsInOrder.forEach(s => {
        if (s.textContent.toLowerCase().includes(lowerTerm)) {
          highlightText(s, term);
          s.style.display = 'block';
          found++;
        } else {
          s.style.display = 'none';
        }
      });
      if (found === 0) {
        const msg = document.createElement('div');
        msg.className = 'no-results-message search-no-results';
        msg.innerHTML = `<i class="bi bi-search" style="font-size:2rem;color:var(--n-muted);display:block;margin-bottom:0.75rem;"></i>No results found for <strong>"${term.replace(/</g,'&lt;').replace(/>/g,'&gt;')}"</strong><br><small>Try different keywords</small>`;
        contentMain.appendChild(msg);
      }
    }
    contentMain.classList.remove('content-fading');
  }, 220);
}

// =============================================
// DARK MODE
// =============================================
function initDarkMode() {
  const toggle = document.getElementById('darkModeToggle');
  const icon = document.getElementById('darkModeIcon');
  const html = document.documentElement;
  try {
    if (localStorage.getItem('cudfirm_theme') === 'dark') {
      html.setAttribute('data-theme', 'dark');
      if (icon) icon.className = 'bi bi-sun-fill';
    }
  } catch(e) {}
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    if (icon) icon.className = isDark ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
    try { localStorage.setItem('cudfirm_theme', isDark ? 'light' : 'dark'); } catch(e) {}
    showToast(isDark ? 'Light mode ☀️' : 'Night mode 🌙');
  });
}

// =============================================
// TOAST
// =============================================
let toastTimer = null;
function showToast(message, duration) {
  duration = duration || 2500;
  const toast = document.getElementById('toastNotification');
  const msg = document.getElementById('toastMessage');
  if (!toast || !msg) return;
  msg.textContent = message;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

// =============================================
// COPY TO CLIPBOARD
// =============================================
function copyToClipboard(text, successMessage) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => showToast(successMessage || 'Copied ✓'))
      .catch(() => showToast('Could not copy.'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast(successMessage || 'Copied ✓'); }
    catch(e) { showToast('Could not copy.'); }
    document.body.removeChild(ta);
  }
}

// =============================================
// READING PROGRESS BAR
// =============================================
function initReadingProgressBar() {
  const bar = document.getElementById('readingProgressBar');
  const contentMain = document.querySelector('.content-main');
  if (!bar || !contentMain) return;
  contentMain.addEventListener('scroll', () => {
    const h = contentMain.scrollHeight - contentMain.clientHeight;
    bar.style.width = (h > 0 ? (contentMain.scrollTop / h) * 100 : 0) + '%';
  }, { passive: true });
}

// =============================================
// BACK TO TOP
// =============================================
function initBackToTop() {
  const btn = document.getElementById('backToTopBtn');
  const contentMain = document.querySelector('.content-main');
  if (!btn || !contentMain) return;
  contentMain.addEventListener('scroll', () => {
    btn.classList.toggle('visible', contentMain.scrollTop > 300);
  }, { passive: true });
  btn.addEventListener('click', () => contentMain.scrollTo({ top: 0, behavior: 'smooth' }));
}

// =============================================
// LIVE USER COUNT
// =============================================
function initLiveUserCount() {
  const el = document.getElementById('sidebarLiveCount');
  const el2 = document.getElementById('liveUserCount');
  const base = Math.floor(Math.random() * 30) + 12;
  function update() {
    const n = base + Math.floor(Math.random() * 6) - 2;
    if (el)  el.textContent = n;
    if (el2) el2.textContent = n + ' Online';
  }
  update();
  setInterval(update, 8000);
}

// =============================================
// BREADCRUMB
// =============================================
function updateBreadcrumb(tabId) {
  const trail = document.getElementById('breadcrumbTrail');
  if (!trail) return;
  const name = TAB_NAMES[tabId] || tabId;
  if (breadcrumbHistory.length === 0 || breadcrumbHistory[breadcrumbHistory.length - 1] !== tabId) {
    breadcrumbHistory.push(tabId);
    if (breadcrumbHistory.length > 4) breadcrumbHistory.shift();
  }
  trail.innerHTML = breadcrumbHistory.map((id, i) => {
    const n = TAB_NAMES[id] || id;
    const isLast = i === breadcrumbHistory.length - 1;
    return isLast
      ? `<span class="breadcrumb-current">${n}</span>`
      : `<button class="breadcrumb-link" onclick="openTab(event,'${id}')">${n}</button><span class="breadcrumb-sep">›</span>`;
  }).join('');
}

// =============================================
// KEYBOARD SHORTCUTS
// =============================================
function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === '?') {
      openModal('Keyboard Shortcuts', `
        <ul style="font-size:0.85rem;line-height:2;">
          <li><kbd>?</kbd> — Show this help</li>
          <li><kbd>/</kbd> — Focus search</li>
          <li><kbd>h</kbd> — Go to Home</li>
          <li><kbd>s</kbd> — Go to Services</li>
          <li><kbd>p</kbd> — Go to Portfolio</li>
          <li><kbd>c</kbd> — Go to Contact</li>
          <li><kbd>Esc</kbd> — Close overlay</li>
        </ul>`);
    }
    if (e.key === '/') {
      e.preventDefault();
      const si = document.getElementById('searchInput');
      if (si) { si.classList.add('active'); si.focus(); }
    }
    if (e.key === 'h' || e.key === 'H') openTab(null, 'tab1');
    if (e.key === 's' || e.key === 'S') openTab(null, 'tab3');
    if (e.key === 'p' || e.key === 'P') openTab(null, 'tab4');
    if (e.key === 'c' || e.key === 'C') openTab(null, 'connect-content');
  });
}


// =============================================
// SWIPE NAVIGATION
// =============================================

// NEEEEEEEEEEEEEEEW

function initSwipeNavigation() {
  const contentMain = document.querySelector('.content-main');
  if (!contentMain) return;
  let startX = 0, startY = 0, swipeLocked = false;

  function isInsideHScrollable(el, dx) {
    while (el && el !== contentMain) {
      // Also block swipe if inside the feed's vertical scroll container
      if (el.id === 'feedMain' || el.id === 'feedSidebarRight') return true;
      const style = window.getComputedStyle(el);
      const overflowX = style.overflowX;
      const canScrollH = (overflowX === 'auto' || overflowX === 'scroll') && el.scrollWidth > el.clientWidth;
      if (canScrollH) {
        const atLeft = el.scrollLeft <= 0;
        const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
        if ((dx < 0 && !atRight) || (dx > 0 && !atLeft)) return true;
      }
      el = el.parentElement;
    }
    return false;
  }

  contentMain.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    swipeLocked = false;
  }, { passive: true });

  contentMain.addEventListener('touchmove', e => {
    if (swipeLocked) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    if (Math.abs(dx) > Math.abs(dy) && isInsideHScrollable(e.target, dx)) swipeLocked = true;
  }, { passive: true });

  contentMain.addEventListener('touchend', e => {
    if (swipeLocked) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 80) {
      if (isInsideHScrollable(e.target, dx)) return;
      const next = dx < 0 ? Math.min(ALL_TAB_IDS.length - 1, currentTabIndex + 1) : Math.max(0, currentTabIndex - 1);
      openTab(null, ALL_TAB_IDS[next]);
    }
  }, { passive: true });
}


// =============================================
// SIDEBAR TAB FILTER
// =============================================
function initSidebarTabFilter() {
  const input = document.getElementById('sidebarTabSearch');
  if (!input) return;
  input.addEventListener('input', function() {
    const val = this.value.toLowerCase();
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.style.display = btn.dataset.tabName?.includes(val) ? '' : 'none';
    });
  });
}

// =============================================
// SERVICE / PORTFOLIO FINDER (Explore tab)
// =============================================
function initServiceFinder() {
  const grid = document.getElementById('service-grid');
  if (!grid) return;

  const portfolioItems = [
    { name:'CUDFIRM Group Site', type:'Multi-Page Business', img:'https://placehold.co/300x200/0B3D2E/C8922A?text=CUDFIRM', link:'https://cudfirm.netlify.app', tags:['Business','Live Site'], search:'cudfirm business multi page' },
    { name:'Barber Shop Landing Page', type:'Landing Page Demo', img:'https://placehold.co/300x200/1A6B4A/fff?text=Barber+Shop', link:'#', tags:['Barber','Landing Page','Demo'], search:'barber salon hair landing page' },
    { name:'Fashion Designer Portfolio', type:'Portfolio Site Demo', img:'https://placehold.co/300x200/C8922A/fff?text=Fashion+Portfolio', link:'#', tags:['Fashion','Portfolio','Demo'], search:'fashion designer adire clothing portfolio' },
    { name:'Food Vendor Site', type:'Landing Page Demo', img:'https://placehold.co/300x200/E8B84B/0B3D2E?text=Food+Vendor', link:'#', tags:['Food','Catering','Demo'], search:'food vendor catering restaurant delivery' },
    { name:'Life Coach Site', type:'Service Site Demo', img:'https://placehold.co/300x200/4D9E7A/fff?text=Life+Coach', link:'#', tags:['Coach','Services','Demo'], search:'coach consultant trainer wellness' },
    { name:'Photography Portfolio', type:'Portfolio Site Demo', img:'https://placehold.co/300x200/8B4513/fff?text=Photography', link:'#', tags:['Photography','Portfolio','Demo'], search:'photographer photography portfolio gallery' },
    { name:'Solar Business Site', type:'Business Site Demo', img:'https://placehold.co/300x200/191970/fff?text=Solar+Energy', link:'#', tags:['Solar','Energy','Demo'], search:'solar energy inverter installation business' },
    { name:'Your Business Here', type:'Get Started Today', img:'https://placehold.co/300x200/3A4035/fff?text=Your+Business', link:'connect-content', tags:['Custom','New'], search:'custom new business website' },
  ];

  function renderCards(filter) {
    const term = (filter || '').toLowerCase();
    const filtered = term
      ? portfolioItems.filter(p => p.search.includes(term) || p.name.toLowerCase().includes(term) || p.type.toLowerCase().includes(term))
      : portfolioItems;

    grid.innerHTML = filtered.length
      ? filtered.map(p => `
          <div class="col" data-search-text="${p.search}">
            <div class="card h-100" style="overflow:hidden;cursor:pointer;" onclick="${p.link.startsWith('http') ? `window.open('${p.link}','_blank')` : `openTab(event,'${p.link}')`}">
              <img src="${p.img}" alt="${p.name}" style="width:100%;height:130px;object-fit:cover;" loading="lazy" onerror="this.src='https://placehold.co/300x200/0B3D2E/C8922A?text=CUDFIRM'" />
              <div style="padding:0.75rem;">
                <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:0.82rem;margin-bottom:0.2rem;">${p.name}</div>
                <div style="font-size:0.7rem;color:var(--n-muted);margin-bottom:0.4rem;">${p.type}</div>
                <div>${p.tags.map(t => `<span class="tag ${t === 'Live Site' ? 'green' : 'orange'}" style="font-size:0.6rem;">#${t}</span>`).join('')}</div>
              </div>
            </div>
          </div>`).join('')
      : `<div class="col-12 text-center p-4" style="color:var(--n-muted);font-size:0.85rem;">No portfolio items match "${filter}"</div>`;
  }

  const serviceSearchInput = document.getElementById('serviceSearchInput');
  const serviceSearchInputDesktop = document.getElementById('serviceSearchInputDesktop');
  const clearServiceSearchBtn = document.getElementById('clearServiceSearchBtn');

  const handleSearch = function(val) {
    renderCards(val);
    if (clearServiceSearchBtn) clearServiceSearchBtn.classList.toggle('d-none', !val);
    if (serviceSearchInput && serviceSearchInput !== this) serviceSearchInput.value = val;
    if (serviceSearchInputDesktop && serviceSearchInputDesktop !== this) serviceSearchInputDesktop.value = val;
  };

  if (serviceSearchInput) serviceSearchInput.addEventListener('input', function() { handleSearch.call(this, this.value); });
  if (serviceSearchInputDesktop) serviceSearchInputDesktop.addEventListener('input', function() { handleSearch.call(this, this.value); });

  if (clearServiceSearchBtn) {
    clearServiceSearchBtn.addEventListener('click', () => {
      if (serviceSearchInput) serviceSearchInput.value = '';
      if (serviceSearchInputDesktop) serviceSearchInputDesktop.value = '';
      renderCards();
      clearServiceSearchBtn.classList.add('d-none');
      if (serviceSearchInput) serviceSearchInput.focus();
    });
  }

  const disclaimerBtn = document.getElementById('disclaimer-toggle-btn');
  const disclaimerModalEl = document.getElementById('disclaimer-modal');
  if (disclaimerBtn && disclaimerModalEl && typeof bootstrap !== 'undefined') {
    const disclaimerModal = new bootstrap.Modal(disclaimerModalEl);
    disclaimerBtn.addEventListener('click', () => disclaimerModal.show());
  }

  renderCards();
}

// =============================================
// LIGHTBOX
// =============================================
function openLightbox(src, caption, link) {
  const lb = document.getElementById('imageLightbox');
  if (!lb) return;
  const lbImg = document.getElementById('lightboxImg');
  const lbCaption = document.getElementById('lightboxCaption');
  const enterBtn = document.getElementById('lightboxEnterBtn');

  lbImg.src = src;
  lbCaption.textContent = caption;

  const hasRealLink = link && link !== '#' && link.trim() !== '';
  if (hasRealLink) {
    enterBtn.href = link;
    enterBtn.target = '_self';
    enterBtn.style.display = 'inline-block';
  } else {
    enterBtn.href = '#';
    enterBtn.style.display = 'none';
  }

  lb.style.display = 'flex';
  lb.offsetHeight;
  lb.classList.add('lightbox-visible');
}

function closeLightbox() {
  const lb = document.getElementById('imageLightbox');
  if (!lb) return;
  lb.classList.remove('lightbox-visible');
  setTimeout(() => {
    if (!lb.classList.contains('lightbox-visible')) {
      lb.style.display = 'none';
    }
  }, 250);
}

function closeLightboxOutside(e) {
  if (e.target.id === 'imageLightbox') closeLightbox();
}

// =============================================
// PWA INSTALL
// =============================================
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  showToast('Add CUDFIRM to your home screen 📲', 5000);
});

// =============================================
// DOM READY — SINGLE LISTENER
// =============================================
document.addEventListener('DOMContentLoaded', function () {

  // STEP 1: Render structural UI
  renderSidebarTabs();
  renderFooterNav();
  renderMobileTabStrip();

  // STEP 2: Build all sections into DOM
  buildAllSections();

  // STEP 3: Store sections for global search
  const contentMain = document.querySelector('.content-main');
  if (contentMain) {
    originalSectionsInOrder = Array.from(contentMain.children).filter(n => n.tagName === 'SECTION');
  }

  // STEP 4: Open Home first
  openTab(null, 'tab1');

  // STEP 5: Restore last visited tab
  try {
    const saved = localStorage.getItem('cudfirm_last_tab');
    if (saved && saved !== 'tab1' && document.getElementById(saved)) {
      setTimeout(() => openTab(null, saved), 60);
    }
  } catch(e) {}

  // STEP 6: Global Search
  const searchIcon = document.getElementById('searchIcon');
  const searchInput = document.getElementById('searchInput');
  const searchContainer = document.getElementById('searchContainer');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  if (searchIcon && searchInput) {
    searchIcon.addEventListener('click', e => {
      e.stopPropagation();
      searchInput.classList.toggle('active');
      if (searchInput.classList.contains('active')) searchInput.focus();
      else if (searchInput.value && clearSearchBtn) clearSearchBtn.click();
    });
  }
  if (clearSearchBtn && searchInput) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      filterContent('');
      searchInput.focus();
    });
  }
  if (searchInput && clearSearchBtn) {
    searchInput.addEventListener('input', function() {
      clearSearchBtn.style.display = this.value ? 'block' : 'none';
      filterContent(this.value);
    });
  }
  if (searchContainer && searchInput) {
    document.addEventListener('click', e => {
      if (!searchContainer.contains(e.target) && searchInput.classList.contains('active')) {
        searchInput.classList.remove('active');
      }
    });
  }

  // STEP 7: View-specific search inputs
  document.querySelectorAll('.view-search').forEach(input => {
    input.addEventListener('input', handleViewSearch);
  });

  // STEP 8: Modal close
  const modal = document.getElementById('modal');
  const modalCloseBtn = document.querySelector('.modal-close');
  if (modal && modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  }

  // STEP 9: Lightbox on grid items (delegated)
  document.addEventListener('click', e => {
    const gridItem = e.target.closest('.grid-item[data-img]');
    if (gridItem) {
      e.preventDefault();
      e.stopPropagation();
      const img = gridItem.getAttribute('data-img');
      const name = gridItem.getAttribute('data-name');
      const link = gridItem.getAttribute('data-link');
      openLightbox(img, name, link);
    }
  });

  // STEP 10: All feature inits
  initDarkMode();
  initReadingProgressBar();
  initBackToTop();
  initLiveUserCount();
  initKeyboardShortcuts();
  initSwipeNavigation();
  initSidebarTabFilter();
  initServiceFinder();

  // STEP 11: First-visit hint
  try {
    if (!localStorage.getItem('cudfirm_hint_shown')) {
      setTimeout(() => {
        showToast('Tip: Press ? for keyboard shortcuts ⌨️', 4500);
        localStorage.setItem('cudfirm_hint_shown', '1');
      }, 3500);
    }
  } catch(e) {}

});