-- ============================================================
-- CUDFIRM CMS — Migration 017
-- Public website messaging refresh
--
-- Data-only corrective migration. Existing migrations remain unchanged.
-- Before running: download a CUDFIRM JSON backup, back up the project,
-- and confirm the target is the CUDFIRM_DATABASE Supabase project.
-- ============================================================

begin;

update public.hero
set
  eyebrow = 'Business Websites You Can Manage · Lagos, Nigeria',
  title = 'Get a Website That Grows With Your Business',
  subtitle = 'CUDFIRM builds fast, mobile-friendly websites that help customers find, trust and contact your business. You also get a simple dashboard to update your content — from ₦50,000, delivered in 3–7 days.',
  cta_primary_text = 'Get a Free Quote Today',
  cta_primary_target = 'connect-content',
  cta_secondary_text = 'See Our Work',
  cta_secondary_target = 'tab4',
  trust_items = '[
    {"icon":"bi-check-circle-fill","label":"Mobile-Ready"},
    {"icon":"bi-check-circle-fill","label":"3–7 Day Delivery"},
    {"icon":"bi-check-circle-fill","label":"From ₦50,000"},
    {"icon":"bi-check-circle-fill","label":"Easy Dashboard Included"}
  ]'::jsonb,
  updated_at = now()
where id = 1;

update public.services
set name = 'Starter Website',
    description = 'Best for small businesses and professionals who need to get online quickly. You get one focused page with your services, pictures, contact details, WhatsApp button and an easy dashboard for updates.',
    price = '₦50,000',
    tags = '["#Starter","#OnePage","#Dashboard"]'::jsonb,
    search_terms = 'starter website one page dashboard small business professional quick',
    is_special = false,
    is_active = true,
    status = 'published',
    sort_order = 1,
    updated_at = now()
where id = 1;

update public.services
set name = 'Business Website',
    description = 'Best for growing businesses that need more space to explain what they do. You get up to six pages, mobile-friendly design, contact forms, Google setup, a management dashboard and 30 days of support.',
    price = '₦100,000',
    tags = '["#Business","#MultiPage","#Professional"]'::jsonb,
    search_terms = 'business website multi page professional dashboard google contact forms',
    is_special = false,
    is_active = true,
    status = 'published',
    sort_order = 2,
    updated_at = now()
where id = 2;

update public.services
set name = 'Website Maintenance',
    description = 'Best for business owners who want their website kept fresh and working well. We handle agreed text changes, image updates, checks, backups and small fixes.',
    price = '₦10,000–₦20,000 per month',
    tags = '["#Monthly","#Support","#Updates"]'::jsonb,
    search_terms = 'maintenance monthly support updates images backups fixes',
    is_special = false,
    is_active = true,
    status = 'published',
    sort_order = 3,
    updated_at = now()
where id = 3;

update public.services
set name = 'Bring Your Own Template',
    description = 'Already have a website design or template you like? Send it to us. We will review it, add your business content and connect it to the CUDFIRM dashboard where suitable.',
    price = 'Custom Quote',
    tags = '["#YourTemplate","#CustomDesign","#Setup"]'::jsonb,
    search_terms = 'bring own template client supplied custom design dashboard setup',
    is_special = false,
    is_active = true,
    status = 'published',
    sort_order = 4,
    updated_at = now()
where id = 4;

update public.services
set name = 'Domain & Hosting Setup',
    description = 'We help you register your website address, connect reliable hosting and make sure the website is properly published online.',
    price = 'From ₦15,000',
    tags = '["#Domain","#Hosting","#Launch"]'::jsonb,
    search_terms = 'domain hosting launch publish website address',
    is_special = false,
    is_active = true,
    status = 'published',
    sort_order = 5,
    updated_at = now()
where id = 5;

update public.services
set name = 'Google & SEO Setup',
    description = 'We set up your page titles, descriptions, Google tools and other important details that help customers find your business online.',
    price = '₦20,000',
    tags = '["#Google","#SEO","#Visibility"]'::jsonb,
    search_terms = 'google seo visibility page titles descriptions search',
    is_special = false,
    is_active = true,
    status = 'published',
    sort_order = 6,
    updated_at = now()
where id = 6;

update public.services
set name = 'Brand Identity',
    description = 'Need a more professional look? We can create a simple logo, colour style, fonts and brand guide for your website and social pages.',
    price = 'From ₦25,000',
    tags = '["#Logo","#Branding","#Design"]'::jsonb,
    search_terms = 'logo branding design colour fonts brand guide',
    is_special = false,
    is_active = true,
    status = 'published',
    sort_order = 7,
    updated_at = now()
where id = 7;

update public.services
set name = 'Ready-Made Website Designs',
    description = 'Choose from CUDFIRM’s ready-made website designs and let us customise the words, pictures, colours and sections to suit your business.',
    price = 'Project Quote',
    tags = '["#ReadyMade","#FastSetup","#Customised"]'::jsonb,
    search_terms = 'ready made template fast setup customised website design',
    is_special = false,
    is_active = true,
    status = 'published',
    sort_order = 8,
    updated_at = now()
where id = 8;

update public.services
set name = 'Special Website Request',
    description = 'Need something outside the standard options? Tell us what you want the website to do. We will review it and give you a clear answer, price and timeline.',
    price = 'Let''s Talk',
    tags = '["#Custom","#SpecialRequest","#Quote"]'::jsonb,
    search_terms = 'custom special request quote website features',
    is_special = true,
    is_active = true,
    status = 'published',
    sort_order = 9,
    updated_at = now()
where id = 9;

update public.testimonials
set name = 'Look More Professional',
    role = 'Website Benefit',
    quote = 'Give customers one trusted place to learn about your business, services and contact details.',
    is_placeholder = true,
    is_active = true,
    status = 'published',
    sort_order = 1,
    updated_at = now()
where id = 1;

update public.testimonials
set name = 'Get More Enquiries',
    role = 'Website Benefit',
    quote = 'Make it easy for interested customers to call, send a message, complete a form or contact you on WhatsApp.',
    is_placeholder = true,
    is_active = true,
    status = 'published',
    sort_order = 2,
    updated_at = now()
where id = 2;

update public.testimonials
set name = 'Save Time On Updates',
    role = 'Website Benefit',
    quote = 'Change common website information without waiting for a developer every time.',
    is_placeholder = true,
    is_active = true,
    status = 'published',
    sort_order = 3,
    updated_at = now()
where id = 3;

update public.testimonials
set name = 'Stay In Control',
    role = 'Website Benefit',
    quote = 'Keep your website content, messages, staff access and important records organised in one place.',
    is_placeholder = true,
    is_active = true,
    status = 'published',
    sort_order = 4,
    updated_at = now()
where id = 4;

update public.faq
set question = 'How long does it take to build a website?',
    answer = 'A landing page usually takes 3–7 business days. A larger business website may take up to 3–10 business days. We agree on the delivery date before work starts.',
    is_active = true, status = 'published', sort_order = 1, updated_at = now()
where id = 1;

update public.faq
set question = 'What do I need to provide?',
    answer = 'Your business name, services, phone number, logo if available, pictures and any written information you already have. We will guide you if some items are not ready.',
    is_active = true, status = 'published', sort_order = 2, updated_at = now()
where id = 2;

update public.faq
set question = 'Can I use my own website template?',
    answer = 'Yes. You can choose one of our ready-made designs or send us your own template. We will review it and explain how it can be used for your project.',
    is_active = true, status = 'published', sort_order = 3, updated_at = now()
where id = 3;

update public.faq
set question = 'Can I update the website myself?',
    answer = 'Yes. You will receive a simple dashboard for updating the parts of the website included in your package, such as services, pictures, FAQs and contact information.',
    is_active = true, status = 'published', sort_order = 4, updated_at = now()
where id = 4;

update public.faq
set question = 'What can I manage from the dashboard?',
    answer = 'Depending on your website, you can manage content, images, services, portfolio items, customer messages, newsletter sign-ups, Google details, website reports, staff access and backups.',
    is_active = true, status = 'published', sort_order = 5, updated_at = now()
where id = 5;

update public.faq
set question = 'Can my staff have separate login access?',
    answer = 'Yes. Different team members can receive different levels of access, so they only see or manage what they are allowed to use.',
    is_active = true, status = 'published', sort_order = 6, updated_at = now()
where id = 6;

update public.faq
set question = 'Is my website and customer information safe?',
    answer = 'CUDFIRM protects private records and limits who can view or change them. We also provide backups and checks to help keep the website working properly.',
    is_active = true, status = 'published', sort_order = 7, updated_at = now()
where id = 7;

update public.faq
set question = 'Will my website work on phones and Google?',
    answer = 'Yes. Every website is built for mobile devices, and we set up the basic information Google needs to understand the website. Good search results also depend on your content and competition.',
    is_active = true, status = 'published', sort_order = 8, updated_at = now()
where id = 8;

update public.faq
set question = 'Do you build online stores or special features?',
    answer = 'Special features and online stores are reviewed separately. Tell us what you need, and we will explain what is possible, the cost and the delivery time.',
    is_active = true, status = 'published', sort_order = 9, updated_at = now()
where id = 9;

update public.faq
set question = 'How do I get started?',
    answer = 'Complete the quote form or send us a WhatsApp message with your business details and preferred design. We will reply within 24 hours with the next steps.',
    is_active = true, status = 'published', sort_order = 10, updated_at = now()
where id = 10;

update public.navigation
set label = 'Benefits'
where tab_id = 'tab9' and location = 'sidebar';

update public.about_content
set
  eyebrow = 'About CUDFIRM',
  title = 'Every Business Deserves A Website It Can Manage And Grow',
  introduction = 'CUDFIRM helps businesses get online with websites that look professional, work well on phones and are easy to update. We handle the building, setup and launch, then give you a simple dashboard and proper support.',
  mission_title = 'Our Mission',
  mission_text = 'To help businesses own a professional website they can use with confidence, update easily and grow over time.',
  story_title = 'Our Story',
  story_blocks = '[
    {"id":"story-1","heading":"","text":"CUDFIRM started with a simple problem: many small businesses depended only on social media, while others had websites they could not update without calling a developer.","imageUrl":"","imageAlt":""},
    {"id":"story-2","heading":"","text":"We decided to build websites that are not only attractive, but also useful. Clients should be able to update their information, receive enquiries and stay in control after launch.","imageUrl":"","imageAlt":""},
    {"id":"story-3","heading":"","text":"Today, CUDFIRM builds business websites using ready-made designs, customised designs and client-supplied templates, with a clear process from setup to handover.","imageUrl":"","imageAlt":""}
  ]'::jsonb,
  values_title = 'What We Stand For',
  values = '[
    {"id":"value-1","icon":"bi-graph-up-arrow","title":"Business Results First","description":"Every website should help your business look trusted, reach customers and receive more enquiries."},
    {"id":"value-2","icon":"bi-chat-square-text","title":"Simple And Clear","description":"We explain the price, work and delivery time plainly, without confusing words or hidden surprises."},
    {"id":"value-3","icon":"bi-person-check","title":"You Stay In Control","description":"Your business should be able to manage important website information without depending on us for every small change."},
    {"id":"value-4","icon":"bi-shield-check","title":"Quality You Can Trust","description":"We build websites that are fast, mobile-friendly, secure and properly checked before delivery."}
  ]'::jsonb,
  facts_title = 'Quick Facts',
  facts = '[
    {"id":"fact-1","label":"Based In","value":"Lagos, Nigeria"},
    {"id":"fact-2","label":"Delivery","value":"3–10 Business Days"},
    {"id":"fact-3","label":"Starting Price","value":"₦50,000"},
    {"id":"fact-4","label":"Support Hours","value":"Monday–Saturday, 8am–8pm WAT"}
  ]'::jsonb,
  cta_label = 'Work With CUDFIRM',
  cta_target = 'connect-content',
  status = 'published',
  updated_at = now()
where id = 1;

update public.contact_content
set
  eyebrow = 'Request A Free Quote',
  title = 'Let''s Build Your Website',
  introduction = 'Tell us about your business, the website you need and the design you prefer. We will reply within 24 hours with a clear price, delivery time and next step.',
  assurances = '[
    {"id":"assurance-1","icon":"bi-clock","title":"Reply Within 24 Hours","description":""},
    {"id":"assurance-2","icon":"bi-shield-check","title":"No Commitment Required","description":""},
    {"id":"assurance-3","icon":"bi-cash-coin","title":"Clear Price Before We Start","description":""}
  ]'::jsonb,
  form_config = '{
    "nameLabel":"Your Name",
    "namePlaceholder":"e.g. Emeka Okafor",
    "contactLabel":"Your Email or WhatsApp Number",
    "contactPlaceholder":"email@example.com or +234...",
    "messageLabel":"Tell Us About Your Business And Website",
    "messagePlaceholder":"Tell us what your business does, the pages or features you need, and whether you want one of our designs or have your own template.",
    "submitLabel":"Submit Request",
    "submittingLabel":"Sending...",
    "successMessage":"Your message has been sent.",
    "errorMessage":"We could not send your message. Please try again.",
    "whatsappLabel":"Send via WhatsApp (Fastest)",
    "emailLabel":"Email Us",
    "privacyText":"Your details are kept private and never shared."
  }'::jsonb,
  direct_contact_title = 'Talk To Us Directly',
  direct_contact_description = 'WhatsApp is the fastest way to discuss your project.',
  business_hours = 'Monday–Saturday, 8am to 8pm WAT',
  show_phone = true,
  show_email = true,
  show_whatsapp = true,
  show_address = true,
  show_map = false,
  status = 'published',
  updated_at = now()
where id = 1;

update public.site_settings
set
  email = 'cudfirm@gmail.com',
  phone = '+2349056317709',
  whatsapp = '+2348028699824',
  footer_text = 'A Better Website. More Control. Less Stress.',
  copyright_text = '© 2026 CUDFIRM · Business Websites You Can Manage · Lagos, Nigeria',
  updated_at = now()
where id = 1;

update public.seo_meta
set
  title = 'CUDFIRM — Business Websites You Can Manage',
  meta_description = 'CUDFIRM builds fast, mobile-friendly websites with an easy dashboard for updates, customer messages and growth. Choose our design or bring your own.',
  robots = 'index, follow',
  canonical_url = 'https://cudfirm.netlify.app',
  updated_at = now()
where page_key = 'home';

update public.portfolio_projects
set
  industry = 'Health And Wellness',
  project_type = 'Massage Service Website',
  problem = 'Potential clients needed a clear place to understand the massage services and contact the business directly.',
  solution = 'A clean wellness website showing the services, brand information and direct contact options.',
  tags = '["#Wellness","#Massage","#ServiceWebsite"]'::jsonb,
  is_live = false,
  updated_at = now()
where name = 'NSEYIN Massage';

update public.portfolio_projects
set
  industry = 'Website Design And Management',
  project_type = 'Business Website With Dashboard',
  problem = 'Many businesses receive websites they cannot update or manage without returning to the original developer.',
  solution = 'CUDFIRM gives the business a professional website, a simple dashboard and the freedom to use different suitable website designs.',
  tags = '["#Website","#Dashboard","#Live"]'::jsonb,
  is_live = true,
  updated_at = now()
where name = 'CUDFIRM';

-- A project with no working destination must not be presented as live.
update public.portfolio_projects
set is_live = false,
    updated_at = now()
where coalesce(trim(link), '') in ('', '#');

commit;
