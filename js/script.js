/**
 * ================================================
 *  CUDFIRM GROUP — MASTER SCRIPT
 *  Business Websites You Can Manage · Lagos, Nigeria
 *  "A Better Website. More Control. Less Stress."
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
  'tab5':'Our Process','tab9':'Benefits','tab13':'FAQ',
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
  { id: 'tab9',            label: 'Benefits' },
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
// RECENT WORK
function buildTab1() {
  const portfolioFallback = [
    { img: 'img/nseyin.webp',       link: '#',    name: 'NSEYIN Massage', alt: 'Health and Wellness Website By CUDFIRM' },

    { img: 'img/cudfirm.webp',        link: 'index.html', name: 'CUDFIRM', alt: 'CUDFIRM business website and dashboard' },

    { img: 'img/lobahvisuals.webp', link: 'https://lobahvisuals.vercel.app',                                  name: 'Lobah Visuals',   alt: 'Photography Portfolio Built by CUDFIRM' },

    { img: 'img/elistitches.webp',   link: '#',                                  name: 'Eli Stitches',    alt: 'Tailoring Business Website Built by CUDFIRM' },

    { img: 'img/chef.webp',        link: '#',                                  name: 'The Chef',         alt: 'Food Business Website built by CUDFIRM' },

    { img: 'img/damkaz.webp',        link: '#',                                  name: 'Damkaz',         alt: 'Fashion Brand Website Built by CUDFIRM' },

    { img: 'img/kingmaster.webp',          link: '#',                                  name: 'The King Master',            alt: 'Business website built by CUDFIRM' },

    { img: 'https://placehold.co/800x600/0B3D2E/C8922A?text=Your+Business', link: 'connect-content', name: 'Your Business Is Next', alt: 'Get started with CUDFIRM' },
  ];

  // WHAT WE BUILD
  const servicesFallback = [
    { img: 'https://placehold.co/200x250/0B3D2E/C8922A?text=STARTER', link: '#', name: 'Starter Website', alt: 'Starter Website' },
    { img: 'https://placehold.co/200x250/1A6B4A/fff?text=BUSINESS', link: '#', name: 'Business Website', alt: 'Business Website' },
    { img: 'https://placehold.co/200x250/C8922A/fff?text=MAINTAIN', link: '#', name: 'Maintenance', alt: 'Maintenance' },
    { img: 'https://placehold.co/200x250/4D9E7A/fff?text=TEMPLATE', link: '#', name: 'Bring Your Template', alt: 'Client-Supplied Website Template' },
    { img: 'https://placehold.co/200x250/E8B84B/0B3D2E?text=DOMAIN', link: '#', name: 'Domain & Hosting', alt: 'Domain and Hosting' },
    { img: 'https://placehold.co/200x250/0B3D2E/C8922A?text=SEO', link: '#', name: 'Google & SEO', alt: 'Google and SEO Setup' },
    { img: 'https://placehold.co/200x250/1A6B4A/fff?text=BRAND', link: '#', name: 'Brand Identity', alt: 'Brand Identity' },
    { img: 'https://placehold.co/200x250/3A4035/fff?text=MORE', link: 'tab3', name: 'View All', alt: 'More Services' },
  ];

  // CMS-aware: use Supabase data when present, otherwise the exact
  // hardcoded content above (so the page never changes visually if
  // Supabase is empty/unreachable).
  const cmsPortfolio = window.CMS && Array.isArray(window.CMS.portfolio)
    ? window.CMS.portfolio.filter(p => p.featured_home)
    : null;
  const portfolio = (cmsPortfolio && cmsPortfolio.length)
    ? cmsPortfolio.map(p => ({ img: p.image_url, link: p.link || '#', name: p.name, alt: `${p.name} website built by CUDFIRM` }))
    : portfolioFallback;

  const cmsServices = window.CMS && Array.isArray(window.CMS.services) ? window.CMS.services : null;
  const services = (cmsServices && cmsServices.length)
    ? cmsServices.slice(0, 7)
        .map(s => ({
          img: `https://placehold.co/200x250/0B3D2E/C8922A?text=${encodeURIComponent(s.name)}`,
          link: '#', name: s.name, alt: s.name,
        }))
        .concat([{ img: 'https://placehold.co/200x250/3A4035/fff?text=MORE', link: 'tab3', name: 'View All', alt: 'More Services' }])
    : servicesFallback;

  const hero = (window.CMS && window.CMS.hero) ? window.CMS.hero : {
    eyebrow: 'Business Websites You Can Manage · Lagos, Nigeria',
    title: 'Get a Website That Grows With Your Business',
    subtitle: 'CUDFIRM builds fast, mobile-friendly websites that help customers find, trust and contact your business. You also get a simple dashboard to update your content — from ₦50,000, delivered in 3–7 days.',
    cta_primary_text: 'Get a Free Quote Today', cta_primary_target: 'connect-content',
    cta_secondary_text: 'See Our Work', cta_secondary_target: 'tab4',
    trust_items: [
      { icon: 'bi-check-circle-fill', label: 'Mobile-Ready' },
      { icon: 'bi-check-circle-fill', label: '3–7 Day Delivery' },
      { icon: 'bi-check-circle-fill', label: 'From ₦50,000' },
      { icon: 'bi-check-circle-fill', label: 'Easy Dashboard Included' },
    ],
  };

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
      <span class="hero-eyebrow">${hero.eyebrow}</span>
      <h1 class="hero-title">${hero.title}</h1>
      <p class="hero-sub">${hero.subtitle}</p>
      ${hero.image_url ? `<div class="hero-cms-image-wrap"><img src="${hero.image_url}" alt="${(hero.eyebrow || 'CUDFIRM').replace(/"/g, '&quot;')}" class="hero-cms-image" loading="lazy" onclick="openLightbox(this.src, this.alt, null)"><span class="hero-cms-image-hint">Click to enlarge</span></div>` : ''}
      <div class="hero-cta-row">
        <button class="btn-hero-primary" onclick="openTab(event,'${hero.cta_primary_target}')">${hero.cta_primary_text}</button>
        <button class="btn-hero-secondary" onclick="openTab(event,'${hero.cta_secondary_target}')">${hero.cta_secondary_text}</button>
      </div>
      <div class="hero-trust-strip" role="list" aria-label="Key facts about CUDFIRM">
        ${hero.trust_items.map(t => `<span role="listitem"><i class="bi ${t.icon}" aria-hidden="true"></i> ${t.label}</span>`).join('')}
      </div>
    </div>

    <div class="p-3">
      <h6 class="sticky-top d-flex align-items-center gap-2 py-2">
        <span class="badge text-bg-primary">CUDFIRM</span>
        <span style="font-size:0.72rem;color:var(--n-muted);font-weight:400;">Professional websites built to win trust and grow your business.</span>
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
              { icon:'bi-pencil-square', label:'Easy To Manage', sub:'Update your services, prices, images, FAQs and other website information without touching any code.' },
              { icon:'bi-layout-text-window', label:'Your Design, Your Choice', sub:'Choose one of our ready-made designs or send us a website template you already like.' },
              { icon:'bi-phone', label:'Built For Mobile', sub:'Your website will look clean and work properly on phones, tablets and computers.' },
              { icon:'bi-search', label:'Ready For Google', sub:'We set up the important website details that help search engines understand and show your business.' },
              { icon:'bi-shield-check', label:'Safe And Reliable', sub:'Customer messages and private business information are protected, with backups available when needed.' },
              { icon:'bi-headset', label:'Support After Launch', sub:'We do not disappear after delivery. You receive 30 days of support to help you settle in.' },
            ].map(w => `
              <div class="col-6 col-md-4 col-lg-2">
                <div class="card p-3">
                  <i class="bi ${w.icon}" style="font-size:1.5rem;color:var(--n-gold);margin-bottom:0.5rem;display:block;" aria-hidden="true"></i>
                  <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:0.82rem;">${w.label}</div>
                  <div style="font-size:0.7rem;color:var(--n-muted);margin-top:0.2rem;">${w.sub}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <!-- Recent Work + Services: stacked on phones, side by side from tablet upward -->
      <div class="home-showcase-grid mb-3">
        <!-- Portfolio Highlights -->
        <div class="card card-section">
          <div class="card-header">
            <h3><i class="bi bi-laptop me-1" style="color:var(--n-gold)"></i>Websites We Have Built</h3>
            <button class="btn btn-sm btn-success see-all" onclick="openTab(event,'tab4')">View All</button>
          </div>
          <div class="card-content row icon-grid row-cols-3 row-cols-sm-4 row-cols-md-5 row-cols-lg-7 row-cols-xl-9 quote0">
            ${gridItems(portfolio)}
          </div>
        </div>

        <!-- Services -->
        <div class="card card-section">
          <div class="card-header">
            <h3><i class="bi bi-briefcase me-1" style="color:var(--n-gold)"></i>What We Can Build For You</h3>
            <button class="btn btn-sm btn-primary see-all" onclick="openTab(event,'tab3')">View All</button>
          </div>
          <div class="card-content row icon-grid row-cols-3 row-cols-sm-4 row-cols-md-5 row-cols-lg-7 row-cols-xl-9 quote0">
            ${gridItems(services)}
          </div>
        </div>
      </div>
    </div>

    <hr class="my-2" />
    <footer class="footin" role="contentinfo">
      <div class="icons-social">
        <article class="list-social" aria-label="CUDFIRM social links">
          <span class="icons-social__item"><a class="icons-social__link" href="https://codepen.io/cudfirm-group" target="_blank" rel="noopener" aria-label="CUDFIRM on CodePen"><i class="fab fa-codepen" aria-hidden="true"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://instagram.com/cudfirm" target="_blank" rel="noopener" aria-label="CUDFIRM on Instagram"><i class="fab fa-instagram" aria-hidden="true"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://fb.me/cudfirm" target="_blank" rel="noopener" aria-label="CUDFIRM on Facebook"><i class="fab fa-facebook" aria-hidden="true"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://x.com/cudfirm" target="_blank" rel="noopener" aria-label="CUDFIRM on X / Twitter"><i class="fab fa-twitter" aria-hidden="true"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://linkedin.com/in/cudfirm" target="_blank" rel="noopener" aria-label="CUDFIRM on LinkedIn"><i class="fab fa-linkedin" aria-hidden="true"></i></a></span>
        </article>
      </div>
      <div class="footer-legal">
        <nav aria-label="Legal links">
          <a href="terms.html" class="footer-legal-link">Terms &amp; Conditions</a>
          <span aria-hidden="true"> &middot; </span>
          <a href="terms.html#privacy" class="footer-legal-link">Privacy Policy</a>
          <span aria-hidden="true"> &middot; </span>
          <a href="mailto:cudfirm@gmail.com" class="footer-legal-link">cudfirm@gmail.com</a>
        </nav>
        <p class="footer-copy">&copy; 2026 CUDFIRM &middot; Business Websites You Can Manage &middot; Lagos, Nigeria</p>
        <p class="footer-tagline">A Better Website. More Control. Less Stress.</p>
      </div>
    </footer>
  </section>`;
}

// ─────────────────────────────────────────────
// TAB 2: SECTORS (who we build for)
// ─────────────────────────────────────────────
function buildTab2() {
  const sectors = [
    { icon: 'bi-scissors',          name: 'Barbers & Salons',       desc: 'Show your services, prices, gallery, opening hours and WhatsApp contact in one place.' },
    { icon: 'bi-camera',            name: 'Photographers',           desc: 'Display your best work, packages, prices and booking details in a clean portfolio website.' },
    { icon: 'bi-bag-heart',         name: 'Fashion Designers',       desc: 'Show your collections, custom-order details, customer reviews and social media links.' },
    { icon: 'bi-cup-hot',           name: 'Food Vendors & Caterers', desc: 'Share your menu, delivery areas, prices, food pictures and direct order contact.' },
    { icon: 'bi-person-video3',     name: 'Coaches & Consultants',   desc: 'Explain your services, build trust, share reviews and receive consultation requests.' },
    { icon: 'bi-mortarboard',       name: 'Tutors & Teachers',       desc: 'List your courses, class times, fees, learning details and student enquiries.' },
    { icon: 'bi-shop',              name: 'Small Businesses',        desc: 'Get a complete website with your story, services, pictures, contact details and customer messages.' },
    { icon: 'bi-house-door',        name: 'Real Estate & Agents',    desc: 'Display properties, prices, locations, pictures and enquiry forms for interested buyers or tenants.' },
    { icon: 'bi-heart-pulse',       name: 'Wellness & Health',       desc: 'Present your services, professional profile, common questions and appointment contact options.' },
    { icon: 'bi-truck',             name: 'Logistics & Delivery',    desc: 'Show your service areas, delivery options, price information and WhatsApp contact.' },
    { icon: 'bi-lightning-charge',  name: 'Solar & Energy',          desc: 'Explain your solutions, show completed work and receive clear quote requests from customers.' },
    { icon: 'bi-briefcase',         name: 'Any Business In Nigeria', desc: 'If customers need to find, trust or contact your business, we can build the right website for you.' },
  ];

  return `
  <section id="tab2" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Who We Help</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      Whether you work alone or run a growing team, CUDFIRM can build a website that helps customers understand your business, trust your brand and contact you easily.
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
  const itemsFallback = [
    { icon:'Starter Website', desc:'Best for small businesses and professionals who need to get online quickly. You get one focused page with your services, pictures, contact details, WhatsApp button and an easy dashboard for updates.', tags:['#Starter','#OnePage','#Dashboard'], search:'starter website one page dashboard small business professional quick', price:'₦50,000' },
    { icon:'Business Website', desc:'Best for growing businesses that need more space to explain what they do. You get up to six pages, mobile-friendly design, contact forms, Google setup, a management dashboard and 30 days of support.', tags:['#Business','#MultiPage','#Professional'], search:'business website multi page professional dashboard google contact forms', price:'₦100,000' },
    { icon:'Website Maintenance', desc:'Best for business owners who want their website kept fresh and working well. We handle agreed text changes, image updates, checks, backups and small fixes.', tags:['#Monthly','#Support','#Updates'], search:'maintenance monthly support updates images backups fixes', price:'₦10,000–₦20,000 per month' },
    { icon:'Bring Your Own Template', desc:'Already have a website design or template you like? Send it to us. We will review it, add your business content and connect it to the CUDFIRM dashboard where suitable.', tags:['#YourTemplate','#CustomDesign','#Setup'], search:'bring own template client supplied custom design dashboard setup', price:'Custom Quote' },
    { icon:'Domain & Hosting Setup', desc:'We help you register your website address, connect reliable hosting and make sure the website is properly published online.', tags:['#Domain','#Hosting','#Launch'], search:'domain hosting launch publish website address', price:'From ₦15,000' },
    { icon:'Google & SEO Setup', desc:'We set up your page titles, descriptions, Google tools and other important details that help customers find your business online.', tags:['#Google','#SEO','#Visibility'], search:'google seo visibility page titles descriptions search', price:'₦20,000' },
    { icon:'Brand Identity', desc:'Need a more professional look? We can create a simple logo, colour style, fonts and brand guide for your website and social pages.', tags:['#Logo','#Branding','#Design'], search:'logo branding design colour fonts brand guide', price:'From ₦25,000' },
    { icon:'Ready-Made Website Designs', desc:'Choose from CUDFIRM’s ready-made website designs and let us customise the words, pictures, colours and sections to suit your business.', tags:['#ReadyMade','#FastSetup','#Customised'], search:'ready made template fast setup customised website design', price:'Project Quote' },
    { icon:'Special Website Request', desc:'Need something outside the standard options? Tell us what you want the website to do. We will review it and give you a clear answer, price and timeline.', tags:['#Custom','#SpecialRequest','#Quote'], search:'custom special request quote website features', isSpecial: true, price:'Let\'s Talk' },
  ];

  const cmsServices = window.CMS && Array.isArray(window.CMS.services) ? window.CMS.services : null;
  const items = (cmsServices && cmsServices.length)
    ? cmsServices.map(s => ({
        icon: s.name, iconUrl: s.icon_url || null, desc: s.description, tags: s.tags || [],
        search: s.search_terms || '', price: s.price, isSpecial: !!s.is_special,
      }))
    : itemsFallback;

  const listItems = items.map(item => `
    <div class="list-item" data-search-text="${item.search || ''}">
      <div class="item-icon">${item.iconUrl ? `<img src="${item.iconUrl}" alt="" loading="lazy" class="item-icon-img">` : item.icon}</div>
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
// TAB 4: PORTFOLIO (Real projects showcase)
// ─────────────────────────────────────────────
function buildTab4() {
  const projectsFallback = [
    {
      name: 'NSEYIN Massage',
      industry: 'Health And Wellness',
      type: 'Massage Service Website',
      img: 'img/nseyin.webp',
      link: '#',
      problem: 'Potential clients needed a clear place to understand the massage services and contact the business directly.',
      solution: 'A clean wellness website showing the services, brand information and direct contact options.',
      tags: ['#Wellness', '#Massage', '#ServiceWebsite'],
      live: false,
    },
    {
      name: 'CUDFIRM',
      industry: 'Website Design And Management',
      type: 'Business Website With Dashboard',
      img: 'img/cudfirm.webp',
      link: 'index.html',
      problem: 'Many businesses receive websites they cannot update or manage without returning to the original developer.',
      solution: 'CUDFIRM gives the business a professional website, a simple dashboard and the freedom to use different suitable website designs.',
      tags: ['#Website', '#Dashboard', '#Live'],
      live: true,
    },
    {
      name: 'Lobah Visuals',
      industry: 'Photography',
      type: 'Photography Portfolio',
      img: 'img/lobahvisuals.webp',
      link: '#',
      problem: 'Talented photographer with no landing page for client bookings.',
      solution: 'Full-screen gallery portfolio with packages, pricing, and WhatsApp CTA.',
      tags: ['#Photography', '#Portfolio'],
      live: false,
    },
    {
      name: 'Eli Stitches',
      industry: 'Fashion & Tailoring',
      type: 'Tailoring Business Site',
      img: 'img/elistitches.webp',
      link: '#',
      problem: 'Customers couldn\'t find the tailor or understand their services online.',
      solution: 'Clean business site with services, gallery, measurement guide, and WhatsApp.',
      tags: ['#Tailoring', '#Business'],
      live: false,
    },
    {
      name: 'The Chef',
      industry: 'Retail & E-commerce',
      type: 'Product Landing Page',
      img: 'img/chef.webp',
      link: '#',
      problem: 'Brand needed a direct sales page separate from social media.',
      solution: 'Conversion-focused landing page with product showcase and order CTA.',
      tags: ['#Retail', '#Landing'],
      live: false,
    },
    {
      name: 'AutoLux',
      industry: 'Automobile',
      type: 'Car Dealership Website',
      img: 'https://placehold.co/400x280/0B3D2E/C8922A?text=AutoLux',
      link: 'portfolio/automobile/index.html',
      problem: 'Dealership had no digital presence to showcase its inventory.',
      solution: 'Premium dealership site with car listings, specs, and test-drive booking.',
      tags: ['#Automobile', '#Demo'],
      live: false,
    },
    {
      name: 'Your Business Here',
      industry: 'Any Industry',
      type: 'Get Started Today',
      img: 'https://placehold.co/400x280/3A4035/C8922A?text=Your+Business+%E2%86%92',
      link: 'connect-content',
      problem: 'You\'re losing customers to competitors who have a website.',
      solution: 'A professional website built specifically for your business and customers.',
      tags: ['#GetStarted'],
      live: false,
    },
  ];

  const cmsPortfolio = window.CMS && Array.isArray(window.CMS.portfolio) ? window.CMS.portfolio : null;
  const projects = (cmsPortfolio && cmsPortfolio.length)
    ? cmsPortfolio.map(p => ({
        name: p.name, industry: p.industry, type: p.project_type,
        img: p.image_url, link: p.link || '#', problem: p.problem,
        solution: p.solution, tags: p.tags || [], live: !!p.is_live,
      }))
    : projectsFallback;

  return `
  <section id="tab4" class="tab-content view p-3" aria-labelledby="portfolio-heading">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary" id="portfolio-heading">Our Portfolio</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      A selection of CUDFIRM websites and website designs. <span style="color:#1A6B4A;font-weight:600;">GREEN</span> tags open a working website; gold tags show a demo or preview.
    </p>
    <div class="row g-3 stagger-children">
      ${projects.map(p => `
        <div class="col-12 col-md-6 col-lg-4">
          <div class="card h-100" style="overflow:hidden;cursor:pointer;" onclick="${p.link.startsWith('http') || p.link.includes('/') && !p.link.includes('#') ? `window.open('${p.link}','_blank')` : p.link === '#' ? '' : `openTab(event,'${p.link}')`}" role="article" aria-label="${p.name} — ${p.industry} project">
            <div style="position:relative;">
              <img src="${p.img}" alt="Screenshot of ${p.name} website built by CUDFIRM" style="width:100%;height:180px;object-fit:cover;" loading="lazy" onerror="this.src='https://placehold.co/400x280/0B3D2E/C8922A?text=CUDFIRM'" />
              <div style="position:absolute;top:8px;right:8px;"><span class="tag ${p.live ? 'green' : 'orange'}" style="font-size:0.62rem;padding:0.2rem 0.5rem;">${p.live ? '● Live' : '● Demo'}</span></div>
            </div>
            <div class="card-content">
              <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:0.9rem;margin-bottom:0.1rem;">${p.name}</div>
              <div style="font-size:0.72rem;color:var(--n-gold);font-weight:600;margin-bottom:0.4rem;">${p.industry} · ${p.type}</div>
              <div style="font-size:0.75rem;color:var(--n-muted);margin-bottom:0.5rem;line-height:1.5;"><strong style="color:var(--text-color);">Problem:</strong> ${p.problem}</div>
              <div style="font-size:0.75rem;color:var(--n-muted);margin-bottom:0.6rem;line-height:1.5;"><strong style="color:var(--text-color);">Solution:</strong> ${p.solution}</div>
              <div>${p.tags.map(t => `<span class="tag ${t === '#Live' ? 'green' : t === '#GetStarted' ? 'green' : 'orange'}">${t}</span>`).join('')}</div>
            </div>
          </div>
        </div>`).join('')}
    </div>
    <button class="view-more-btn mt-3" onclick="openTab(event,'connect-content')" aria-label="Get a quote to build your website">
      <i class="bi bi-rocket-takeoff me-1" aria-hidden="true"></i>Start Your Project — Get a Free Quote
    </button>
  </section>`;
}

// ─────────────────────────────────────────────
// TAB 5: OUR PROCESS (Clear, client-focused)
// ─────────────────────────────────────────────
function buildTab5() {
  const steps = [
    { num:'01', title:'Tell Us What You Need', desc:'Send us a WhatsApp message or complete the quote form. Tell us about your business, customers, preferred design and the website you need.', icon:'bi-whatsapp', color:'#1A6B4A' },
    { num:'02', title:'Choose Your Design', desc:'Pick one of our ready-made designs or send us a website template you already have.', icon:'bi-layout-text-window', color:'#C8922A' },
    { num:'03', title:'Get A Clear Quote', desc:'We confirm the work, price and delivery time. Once you approve it, you pay 50% so we can begin.', icon:'bi-check-circle', color:'#0B3D2E' },
    { num:'04', title:'We Build Your Website', desc:'We add your content, pictures, contact details and business features, then prepare your dashboard for easy updates.', icon:'bi-laptop', color:'#4D9E7A' },
    { num:'05', title:'You Review Everything', desc:'We send you a preview link. You check the website and tell us what needs to be adjusted before launch.', icon:'bi-eye', color:'#E8B84B' },
    { num:'06', title:'We Launch And Hand Over', desc:'You pay the final 50%, we publish the website, give you the login details and show you how to manage it.', icon:'bi-rocket-takeoff', color:'#C8922A' },
  ];

  return `
  <section id="tab5" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Our Process</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      Six simple steps take your project from the first conversation to a live website. You will always know what is happening and what comes next.
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
      <i class="bi bi-arrow-right-circle me-1"></i>Start Your Website Project
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
  const benefitsFallback = [
    { name:'Look More Professional', role:'Website Benefit', quote:'Give customers one trusted place to learn about your business, services and contact details.', color:'#0B3D2E', isPlaceholder:true },
    { name:'Get More Enquiries', role:'Website Benefit', quote:'Make it easy for interested customers to call, send a message, complete a form or contact you on WhatsApp.', color:'#C8922A', isPlaceholder:true },
    { name:'Save Time On Updates', role:'Website Benefit', quote:'Change common website information without waiting for a developer every time.', color:'#1A6B4A', isPlaceholder:true },
    { name:'Stay In Control', role:'Website Benefit', quote:'Keep your website content, messages, staff access and important records organised in one place.', color:'#4D9E7A', isPlaceholder:true },
  ];

  const cmsTestimonials = window.CMS && Array.isArray(window.CMS.testimonials) ? window.CMS.testimonials : null;
  const stars = (cmsTestimonials && cmsTestimonials.length)
    ? cmsTestimonials.map(t => ({ name: t.name, role: t.role, quote: t.quote, color: t.accent_color || '#0B3D2E', isPlaceholder: !!t.is_placeholder, avatarUrl: t.avatar_url || null }))
    : benefitsFallback;

  const allPlaceholder = stars.every(s => s.isPlaceholder);

  return `
  <section id="tab9" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">${allPlaceholder ? 'What Your Website Helps You Do' : 'Testimonials'}</span></h6>

    ${allPlaceholder ? `
    <div class="testimonial-placeholder-notice" role="note" aria-label="Website benefits notice">
      <i class="bi bi-info-circle-fill" aria-hidden="true"></i>
      <div>
        <strong>Real client reviews will be added here as they are collected.</strong> For now, these are the practical benefits every CUDFIRM website is built to provide.
      </div>
    </div>` : ''}

    <div class="row g-3 stagger-children mt-1">
      ${stars.map(s => `
        <div class="col-12 col-md-6">
          <div class="card p-4 testimonial-placeholder-card">
            ${s.avatarUrl
              ? `<img src="${s.avatarUrl}" alt="" loading="lazy" style="width:44px;height:44px;border-radius:50%;object-fit:cover;margin-bottom:0.75rem;">`
              : `<div style="width:44px;height:44px;border-radius:50%;background:${s.color};color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:1.1rem;margin-bottom:0.75rem;">${s.name[0]}</div>`}
            <p style="font-size:0.85rem;color:var(--text-color);margin-bottom:0.75rem;">${s.isPlaceholder ? s.quote : `“${s.quote}”`}</p>
            <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:0.82rem;color:${s.color};">${s.name}</div>
            <div style="font-size:0.72rem;color:var(--n-muted);">${s.role}</div>
          </div>
        </div>`).join('')}
    </div>
    <button class="view-more-btn mt-3" onclick="openTab(event,'connect-content')">
      <i class="bi bi-arrow-right-circle me-1"></i>Start Your Website Project
    </button>
  </section>`;
}
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
  const faqsFallback = [
    { q:'How long does it take to build a website?', a:'A landing page usually takes 3–7 business days. A larger business website may take up to 3–10 business days. We agree on the delivery date before work starts.' },
    { q:'What do I need to provide?', a:'Your business name, services, phone number, logo if available, pictures and any written information you already have. We will guide you if some items are not ready.' },
    { q:'Can I use my own website template?', a:'Yes. You can choose one of our ready-made designs or send us your own template. We will review it and explain how it can be used for your project.' },
    { q:'Can I update the website myself?', a:'Yes. You will receive a simple dashboard for updating the parts of the website included in your package, such as services, pictures, FAQs and contact information.' },
    { q:'What can I manage from the dashboard?', a:'Depending on your website, you can manage content, images, services, portfolio items, customer messages, newsletter sign-ups, Google details, website reports, staff access and backups.' },
    { q:'Can my staff have separate login access?', a:'Yes. Different team members can receive different levels of access, so they only see or manage what they are allowed to use.' },
    { q:'Is my website and customer information safe?', a:'CUDFIRM protects private records and limits who can view or change them. We also provide backups and checks to help keep the website working properly.' },
    { q:'Will my website work on phones and Google?', a:'Yes. Every website is built for mobile devices, and we set up the basic information Google needs to understand the website. Good search results also depend on your content and competition.' },
    { q:'Do you build online stores or special features?', a:'Special features and online stores are reviewed separately. Tell us what you need, and we will explain what is possible, the cost and the delivery time.' },
    { q:'How do I get started?', a:'Complete the quote form or send us a WhatsApp message with your business details and preferred design. We will reply within 24 hours with the next steps.' },
  ];

  const cmsFaqs = window.CMS && Array.isArray(window.CMS.faq) ? window.CMS.faq : null;
  const faqs = (cmsFaqs && cmsFaqs.length)
    ? cmsFaqs.map(f => ({ q: f.question, a: f.answer }))
    : faqsFallback;

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
        <button class="btn btn-primary mt-2" onclick="openTab(event,'connect-content')">Join The Wait List</button>
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
    { icon:'bi-pencil-square', title:'Update Your Website Yourself', desc:'Change your services, pictures, portfolio, FAQs and other information from a simple dashboard.' },
    { icon:'bi-layout-text-window', title:'Use Our Design Or Yours', desc:'Choose a CUDFIRM design or bring your own template. Your website does not have to look like every other client’s website.' },
    { icon:'bi-chat-dots', title:'Keep Customer Messages Together', desc:'Contact-form messages and newsletter sign-ups can be viewed and managed from your dashboard.' },
    { icon:'bi-graph-up', title:'See How Your Website Is Doing', desc:'View useful website reports, check important Google details and spot issues that may affect visitors.' },
    { icon:'bi-people', title:'Give Staff The Right Access', desc:'Allow team members to view or update only the parts they need, without giving everyone full control.' },
    { icon:'bi-shield-check', title:'Backups And Proper Support', desc:'Your website can be backed up before major changes, and you receive a clear launch, handover and support process.' },
  ];

  return `
  <section id="tab17" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Why CUDFIRM</span></h6>
    <p class="alert mb-3" style="background:var(--n-gold-pale);border-left:4px solid var(--n-gold);border-radius:8px;font-size:0.83rem;color:var(--n-forest);padding:0.7rem 1rem;">
      A good website should not only look fine. It should help your business, save you time and give you proper control after it goes live.
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
      <i class="bi bi-arrow-right-circle me-1"></i>Build With CUDFIRM
    </button>
  </section>`;
}

// ─────────────────────────────────────────────
// TAB 20: ABOUT US (Client-first positioning)
// ─────────────────────────────────────────────
function buildTab20() {
  const values = [
    { icon:'bi-graph-up-arrow', title:'Business Results First', desc:'Every website should help your business look trusted, reach customers and receive more enquiries.' },
    { icon:'bi-chat-square-text', title:'Simple And Clear', desc:'We explain the price, work and delivery time plainly, without confusing words or hidden surprises.' },
    { icon:'bi-person-check', title:'You Stay In Control', desc:'Your business should be able to manage important website information without depending on us for every small change.' },
    { icon:'bi-shield-check', title:'Quality You Can Trust', desc:'We build websites that are fast, mobile-friendly, secure and properly checked before delivery.' },
  ];

  return `
  <section id="tab20" class="tab-content view p-3">
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">About CUDFIRM</span></h6>

    <!-- Mission statement -->
    <div class="card card-section mb-3" style="border-left:4px solid var(--n-gold);">
      <div class="card-content">
        <p style="font-size:1rem;font-family:'Syne',sans-serif;font-weight:700;color:var(--n-forest);margin-bottom:0.75rem;line-height:1.55;">
          Every Business Deserves A Website It Can Manage And Grow
        </p>
        <p style="font-size:0.85rem;color:var(--n-muted);line-height:1.7;margin:0;">
          CUDFIRM helps businesses get online with websites that look professional, work well on phones and are easy to update. We handle the building, setup and launch, then give you a simple dashboard and proper support.
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
          CUDFIRM started with a simple problem: many small businesses depended only on social media, while others had websites they could not update without calling a developer.
        </p>
        <p style="font-size:0.85rem;color:var(--n-muted);line-height:1.75;margin-bottom:0.75rem;">
          We decided to build websites that are not only attractive, but also useful. Clients should be able to update their information, receive enquiries and stay in control after launch.
        </p>
        <p style="font-size:0.85rem;color:var(--n-muted);line-height:1.75;margin:0;">
          Today, CUDFIRM builds business websites using ready-made designs, customised designs and client-supplied templates, with a clear process from setup to handover.
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
            { label:'Support Hours', value:'Monday–Saturday, 8am–8pm WAT' },
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
      <i class="bi bi-arrow-right-circle me-1"></i>Work With CUDFIRM
    </button>

    <footer class="footin mt-4" role="contentinfo">
      <div class="icons-social">
        <article class="list-social" aria-label="CUDFIRM social links">
          <span class="icons-social__item"><a class="icons-social__link" href="https://codepen.io/cudfirm-group" target="_blank" rel="noopener" aria-label="CUDFIRM on CodePen"><i class="fab fa-codepen" aria-hidden="true"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://instagram.com/cudfirm" target="_blank" rel="noopener" aria-label="CUDFIRM on Instagram"><i class="fab fa-instagram" aria-hidden="true"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://fb.me/cudfirm" target="_blank" rel="noopener" aria-label="CUDFIRM on Facebook"><i class="fab fa-facebook" aria-hidden="true"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://x.com/cudfirm" target="_blank" rel="noopener" aria-label="CUDFIRM on X / Twitter"><i class="fab fa-twitter" aria-hidden="true"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://linkedin.com/in/cudfirm" target="_blank" rel="noopener" aria-label="CUDFIRM on LinkedIn"><i class="fab fa-linkedin" aria-hidden="true"></i></a></span>
        </article>
      </div>
      <div class="footer-legal">
        <nav aria-label="Legal links">
          <a href="terms.html" class="footer-legal-link">Terms &amp; Conditions</a>
          <span aria-hidden="true"> &middot; </span>
          <a href="terms.html#privacy" class="footer-legal-link">Privacy Policy</a>
          <span aria-hidden="true"> &middot; </span>
          <a href="mailto:cudfirm@gmail.com" class="footer-legal-link">cudfirm@gmail.com</a>
        </nav>
        <p class="footer-copy">&copy; 2026 CUDFIRM &middot; Business Websites You Can Manage &middot; Lagos, Nigeria</p>
        <p class="footer-tagline">A Better Website. More Control. Less Stress.</p>
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
    <h6 class="sticky-top py-2"><span class="badge text-bg-primary">Request A Free Quote</span></h6>
    <hr class="my-2 w-25" />
    <div class="contact-container">
      <h4 class="contact-header">Let's Build Your Website</h4>
      <p class="contact-subheader">
        Tell us about your business, the website you need and the design you prefer. We will reply within 24 hours with a clear price, delivery time and next step.
      </p>
      <div class="contact-trust-row" role="list" aria-label="Contact assurances">
        <span role="listitem"><i class="bi bi-clock" aria-hidden="true"></i> Reply within 24 hours</span>
        <span role="listitem"><i class="bi bi-shield-check" aria-hidden="true"></i> No commitment required</span>
        <span role="listitem"><i class="bi bi-cash-coin" aria-hidden="true"></i> Clear price before we start</span>
      </div>
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
              <label for="contactMessage" class="form-label">Tell Us About Your Business And Website</label>
              <textarea class="form-control" id="contactMessage" name="message" rows="5" placeholder="Tell us what your business does, the pages or features you need, and whether you want one of our designs or have your own template." required></textarea>
            </div>
            <div class="d-flex flex-column gap-2">
              <button type="button" class="btn btn-whatsapp w-100" onclick="sendToWhatsAppWithForm()" style="padding:0.65rem;font-size:0.9rem;">
                <i class="bi bi-whatsapp me-1"></i>Send via WhatsApp (Fastest)
              </button>
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-primary w-100" onclick="sendToAdmin()" aria-label="Submit request via web form">
                  <i class="bi bi-send-check me-1"></i>Submit Request
                </button>
                <button type="button" class="btn btn-outline-secondary w-100" onclick="sendToEmail()" aria-label="Send request via email">
                  <i class="bi bi-envelope me-1"></i>Email Us
                </button>
              </div>
              <p style="font-size:0.72rem;color:var(--n-muted);text-align:center;margin:0;">
                <i class="bi bi-lock-fill me-1" aria-hidden="true"></i>Your details are kept private and never shared.
              </p>
            </div>
          </form>
        </div>
        <div class="col-12 col-lg-4">
          <div class="quick-contact-box">
            <h5><i class="bi bi-headset me-1"></i>Talk To Us Directly</h5>
            <p>WhatsApp is the fastest way to discuss your project.</p>
            <a href="tel:+2349056317709" class="btn btn-warning w-100 mb-2"><i class="bi bi-telephone me-1"></i>Call Us Now</a>
            <button class="btn btn-outline-light w-100" onclick="copyToClipboard('+2349056317709','Number copied! ✓')">
              <i class="bi bi-clipboard me-1"></i>Copy Number
            </button>
            <hr style="border-color:rgba(255,255,255,0.2);margin:1rem 0;" />
            <div style="font-size:0.75rem;opacity:0.8;text-align:center;">
              <i class="bi bi-envelope me-1"></i>cudfirm@gmail.com<br/>
              <i class="bi bi-geo-alt me-1 mt-1 d-inline-block"></i>Lagos, Nigeria
            </div>
          </div>
        </div>
      </div>
    </div>
    <footer class="footin mt-4" role="contentinfo">
      <div class="icons-social">
        <article class="list-social" aria-label="CUDFIRM social links">
          <span class="icons-social__item"><a class="icons-social__link" href="https://codepen.io/cudfirm-group" target="_blank" rel="noopener" aria-label="CUDFIRM on CodePen"><i class="fab fa-codepen" aria-hidden="true"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://instagram.com/cudfirm" target="_blank" rel="noopener" aria-label="CUDFIRM on Instagram"><i class="fab fa-instagram" aria-hidden="true"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://fb.me/cudfirm" target="_blank" rel="noopener" aria-label="CUDFIRM on Facebook"><i class="fab fa-facebook" aria-hidden="true"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://x.com/cudfirm" target="_blank" rel="noopener" aria-label="CUDFIRM on X / Twitter"><i class="fab fa-twitter" aria-hidden="true"></i></a></span>
          <span class="icons-social__item"><a class="icons-social__link" href="https://linkedin.com/in/cudfirm" target="_blank" rel="noopener" aria-label="CUDFIRM on LinkedIn"><i class="fab fa-linkedin" aria-hidden="true"></i></a></span>
        </article>
      </div>
      <div class="footer-legal">
        <nav aria-label="Legal links">
          <a href="terms.html" class="footer-legal-link">Terms &amp; Conditions</a>
          <span aria-hidden="true"> &middot; </span>
          <a href="terms.html#privacy" class="footer-legal-link">Privacy Policy</a>
          <span aria-hidden="true"> &middot; </span>
          <a href="mailto:cudfirm@gmail.com" class="footer-legal-link">cudfirm@gmail.com</a>
        </nav>
        <p class="footer-copy">&copy; 2026 CUDFIRM &middot; Business Websites You Can Manage &middot; Lagos, Nigeria</p>
        <p class="footer-tagline">A Better Website. More Control. Less Stress.</p>
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
  submitEnquiryToSupabase(name, contactInfo, message);
  showToast('Request sent ✓ We\'ll reply within 24 hours!');
  setTimeout(() => { window.location.href = 'thank-you.html'; }, 1500);
}

function sendToWhatsAppWithForm() {
  if (!validateForm()) return;
  const { name, contactInfo, message } = getFormValues();
  submitEnquiryToSupabase(name, contactInfo, message);
  const s = window.CMS && window.CMS.siteSettings;
  const yourNumber = (s && s.whatsapp ? s.whatsapp : '+2348028699824').replace(/[^\d+]/g, '');
  const text = `Hello CUDFIRM,\n\nName: ${name}\nContact: ${contactInfo}\n\nMessage:\n${message}`;
  window.open(`https://wa.me/${yourNumber}?text=${encodeURIComponent(text)}`, '_blank');
}

function sendToEmail() {
  if (!validateForm()) return;
  const { name, contactInfo, message } = getFormValues();
  submitEnquiryToSupabase(name, contactInfo, message);
  const subject = encodeURIComponent('Website Quote Request — CUDFIRM');
  const body = encodeURIComponent(`Name: ${name}\nContact Info: ${contactInfo}\n\nMessage:\n${message}`);
  window.location.href = `mailto:cudfirm@gmail.com?subject=${subject}&body=${body}`;
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
// SUPABASE ENQUIRY STORAGE (Phase 3)
// Powers the Messages page in /dashboard. RLS on the `messages`
// table only allows INSERT from the public (anon) key — reading,
// updating, and deleting requires an authenticated admin session.
// Fire-and-forget: a failure here must never block the visitor's
// WhatsApp/email/Google-Sheets submission, which is why every path
// above calls this alongside its existing behavior rather than
// instead of it.
// =============================================
function submitEnquiryToSupabase(name, contactInfo, message) {
  if (typeof supabaseClient === 'undefined') return;
  supabaseClient
    .from('messages')
    .insert({ name, contact_info: contactInfo, message })
    .then(({ error }) => {
      if (error) console.warn('[messages] Supabase submission failed:', error.message);
    });
}

// =============================================
// SITE SETTINGS (Phase 3)
// Patches footer copy/tagline, social links, and adds a newsletter
// signup form to each of the page's footer instances. Runs once,
// after buildAllSections() — it only ever PATCHES existing elements
// or appends a new form; it never replaces the footer markup itself,
// so if siteSettings comes back null (Supabase down, not configured
// yet) the page is byte-for-byte what it was before this feature
// existed.
// =============================================
function applySiteSettings() {
  const s = window.CMS && window.CMS.siteSettings;
  if (!s) return;

  if (s.copyright_text) {
    document.querySelectorAll('.footer-copy').forEach(el => { el.textContent = s.copyright_text; });
  }
  if (s.footer_text) {
    document.querySelectorAll('.footer-tagline').forEach(el => { el.textContent = s.footer_text; });
  }
  if (s.favicon_url) {
    const favicon = document.getElementById('siteFavicon');
    if (favicon) favicon.href = s.favicon_url;
  }
  if (s.email) {
    document.querySelectorAll('a[href^="mailto:cudfirm@gmail.com"]').forEach(a => {
      a.href = `mailto:${s.email}`;
      if (a.textContent.trim() === 'cudfirm@gmail.com') a.textContent = s.email;
    });
  }
  if (s.phone) {
    document.querySelectorAll('a[href^="tel:+2349056317709"]').forEach(a => {
      a.href = `tel:${s.phone.replace(/[^\d+]/g, '')}`;
    });
  }

  if (Array.isArray(s.social_links) && s.social_links.length) {
    const byPlatform = {};
    s.social_links.forEach(l => { if (l && l.platform && l.url) byPlatform[l.platform] = l.url; });
    document.querySelectorAll('.icons-social__link').forEach(a => {
      const iconEl = a.querySelector('i');
      const cls = iconEl ? iconEl.className : '';
      Object.keys(byPlatform).forEach(platform => {
        if (cls.includes(platform)) a.href = byPlatform[platform];
      });
    });
  }

  document.querySelectorAll('.footin').forEach((footer, idx) => {
    if (footer.querySelector('.newsletter-form')) return;
    const form = document.createElement('form');
    form.className = 'newsletter-form';
    form.setAttribute('aria-label', 'Subscribe to our newsletter');
    form.innerHTML = `
      <label for="newsletterEmail${idx}" class="newsletter-label">Get occasional tips &amp; offers</label>
      <div class="newsletter-row">
        <input type="email" id="newsletterEmail${idx}" class="newsletter-input" placeholder="you@email.com" required aria-required="true" autocomplete="email">
        <button type="submit" class="newsletter-btn">Subscribe</button>
      </div>
      <div class="newsletter-msg" role="status" aria-live="polite"></div>
    `;
    form.addEventListener('submit', onNewsletterSubmit);
    const copyEl = footer.querySelector('.footer-copy');
    if (copyEl && copyEl.parentNode) {
      copyEl.parentNode.insertBefore(form, copyEl);
    } else {
      footer.appendChild(form);
    }
  });

  loadAnalytics(s);
}

/**
 * Injects Google Analytics (gtag.js) and/or the Meta Pixel — but only
 * when an admin has actually entered an ID in Site Settings. No IDs
 * set (the default for every existing install) means no tracking
 * scripts are added at all, identical to today's behavior. Guarded
 * against double-injection if applySiteSettings() were ever called
 * twice on the same page load.
 */
function loadAnalytics(s) {
  if (s.ga_id && !document.getElementById('ga-gtag-script')) {
    const script1 = document.createElement('script');
    script1.id = 'ga-gtag-script';
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(s.ga_id)}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.id = 'ga-gtag-init';
    script2.textContent = `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${s.ga_id}');`;
    document.head.appendChild(script2);
  }

  if (s.fb_pixel_id && !document.getElementById('meta-pixel-init')) {
    const script = document.createElement('script');
    script.id = 'meta-pixel-init';
    script.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '${s.fb_pixel_id}');fbq('track', 'PageView');`;
    document.head.appendChild(script);
  }
}

function onNewsletterSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const input = form.querySelector('input[type="email"]');
  const msg = form.querySelector('.newsletter-msg');
  const btn = form.querySelector('button');
  const email = (input.value || '').trim();
  if (!email) return;

  btn.disabled = true;
  msg.textContent = '';
  submitNewsletterSignup(email).then(ok => {
    btn.disabled = false;
    if (ok) {
      msg.textContent = "You're subscribed — thank you! 🎉";
      form.reset();
    } else {
      msg.textContent = 'Something went wrong. Please try again.';
    }
  });
}

function submitNewsletterSignup(email) {
  if (typeof supabaseClient === 'undefined') return Promise.resolve(false);
  return supabaseClient
    .from('subscribers')
    .insert({ email })
    .then(({ error }) => {
      if (!error) return true;
      // A duplicate email means they're already subscribed — treat
      // that as success from the visitor's point of view.
      if (error.message && error.message.toLowerCase().includes('duplicate')) return true;
      console.warn('[subscribers] Supabase submission failed:', error.message);
      return false;
    });
}

// =============================================
// SEO MANAGER (Phase 3)
// Applies the "home" seo_meta row (see SEO Manager in /dashboard)
// to the existing, already-present <head> tags. Every tag it touches
// already exists in index.html with a sensible default — this only
// overwrites content/href attributes, never creates new tags, so a
// missing seo_meta row leaves the page exactly as it ships today.
// =============================================
function applySeoMeta() {
  const seo = window.CMS && window.CMS.seo;
  if (!seo) return;

  if (seo.title) document.title = seo.title;

  const setMeta = (selector, attr, value) => {
    if (!value) return;
    const el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  };

  setMeta('meta[name="description"]', 'content', seo.meta_description);
  setMeta('meta[property="og:title"]', 'content', seo.title);
  setMeta('meta[property="og:description"]', 'content', seo.meta_description);
  setMeta('meta[name="twitter:title"]', 'content', seo.title);
  setMeta('meta[name="twitter:description"]', 'content', seo.meta_description);
  setMeta('meta[name="robots"]', 'content', seo.robots);
  setMeta('link[rel="canonical"]', 'href', seo.canonical_url);
  if (seo.canonical_url) setMeta('meta[property="og:url"]', 'content', seo.canonical_url);
  setMeta('meta[property="og:image"]', 'content', seo.og_image);
  setMeta('meta[name="twitter:image"]', 'content', seo.twitter_image || seo.og_image);
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
document.addEventListener('DOMContentLoaded', async function () {

  // Wait for Supabase content (max ~2.5s, see cms-loader.js). If it
  // times out or any table is empty, window.CMS fields stay null and
  // every buildTabX() below falls back to its hardcoded defaults —
  // the site never breaks or blocks on this.
  await (window.CMSReady || Promise.resolve());

  // If CMS navigation content exists, use it for the sidebar; otherwise
  // keep the hardcoded SIDEBAR_TABS above untouched.
  if (window.CMS && Array.isArray(window.CMS.navigation) && window.CMS.navigation.length) {
    const sidebarRows = window.CMS.navigation.filter(n => n.location === 'sidebar');
    if (sidebarRows.length) {
      SIDEBAR_TABS.length = 0;
      sidebarRows.forEach(n => SIDEBAR_TABS.push({ id: n.tab_id, label: n.label, badge: n.badge || undefined }));
    }
  }

  // STEP 1: Render structural UI
  renderSidebarTabs();
  renderFooterNav();
  renderMobileTabStrip();

  // STEP 2: Build all sections into DOM
  buildAllSections();

  // STEP 2b: Patch in Site Settings (footer/contact/social/newsletter)
  // and SEO <head> tags now that both the DOM and window.CMS exist.
  // No-ops safely if siteSettings/seo weren't found — the page simply
  // keeps the hardcoded defaults it already has.
  applySiteSettings();
  applySeoMeta();

  // STEP 3: Store sections for global search
  const contentMain = document.querySelector('.content-main');
  if (contentMain) {
    originalSectionsInOrder = Array.from(contentMain.children).filter(n => n.tagName === 'SECTION');
  }

  // STEP 4: Open Home first
  openTab(null, 'tab1');

  // STEP 5: Open tab requested via URL hash (e.g. index.html#tab3,
  // used by thank-you.html's navigation buttons); otherwise restore
  // the last visited tab as before.
  const hashTab = location.hash ? location.hash.slice(1) : '';
  if (hashTab && document.getElementById(hashTab)) {
    setTimeout(() => openTab(null, hashTab), 60);
  } else {
    try {
      const saved = localStorage.getItem('cudfirm_last_tab');
      if (saved && saved !== 'tab1' && document.getElementById(saved)) {
        setTimeout(() => openTab(null, saved), 60);
      }
    } catch(e) {}
  }

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