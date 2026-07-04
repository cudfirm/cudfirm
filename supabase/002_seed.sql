-- ============================================================
-- CUDFIRM CMS — Seed Data 002
-- Extracted directly from js/script.js so the live site looks
-- IDENTICAL the moment it switches to reading from Supabase.
-- Safe to re-run: clears each table first.
-- ============================================================

truncate table hero restart identity;
truncate table services restart identity;
truncate table portfolio_projects restart identity;
truncate table testimonials restart identity;
truncate table faq restart identity;
truncate table navigation restart identity;

-- ---------- HERO ----------
insert into hero (id, eyebrow, title, subtitle, cta_primary_text, cta_primary_target, cta_secondary_text, cta_secondary_target, trust_items)
values (
  1,
  'Professional Web Design Studio · Lagos, Nigeria',
  'Your Business Deserves a Website That Wins Customers',
  'CUDFIRM builds fast, mobile-first websites for Nigerian businesses, professionals, and growing brands. We turn first-time visitors into paying customers — starting from ₦50,000, delivered in 3–7 days.',
  'Get a Free Quote Today', 'connect-content',
  'See Our Work', 'tab4',
  '[
    {"icon":"bi-check-circle-fill","label":"Mobile-Ready"},
    {"icon":"bi-check-circle-fill","label":"3–7 Day Delivery"},
    {"icon":"bi-check-circle-fill","label":"From ₦50,000"},
    {"icon":"bi-check-circle-fill","label":"30-Day Support Included"}
  ]'::jsonb
);

-- ---------- SERVICES ----------
insert into services (name, description, price, tags, search_terms, is_special, sort_order) values
('Starter Landing Page', 'Best for: barbers, photographers, food vendors, coaches, and anyone who needs to get online quickly. A single, conversion-focused page with your services, gallery, contact, and a WhatsApp button. Live in 3–5 days.', '₦50,000', '["#Landing","#Starter","#₦50K"]', 'landing page starter single one page fast affordable barber stylist photographer coach', false, 1),
('Business Website', 'Best for: growing businesses, professionals, and brands that need more than one page. Up to 6 custom pages with mobile-friendly design, SEO setup, contact forms, and 30-day free support after launch.', '₦100,000', '["#Full-Site","#Multi-Page","#₦100K"]', 'full business website multi page complete professional sme restaurant', false, 2),
('Website Maintenance', 'Best for: existing site owners who want to stay current without the technical headache. Monthly text updates, image changes, speed checks, and backups. Your site, always fresh.', '₦10K–20K/mo', '["#Monthly","#Support","#₦10K–20K"]', 'maintenance update support monthly changes fix bug backup', false, 3),
('Domain & Hosting Setup', 'Best for: businesses starting from scratch. We register your .com.ng or .com domain and set up fast, reliable Nigerian web hosting — so your site is live and accessible worldwide.', 'From ₦15,000', '["#Domain","#Hosting","#Setup"]', 'domain hosting setup register .com .com.ng website address', false, 4),
('SEO Starter Pack', 'Best for: businesses that want to appear on Google. We set up meta tags, Google Search Console, improve page speed, and configure local SEO — so customers searching for what you do can actually find you.', '₦20,000', '["#SEO","#Google","#Visibility"]', 'seo google search console meta tags visibility local search rank', false, 5),
('Brand Identity', 'Best for: new businesses and entrepreneurs. Logo design, colour palette, fonts, and a simple brand guide — everything you need to look consistent and professional across your website, social media, and print.', 'From ₦25,000', '["#Branding","#Logo","#Design"]', 'logo branding identity design colour palette font guide professional', false, 6),
('WhatsApp Business Setup', 'Best for: any business. We configure your WhatsApp Business profile with auto-replies, product catalogues, and a click-to-chat link embedded in your website — so customers reach you instantly.', '₦5,000', '["#WhatsApp","#Business"]', 'whatsapp business setup profile auto reply catalogue chat link', false, 7),
('Social Media Integration', 'Best for: businesses that are active on Instagram, Facebook, or TikTok. We connect your social feed to your website so it always looks fresh and active — without any extra work from you.', '₦8,000', '["#Social","#Instagram","#Feed"]', 'social media instagram facebook tiktok feed integration connect', false, 8),
('Got A Special Request?', 'Need something outside the standard list? Tell us what you want to build. We will review it and come back with a fair quote and clear timeline — no vague estimates.', 'Let''s Talk', '["#Custom","#Request"]', 'custom special request unique bespoke build quote', true, 9);

-- ---------- PORTFOLIO PROJECTS ----------
insert into portfolio_projects (name, industry, project_type, image_url, link, problem, solution, tags, is_live, featured_home, sort_order) values
('NSEYIN Massage', 'Health and Wellness', 'Service Website', 'img/nseyin.webp', '#', 'Agents losing leads to competitors with better online presence.', 'Premium multi-page property site with listings, gallery, and inquiry form.', '["#RealEstate","#Live"]', true, true, 1),
('A Blank Page', 'Fashion & Design', 'Designer Portfolio Site', 'img/black.jpg', 'portfolio/fashion/index.html', 'Collections buried on Instagram with no professional showcase.', 'Elegant lookbook site with collections, custom orders, and booking.', '["#Fashion","#Live"]', true, false, 2),
('Lobah Visuals', 'Photography', 'Photography Portfolio', 'img/lobahvisuals.webp', '#', 'Talented photographer with no landing page for client bookings.', 'Full-screen gallery portfolio with packages, pricing, and WhatsApp CTA.', '["#Photography","#Portfolio"]', true, true, 3),
('Eli Stitches', 'Fashion & Tailoring', 'Tailoring Business Site', 'img/elistitches.webp', '#', 'Customers couldn''t find the tailor or understand their services online.', 'Clean business site with services, gallery, measurement guide, and WhatsApp.', '["#Tailoring","#Business"]', true, true, 4),
('The Chef', 'Retail & E-commerce', 'Product Landing Page', 'img/chef.webp', '#', 'Brand needed a direct sales page separate from social media.', 'Conversion-focused landing page with product showcase and order CTA.', '["#Retail","#Landing"]', true, true, 5),
('Damkaz', 'Fashion Brand', 'Brand Website', 'img/damkaz.webp', '#', 'Brand needed a professional web presence beyond social media.', 'Fashion brand website showcasing collections and story.', '["#Fashion","#Live"]', true, true, 6),
('The King Master', 'General Business', 'Business Website', 'img/kingmaster.webp', '#', 'Business needed a credible online presence.', 'Professional business website built for trust and discovery.', '["#Business","#Live"]', true, true, 7),
('AutoLux', 'Automobile', 'Car Dealership Website', 'https://placehold.co/400x280/0B3D2E/C8922A?text=AutoLux', 'portfolio/automobile/index.html', 'Dealership had no digital presence to showcase its inventory.', 'Premium dealership site with car listings, specs, and test-drive booking.', '["#Automobile","#Demo"]', false, false, 8),
('Your Business Here', 'Any Industry', 'Get Started Today', 'https://placehold.co/400x280/3A4035/C8922A?text=Your+Business+%E2%86%92', 'connect-content', 'You''re losing customers to competitors who have a website.', 'A professional website built specifically for your business and customers.', '["#GetStarted"]', false, false, 9);

-- ---------- TESTIMONIALS ----------
insert into testimonials (name, role, quote, accent_color, is_placeholder, sort_order) values
('Adaeze O.', 'Fashion Designer · Lagos', 'CUDFIRM built my website in 5 days. My clients now book me online instead of hunting for my number. Life-changing.', '#0B3D2E', true, 1),
('Emeka N.', 'Solar Installer · Abuja', 'I thought a professional website was too expensive for my small business. CUDFIRM proved me completely wrong.', '#C8922A', true, 2),
('Fatima U.', 'Food Vendor · Kano', 'My WhatsApp orders doubled in 3 weeks after my site went live. People trust me more because I have a real website.', '#1A6B4A', true, 3),
('Chukwudi E.', 'Photographer · Enugu', 'Clean, fast, mobile-ready, and clients actually find me on Google now. Worth every kobo.', '#4D9E7A', true, 4);

-- ---------- FAQ ----------
insert into faq (question, answer, sort_order) values
('How long does it take to build a website?', 'A landing page takes 3–5 business days. A full multi-page business website takes 5–10 business days. We agree on a timeline before starting.', 1),
('What do I need to provide to get started?', 'Your business name, logo (if any), phone number, services or products, and any photos. We guide you through what''s needed — even if you don''t have everything ready.', 2),
('Do you offer payment in instalments?', 'Yes. You pay 50% upfront to begin and 50% on delivery. No full payment required before we start work.', 3),
('Will my website work on mobile phones?', 'Yes — every site we build is mobile-first. Over 80% of Nigerians browse on their phones, so this is non-negotiable for us.', 4),
('Can I update my website myself after you build it?', 'We can teach you how to make basic updates. Alternatively, our monthly maintenance plan covers all changes for ₦10,000–₦20,000/month.', 5),
('Do you do e-commerce or online stores?', 'We currently focus on landing pages, business sites, and portfolios. Online stores are complex — we recommend focusing on a simple site first to build trust with customers.', 6),
('What if I don''t have a logo or brand yet?', 'We offer basic logo and brand identity design as an add-on from ₦25,000. We can start with a simple, clean design and improve it over time.', 7),
('Do you host the website too?', 'Yes. We can handle domain registration and hosting setup for you as part of the project or as a separate add-on service.', 8),
('Where are you based and can you work with clients outside Lagos?', 'CUDFIRM is based in Lagos, Nigeria. We work with clients all over Nigeria — Abuja, Port Harcourt, Kano, Enugu, and beyond. Everything is done remotely via WhatsApp, email, and video calls, so location is never a barrier.', 9),
('How do I get started?', 'Simple. Go to the "Get A Quote" section, fill in your name, contact details, and tell us about your business. We will respond within 24 hours with a clear quote and next steps. You can also reach us directly on WhatsApp if you prefer a conversation first.', 10);

-- ---------- NAVIGATION ----------
insert into navigation (tab_id, label, location, badge, sort_order) values
('tab1', 'Home', 'sidebar', null, 1),
('tab3', 'Services', 'sidebar', null, 2),
('tab4', 'Portfolio', 'sidebar', null, 3),
('tab2', 'Who We Help', 'sidebar', null, 4),
('tab5', 'Our Process', 'sidebar', null, 5),
('tab17', 'Why CUDFIRM', 'sidebar', null, 6),
('tab9', 'Testimonials', 'sidebar', null, 7),
('tab13', 'FAQ', 'sidebar', null, 8),
('tab20', 'About Us', 'sidebar', null, 9),
('connect-content', 'Get A Quote', 'sidebar', 'hot', 10);
-- Footer nav seed left for you to fill in from FOOTER_NAV in script.js
-- once you confirm which items should be CMS-driven vs fixed (e.g. legal links).
