/**
 * ================================================
 *  NSEYIN — MASTER SCRIPT
 *  Multifaceted Company — Local & International
 *  All tab content rendered dynamically for speed
 * ================================================
 */

// =============================================
// GLOBAL STATE
// =============================================
let originalSectionsInOrder = [];
let activeTabIdBeforeSearch = null;

const ALL_TAB_IDS = [
  'blog-content','explore-content','tab1','forum-content','connect-content',
  'tab2','tab3','tab4','tab5','tab6','tab7','tab8','tab9','tab10',
  'tab11','tab12','tab13','tab14','tab15','tab16','tab17','tab18','tab19','tab20'
];
let currentTabIndex = 2;

const TAB_NAMES = {
  'tab1':'Home','tab2':'Sectors','tab3':'Services','tab4':'People',
  'tab5':'Events','tab6':'Templates','tab7':'Grants','tab8':'Showcase',
  'tab9':'Our Stars','tab10':'Love Notes','tab11':'Local Guides',
  'tab12':'Spark','tab13':'Discover','tab14':'Deals','tab15':'Community',
  'tab16':'Submit A Tip','tab17':'Investment','tab18':'Diaspora','tab19':'Media','tab20':'Partners',
  'blog-content':'Blog','explore-content':'Explore',
  'forum-content':'Forum','connect-content':'Connect'
};

let breadcrumbHistory = [];

// =============================================
// SIDEBAR TABS DATA
// =============================================
const SIDEBAR_TABS = [
  { id: 'tab1',  label: 'Home' },
  { id: 'tab2',  label: 'Sectors' },
  { id: 'tab3',  label: 'Services' },
  { id: 'tab4',  label: 'People' },
  { id: 'tab5',  label: 'Events' },
  { id: 'tab6',  label: 'Templates' },
  { id: 'tab7',  label: 'Grants' },
  { id: 'tab8',  label: 'Showcase' },
  { id: 'tab9',  label: 'Our Stars' },
  { id: 'tab10', label: 'Love Notes' },
  { id: 'tab11', label: 'Local Guides' },
  { id: 'tab12', label: 'Spark 🔥', badge: 'hot' },
  { id: 'tab13', label: 'Discover' },
  { id: 'tab14', label: 'Deals', badge: 'new' },
  { id: 'tab15', label: 'Community' },
  { id: 'tab16', label: 'Submit A Tip' },
  { id: 'tab17', label: 'Investment' },
  { id: 'tab18', label: 'Diaspora' },
  { id: 'tab19', label: 'Media' },
  { id: 'tab20', label: 'Partners' },
];

// =============================================
// FOOTER NAV DATA
// =============================================
const FOOTER_NAV = [
  { id: 'blog-content',    icon: 'bi-grid',        label: 'Blog' },
  { id: 'explore-content', icon: 'bi-door-open',   label: 'Explore' },
  { id: 'tab1',            icon: 'bi-house-fill',  label: 'Home' },
  { id: 'forum-content',   icon: 'bi-chat-dots',   label: 'Forum' },
  { id: 'connect-content', icon: 'bi-person-check',label: 'Connect' },
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

// =============================================
// 2. RENDER FOOTER NAV
// =============================================
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
  // Insert a horizontal scrollable chip strip inside .content-area, after the header,
  // for mobile screens where the sidebar (and its tabs) are hidden.
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

  // Insert right after the header
  contentHeader.insertAdjacentElement('afterend', strip);
}

function updateMobileTabStrip(activeTabId) {
  document.querySelectorAll('.mobile-tab-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.tabId === activeTabId);
    if (chip.dataset.tabId === activeTabId) {
      // Scroll the active chip into view
      chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  });
}
function buildAllSections() {
  const main = document.getElementById('contentMain');
  if (!main) return;

  // All sections as HTML strings — injected at once
  const sections = [
    buildTab1(),
    buildTab2(),
    buildTab3(),
    buildTab4(),
    buildTab5(),
    buildTab6(),
    buildTab7(),
    buildTab8(),
    buildTab9(),
    buildTab10(),
    buildTab11(),
    buildTab12(),
    buildTab13(),
    buildTab14(),
    buildTab15(),
    buildTab16(),
    buildTab17(),
    buildTab18(),
    buildTab19(),
    buildTab20(),
    buildBlogContent(),
    buildExploreContent(),
    buildForumContent(),
    buildConnectContent(),
  ];

  main.innerHTML = sections.join('');
}

// ─────────────────────────────────────────────
// TAB 1: HOME
// ─────────────────────────────────────────────
function buildTab1() {
  const partners = [
    { img: 'img/cudfirm001.png', link: 'https://cudfirm.netlify.app', name: 'CUDFIRM', alt: 'CUDFIRM GROUP' },
    { img: 'img/kingmaster.png', link: '#', name: 'King Master', alt: 'The King Master' },
    { img: 'https://placehold.co/80x80/0B3D2E/C8922A?text=NS', link: '#', name: 'NSEYIN Tech', alt: 'NSEYIN Tech' },
    { img: 'https://placehold.co/80x80/1A6B4A/fff?text=NX', link: '#', name: 'NSEYIN Xport', alt: 'NSEYIN Export' },
    { img: 'https://placehold.co/80x80/C8922A/fff?text=NH', link: '#', name: 'NSEYIN Health', alt: 'NSEYIN Health' },
    { img: 'https://placehold.co/80x80/4D9E7A/fff?text=NL', link: '#', name: 'NSEYIN Logistics', alt: 'NSEYIN Logistics' },
    { img: 'https://placehold.co/80x80/E8B84B/0B3D2E?text=NE', link: '#', name: 'NSEYIN Energy', alt: 'NSEYIN Energy' },
    { img: 'https://placehold.co/80x80/3A4035/fff?text=+', link: 'connect-content', name: 'Join Us', alt: 'Become a Partner' },
  ];

  const brands = [
    { img: 'https://placehold.co/80x80/5f9ea0/ffffff?text=BLOG', link: '#', name: 'NSEYIN Blog', alt: 'NSEYIN Blog' },
    { img: 'img/lobah.jpeg', link: 'https://www.instagram.com/lobahvisuals', name: 'Lobah Visuals', alt: 'LOBAH VISUALS' },
    { img: 'img/elichi.png', link: 'https://www.instagram.com/elichiskitchen', name: 'Elichi Catering', alt: 'ELICHI' },
    { img: 'img/damkaz.png', link: '#', name: 'Damkaz Couture', alt: 'DAMKAZ' },
    { img: 'img/elistiches.png', link: '#', name: "Eli's Stitches", alt: 'ELI STITCHES' },
    { img: 'https://placehold.co/80x80/C8922A/fff?text=AG', link: '#', name: 'AgriLink', alt: 'AgriLink' },
    { img: 'https://placehold.co/80x80/0B3D2E/C8922A?text=TK', link: '#', name: 'TechKraft', alt: 'TechKraft' },
    { img: 'https://placehold.co/80x80/1A6B4A/fff?text=WC', link: '#', name: 'WaterCycle', alt: 'WaterCycle' },
    { img: 'https://placehold.co/80x80/8B4513/fff?text=WD', link: '#', name: 'WoodCraft', alt: 'WoodCraft' },
    { img: 'https://placehold.co/80x80/4B0082/fff?text=SS', link: '#', name: 'Solar Spark', alt: 'Solar Spark' },
    { img: 'https://placehold.co/80x80/191970/fff?text=+', link: '#', name: 'Vacant', alt: 'Vacant Slot' },
  ];

  const services = [
    { img: 'img/nseyin.png', link: 'massage.html', name: 'Massage & Wellness', alt: 'Massage & Wellness' },
    { img: 'img/adire.jpg', link: '#', name: 'Adire Textiles', alt: 'ADIRE' },
    { img: 'img/hosting.jpg', link: '#', name: 'Web Hosting', alt: 'WEB HOSTING' },
    { img: 'img/real-auto.jpg', link: '#', name: 'Estates & Autos', alt: 'REAL ESTATE & AUTOMOBILE' },
    { img: 'img/shop.jpeg', link: '#', name: 'NSEYIN Shop', alt: 'SHOP' },
    { img: 'img/creative.jpeg', link: '#', name: 'Creative Studio', alt: 'CREATIVE' },
    { img: 'https://placehold.co/80x80/0B3D2E/C8922A?text=FD', link: '#', name: 'Food Delivery', alt: 'Food Delivery' },
    { img: 'https://placehold.co/80x80/C8922A/fff?text=LG', link: '#', name: 'Logistics', alt: 'Logistics' },
    { img: 'https://placehold.co/80x80/4D9E7A/fff?text=HX', link: '#', name: 'Health Express', alt: 'Health Express' },
    { img: 'https://placehold.co/80x80/E8B84B/0B3D2E?text=SP', link: '#', name: 'Solar Power', alt: 'Solar Power' },
    { img: 'https://placehold.co/80x80/1A6B4A/fff?text=ED', link: '#', name: 'Edu Hub', alt: 'Edu Hub' },
    { img: 'https://placehold.co/80x80/5f9ea0/fff?text=+', link: '#', name: 'More Soon', alt: 'Coming Soon' },
  ];

  const gridItems = (items) => items.map(p =>
    `<div class="col grid-item" onclick="openLightbox('${p.img}','${p.name}','${p.link}')">
      <img src="${p.img}" data-link="${p.link}" alt="${p.alt}" class="img-fluid" loading="lazy" onerror="this.src='https://placehold.co/80x80/0B3D2E/C8922A?text=N'" />
      <span class="text">${p.name}</span>
    </div>`
  ).join('');

  return `
  <section id="tab1" class="tab-content view">
    <div class="home-hero">
      <span class="hero-eyebrow">Welcome to</span>
      <h1 class="hero-title">NSEYIN</h1>
      <p class="hero-sub">Where every need meets a solution — locally and internationally. We connect people, services, and opportunities.</p>
      <div class="hero-cta-row">
        <button class="btn-hero-primary" onclick="openTab(event,'tab3')">Explore Services</button>
        <button class="btn-hero-secondary" onclick="openTab(event,'connect-content')">Get In Touch</button>
      </div>
    </div>

    <div class="p-3">
      <h6 class="sticky-top d-flex align-items-center gap-2 py-2">
        <span class="badge text-bg-primary">NSEYIN GROUP</span>
        <span style="font-size:0.72rem;color:var(--n-muted);font-weight:400;">Multifaceted. Global. Reliable.</span>
      </h6>
      <hr class="my-2 w-25" />

      <!-- Partners & Sponsors -->
      <div class="card card-section mb-3">
        <div class="card-header">
          <h3><i class="bi bi-stars me-1" style="color:var(--n-gold)"></i>Partners &amp; Sponsors</h3>
          <button class="btn btn-sm btn-success see-all" onclick="openTab(event,'tab20')">View All</button>
        </div>
        <div class="card-content row icon-grid row-cols-3 row-cols-sm-4 row-cols-md-5 row-cols-lg-7 row-cols-xl-9 quote0">
          ${gridItems(partners)}
        </div>
      </div>

      <!-- Trending Brands -->
      <div class="card card-section mb-3">
        <div class="card-header">
          <h3><i class="bi bi-fire me-1" style="color:#dc5032"></i>Trending Brands</h3>
          <button class="btn btn-sm btn-primary see-all" onclick="openTab(event,'explore-content')">View All</button>
        </div>
        <div class="card-content row icon-grid row-cols-3 row-cols-sm-4 row-cols-md-5 row-cols-lg-7 row-cols-xl-9 quote0">
          ${gridItems(brands)}
        </div>
      </div>

      <!-- Our Services -->
      <div class="card card-section mb-3">
        <div class="card-header">
          <h3><i class="bi bi-briefcase me-1" style="color:var(--n-gold)"></i>Our Services</h3>
          <button class="btn btn-sm btn-warning see-all" onclick="openTab(event,'tab3')">View All</button>
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
          <span class="icons-social__item"><a class="icons-social__link" href="#" aria-label="CodePen"><i class="fab fa-codepen"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://instagram.com/nseyin" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="#" aria-label="Facebook"><i class="fab fa-facebook"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="#" aria-label="Twitter/X"><i class="fab fa-twitter"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="#" aria-label="LinkedIn"><i class="fab fa-linkedin"></i></a></span>
        </article>
      </div>
    </footer>
  </section>`;
}

// ─────────────────────────────────────────────
// TAB 2: SECTORS
// ─────────────────────────────────────────────
function buildTab2() {
  const sectors = [
    { icon: 'bi-cpu',              name: 'Technology',        desc: 'Software, hardware, AI, fintech, and digital platforms.' },
    { icon: 'bi-cart3',            name: 'Commerce',          desc: 'Retail, e-commerce, supply chain, and trade.' },
    { icon: 'bi-heart-pulse',      name: 'Healthcare',        desc: 'Pharmacy, telemedicine, wellness, and health tech.' },
    { icon: 'bi-house-door',       name: 'Real Estate',       desc: 'Residential, commercial, rentals, and property management.' },
    { icon: 'bi-truck',            name: 'Logistics',         desc: 'Delivery, freight, warehousing, and supply chain.' },
    { icon: 'bi-lightning-charge', name: 'Energy & Solar',    desc: 'Renewable energy, solar installation, and power solutions.' },
    { icon: 'bi-egg-fried',        name: 'Agriculture & Food',desc: 'Farming, food processing, export, and agro-products.' },
    { icon: 'bi-building',         name: 'Construction',      desc: 'Civil works, renovation, interior design, and facilities.' },
    { icon: 'bi-mortarboard',      name: 'Education',         desc: 'Tutoring, online learning, training, and certification.' },
    { icon: 'bi-palette',          name: 'Creative Arts',     desc: 'Design, media, photography, fashion, and entertainment.' },
    { icon: 'bi-globe',            name: 'Export & Import',   desc: 'International trade, diaspora goods, and customs support.' },
    { icon: 'bi-people',           name: 'Human Capital',     desc: 'Recruitment, HR services, staffing, and talent management.' },
    { icon: 'bi-droplet',          name: 'Clean Water',       desc: 'Water treatment, delivery, borehole, and purification.' },
    { icon: 'bi-phone',            name: 'Telecom & Mobile',  desc: 'Data, POS, phone accessories, airtime, and connectivity.' },
    { icon: 'bi-star',             name: 'Lifestyle',         desc: 'Laundry, beauty, massage, events, and personal services.' },
    { icon: 'bi-bank',             name: 'Finance & Banking', desc: 'Microfinance, investment, insurance, and fintech services.' },
  ];

  const cards = sectors.map(s =>
    `<div class="col">
      <div class="sector-card">
        <div class="sector-icon"><i class="bi ${s.icon}"></i></div>
        <div class="sector-name">${s.name}</div>
        <div class="sector-desc">${s.desc}</div>
      </div>
    </div>`
  ).join('');

  return `
  <section id="tab2" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Sectors</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      <i class="bi bi-info-circle me-1"></i>
      Use our classified sectors for project planning, knowledge onboarding, and staying relevant across industries at home and abroad.
    </p>
    <div class="custom-max-w-4xl mx-auto">
      <h2 class="fw-bold text-uppercase mb-3 custom-text-sm custom-tracking-widest custom-text-gray-500">Active Sectors</h2>
      <div class="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3 stagger-children">
        ${cards}
      </div>
      <button class="view-more-btn mt-4" onclick="openTab(event,'connect-content')">
        <i class="bi bi-plus-circle me-1"></i>Suggest A New Sector
      </button>
    </div>
  </section>`;
}

// ─────────────────────────────────────────────
// TAB 3: SERVICES
// ─────────────────────────────────────────────
function buildTab3() {
  const items = [
    { icon:'POS & Data Services',      desc:'POS Machine Setup, Data Bundles, Airtime Top-Up & Mobile Money.',             tags:['#Fintech','#Mobile','#POS'],           search:'pos data airtime mobile money network mtn glo airtel' },
    { icon:'Phone Accessories',         desc:'Chargers, Cases, Screen Guards, Earphones & Repair Services.',                tags:['#Tech','#Mobile','#Gadgets'],          search:'phone charger accessories screen guard repair earphones' },
    { icon:'Foodstuff Delivery',        desc:'Fresh Market Produce, Groceries & Bulk Orders Delivered Fast.',              tags:['#Food','#Grocery','#Delivery'],         search:'food groceries market tomatoes rice beans yam delivery' },
    { icon:'Hygiene & Personal Care',   desc:'Toiletries, Sanitizers, Household & Baby Care Products.',                   tags:['#Health','#Home','#Baby'],             search:'hygiene soap sanitizer baby care toiletries household' },
    { icon:'Clean Water Supply',        desc:'Sachet Water, Dispenser Refills, Borehole & Tanker Services.',               tags:['#Water','#Health','#Utilities'],       search:'water sachet dispenser borehole tanker clean drinking' },
    { icon:'Logistics & Delivery',      desc:'Same-Day Dispatch, State-to-State Haulage & International Shipping.',        tags:['#Logistics','#Shipping','#Export'],    search:'logistics delivery dispatch haulage shipping courier send' },
    { icon:'Solar Energy Solutions',    desc:'Panel Installation, Inverter Systems, Battery Backup & Maintenance.',        tags:['#Solar','#Energy','#Green'],          search:'solar inverter battery energy panel installation power' },
    { icon:'Laundry & Cleaning',        desc:'Doorstep Pickup, Spotless Laundry, Home & Office Cleaning.',                tags:['#Home','#Office','#Commercial'],       search:'laundry cleaning pickup spotless home office dry clean' },
    { icon:'Pharmacy / Health Support', desc:'Licensed Medication Delivery & Telehealth Bookings.',                       tags:['#Healthcare','#Pharmacy'],            search:'pharmacy medication health doctor telehealth prescription' },
    { icon:'Affordable Housing Links',  desc:'Verified Rentals, Mini-Flats, Co-Living & Maintenance.',                    tags:['#Shelter','#Real-Estate'],            search:'housing rent apartment flat real estate co-living property' },
    { icon:'Food Processing & Export',  desc:'Packaged Food (Garri, Dried Fish, Cashew etc.) — B2B & B2C.',               tags:['#Agro','#Food','#Export'],            search:'food processing garri dried fish cashew export agro b2b' },
    { icon:'Massage & Wellness',        desc:'Professional Body Massage — Home, Office & Doorstep Sessions.',             tags:['#Relaxation','#Wellness','#Home-Service'], search:'massage body spa relaxation wellness doorstep home office' },
    { icon:'NIN Slip to Card',          desc:'NIN Slip to Physical ID Card Conversion — Fast & Reliable.',                tags:['#Identity','#Documentation'],         search:'NIN slip card national identification conversion ID document' },
    { icon:'Web Design & Hosting',      desc:'Affordable Websites, E-Commerce Stores & Domain Hosting.',                  tags:['#Tech','#Digital','#Web'],            search:'web design hosting domain website ecommerce digital' },
    { icon:'Creative & Media Studio',   desc:'Photography, Videography, Branding, Flyers & Social Media Content.',        tags:['#Creative','#Media','#Branding'],     search:'photography video branding flyer social media design creative' },
    { icon:'Got A Service?',            desc:'Know A Service That Should Be Listed Here? Suggest It.',                    tags:['#Suggest','#Submit'],                 search:'suggest submit new service vacancy listing', isSpecial: true },
  ];

  const listItems = items.map(item => `
    <div class="list-item" data-search-text="${item.search || ''}">
      <div class="item-icon">${item.icon}</div>
      <div class="item-content d-flex justify-content-between align-items-center gap-2">
        <h6>${item.desc}</h6>
        <a href="#" class="btn btn-sm ${item.isSpecial ? 'btn-primary' : 'btn-success'} flex-shrink-0" onclick="${item.isSpecial ? "openTab(event,'connect-content')" : "openTab(event,'connect-content')"}" style="font-size:0.72rem;padding:0.3rem 0.65rem;">${item.isSpecial ? 'Suggest' : 'Request'}</a>
      </div>
      <p class="mb-0" style="font-size:0.72rem;">NSEYIN &middot; ${item.tags.map(t => `<span class="tag ${t.startsWith('#H') ? 'green' : t.startsWith('#T') || t.startsWith('#D') ? 'gray' : 'orange'}">${t}</span>`).join('')}</p>
    </div>`
  ).join('');

  return `
  <section id="tab3" class="tab-content view">
    <h6 class="sticky-top py-2 px-3"><span class="badge text-bg-primary">Services</span></h6>
    <div class="tab3-search-bar sticky-top px-3 py-2">
      <input type="text" class="view-search w-100" data-target-list="#tab3-list" placeholder="Search services (e.g. food, solar, delivery)..." />
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
        <p>We&apos;re building something great here. Your ideas shape what goes on this page — tell us what you'd love to see!</p>
        <button class="btn btn-primary btn-lg mt-2" onclick="openTab(event,'connect-content')">Share Your Ideas</button>
      </div>
    </div>
  </section>`;
}

// ─────────────────────────────────────────────
// TABS 4–20
// ─────────────────────────────────────────────
function buildTab4() {
  return buildUnderConstruction('tab4','People','Connect with verified professionals, freelancers, vendors, and service providers across Nigeria and the diaspora.','People');
}

function buildTab5() {
  return `
  <section id="tab5" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Events</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      Discover upcoming webinars, trade expos, workshops, and networking events — locally and internationally.
    </p>
    <div class="row g-3">
      ${[
        { title:'NSEYIN Networking Night', date:'Jun 15, 2025', loc:'Lagos, Nigeria', color:'#0B3D2E', tag:'In-Person' },
        { title:'Export Business Masterclass', date:'Jun 28, 2025', loc:'Zoom — Online', color:'#C8922A', tag:'Virtual' },
        { title:'Agro-Tech Summit 2025', date:'Jul 10, 2025', loc:'Abuja, Nigeria', color:'#1A6B4A', tag:'Hybrid' },
        { title:'Diaspora Connect Forum', date:'Aug 2, 2025', loc:'London, UK', color:'#4D9E7A', tag:'In-Person' },
      ].map(e => `
        <div class="col-12 col-md-6">
          <div class="card p-3 d-flex flex-row gap-3 align-items-start">
            <div style="background:${e.color};color:#fff;border-radius:10px;padding:0.6rem 0.75rem;text-align:center;min-width:52px;flex-shrink:0;">
              <div style="font-family:'Syne',sans-serif;font-size:1rem;font-weight:800;line-height:1;">${e.date.split(' ')[1].replace(',','')}</div>
              <div style="font-size:0.6rem;letter-spacing:0.1em;text-transform:uppercase;opacity:0.85;">${e.date.split(' ')[0]}</div>
            </div>
            <div>
              <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:0.88rem;margin-bottom:0.2rem;">${e.title}</div>
              <div style="font-size:0.75rem;color:var(--n-muted);"><i class="bi bi-geo-alt me-1"></i>${e.loc}</div>
              <span class="tag orange mt-1 d-inline-block">#${e.tag}</span>
            </div>
          </div>
        </div>`
      ).join('')}
    </div>
    <button class="view-more-btn mt-3" onclick="openTab(event,'connect-content')">
      <i class="bi bi-calendar-plus me-1"></i>Submit Your Event
    </button>
  </section>`;
}

function buildTab6() {
  const templates = [
    { icon:'bi-file-earmark-person', name:'Professional CV', desc:'Clean, ATS-optimised resume template.', color:'#0B3D2E' },
    { icon:'bi-file-earmark-text',  name:'Business Proposal', desc:'Investor-ready proposal with financials.', color:'#C8922A' },
    { icon:'bi-receipt',            name:'Invoice Template', desc:'Branded invoice for freelancers & SMEs.', color:'#1A6B4A' },
    { icon:'bi-envelope-paper',     name:'Cover Letter', desc:'Compelling cover letter structure.', color:'#4D9E7A' },
    { icon:'bi-bar-chart',          name:'Business Plan', desc:'Full-format business plan outline.', color:'#E8B84B' },
    { icon:'bi-file-earmark-check', name:'Service Contract', desc:'Legal service agreement template.', color:'#8B4513' },
  ];
  return `
  <section id="tab6" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Templates</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      Access professionally designed templates for resumes, proposals, invoices, contracts, and more — free for NSEYIN members.
    </p>
    <div class="row g-3 stagger-children">
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
        </div>`
      ).join('')}
    </div>
  </section>`;
}

function buildTab7() {
  const grants = [
    { name:'Tony Elumelu Foundation Grant', amount:'$5,000', deadline:'Dec 31, 2025', sector:'All Sectors', link:'https://www.tonyelumelufoundation.org' },
    { name:'Google for Startups Africa', amount:'Up to $100K credits', deadline:'Rolling', sector:'Tech', link:'https://startup.google.com' },
    { name:'CBN MSME Fund', amount:'₦500K – ₦5M', deadline:'Rolling', sector:'SMEs', link:'#' },
    { name:'NIRSAL Agro Fund', amount:'₦1M – ₦50M', deadline:'Quarterly', sector:'Agriculture', link:'#' },
    { name:'World Bank Youth Initiative', amount:'$10,000', deadline:'Mar 2026', sector:'Youth & Innovation', link:'#' },
    { name:'AfDB Digital Fund', amount:'$25,000', deadline:'Jun 2026', sector:'Digital & Fintech', link:'#' },
  ];
  return `
  <section id="tab7" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Grants</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      Browse curated grants, funding opportunities, and financial support programs for individuals, SMEs, and startups in Nigeria and across Africa.
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
        </div>`
      ).join('')}
    </div>
    <button class="view-more-btn mt-3" onclick="openTab(event,'connect-content')">
      <i class="bi bi-megaphone me-1"></i>Submit A Grant Listing
    </button>
  </section>`;
}

function buildTab8() {
  return buildUnderConstruction('tab8','Showcase','A premium space to upload your branded items, portfolio, gigs, and market your business directly to NSEYIN\u2019s growing audience.','Showcase');
}

function buildTab9() {
  const stars = [
    { name:'Adaeze Okonkwo', role:'Export Entrepreneur', quote:'NSEYIN helped me get my first international food export deal. Life-changing!', color:'#0B3D2E' },
    { name:'Emeka Nwosu', role:'Solar Installer', quote:'The grant listings on NSEYIN connected me to funding I never knew existed.', color:'#C8922A' },
    { name:'Fatima Usman', role:'Fashion Designer', quote:'My brand got 3x more visibility after listing on NSEYIN. Absolutely recommend.', color:'#1A6B4A' },
    { name:'Chukwudi Eze', role:'Tech Founder', quote:'NSEYIN is the missing infrastructure for Nigerian entrepreneurs. Period.', color:'#4D9E7A' },
  ];
  return `
  <section id="tab9" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Our Stars</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      Featuring success stories and case studies from our community. These are people who took action — and won.
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
        </div>`
      ).join('')}
    </div>
    <button class="view-more-btn mt-3" onclick="openTab(event,'connect-content')">
      <i class="bi bi-star me-1"></i>Share Your Success Story
    </button>
  </section>`;
}

function buildTab10() {
  const notes = [
    { text:'The NSEYIN team handled our logistics like pros. Quick, reliable, no drama.', by:'Amara, Kano', stars:5 },
    { text:'Got my NIN card converted in less than 2 days. Thought it would take weeks. Impressed!', by:'Oluwaseun, Lagos', stars:5 },
    { text:'Clean water delivery was on time, affordable, and the guys were courteous. 10/10.', by:'Mrs. Adeyemi, Ibadan', stars:5 },
    { text:'The web hosting package was exactly what my small business needed. No hidden charges.', by:'Daniel, Enugu', stars:4 },
    { text:'Massage service at my house? I didn\'t believe it until it happened. Absolutely amazing.', by:'Chisom, Abuja', stars:5 },
    { text:'NSEYIN truly cares about their customers. I felt heard and valued every step of the way.', by:'Grace, Rivers', stars:5 },
  ];
  const stars = (n) => Array(5).fill(0).map((_,i) => `<i class="bi bi-star-fill" style="color:${i<n?'#C8922A':'#ccc'};font-size:0.7rem;"></i>`).join('');
  return `
  <section id="tab10" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Love Notes</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      Real words from real people — our community's wall of love.
    </p>
    <div class="row g-3 stagger-children">
      ${notes.map(n => `
        <div class="col-12 col-md-6">
          <div class="card p-3">
            <div class="mb-2">${stars(n.stars)}</div>
            <p style="font-size:0.85rem;font-style:italic;margin-bottom:0.6rem;">"${n.text}"</p>
            <div style="font-size:0.72rem;font-weight:700;color:var(--n-jade);">— ${n.by}</div>
          </div>
        </div>`
      ).join('')}
    </div>
    <button class="view-more-btn mt-3" onclick="openTab(event,'connect-content')">
      <i class="bi bi-heart me-1"></i>Leave A Review
    </button>
  </section>`;
}

function buildTab11() {
  const guides = [
    { city:'Lagos', icon:'bi-buildings', tips:['Use Uber/Bolt for safe rides in VI & Lekki','Best suya spots close at 10pm — go early','Pay with transfer everywhere — cash is rare in malls'] },
    { city:'Abuja', icon:'bi-bank', tips:['Wuse 2 & Maitama have the best restaurants','Traffic peaks between 7–9am on Airport Road','Garki market is cheapest for bulk buys'] },
    { city:'London', icon:'bi-airplane', tips:['Peckham is the hub for Nigerian goods & food','Register for HMRC Self-Assessment if self-employed','NSEYIN can help ship goods back home affordably'] },
    { city:'Houston, USA', icon:'bi-globe-americas', tips:['Alief area has the largest Nigerian community','International supermarkets stock Naija goods','Contact NSEYIN for business setup guidance'] },
  ];
  return `
  <section id="tab11" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Local Guides</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      City-by-city guides curated for Nigerians at home and in the diaspora. Practical tips that actually work.
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
        </div>`
      ).join('')}
    </div>
    <button class="view-more-btn mt-3" onclick="openTab(event,'connect-content')">
      <i class="bi bi-map me-1"></i>Suggest A City Guide
    </button>
  </section>`;
}

function buildTab12() {
  const sparks = [
    { title:'Start Your Export Business in 30 Days', tag:'Business', icon:'bi-box-arrow-up-right', color:'#C8922A' },
    { title:'How Solar is Changing Rural Nigeria', tag:'Energy', icon:'bi-lightning-charge-fill', color:'#1A6B4A' },
    { title:'5 Side Hustles That Work in 2025', tag:'Finance', icon:'bi-cash-coin', color:'#0B3D2E' },
    { title:'Build a Business Website for Under ₦50K', tag:'Tech', icon:'bi-globe2', color:'#4D9E7A' },
    { title:'How to Apply for the Tony Elumelu Grant', tag:'Grants', icon:'bi-award', color:'#E8B84B' },
    { title:'The Rise of Agribusiness in West Africa', tag:'Agriculture', icon:'bi-tree', color:'#8B4513' },
  ];
  return `
  <section id="tab12" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Spark 🔥</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      Ideas, inspiration, and motivation for your next big move. Spark your ambition.
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
        </div>`
      ).join('')}
    </div>
    <button class="view-more-btn mt-3" onclick="openTab(event,'connect-content')">
      <i class="bi bi-pencil-square me-1"></i>Write For Spark
    </button>
  </section>`;
}

function buildTab13() {
  return buildUnderConstruction('tab13','Discover','Discover new tools, resources, curated products, and people to help you succeed — at home and across the globe.','Discover');
}

function buildTab14() {
  const deals = [
    { title:'50% Off Solar Consultation', validity:'Ends Jun 30', code:'SOLAR50', color:'#C8922A' },
    { title:'Free First Laundry Pickup', validity:'New customers only', code:'WASH1ST', color:'#0B3D2E' },
    { title:'₦500 Off Any Delivery Over ₦5K', validity:'This month only', code:'SHIP500', color:'#1A6B4A' },
    { title:'Free Website Domain (1 year)', validity:'With hosting plan', code:'NSYDOMAIN', color:'#4D9E7A' },
  ];
  return `
  <section id="tab14" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Deals ✨</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      Exclusive deals and discounts available only to NSEYIN community members. Act fast — these expire!
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
        </div>`
      ).join('')}
    </div>
    <button class="view-more-btn mt-3" onclick="openTab(event,'connect-content')">
      <i class="bi bi-tag me-1"></i>Submit A Deal
    </button>
  </section>`;
}

function buildTab15() {
  return `
  <section id="tab15" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Community</span></h6>
    <div class="view-header px-0 mb-3">
      <h1 class="view-title">Community Feed</h1>
    </div>
    <div class="card mb-3">
      <div class="card-header"><h3><i class="bi bi-megaphone me-1" style="color:var(--n-gold)"></i>Latest Announcement</h3></div>
      <div class="card-content">
        <p style="font-size:0.88rem;">Welcome to the new NSEYIN platform! We've completely redesigned our community hub. Explore the new features, connect with fellow members, and let us know your thoughts in the feedback section.</p>
        <span class="tag green">#Launch</span><span class="tag orange">#NewFeature</span>
      </div>
    </div>
    <div class="card">
      <div class="card-content under-construction">
        <i class="bi bi-chat-heart"></i>
        <h3>Community Discussions — Coming Soon</h3>
        <p>Join threads, share ideas, ask questions, and connect with over 2,400 members of the NSEYIN community.</p>
        <button class="btn btn-primary mt-2" onclick="openTab(event,'connect-content')">Get Notified at Launch</button>
      </div>
    </div>
  </section>`;
}

function buildTab16() {
  return `
  <section id="tab16" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Submit A Tip</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      Have a news tip, a hidden gem, a business tool, or a resource the community should know about? Submit it here.
    </p>
    <div class="card">
      <div class="card-content">
        <div class="mb-3">
          <label class="form-label">Your Tip or Resource</label>
          <input type="text" class="form-control" id="tipTitle" placeholder="e.g. Best app for Nigerian freelancers..." />
        </div>
        <div class="mb-3">
          <label class="form-label">More Details</label>
          <textarea class="form-control" id="tipDetails" rows="4" placeholder="Why is this valuable? Who does it help?"></textarea>
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

function buildTab17() {
  return buildUnderConstruction('tab17','Investment','Discover vetted investment opportunities, partnerships, and co-founder matches across NSEYIN&apos;s network of businesses and ventures.','Investment');
}

function buildTab18() {
  return buildUnderConstruction('tab18','Diaspora Hub','Dedicated resources for Nigerians abroad — shipping, remittances, business registration back home, and community connections.','Diaspora');
}

function buildTab19() {
  return buildUnderConstruction('tab19','Media & Press','NSEYIN press releases, brand kit, media coverage, and publication-ready assets for journalists and content creators.','Media');
}

function buildTab20() {
  return buildUnderConstruction('tab20','All Partners','The full directory of NSEYIN&apos;s verified partners, sponsors, and affiliated brands across Nigeria and the diaspora.','Partners');
}

// ─────────────────────────────────────────────
// BLOG CONTENT
// ─────────────────────────────────────────────
function buildBlogContent() {
  return `
  <section id="blog-content" class="view tab-content p-3">
    <div class="view-header px-0">
      <h1 class="view-title">NSEYIN Blog</h1>
      <div class="header-actions">
        <span class="btn btn-sm btn-primary"><i class="bi bi-newspaper me-1"></i>Business</span>
        <span class="btn btn-sm btn-primary"><i class="bi bi-cpu me-1"></i>Tech</span>
        <span class="btn btn-sm btn-primary"><i class="bi bi-globe2 me-1"></i>Diaspora</span>
        <span class="btn btn-sm btn-primary"><i class="bi bi-tree me-1"></i>Agro</span>
        <span class="btn btn-sm btn-primary"><i class="bi bi-lightning me-1"></i>Energy</span>
      </div>
    </div>
    <div class="grid-container mt-3">
      <div class="card stat-card">
        <div class="card-icon stat-icon-courses"><i class="bi bi-grid-fill"></i></div>
        <div class="card-content"><h3>16 Active Sectors</h3><p>Spanning tech, agro, health & more.</p></div>
      </div>
      <div class="card stat-card">
        <div class="card-icon stat-icon-providers"><i class="bi bi-people-fill"></i></div>
        <div class="card-content"><h3>2,450+</h3><p>Verified service providers listed.</p></div>
      </div>
      <div class="card stat-card">
        <div class="card-icon stat-icon-gigs"><i class="bi bi-briefcase-fill"></i></div>
        <div class="card-content"><h3>48 Active Gigs</h3><p>Remote and local opportunities.</p></div>
      </div>
      <div class="card stat-card live-indicator-card">
        <div class="card-icon stat-icon-live"><i class="bi bi-broadcast"></i></div>
        <div class="card-content"><h3 id="liveUserCount">— Online</h3><p>Active right now <span class="live-dot"></span></p></div>
      </div>
      <div class="card full-width">
        <div class="card-header"><h2>Quick Actions</h2></div>
        <div class="card-content quick-actions">
          <button class="action-item" onclick="openTab(event,'tab2')"><i class="bi bi-compass"></i><span>Explore Sectors</span></button>
          <button class="action-item" onclick="openTab(event,'tab3')"><i class="bi bi-search"></i><span>Find A Service</span></button>
          <button class="action-item" onclick="openTab(event,'tab15')"><i class="bi bi-chat-dots"></i><span>Join Community</span></button>
          <button class="action-item" onclick="openTab(event,'tab7')"><i class="bi bi-award"></i><span>View Grants</span></button>
          <button class="action-item" onclick="openTab(event,'connect-content')"><i class="bi bi-person-plus"></i><span>Partner With Us</span></button>
        </div>
      </div>
    </div>
    <footer class="footin mt-3">
      <div class="icons-social">
        <article class="list-social">
          <span class="icons-social__item"><a class="icons-social__link" href="#"><i class="fab fa-codepen"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://instagram.com/nseyin" target="_blank" rel="noopener"><i class="fab fa-instagram"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="#"><i class="fab fa-facebook"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="#"><i class="fab fa-twitter"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="#"><i class="fab fa-linkedin"></i></a></span>
        </article>
      </div>
    </footer>
  </section>`;
}

// ─────────────────────────────────────────────
// EXPLORE CONTENT
// ─────────────────────────────────────────────
function buildExploreContent() {
  return `
  <section id="explore-content" class="tab-content view">
    <div class="explore-search-bar sticky-top d-flex align-items-center gap-2 px-3 py-2">
      <h6 class="mb-0 me-2 flex-shrink-0"><span class="badge text-bg-primary">Explore</span></h6>
      <input type="text" id="serviceSearchInput" placeholder="Search portfolio..." class="view-search flex-1" />
      <button id="clearServiceSearchBtn" class="btn btn-sm btn-outline-secondary d-none" style="border-radius:20px;font-size:0.72rem;">Clear</button>
      <button id="disclaimer-toggle-btn" class="d-lg-none btn btn-sm btn-outline-secondary flex-shrink-0" style="border-radius:20px;font-size:0.72rem;">Info</button>
    </div>
    <div id="main-content-wrapper" class="row gx-lg-4 p-3">
      <div class="col-lg-8 col-xl-9">
        <div id="service-grid" class="row row-cols-2 row-cols-sm-3 row-cols-lg-3 row-cols-xl-4 g-3"></div>
      </div>
      <aside class="d-none d-lg-block col-lg-4 col-xl-3">
        <div id="disclaimer-content-desktop" class="p-4 rounded-3 sticky-top" style="top:70px;">
          <h3 class="h5 fw-bold border-bottom pb-2 mb-3" style="color:var(--n-forest);">Important Notice</h3>
          <div class="disclaimer-text">
            <p style="font-size:0.8rem;">NSEYIN is not directly affiliated with third-party sites without our registered trademark. We are not liable for changes to their terms or functions.</p>
            <p style="font-size:0.8rem;">Discovered a useful service? Let us know — we'll research and add it.</p>
            <p style="font-size:0.8rem;"><span style="color:var(--n-jade);font-weight:700;">GREEN</span> listings are NSEYIN-sponsored. <span style="color:#dc3545;font-weight:700;">®</span> are registered with verified addresses.</p>
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
// FORUM CONTENT
// ─────────────────────────────────────────────
function buildForumContent() {
  const brands = ['NSEYIN','CUDFIRM','Adire','Lobah','Elichi','AgriLink','TechKraft','WaterCycle','SolarSpark','WoodCraft','EduHub','FoodLink'];
  const brandCards = brands.map((b, i) => `
    <div class="s-card">
      <img src="https://placehold.co/80x80/${['0B3D2E','C8922A','1A6B4A','4D9E7A','E8B84B','8B4513','191970','5f9ea0','A52A2A','2F4F4F','8B008B','3A4035'][i % 12]}/fff?text=${b[0]}" alt="${b}" onerror="this.src='https://placehold.co/80x80/0B3D2E/C8922A?text=N'" />
      <div class="s-name"><span class="badge" style="background:rgba(11,61,46,0.12);color:var(--n-jade);font-size:0.55rem;">${b}</span></div>
    </div>`
  ).join('');

  const forumIcons = [
    { icon:'bi-briefcase', label:'Business' }, { icon:'bi-cpu', label:'Tech' },
    { icon:'bi-heart-pulse', label:'Health' }, { icon:'bi-tree', label:'Agro' },
    { icon:'bi-globe', label:'Diaspora' }, { icon:'bi-lightning', label:'Energy' },
    { icon:'bi-house', label:'Housing' }, { icon:'bi-palette', label:'Creative' },
    { icon:'bi-mortarboard', label:'Education' }, { icon:'bi-truck', label:'Logistics' },
    { icon:'bi-cash-coin', label:'Finance' }, { icon:'bi-star', label:'Lifestyle' },
    { icon:'bi-award', label:'Grants' }, { icon:'bi-people', label:'Network' },
    { icon:'bi-chat-dots', label:'Discussions' },
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
        <img src="https://raw.githubusercontent.com/farazc60/Project-Images/refs/heads/main/Velocity%20Blog%20Website%20Template/office-spaces-that-actually-inspire-creativity.jpg" alt="NSEYIN Forum Banner" class="forum-hero-img" loading="lazy" />
        <div class="forum-hero-overlay">
          <div class="forum-hero-text">
            <span class="forum-hero-eyebrow">Welcome to the</span>
            <h2 class="forum-hero-title">NSEYIN Forum</h2>
            <p class="forum-hero-sub">Ideas · Discussions · Community</p>
          </div>
          <div class="forum-hero-pills">
            <span class="forum-pill"><i class="bi bi-fire"></i>Trending</span>
            <span class="forum-pill"><i class="bi bi-people-fill"></i>2.4K Members</span>
            <span class="forum-pill"><i class="bi bi-chat-dots-fill"></i>Live Now</span>
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
        </div>`
      ).join('')}
    </div>
    <hr class="my-2" />
    <footer class="footin">
      <div class="icons-social">
        <article class="list-social">
          <span class="icons-social__item"><a class="icons-social__link" href="#"><i class="fab fa-codepen"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://instagram.com/nseyin" target="_blank" rel="noopener"><i class="fab fa-instagram"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="#"><i class="fab fa-facebook"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="#"><i class="fab fa-twitter"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="#"><i class="fab fa-linkedin"></i></a></span>
        </article>
      </div>
    </footer>
  </section>`;
}

// ─────────────────────────────────────────────
// CONNECT CONTENT
// ─────────────────────────────────────────────
function buildConnectContent() {
  return `
  <section id="connect-content" class="tab-content view p-3 p-sm-4">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Connect</span></h6>
    <hr class="my-2 w-25" />
    <div class="contact-container">
      <h4 class="contact-header">How Can We Make Your Day?</h4>
      <p class="contact-subheader">
        Looking for a service, want to partner with us, share feedback, or have a brilliant idea? Send it our way — we'll get right on it.
      </p>
      <div class="row g-4">
        <div class="col-12 col-lg-8">
          <form id="contactForm" onsubmit="return false;">
            <div class="mb-3">
              <label for="contactName" class="form-label">Your Name</label>
              <input type="text" class="form-control" id="contactName" name="name" placeholder="e.g. Emeka Okafor" required />
            </div>
            <div class="mb-3">
              <label for="contactInfo" class="form-label">Your Email or Phone Number</label>
              <input type="text" class="form-control" id="contactInfo" name="contact_info" placeholder="email@example.com or +234..." required />
            </div>
            <div class="mb-3">
              <label for="contactMessage" class="form-label">What Do You Need?</label>
              <textarea class="form-control" id="contactMessage" name="message" rows="5" placeholder="Tell us about your request, idea, or feedback..." required></textarea>
            </div>
            <div class="d-flex flex-column gap-2">
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-primary w-100" onclick="sendToAdmin()">
                  <i class="bi bi-send-check me-1"></i>Send To Admin
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
            <h5><i class="bi bi-headset me-1"></i>Quick Contact</h5>
            <p>For immediate assistance — we're available 8am to 8pm WAT.</p>
            <a href="tel:+2349056317709" class="btn btn-warning w-100 mb-2"><i class="bi bi-telephone me-1"></i>Call Us Directly</a>
            <button class="btn btn-outline-light w-100" onclick="copyToClipboard('+2349056317709','Phone number copied! ✓')">
              <i class="bi bi-clipboard me-1"></i>Copy Number
            </button>
            <hr style="border-color:rgba(255,255,255,0.2);margin:1rem 0;" />
            <div style="font-size:0.75rem;opacity:0.8;text-align:center;">
              <i class="bi bi-envelope me-1"></i>info@nseyin.com<br />
              <i class="bi bi-geo-alt me-1 mt-1 d-inline-block"></i>Lagos, Nigeria
            </div>
          </div>
        </div>
      </div>
    </div>
    <footer class="footin mt-4">
      <div class="icons-social">
        <article class="list-social">
          <span class="icons-social__item"><a class="icons-social__link" href="#"><i class="fab fa-codepen"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://instagram.com/nseyin" target="_blank" rel="noopener"><i class="fab fa-instagram"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="#"><i class="fab fa-facebook"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="#"><i class="fab fa-twitter"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="#"><i class="fab fa-linkedin"></i></a></span>
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

  try { localStorage.setItem('nseyin_last_tab', tabId); } catch(e) {}

  updateBreadcrumb(tabId);

  // Sync mobile tab strip active state
  updateMobileTabStrip(tabId);

  const contentMain = document.querySelector('.content-main');
  if (contentMain) contentMain.scrollTop = 0;
}

// =============================================
// GSAP ANIMATION
// =============================================
function animateView(viewElement) {
  if (typeof gsap === 'undefined') return;
  // Only animate the view container itself — never child cards/items.
  // Animating child items with stagger causes later items to stay at opacity:0
  // when there are many cards (Sectors, Services), making them invisible.
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
    openModal('Fields Required', '<p style="font-size:0.88rem;">Please fill in all fields — name, contact info, and your message — before submitting.</p>');
    return false;
  }
  return true;
}

function sendToAdmin() {
  if (!validateForm()) return;
  const { name, contactInfo, message } = getFormValues();
  submitToGoogleSheets(name, contactInfo, message);
  showToast('Message sent to admin ✓ Redirecting...');
  setTimeout(() => { window.location.href = 'success.html'; }, 1500);
}

function sendToWhatsAppWithForm() {
  if (!validateForm()) return;
  const { name, contactInfo, message } = getFormValues();
  const yourNumber = '+2348028699824';
  const text = `Hello NSEYIN,\n\nName: ${name}\nContact: ${contactInfo}\n\nMessage:\n${message}`;
  window.open(`https://wa.me/${yourNumber}?text=${encodeURIComponent(text)}`, '_blank');
}

function sendToEmail() {
  if (!validateForm()) return;
  const { name, contactInfo, message } = getFormValues();
  const subject = encodeURIComponent('New Message — NSEYIN');
  const body = encodeURIComponent(`Name: ${name}\nContact Info: ${contactInfo}\n\nMessage:\n${message}`);
  window.location.href = `mailto:info@nseyin.com?subject=${subject}&body=${body}`;
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
  // Use a CSS class for the fade rather than an inline style,
  // so it can never get stuck and block child element rendering.
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
    if (localStorage.getItem('nseyin_theme') === 'dark') {
      html.setAttribute('data-theme', 'dark');
      if (icon) icon.className = 'bi bi-sun-fill';
    }
  } catch(e) {}
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    if (icon) icon.className = isDark ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
    try { localStorage.setItem('nseyin_theme', isDark ? 'light' : 'dark'); } catch(e) {}
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
  contentMain.addEventListener('scroll', () => btn.classList.toggle('visible', contentMain.scrollTop > 250), { passive: true });
  btn.addEventListener('click', () => contentMain.scrollTo({ top: 0, behavior: 'smooth' }));
}

// =============================================
// BREADCRUMB
// =============================================
function updateBreadcrumb(tabId) {
  const name = TAB_NAMES[tabId] || tabId;
  if (breadcrumbHistory[breadcrumbHistory.length - 1] === name) return;
  breadcrumbHistory.push(name);
  if (breadcrumbHistory.length > 3) breadcrumbHistory.shift();
  const trail = document.getElementById('breadcrumbTrail');
  if (!trail) return;
  trail.innerHTML = breadcrumbHistory.map((item, i) => {
    const isCurrent = i === breadcrumbHistory.length - 1;
    return `<span class="bc-item${isCurrent ? ' bc-current' : ''}" style="${isCurrent ? 'opacity:1;font-weight:600;' : 'opacity:0.55;'}">${item}</span>${isCurrent ? '' : '<span class="bc-sep" style="opacity:0.4;margin:0 0.3rem;">›</span>'}`;
  }).join('');
}

// =============================================
// LIVE USER COUNT
// =============================================
function initLiveUserCount() {
  const blogCount = document.getElementById('liveUserCount');
  const sidebarCount = document.getElementById('sidebarLiveCount');
  function update() {
    const count = Math.max(5, 18 + Math.floor(new Date().getHours() * 0.7) + Math.floor(Math.random() * 9) - 4);
    if (blogCount) blogCount.textContent = count + ' Online';
    if (sidebarCount) sidebarCount.textContent = count;
  }
  update();
  setInterval(update, 40000);
}

// =============================================
// KEYBOARD SHORTCUTS
// =============================================
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) return;
    switch(e.key) {
      case 'ArrowRight': case 'ArrowDown':
        e.preventDefault();
        openTab(null, ALL_TAB_IDS[Math.min(ALL_TAB_IDS.length - 1, currentTabIndex + 1)]);
        break;
      case 'ArrowLeft': case 'ArrowUp':
        e.preventDefault();
        openTab(null, ALL_TAB_IDS[Math.max(0, currentTabIndex - 1)]);
        break;
      case 'Escape':
        e.preventDefault();
        openTab(null, 'tab1');
        showToast('Returned to Home 🏠');
        break;
      case '/':
        e.preventDefault();
        const si = document.getElementById('searchInput');
        if (si) { si.classList.add('active'); si.focus(); }
        break;
      case '?':
        openModal('Keyboard Shortcuts ⌨️', `
          <ul style="line-height:2.2;font-size:0.88rem;padding-left:1.25rem;">
            <li><strong>→ / ↓</strong> — Next tab</li>
            <li><strong>← / ↑</strong> — Previous tab</li>
            <li><strong>Esc</strong> — Go to Home</li>
            <li><strong>/</strong> — Open search</li>
            <li><strong>?</strong> — Show this help</li>
          </ul>`);
        break;
    }
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


// NEEEEEEEEEEEEEEEW

// =============================================
// SIDEBAR TAB FILTER
// =============================================
function initSidebarTabFilter() {
  const filterInput = document.getElementById('sidebarTabSearch');
  if (!filterInput) return;
  filterInput.addEventListener('input', function() {
    const term = this.value.toLowerCase().trim();
    document.querySelectorAll('.sidebar-tabs .tab-button').forEach(btn => {
      const name = (btn.getAttribute('data-tab-name') || btn.textContent).toLowerCase();
      btn.style.display = (!term || name.includes(term)) ? '' : 'none';
    });
  });
}

// =============================================
// SERVICE FINDER (EXPLORE TAB)
// =============================================
function initServiceFinder() {
  const serviceGrid = document.getElementById('service-grid');
  if (!serviceGrid) return;

  const serviceData = [
    { title:'CREATORS', isRegistered: true,  description:'Event planning, content creation, videography, photography, coverage, weddings, birthdays, parties, engagement, and surprises.',   image:'https://placehold.co/400x200/0B3D2E/C8922A?text=Creators' },
    { title:'FASHION HOUSE',   isRegistered: true,  description:'Textile, tailoring, fashion, adire, ankara, lace, wears, bags, and stylist services for all occasions.',                           image:'https://placehold.co/400x200/A52A2A/ffffff?text=Fashion+House' },
    { title:'FOOD & AGRO',     isRegistered: true,  description:'Fresh food delivery, agro products, garri, dried fish, cashew, food processing and export — B2B & B2C.',                          image:'https://placehold.co/400x200/1A6B4A/ffffff?text=Food+%26+Agro' },
    { title:'WELLNESS HUB',    isRegistered: true,  description:'Massage, spa, body wellness, stress relief, deep tissue therapy — home, office & doorstep sessions.',                             image:'https://placehold.co/400x200/4D9E7A/ffffff?text=Wellness+Hub' },
    { title:'SOLAR SOLUTIONS', isRegistered: false, description:'Solar panel installation, inverter setup, battery backup, rural electrification, and green energy consultations.',                 image:'https://placehold.co/400x200/E8B84B/0B3D2E?text=Solar+Solutions' },
    { title:'DIGITAL STUDIO',  isRegistered: false, description:'Web design, hosting, domain setup, SEO, social media management, and digital brand building for SMEs.',                           image:'https://placehold.co/400x200/191970/ffffff?text=Digital+Studio' },
    { title:'NSEYIN LOGISTICS',isRegistered: true,  description:'Same-day delivery, state-to-state haulage, international shipping, and courier services across Nigeria and abroad.',              image:'https://placehold.co/400x200/3A4035/ffffff?text=Logistics' },
    { title:'HOUSING LINKS',   isRegistered: false, description:'Verified rentals, mini-flats, co-living, short-let, long-let, property management, and maintenance services.',                   image:'https://placehold.co/400x200/8B4513/ffffff?text=Housing+Links' },
  ];

  const serviceSearchInput = document.getElementById('serviceSearchInput');
  const serviceSearchInputDesktop = document.getElementById('serviceSearchInputDesktop');
  const clearServiceSearchBtn = document.getElementById('clearServiceSearchBtn');

  function renderCards(filter) {
    filter = filter || '';
    serviceGrid.innerHTML = '';
    const lower = filter.toLowerCase();
    const filtered = serviceData.filter(i => i.title.toLowerCase().includes(lower) || i.description.toLowerCase().includes(lower));
    if (!filtered.length) {
      serviceGrid.innerHTML = '<p class="text-secondary col-12 p-3" style="font-size:0.85rem;">No services found matching your search.</p>';
      return;
    }
    filtered.forEach(item => {
      const col = document.createElement('div');
      col.className = 'col';
      const badge = item.isRegistered ? '<span class="position-absolute top-0 end-0 m-2 badge rounded-pill bg-danger z-3" style="font-size:0.65rem;">®</span>' : '';
      let desc = item.description;
      if (filter) {
        const re = new RegExp('(' + filter.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'gi');
        desc = desc.replace(re, '<mark>$1</mark>');
      }
      col.innerHTML = `
        <div class="card service-card h-100">
          <div class="position-relative">
            <img src="${item.image}" alt="${item.title}" class="card-img-top" loading="lazy" onerror="this.src='https://placehold.co/400x200/0B3D2E/C8922A?text=NSEYIN'" />
            ${badge}
          </div>
          <div class="card-body p-2">
            <div class="card-title">${item.title}</div>
            <p class="card-text">${desc}</p>
          </div>
          <div class="card-footer">
            <div class="d-flex gap-2" style="font-size:0.78rem;">
              <a href="#" class="text-secondary" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
              <a href="#" class="text-secondary" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
              <a href="#" class="text-secondary" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
            </div>
            <a href="#" class="fw-semibold small text-decoration-none" style="color:var(--n-jade);" onclick="openTab(event,'connect-content')">Enquire →</a>
          </div>
        </div>`;
      serviceGrid.appendChild(col);
    });
  }

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
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightboxCaption').textContent = caption;
  const enterBtn = document.getElementById('lightboxEnterBtn');
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
  if (typeof gsap !== 'undefined') {
    gsap.fromTo('.lightbox-content-wrapper', { scale: 0.75, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.38, ease: 'back.out(1.4)' });
  }
}

function closeLightbox() {
  const lb = document.getElementById('imageLightbox');
  if (!lb) return;
  if (typeof gsap !== 'undefined') {
    gsap.to('.lightbox-content-wrapper', { scale: 0.75, opacity: 0, duration: 0.2, onComplete: () => lb.style.display = 'none' });
  } else {
    lb.style.display = 'none';
  }
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
  showToast('Add NSEYIN to your home screen for the best experience 📲', 5000);
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

  // STEP 4: Open Home first (never blank)
  openTab(null, 'tab1');

  // STEP 5: Restore last visited tab
  try {
    const saved = localStorage.getItem('nseyin_last_tab');
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

  // STEP 9: Lightbox on Home images
  document.addEventListener('click', e => {
    const img = e.target.closest('#tab1 .grid-item img');
    if (img) openLightbox(img.src, img.alt || 'View Item', img.getAttribute('data-link') || '#');
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
    if (!localStorage.getItem('nseyin_hint_shown')) {
      setTimeout(() => {
        showToast('Tip: Press ? for keyboard shortcuts ⌨️', 4500);
        localStorage.setItem('nseyin_hint_shown', '1');
      }, 3500);
    }
  } catch(e) {}

});
