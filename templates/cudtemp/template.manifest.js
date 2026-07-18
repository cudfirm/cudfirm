/** CUDTEMP — CUDFIRM-owned reusable Adapter 2 manifest. */
(function () {
  'use strict';

  window.CUDTEMPManifest = Object.freeze({
    schemaVersion: '1.1.0',
    template: {
      id: 'cudtemp',
      name: 'CUDTEMP',
      version: '1.0.0',
      author: 'CUDFIRM',
      description: 'CUDFIRM-owned SaaS-style landing template connected to the shared CMS core through Adapter 2.',
      category: 'saas-business',
    },
    compatibility: {
      minimumContractVersion: '1.1.0',
      maximumContractVersion: '1.x',
      requiredCoreVersion: '2.0.0',
      supportedLocales: ['en-NG'],
      requiresJavaScript: true,
      notes: ['CUDTEMP uses a standalone landing-page shell and does not depend on the protected Adapter 1 legacy scripts or styles.'],
    },
    modules: { required: [], optional: ['member-accounts'] },
    assets: {
      required: [
        { id: 'cudtemp-styles', type: 'stylesheet', source: 'templates/cudtemp/css/cudtemp.css', managedBy: 'template', loadOrder: 10 },
        { id: 'cudtemp-interactions', type: 'script', source: 'templates/cudtemp/js/cudtemp.js', managedBy: 'template', loadOrder: 20 },
        { id: 'cudtemp-adapter', type: 'script', source: 'templates/cudtemp/template.adapter.js', managedBy: 'template', loadOrder: 30 },
      ],
      optional: [
        { id: 'dm-sans', type: 'font', source: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap', managedBy: 'host', loadOrder: 1 },
      ],
      notes: ['The host page loads declared assets. The shared runtime validates and renders sections but does not inject assets.'],
    },
    sections: {
      navigation: { enabled: true, required: false, source: 'navigation', mount: '#mainNav', renderer: 'renderNavigation', itemRequiredFields: ['label', 'target'], emptyState: 'keep-legacy' },
      hero: { enabled: true, required: true, source: 'hero', mount: '.hero', renderer: 'renderHero', requiredFields: ['title'], optionalFields: ['eyebrow','subtitle','primaryAction','secondaryAction','trustItems'], emptyState: 'keep-legacy' },
      portfolio: { enabled: true, required: false, source: 'portfolio', mount: '#screens', renderer: 'renderPortfolio', itemRequiredFields: ['title','imageUrl'], emptyState: 'keep-legacy' },
      services: { enabled: true, required: false, source: 'services', mount: '#features', renderer: 'renderServices', itemRequiredFields: ['title','description'], emptyState: 'keep-legacy' },
      facts: { enabled: true, required: false, source: 'about', mount: '.stats-section', renderer: 'renderFacts', optionalFields: ['facts'], emptyState: 'keep-legacy' },
      delivery: { enabled: true, required: false, source: 'services', mount: '#pricing', renderer: 'renderDelivery', itemRequiredFields: ['title','description'], emptyState: 'keep-legacy' },
      testimonials: { enabled: true, required: false, source: 'testimonials', mount: '#testimonials', renderer: 'renderTestimonials', itemRequiredFields: ['name','quote'], emptyState: 'keep-legacy' },
      capabilities: { enabled: true, required: false, source: 'about', mount: '#integrations', renderer: 'renderCapabilities', optionalFields: ['values'], emptyState: 'keep-legacy' },
      faq: { enabled: true, required: false, source: 'faq', mount: '#faq', renderer: 'renderFaq', itemRequiredFields: ['question','answer'], emptyState: 'keep-legacy' },
      contact: { enabled: true, required: false, source: 'contact', mount: '#contact', renderer: 'renderContact', requiredFields: ['title'], optionalFields: ['introduction','directContact'], emptyState: 'keep-legacy' },
      site: { enabled: true, required: true, source: 'site', mount: '.footer', renderer: 'renderSite', requiredFields: ['name'], optionalFields: ['footerText','copyrightText','socialLinks','email','phone','whatsapp'], emptyState: 'keep-legacy' },
      seo: { enabled: true, required: false, source: 'seo', mount: 'head', renderer: 'renderSeo', emptyState: 'keep-legacy' },
    },
    routes: {
      mode: 'single-page',
      pages: { home: { target: 'cudtemp.html', section: 'hero', seoPageKey: 'home' } },
    },
    forms: {},
    features: { tabs: false, filtering: false, search: false, lightbox: false, contactForm: false, newsletterForm: false, themeCustomization: true, maintenanceMode: true, darkMode: false },
    seo: { enabled: true, managedBy: 'adapter', pageResolution: { mode: 'single-page', fallbackPageKey: 'home' }, supportedFields: ['title','description','canonicalUrl','robots','openGraphImage','twitterImage'] },
    theme: {
      enabled: true,
      managedBy: 'adapter',
      cssVariableMap: { primary: '--accent', secondary: '--accent-mid', accent: '--accent-light', background: '--bg', text: '--text-1', radius: '--radius' },
      supportsCustomCss: false,
    },
    fallbacks: {
      missingRequiredSection: 'error', missingOptionalSection: 'ignore', missingRequiredField: 'warn-and-hide', missingOptionalField: 'ignore', missingImage: 'keep-legacy', emptyList: 'keep-legacy', rendererFailure: 'keep-legacy',
    },
    notes: [{ level: 'info', message: 'CUDTEMP is a reusable CUDFIRM-owned template. It consumes shared contract data and contains no authentication, dashboard CRUD, direct Supabase table queries, RLS, backup, or role logic.' }],
  });
})();
