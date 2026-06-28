/**
 * ================================================
 *  CUDFIRM FEED ENGINE — AI-Powered Dynamic Feed
 *  Version: 1.0.0
 *  Integrates with: script.js (replaces buildBlogContent)
 *
 *  Architecture:
 *  ─ FeedDataSource   → data layer (RSS / API / manual / social stubs)
 *  ─ FeedAI           → AI-simulation layer (scoring, tagging, personalization)
 *  ─ FeedStore        → reactive state (filter, sort, bookmarks, likes)
 *  ─ FeedRenderer     → DOM rendering (cards, layouts, sidebar)
 *  ─ FeedController   → orchestration (init, events, load-more)
 *  ─ buildBlogContent → replaces existing stub (same function name!)
 * ================================================
 */

'use strict';

/* ============================================
   FEED DATA SOURCE
   Scalable: swap fetchFromRSS / fetchFromAPI
   with real Supabase / Firebase / RSS calls
   ============================================ */
const FeedDataSource = (() => {

  /* ── Category meta ── */
  const CATEGORIES = [
    { id: 'all',       label: 'All',       emoji: '🌐' },
    { id: 'business',  label: 'Business',  emoji: '💼' },
    { id: 'tech',      label: 'Tech',      emoji: '💻' },
    { id: 'health',    label: 'Health',    emoji: '❤️' },
    { id: 'agro',      label: 'Agro',      emoji: '🌿' },
    { id: 'diaspora',  label: 'Diaspora',  emoji: '✈️' },
    { id: 'energy',    label: 'Energy',    emoji: '⚡' },
    { id: 'lifestyle', label: 'Lifestyle', emoji: '✨' },
    { id: 'finance',   label: 'Finance',   emoji: '📊' },
    { id: 'creative',  label: 'Creative',  emoji: '🎨' },
    { id: 'housing',   label: 'Housing',   emoji: '🏠' },
    { id: 'community', label: 'Community', emoji: '🤝' },
  ];

  /* ── Author pool ── */
  const AUTHORS = [
    { name: 'Amara Okafor',  handle: '@amaraok',  avatar: 'https://i.pravatar.cc/40?img=47', posts: 24 },
    { name: 'Chidi Nwosu',   handle: '@chidinw',  avatar: 'https://i.pravatar.cc/40?img=68', posts: 18 },
    { name: 'Ngozi Adeyemi', handle: '@ngoziad',  avatar: 'https://i.pravatar.cc/40?img=45', posts: 31 },
    { name: 'Emeka Bello',   handle: '@emekab',   avatar: 'https://i.pravatar.cc/40?img=57', posts: 12 },
    { name: 'Fatima Yusuf',  handle: '@fatimay',  avatar: 'https://i.pravatar.cc/40?img=25', posts: 20 },
    { name: 'Tunde Adebayo', handle: '@tundeab',  avatar: 'https://i.pravatar.cc/40?img=52', posts: 15 },
    { name: 'Kemi Osei',     handle: '@kemios',   avatar: 'https://i.pravatar.cc/40?img=32', posts: 28 },
    { name: 'Seun Martins',  handle: '@seunm',    avatar: 'https://i.pravatar.cc/40?img=60', posts: 9  },
  ];

  /* ── Image bank (high-quality Unsplash by category) ── */
  const IMAGES = {
    business:  [
      'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=600&q=75',
      'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=600&q=75',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=75',
    ],
    tech:      [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=75',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=75',
      'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=75',
    ],
    health:    [
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=75',
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=75',
      'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&q=75',
    ],
    agro:      [
      'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=75',
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=75',
      'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&q=75',
    ],
    diaspora:  [
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=75',
      'https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=600&q=75',
      'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=600&q=75',
    ],
    energy:    [
      'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&q=75',
      'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&q=75',
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=75',
    ],
    lifestyle: [
      'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=75',
      'https://images.unsplash.com/photo-1498462440456-0dba182e775b?w=600&q=75',
      'https://images.unsplash.com/photo-1550159930-40066082a4fc?w=600&q=75',
    ],
    finance:   [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=75',
      'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=600&q=75',
      'https://images.unsplash.com/photo-1554260570-e9689a3418b8?w=600&q=75',
    ],
    creative:  [
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=75',
      'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&q=75',
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&q=75',
    ],
    housing:   [
      'https://images.unsplash.com/photo-1460317442991-0ec209397118?w=600&q=75',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=75',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=75',
    ],
    community: [
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=75',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=75',
      'https://images.unsplash.com/photo-1556484687-30636164638b?w=600&q=75',
    ],
  };

  /* ── Seed post data ── */
  const SEED_POSTS = [
    {
      id: 'p001', type: 'manual', category: 'business',
      title: 'How Nigerian Startups Are Redefining the African Supply Chain',
      excerpt: 'A new wave of logistics-tech companies is bridging the last-mile gap across West Africa, attracting record diaspora investment.',
      tags: ['StartupNG', 'Logistics', 'AfricaTech'],
      readTime: '5 min', featured: true,
    },
    {
      id: 'p002', type: 'api', category: 'tech',
      title: 'AI Tools Built for Africa: The 2026 Landscape Report',
      excerpt: 'From Lagos to Nairobi, homegrown AI solutions are disrupting everything from agritech to fintech with unprecedented speed.',
      tags: ['AI', 'AfricaTech', 'Innovation'],
      readTime: '7 min', featured: false,
    },
    {
      id: 'p003', type: 'rss', category: 'health',
      title: 'CUDFIRM Wellness Guide: Managing Stress in the Entrepreneurial Journey',
      excerpt: 'Mental health is the silent business strategy. Here is what top Nigerian founders are doing differently in 2026.',
      tags: ['MentalHealth', 'Wellness', 'Founders'],
      readTime: '4 min', featured: false,
    },
    {
      id: 'p004', type: 'manual', category: 'agro',
      title: 'Cassava Futures: How AgriLink Is Changing Nigeria\'s Export Game',
      excerpt: 'Direct-to-buyer agro export platforms are cutting middlemen and tripling farmer incomes across the Niger Delta.',
      tags: ['Agro', 'Export', 'FoodSecurity'],
      readTime: '6 min', featured: false,
    },
    {
      id: 'p005', type: 'social', category: 'diaspora',
      title: 'Sending Money Home Just Got Smarter: The Remittance Revolution',
      excerpt: 'Fintech platforms are slashing remittance fees to near-zero for the 15 million Nigerians living abroad.',
      tags: ['Diaspora', 'Fintech', 'Remittance'],
      readTime: '3 min', featured: false,
    },
    {
      id: 'p006', type: 'api', category: 'energy',
      title: 'Solar Microgrids Are Powering Rural Nigeria — Here\'s the Blueprint',
      excerpt: 'Community-owned solar installations are delivering 24/7 power to villages that the national grid has never reached.',
      tags: ['SolarEnergy', 'CleanTech', 'Nigeria'],
      readTime: '5 min', featured: false,
    },
    {
      id: 'p007', type: 'manual', category: 'finance',
      title: 'Stock-Picking in 2026: A Nigerian Investor\'s Survival Guide',
      excerpt: 'With the NGX recovering strongly, here are the sectors analysts are bullish on — and the ones to avoid.',
      tags: ['Investing', 'NGX', 'Finance'],
      readTime: '8 min', featured: false,
    },
    {
      id: 'p008', type: 'rss', category: 'creative',
      title: 'Afro-Digital Art: The Global Rise of Nigerian Creatives Online',
      excerpt: 'From Twitter/X to emerging Web3 platforms, a generation of Nigerian artists is commanding global attention.',
      tags: ['CreativeNG', 'AfroPop', 'DigitalArt'],
      readTime: '4 min', featured: false,
    },
    {
      id: 'p009', type: 'api', category: 'housing',
      title: 'Affordable Housing Hacks for Lagos: The 2026 Insider Report',
      excerpt: 'Co-living, rent-to-own, and community mortgage pools are transforming how young Lagosians approach homeownership.',
      tags: ['Lagos', 'Housing', 'RealEstate'],
      readTime: '6 min', featured: false,
    },
    {
      id: 'p010', type: 'manual', category: 'lifestyle',
      title: '10 Lagos Restaurants Redefining Fine Dining in West Africa',
      excerpt: 'Nigerian cuisine has always been world-class. Now, the presentation and experience are finally catching up.',
      tags: ['FoodNG', 'Lagos', 'Culture'],
      readTime: '5 min', featured: false,
    },
    {
      id: 'p011', type: 'social', category: 'community',
      title: 'CUDFIRM Community: 2,400 Members and the Story Behind the Growth',
      excerpt: 'How a WhatsApp group became West Africa\'s most active business-support community in under three years.',
      tags: ['Community', 'CUDFIRM', 'Growth'],
      readTime: '4 min', featured: false,
    },
    {
      id: 'p012', type: 'rss', category: 'tech',
      title: 'Coding Bootcamps vs Degrees: What Nigeria\'s Tech Hirers Actually Want',
      excerpt: 'We surveyed 120 Nigerian tech recruiters. The results might surprise you — and give bootcamp graduates hope.',
      tags: ['TechNG', 'Career', 'Education'],
      readTime: '6 min', featured: false,
    },
    {
      id: 'p013', type: 'api', category: 'business',
      title: 'The CUDFIRM Grants Directory: 28 Open Opportunities for 2026',
      excerpt: 'Government, private sector, and diaspora-backed grants open right now for Nigerian entrepreneurs.',
      tags: ['Grants', 'Funding', 'SMEs'],
      readTime: '5 min', featured: false,
    },
    {
      id: 'p014', type: 'manual', category: 'diaspora',
      title: 'UK-Nigeria Business Bridge: What Opens Doors in Both Directions',
      excerpt: 'British-Nigerian entrepreneurs share the frameworks that let them operate successfully across two continents.',
      tags: ['UKNigeria', 'Diaspora', 'Business'],
      readTime: '7 min', featured: false,
    },
    {
      id: 'p015', type: 'rss', category: 'health',
      title: 'Nigeria\'s Health-Tech Boom: Apps That Are Actually Saving Lives',
      excerpt: 'Telemedicine, AI diagnostics, and community health workers with smartphones — the future is already here.',
      tags: ['HealthTech', 'Nigeria', 'Innovation'],
      readTime: '5 min', featured: false,
    },
  ];

  /* ── Enrich posts with dynamic data ── */
  function _enrichPost(raw, index) {
    const author = AUTHORS[index % AUTHORS.length];
    const imgPool = IMAGES[raw.category] || IMAGES.business;
    const img = imgPool[index % imgPool.length];
    const hoursAgo = Math.floor(Math.random() * 48) + 1;
    const timestamp = hoursAgo < 24
      ? `${hoursAgo}h ago`
      : `${Math.floor(hoursAgo / 24)}d ago`;
    const reactions = Math.floor(Math.random() * 340) + 20;
    const comments  = Math.floor(Math.random() * 80) + 2;
    const shares    = Math.floor(Math.random() * 150) + 5;
    const sourceMap = {
      rss: 'RSS Feed', api: 'API Content',
      manual: 'CUDFIRM Editorial', social: 'Social Embed',
    };

    return {
      ...raw,
      author,
      image: img,
      timestamp,
      reactions,
      comments,
      shares,
      sourceLabel: sourceMap[raw.type] || 'Editorial',
      sourceIcon: 'https://i.pravatar.cc/20?img=' + ((index * 7 + 3) % 70),
    };
  }

  let _enriched = null;

  /* ── Public API ── */
  return {
    CATEGORIES,
    AUTHORS,

    /* Simulates async fetch — swap with real API call */
    async fetchFeed() {
      if (_enriched) return _enriched;
      // ↓ Replace this with: const res = await fetch('https://your-api/feed'); const raw = await res.json();
      await new Promise(r => setTimeout(r, 320)); // simulate latency
      _enriched = SEED_POSTS.map(_enrichPost);
      return _enriched;
    },

    /* Stub: future RSS integration */
    async fetchFromRSS(url) {
      // Replace with real RSS-to-JSON service, e.g.:
      // const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
      console.info('[FeedDataSource] RSS fetch stub — url:', url);
      return [];
    },

    /* Stub: future Supabase / Firebase integration */
    async fetchFromDB(table, filters = {}) {
      // const { data } = await supabase.from(table).select('*').match(filters);
      console.info('[FeedDataSource] DB fetch stub — table:', table, 'filters:', filters);
      return [];
    },

    /* Stub: manual post submission (used by Submit A Tip tab) */
    async submitPost(post) {
      // await supabase.from('posts').insert([post]);
      console.info('[FeedDataSource] submitPost stub:', post);
      return { success: true };
    },

    /* Simulate loading more posts (pagination) */
    async fetchMore(page = 2) {
      await new Promise(r => setTimeout(r, 500));
      // Rotate existing posts with new IDs for demo
      return SEED_POSTS.slice(0, 6).map((raw, i) => ({
        ..._enrichPost(raw, i + page * 10),
        id: raw.id + '_p' + page,
        title: raw.title + ' — Part ' + page,
      }));
    },
  };
})();


/* ============================================
   FEED AI ENGINE
   Simulates AI-powered features via frontend logic
   Swap scoring/tagging with real AI API calls
   ============================================ */
const FeedAI = (() => {

  /* ── Engagement Score (0–100) ── */
  function computeEngagementScore(post) {
    const base = (post.reactions * 0.4) + (post.comments * 1.2) + (post.shares * 0.8);
    const normalized = Math.min(100, Math.round(base / 5));
    return normalized;
  }

  /* ── Auto category tagging ── */
  function autoTagCategory(text) {
    const map = {
      business: ['startup','entrepreneur','company','market','trade','commerce','SME'],
      tech:     ['AI','app','software','digital','code','data','tech','algorithm'],
      health:   ['health','wellness','medical','doctor','hospital','mental'],
      agro:     ['farm','crop','agri','food','export','cassava','harvest'],
      diaspora: ['abroad','remit','diaspora','UK','US','international'],
      energy:   ['solar','power','energy','grid','electricity','oil'],
      finance:  ['invest','stock','naira','NGX','fund','bank','loan'],
      creative: ['art','design','creative','music','fashion','film'],
      housing:  ['house','apartment','Lagos','rent','property','real estate'],
      lifestyle:['food','restaurant','travel','culture','style'],
      community:['community','member','network','group','connect'],
    };
    const lower = (text || '').toLowerCase();
    for (const [cat, kws] of Object.entries(map)) {
      if (kws.some(kw => lower.includes(kw.toLowerCase()))) return cat;
    }
    return 'business';
  }

  /* ── Trending tags extraction ── */
  function extractTrendingTags(posts) {
    const freq = {};
    posts.forEach(p => (p.tags || []).forEach(t => { freq[t] = (freq[t] || 0) + 1; }));
    return Object.entries(freq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  }

  /* ── Smart sort ── */
  function smartSort(posts, mode = 'trending') {
    const scored = posts.map(p => ({ ...p, _score: computeEngagementScore(p) }));
    if (mode === 'trending')   return scored.sort((a, b) => b._score - a._score);
    if (mode === 'latest')     return scored.sort((a, b) => {
      const parseHours = ts => {
        const m = ts.match(/(\d+)([hd])/);
        if (!m) return 999;
        return m[2] === 'h' ? +m[1] : +m[1] * 24;
      };
      return parseHours(a.timestamp) - parseHours(b.timestamp);
    });
    if (mode === 'recommended') return scored.sort((a, b) => (b._score + Math.random() * 20) - (a._score + Math.random() * 20));
    return scored;
  }

  /* ── Personalized sections ── */
  function getPersonalizedSections(posts, interests = ['business', 'tech']) {
    return interests.map(cat => ({
      category: cat,
      posts: posts.filter(p => p.category === cat).slice(0, 3),
    })).filter(s => s.posts.length > 0);
  }

  /* ── AI insight text ── */
  function generateInsight(posts) {
    const topCat = posts.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1; return acc;
    }, {});
    const dominant = Object.entries(topCat).sort(([,a],[,b]) => b - a)[0];
    const insights = [
      `✦ ${dominant ? dominant[0] : 'Business'} is dominating your feed today — 3x more engagement than usual.`,
      `✦ Readers like you spent 2.4× more time on articles with practical frameworks this week.`,
      `✦ Posts tagged #Diaspora are trending 180% above weekly average right now.`,
      `✦ Based on your reading patterns, you might enjoy our Finance deep-dives this week.`,
    ];
    return insights[Math.floor(Math.random() * insights.length)];
  }

  return {
    computeEngagementScore,
    autoTagCategory,
    extractTrendingTags,
    smartSort,
    getPersonalizedSections,
    generateInsight,
  };
})();


/* ============================================
   FEED STORE — Reactive State
   ============================================ */
const FeedStore = (() => {
  let state = {
    posts: [],
    filteredPosts: [],
    activeCategory: 'all',
    sortMode: 'trending',
    bookmarks: new Set(),
    likes: new Map(),       // postId → count
    searchQuery: '',
    page: 1,
    loadingMore: false,
    userInterests: ['business', 'tech'],
    commentDrafts: {},      // postId → draftText
    expandedComments: new Set(),
  };

  /* Persist bookmarks across sessions */
  try {
    const saved = localStorage.getItem('cudfirm_feed_bookmarks');
    if (saved) state.bookmarks = new Set(JSON.parse(saved));
    const savedLikes = localStorage.getItem('cudfirm_feed_likes');
    if (savedLikes) state.likes = new Map(JSON.parse(savedLikes));
  } catch(_) {}

  function _saveBookmarks() {
    try { localStorage.setItem('cudfirm_feed_bookmarks', JSON.stringify([...state.bookmarks])); } catch(_) {}
  }

  function _saveLikes() {
    try { localStorage.setItem('cudfirm_feed_likes', JSON.stringify([...state.likes])); } catch(_) {}
  }

  return {
    getState: () => ({ ...state }),
    getPosts: () => state.posts,
    getFiltered: () => state.filteredPosts,

    setPosts(posts) {
      state.posts = posts;
      this.applyFilter();
    },

    applyFilter() {
      let result = [...state.posts];
      if (state.activeCategory !== 'all') {
        result = result.filter(p => p.category === state.activeCategory);
      }
      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        result = result.filter(p =>
          p.title.toLowerCase().includes(q) ||
          (p.excerpt || '').toLowerCase().includes(q) ||
          (p.tags || []).some(t => t.toLowerCase().includes(q))
        );
      }
      state.filteredPosts = FeedAI.smartSort(result, state.sortMode);
    },

    setCategory(cat) { state.activeCategory = cat; this.applyFilter(); },
    setSortMode(mode) { state.sortMode = mode; this.applyFilter(); },
    setSearch(q) { state.searchQuery = q; this.applyFilter(); },

    toggleBookmark(id) {
      if (state.bookmarks.has(id)) { state.bookmarks.delete(id); }
      else { state.bookmarks.add(id); }
      _saveBookmarks();
      return state.bookmarks.has(id);
    },

    isBookmarked(id) { return state.bookmarks.has(id); },

    toggleLike(id, currentCount) {
      if (state.likes.has(id)) { state.likes.delete(id); _saveLikes(); return { liked: false, count: currentCount - 1 }; }
      state.likes.set(id, currentCount + 1); _saveLikes();
      return { liked: true, count: currentCount + 1 };
    },

    isLiked(id) { return state.likes.has(id); },
    getLikeCount(id, fallback) { return state.likes.has(id) ? state.likes.get(id) : fallback; },

    toggleComments(id) {
      if (state.expandedComments.has(id)) { state.expandedComments.delete(id); return false; }
      state.expandedComments.add(id); return true;
    },

    isCommentsOpen(id) { return state.expandedComments.has(id); },

    setCommentDraft(id, text) { state.commentDrafts[id] = text; },
    getCommentDraft(id) { return state.commentDrafts[id] || ''; },

    addMorePosts(newPosts) {
      state.posts = [...state.posts, ...newPosts];
      this.applyFilter();
    },

    setPage(n) { state.page = n; },
    setLoadingMore(v) { state.loadingMore = v; },
  };
})();


/* ============================================
   FEED RENDERER — DOM Builder
   ============================================ */
const FeedRenderer = (() => {

  /* ── Lazy image observer ── */
  let _imageObserver = null;

  function _getOrCreateObserver() {
    if (_imageObserver) return _imageObserver;
    _imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        const src = img.dataset.src;
        if (!src) return;
        img.src = src;
        img.onload = () => { img.classList.add('loaded'); };
        img.onerror = () => { img.classList.add('loaded'); };
        _imageObserver.unobserve(img);
      });
    }, { rootMargin: '200px' });
    return _imageObserver;
  }

  function _observeImages(container) {
    const observer = _getOrCreateObserver();
    container.querySelectorAll('[data-src]').forEach(img => observer.observe(img));
  }

  /* ── Category pill class ── */
  function _catClass(cat) {
    return 'cat-' + (cat || 'default');
  }

  /* ── Source type badge ── */
  function _sourceTypeBadge(type) {
    const map = {
      rss:    ['source-type-rss',    'RSS'],
      api:    ['source-type-api',    'API'],
      manual: ['source-type-manual', 'Editorial'],
      social: ['source-type-social', 'Social'],
    };
    const [cls, label] = map[type] || ['source-type-manual', 'Post'];
    return `<span class="feed-source-type ${cls}">${label}</span>`;
  }

  /* ── Engagement score bar ── */
  function _scoreBar(post) {
    const score = FeedAI.computeEngagementScore(post);
    return `
      <div class="nfeed-score-bar">
        <span class="nfeed-score-label">AI Score</span>
        <div class="nfeed-score-track">
          <div class="nfeed-score-fill" style="width:${score}%"></div>
        </div>
        <span class="nfeed-score-value">${score}</span>
      </div>`;
  }

  /* ── Simulated comments ── */
  function _buildComments(postId) {
    const commentData = [
      { name: 'Emeka B.',  avatar: 'https://i.pravatar.cc/30?img=12', text: 'This is exactly what Nigerian SMEs need right now. 🙌' },
      { name: 'Ngozi A.',  avatar: 'https://i.pravatar.cc/30?img=45', text: 'Great piece — the part about logistics really resonated with me.' },
      { name: 'You',       avatar: 'https://i.pravatar.cc/30?img=70', text: FeedStore.getCommentDraft(postId) || '' },
    ].filter(c => c.text);

    const items = commentData.map(c => `
      <div class="nfeed-comment-item">
        <img class="nfeed-comment-avatar" src="${c.avatar}" alt="${c.name}" loading="lazy" />
        <div class="nfeed-comment-bubble">
          <div class="nfeed-comment-name">${c.name}</div>
          <div class="nfeed-comment-text">${c.text}</div>
        </div>
      </div>`).join('');

    return `
      <div class="nfeed-comments-inner">
        ${items}
        <div class="nfeed-comment-input-row">
          <input
            type="text"
            class="nfeed-comment-input"
            placeholder="Add a comment..."
            data-post-id="${postId}"
            value="${FeedStore.getCommentDraft(postId)}"
          />
          <button class="nfeed-comment-send" data-action="send-comment" data-post-id="${postId}" aria-label="Send">
            <i class="bi bi-send-fill"></i>
          </button>
        </div>
      </div>`;
  }

  /* ── Full feed card ── */
  function renderCard(post) {
    const isLiked      = FeedStore.isLiked(post.id);
    const isBookmarked = FeedStore.isBookmarked(post.id);
    const likeCount    = FeedStore.getLikeCount(post.id, post.reactions);
    const isOpen       = FeedStore.isCommentsOpen(post.id);

    return `
      <article class="nfeed-card" data-post-id="${post.id}" data-category="${post.category}">
        <div class="nfeed-card-img-wrap">
          <img
            class="nfeed-card-img"
            data-src="${post.image}"
            src=""
            alt="${post.title}"
            loading="lazy"
          />
          <div class="nfeed-card-img-placeholder">
            <i class="bi bi-image" style="opacity:0.3"></i>
          </div>
          <span class="nfeed-card-cat ${_catClass(post.category)}">${post.category}</span>
          <button
            class="feed-hero-bookmark${isBookmarked ? ' saved' : ''}"
            data-action="bookmark" data-post-id="${post.id}"
            aria-label="Bookmark"
          ><i class="bi bi-bookmark${isBookmarked ? '-fill' : ''}"></i></button>
          ${post.tags && post.tags[0] ? `<span class="nfeed-ai-tag">✦ ${post.tags[0]}</span>` : ''}
        </div>
        <div class="nfeed-card-body">
          <div class="nfeed-source-row">
            <img class="nfeed-source-avatar" src="${post.sourceIcon}" alt="${post.sourceLabel}" loading="lazy" />
            <span class="nfeed-source-name">${post.sourceLabel}</span>
            <span class="nfeed-source-dot"></span>
            <span class="nfeed-timestamp">${post.timestamp}</span>
            ${_sourceTypeBadge(post.type)}
          </div>
          <h3 class="nfeed-card-title">${post.title}</h3>
          <p class="nfeed-card-excerpt">${post.excerpt}</p>
          <div class="nfeed-author-row">
            <img class="nfeed-author-avatar" src="${post.author.avatar}" alt="${post.author.name}" loading="lazy" />
            <div class="nfeed-author-info">
              <div class="nfeed-author-name">${post.author.name}</div>
              <div class="nfeed-read-time">${post.readTime} read</div>
            </div>
          </div>
          ${_scoreBar(post)}
          <div class="nfeed-card-actions">
            <button class="nfeed-action-btn${isLiked ? ' liked' : ''}" data-action="like" data-post-id="${post.id}" data-count="${likeCount}">
              <i class="bi bi-heart${isLiked ? '-fill' : ''}"></i>
              <span class="like-count">${likeCount}</span>
            </button>
            <button class="nfeed-action-btn" data-action="comments" data-post-id="${post.id}">
              <i class="bi bi-chat"></i> ${post.comments}
            </button>
            <button class="nfeed-action-btn nfeed-action-share" data-action="share" data-post-id="${post.id}" data-title="${post.title}">
              <i class="bi bi-share"></i>
            </button>
          </div>
        </div>
        <div class="nfeed-comments-section${isOpen ? ' open' : ''}" id="comments-${post.id}">
          ${isOpen ? _buildComments(post.id) : ''}
        </div>
      </article>`;
  }

  /* ── Compact horizontal card (sidebar recommended) ── */
  function renderCardH(post) {
    return `
      <article class="nfeed-card-h" data-post-id="${post.id}" data-category="${post.category}">
        <img class="nfeed-card-h-img" data-src="${post.image}" src="" alt="${post.title}" loading="lazy" />
        <div class="nfeed-card-h-body">
          <div class="nfeed-card-h-title">${post.title}</div>
          <div class="nfeed-card-h-meta">${post.author.name} · ${post.timestamp}</div>
        </div>
      </article>`;
  }

  /* ── Numbered list item ── */
  function renderListItem(post, rank) {
    return `
      <div class="feed-list-item" data-post-id="${post.id}">
        <span class="feed-list-rank">${rank}</span>
        <img class="feed-list-img" data-src="${post.image}" src="" alt="${post.title}" loading="lazy" />
        <div class="feed-list-body">
          <div class="feed-list-cat">${post.category}</div>
          <div class="feed-list-title">${post.title}</div>
          <div class="feed-list-meta">
            ${post.author.name}
            <span>·</span>
            ${post.timestamp}
            <span>·</span>
            ${post.reactions} 💙
          </div>
        </div>
      </div>`;
  }

  /* ── Hero card ── */
  function renderHero(post) {
    const isBookmarked = FeedStore.isBookmarked(post.id);
    return `
      <div class="feed-hero" data-post-id="${post.id}">
        <img class="feed-hero-img" data-src="${post.image}" src="" alt="${post.title}" loading="lazy" />
        <span class="feed-trending-badge"><i class="bi bi-fire me-1"></i>Trending Now</span>
        <button
          class="feed-hero-bookmark${isBookmarked ? ' saved' : ''}"
          data-action="bookmark" data-post-id="${post.id}"
          aria-label="Bookmark hero"
        ><i class="bi bi-bookmark${isBookmarked ? '-fill' : ''}"></i></button>
        <div class="feed-hero-overlay">
          <div class="feed-hero-eyebrow">
            <span class="hero-cat-dot"></span>
            ${post.category} · ${post.sourceLabel}
          </div>
          <h2 class="feed-hero-title">${post.title}</h2>
          <div class="feed-hero-meta">
            <span class="feed-hero-author">
              <img class="feed-hero-avatar" src="${post.author.avatar}" alt="${post.author.name}" loading="lazy" />
              ${post.author.name}
            </span>
            <span class="feed-hero-time">${post.timestamp}</span>
            <span class="feed-hero-read-time">${post.readTime} read</span>
          </div>
        </div>
      </div>`;
  }

  /* ── Skeleton loader set ── */
  function renderSkeletons(count = 3) {
    return Array.from({ length: count }, () => `
      <div class="feed-skeleton nfeed-card">
        <div class="skeleton-block skeleton-img"></div>
        <div class="skeleton-block skeleton-title"></div>
        <div class="skeleton-block skeleton-title-sm"></div>
        <div class="skeleton-block skeleton-text"></div>
        <div class="skeleton-block skeleton-text-sm"></div>
        <div class="skeleton-block skeleton-actions"></div>
      </div>`
    ).join('');
  }

  /* ── Trending tags row ── */
  function renderTrendingRow(tags) {
    const chips = tags.map(({ tag, count }) => `
      <button class="feed-trend-tag" data-search="${tag}">
        #${tag} <span class="trend-count">${count}</span>
      </button>`).join('');
    return `
      <div class="feed-trending-row">
        <span class="feed-trending-label">Trending</span>
        ${chips}
      </div>`;
  }

  /* ── Right sidebar ── */
  function renderSidebar(posts) {
    const trending = FeedAI.extractTrendingTags(posts).slice(0, 5);
    const recommended = FeedAI.smartSort([...posts], 'recommended').slice(0, 3);
    const insight = FeedAI.generateInsight(posts);

    const trendItems = trending.map((t, i) => `
      <div class="feed-trending-item" data-search="${t.tag}">
        <span class="feed-trending-num">${i + 1}</span>
        <div class="feed-trending-info">
          <div class="feed-trending-tag-name">#${t.tag}</div>
          <div class="feed-trending-count">${t.count * 42 + 100} posts</div>
        </div>
        <i class="bi bi-arrow-up-right feed-trending-arrow"></i>
      </div>`).join('');

    const recCards = recommended.map(p => renderCardH(p)).join('');

    const topAuthors = FeedDataSource.AUTHORS.slice(0, 4).map(a => `
      <div class="feed-author-card">
        <img class="feed-author-card-img" src="${a.avatar}" alt="${a.name}" loading="lazy" />
        <div class="feed-author-info">
          <div class="feed-author-card-name">${a.name}</div>
          <div class="feed-author-card-posts">${a.posts} articles</div>
        </div>
        <button class="feed-follow-btn" data-action="follow" data-author="${a.handle}">Follow</button>
      </div>`).join('');

    return `
      <div class="feed-ai-insight">
        <span class="feed-ai-insight-icon">🤖</span>
        <div class="feed-ai-insight-title">AI Insight for You</div>
        <div class="feed-ai-insight-text">${insight}</div>
      </div>

      <div class="feed-streak">
        <span class="feed-streak-icon">🔥</span>
        <span class="feed-streak-text">5-day reading streak — keep it up!</span>
      </div>

      <div class="feed-widget">
        <div class="feed-widget-title"><i class="bi bi-bar-chart-fill"></i> Trending Tags</div>
        ${trendItems}
      </div>

      <div class="feed-widget">
        <div class="feed-widget-title"><i class="bi bi-stars"></i> Recommended</div>
        <div class="d-flex flex-column gap-2">${recCards}</div>
      </div>

      <div class="feed-widget">
        <div class="feed-widget-title"><i class="bi bi-person-heart"></i> Writers to Follow</div>
        ${topAuthors}
      </div>`;
  }

  return {
    renderCard,
    renderCardH,
    renderListItem,
    renderHero,
    renderSkeletons,
    renderTrendingRow,
    renderSidebar,
    observeImages: _observeImages,
  };
})();


/* ============================================
   FEED CONTROLLER — Orchestration Layer
   ============================================ */
const FeedController = (() => {

  let _initialized = false;

  /* ── Build the full feed page structure ── */
  function _getShell() {
    const cats = FeedDataSource.CATEGORIES;
    const catTabs = cats.map(c =>
      `<button class="feed-cat-tab${c.id === 'all' ? ' active' : ''}" data-cat="${c.id}">
        <span class="cat-emoji">${c.emoji}</span> ${c.label}
      </button>`
    ).join('');

    return `
      <!-- ─── Feed Top Bar ─── -->
      <div class="feed-topbar">
        <span class="feed-topbar-brand">CUDFIRM Feed</span>
        <div class="feed-topbar-divider"></div>
        <div class="feed-category-tabs" id="feedCategoryTabs">
          ${catTabs}
        </div>
        <button class="feed-sort-btn" id="feedSortBtn" title="Sort feed">
          <i class="bi bi-sliders me-1"></i><span id="feedSortLabel">Trending</span>
        </button>
        <span class="feed-ai-badge">✦ AI</span>
        <div class="feed-search-wrap">
          <i class="bi bi-search feed-search-icon"></i>
          <input type="text" id="feedSearchInput" class="feed-search-input" placeholder="Search feed…" autocomplete="off" />
        </div>
      </div>

      <!-- ─── Feed Body ─── -->
      <div class="feed-body">
        <!-- Main Column -->
        <div class="feed-main" id="feedMain">
          <!-- Skeletons shown while loading -->
          <div class="feed-grid-3" id="feedSkeletonGrid">
            ${FeedRenderer.renderSkeletons(3)}
          </div>
        </div>

        <!-- Right Sidebar -->
        <div class="feed-sidebar-right" id="feedSidebarRight">
          <!-- Populated after fetch -->
        </div>
      </div>`;
  }

  /* ── Render populated feed ── */
  function _renderFeed(posts) {
    const main = document.getElementById('feedMain');
    if (!main) return;

    const all = FeedStore.getFiltered();
    if (!all.length) {
      main.innerHTML = `
        <div class="feed-empty-state">
          <div class="feed-empty-icon"><i class="bi bi-journal-x"></i></div>
          <div class="feed-empty-title">No posts found</div>
          <div class="feed-empty-text">Try a different category or search term.</div>
        </div>`;
      return;
    }

    const hero      = all[0];
    const trending  = FeedAI.extractTrendingTags(posts);
    const latest    = all.slice(1, 4);
    const scrollRow = all.slice(4, 8);
    const topList   = FeedAI.smartSort([...posts], 'trending').slice(0, 5);
    const moreGrid  = all.slice(8, 14);

    main.innerHTML = `
      <!-- Hero -->
      ${FeedRenderer.renderHero(hero)}

      <!-- Trending Tags -->
      ${FeedRenderer.renderTrendingRow(trending)}

      <!-- Personalized Banner -->
      <div class="feed-personalized-banner">
        <span class="feed-personalized-icon">🎯</span>
        <div class="feed-personalized-text">
          <div class="feed-personalized-title">Personalized for You</div>
          <div class="feed-personalized-sub">Based on your reading patterns in Business & Tech</div>
        </div>
        <button class="feed-personalized-btn" id="feedCustomizeBtn">Customize</button>
      </div>

      <!-- Latest Section -->
      <div class="feed-section-header">
        <div class="feed-section-title"><span class="section-icon">⚡</span>Latest Stories</div>
        <button class="feed-section-see-all" data-cat="all">See all <i class="bi bi-arrow-right"></i></button>
      </div>
      <div class="feed-grid-3" id="feedLatestGrid">
        ${latest.map(p => FeedRenderer.renderCard(p)).join('')}
      </div>

      <!-- Horizontal Scroll Row -->
      <div class="feed-section-header">
        <div class="feed-section-title"><span class="section-icon">🔥</span>Hot Right Now</div>
        <button class="feed-section-see-all" data-sort="trending">View trending <i class="bi bi-arrow-right"></i></button>
      </div>
      <div class="feed-scroll-row" id="feedScrollRow">
        ${scrollRow.map(p => FeedRenderer.renderCard(p)).join('')}
      </div>

      <!-- Top 5 List -->
      <div class="feed-section-header">
        <div class="feed-section-title"><span class="section-icon">🏆</span>Most Read This Week</div>
      </div>
      <div class="feed-list" id="feedTopList">
        ${topList.map((p, i) => FeedRenderer.renderListItem(p, i + 1)).join('')}
      </div>

      <!-- More Stories Grid -->
      <div class="feed-section-header mt-4">
        <div class="feed-section-title"><span class="section-icon">📰</span>More Stories</div>
        <button class="feed-section-see-all" data-sort="latest">Latest first <i class="bi bi-arrow-right"></i></button>
      </div>
      <div class="feed-grid-2" id="feedMoreGrid">
        ${moreGrid.map(p => FeedRenderer.renderCard(p)).join('')}
      </div>

      <!-- Load More -->
      <button class="feed-load-more-btn" id="feedLoadMoreBtn">
        <div class="load-spinner"></div>
        <span class="load-label"><i class="bi bi-arrow-clockwise me-1"></i>Load More Stories</span>
      </button>
    `;

    // Observe lazy images
    FeedRenderer.observeImages(main);

    // Attach events inside feed
    _attachCardEvents(main);
  }

  /* ── Render sidebar ── */
  function _renderSidebar(posts) {
    const sidebar = document.getElementById('feedSidebarRight');
    if (!sidebar) return;
    sidebar.innerHTML = FeedRenderer.renderSidebar(posts);
    FeedRenderer.observeImages(sidebar);
    _attachSidebarEvents(sidebar);
  }

  /* ── Attach card interaction events ── */
  function _attachCardEvents(container) {
    container.addEventListener('click', e => {
      // Like
      const likeBtn = e.target.closest('[data-action="like"]');
      if (likeBtn) {
        e.stopPropagation();
        const id    = likeBtn.dataset.postId;
        const count = parseInt(likeBtn.dataset.count, 10);
        const { liked, count: newCount } = FeedStore.toggleLike(id, count);
        likeBtn.dataset.count = newCount;
        likeBtn.classList.toggle('liked', liked);
        likeBtn.querySelector('i').className = `bi bi-heart${liked ? '-fill' : ''}`;
        likeBtn.querySelector('.like-count').textContent = newCount;
        return;
      }

      // Bookmark (card)
      const bmBtn = e.target.closest('[data-action="bookmark"]');
      if (bmBtn) {
        e.stopPropagation();
        const id = bmBtn.dataset.postId;
        const saved = FeedStore.toggleBookmark(id);
        bmBtn.classList.toggle('saved', saved);
        const icon = bmBtn.querySelector('i');
        if (icon) icon.className = `bi bi-bookmark${saved ? '-fill' : ''}`;
        if (typeof showToast === 'function') {
          showToast(saved ? '🔖 Article saved to bookmarks!' : 'Bookmark removed');
        }
        return;
      }

      // Comments toggle
      const cmtBtn = e.target.closest('[data-action="comments"]');
      if (cmtBtn) {
        e.stopPropagation();
        const id    = cmtBtn.dataset.postId;
        const panel = document.getElementById(`comments-${id}`);
        if (!panel) return;
        const isOpen = FeedStore.toggleComments(id);
        panel.classList.toggle('open', isOpen);
        if (isOpen && !panel.innerHTML.trim()) {
          panel.innerHTML = FeedRenderer.renderSidebar ? '' : '';
          // Re-render comments block
          panel.innerHTML = `<div class="nfeed-comments-inner">
            <div class="nfeed-comment-item">
              <img class="nfeed-comment-avatar" src="https://i.pravatar.cc/30?img=12" alt="User" loading="lazy" />
              <div class="nfeed-comment-bubble">
                <div class="nfeed-comment-name">Emeka B.</div>
                <div class="nfeed-comment-text">This is exactly what Nigerian SMEs need right now 🙌</div>
              </div>
            </div>
            <div class="nfeed-comment-item">
              <img class="nfeed-comment-avatar" src="https://i.pravatar.cc/30?img=45" alt="User" loading="lazy" />
              <div class="nfeed-comment-bubble">
                <div class="nfeed-comment-name">Ngozi A.</div>
                <div class="nfeed-comment-text">Great piece — really resonated with me.</div>
              </div>
            </div>
            <div class="nfeed-comment-input-row">
              <input type="text" class="nfeed-comment-input" placeholder="Add a comment…" data-post-id="${id}" />
              <button class="nfeed-comment-send" data-action="send-comment" data-post-id="${id}" aria-label="Send">
                <i class="bi bi-send-fill"></i>
              </button>
            </div>
          </div>`;
        }
        return;
      }

      // Send comment
      const sendBtn = e.target.closest('[data-action="send-comment"]');
      if (sendBtn) {
        e.stopPropagation();
        const id  = sendBtn.dataset.postId;
        const inp = container.querySelector(`.nfeed-comment-input[data-post-id="${id}"]`);
        if (!inp || !inp.value.trim()) return;
        const text = inp.value.trim();
        FeedStore.setCommentDraft(id, '');
        inp.value = '';
        // Inject new comment
        const commentList = sendBtn.closest('.nfeed-comments-inner');
        const newItem = document.createElement('div');
        newItem.className = 'nfeed-comment-item';
        newItem.innerHTML = `
          <img class="nfeed-comment-avatar" src="https://i.pravatar.cc/30?img=70" alt="You" loading="lazy" />
          <div class="nfeed-comment-bubble">
            <div class="nfeed-comment-name">You</div>
            <div class="nfeed-comment-text">${text}</div>
          </div>`;
        commentList.insertBefore(newItem, sendBtn.closest('.nfeed-comment-input-row'));
        if (typeof showToast === 'function') showToast('Comment posted! ✅');
        return;
      }

      // Share
      const shareBtn = e.target.closest('[data-action="share"]');
      if (shareBtn) {
        e.stopPropagation();
        const title = shareBtn.dataset.title || 'CUDFIRM Article';
        if (navigator.share) {
          navigator.share({ title, url: window.location.href }).catch(() => {});
        } else {
          navigator.clipboard.writeText(window.location.href).then(() => {
            if (typeof showToast === 'function') showToast('Link copied to clipboard! 📋');
          }).catch(() => {
            if (typeof showToast === 'function') showToast('Share: ' + title);
          });
        }
        return;
      }

      // Load More
      const loadBtn = e.target.closest('#feedLoadMoreBtn');
      if (loadBtn) {
        _loadMore();
        return;
      }

      // See All / Sort shortcuts
      const seeAll = e.target.closest('[data-cat]');
      if (seeAll && seeAll.dataset.cat) {
        _setCategory(seeAll.dataset.cat);
        return;
      }

      const sortShortcut = e.target.closest('[data-sort]');
      if (sortShortcut) {
        _setSortMode(sortShortcut.dataset.sort);
        return;
      }

      // Trending tag in feed body
      const trendTag = e.target.closest('.feed-trend-tag[data-search]');
      if (trendTag) {
        _setSearch(trendTag.dataset.search.replace('#', ''));
        return;
      }

      // Customize btn
      const custBtn = e.target.closest('#feedCustomizeBtn');
      if (custBtn) {
        if (typeof showToast === 'function') showToast('Personalization settings coming soon! ✨');
        return;
      }
    });

    // Comment input draft save
    container.addEventListener('input', e => {
      const inp = e.target.closest('.nfeed-comment-input');
      if (inp) {
        FeedStore.setCommentDraft(inp.dataset.postId, inp.value);
      }
    });
  }

  /* ── Attach sidebar events ── */
  function _attachSidebarEvents(sidebar) {
    sidebar.addEventListener('click', e => {
      // Follow button
      const followBtn = e.target.closest('[data-action="follow"]');
      if (followBtn) {
        const author = followBtn.dataset.author;
        const isFollowing = followBtn.classList.toggle('following');
        followBtn.textContent = isFollowing ? 'Following' : 'Follow';
        if (typeof showToast === 'function') {
          showToast(isFollowing ? `Following ${author} 🎉` : `Unfollowed ${author}`);
        }
        return;
      }

      // Trending tag click in sidebar
      const trendItem = e.target.closest('.feed-trending-item[data-search]');
      if (trendItem) {
        _setSearch(trendItem.dataset.search);
        return;
      }
    });
  }

  /* ── Category filter ── */
  function _setCategory(cat) {
    FeedStore.setCategory(cat);
    document.querySelectorAll('.feed-cat-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === cat);
    });
    const all = FeedStore.getFiltered();
    if (!all.length) {
      const grid = document.getElementById('feedLatestGrid');
      if (grid) grid.innerHTML = `<div class="feed-empty-state" style="grid-column:1/-1">
        <div class="feed-empty-icon">🔍</div>
        <div class="feed-empty-title">No posts in this category yet</div>
        <div class="feed-empty-text">Check back soon — our editors are on it.</div>
      </div>`;
    } else {
      _renderFeed(FeedStore.getPosts());
    }
    // Scroll to top of feed main
    const main = document.getElementById('feedMain');
    if (main) main.scrollTop = 0;
  }

  /* ── Sort mode ── */
  const SORT_CYCLE = ['trending', 'latest', 'recommended'];
  const SORT_LABELS = { trending: 'Trending', latest: 'Latest', recommended: 'For You' };
  let _sortIndex = 0;

  function _setSortMode(mode) {
    FeedStore.setSortMode(mode);
    const label = document.getElementById('feedSortLabel');
    if (label) label.textContent = SORT_LABELS[mode] || 'Trending';
    _renderFeed(FeedStore.getPosts());
  }

  function _cycleSortMode() {
    _sortIndex = (_sortIndex + 1) % SORT_CYCLE.length;
    _setSortMode(SORT_CYCLE[_sortIndex]);
  }

  /* ── Search ── */
  function _setSearch(q) {
    FeedStore.setSearch(q);
    const inp = document.getElementById('feedSearchInput');
    if (inp) inp.value = q;
    _renderFeed(FeedStore.getPosts());
  }

  /* ── Load more ── */
  async function _loadMore() {
    if (FeedStore.getState().loadingMore) return;
    FeedStore.setLoadingMore(true);
    const btn = document.getElementById('feedLoadMoreBtn');
    if (btn) btn.classList.add('loading');

    try {
      const page = FeedStore.getState().page + 1;
      FeedStore.setPage(page);
      const morePosts = await FeedDataSource.fetchMore(page);
      FeedStore.addMorePosts(morePosts);

      const grid = document.getElementById('feedMoreGrid');
      if (grid) {
        const newCards = morePosts.map(p => FeedRenderer.renderCard(p)).join('');
        const temp = document.createElement('div');
        temp.innerHTML = newCards;
        while (temp.firstChild) grid.appendChild(temp.firstChild);
        FeedRenderer.observeImages(grid);
        _attachCardEvents(grid);
      }
    } finally {
      FeedStore.setLoadingMore(false);
      if (btn) btn.classList.remove('loading');
    }
  }

  /* ── Bind top-bar controls ── */
  function _bindTopBarControls() {
    // Category tabs
    const tabsContainer = document.getElementById('feedCategoryTabs');
    if (tabsContainer) {
      tabsContainer.addEventListener('click', e => {
        const tab = e.target.closest('.feed-cat-tab');
        if (!tab) return;
        _setCategory(tab.dataset.cat);
      });
    }

    // Sort button
    const sortBtn = document.getElementById('feedSortBtn');
    if (sortBtn) {
      sortBtn.addEventListener('click', _cycleSortMode);
    }

    // Search input
    const searchInp = document.getElementById('feedSearchInput');
    if (searchInp) {
      let debounceTimer;
      searchInp.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => _setSearch(searchInp.value), 280);
      });
    }
  }

  /* ── Public init ── */
  async function init() {
    if (_initialized) return;
    _initialized = true;

    const section = document.getElementById('blog-content');
    if (!section) return;

    // Upgrade section class
    section.classList.add('feed-upgraded');
    section.innerHTML = _getShell();

    // Bind controls immediately (before data arrives)
    _bindTopBarControls();

    try {
      const posts = await FeedDataSource.fetchFeed();
      FeedStore.setPosts(posts);
      _renderFeed(posts);
      _renderSidebar(posts);
    } catch(err) {
      console.error('[FeedController] Init error:', err);
      const main = document.getElementById('feedMain');
      if (main) {
        main.innerHTML = `<div class="feed-empty-state">
          <div class="feed-empty-icon"><i class="bi bi-wifi-off"></i></div>
          <div class="feed-empty-title">Could not load feed</div>
          <div class="feed-empty-text">Please check your connection and try again.</div>
        </div>`;
      }
    }
  }

  return { init };
})();


/* ============================================
   INTEGRATION POINT
   Overrides the existing buildBlogContent() stub
   in script.js — same function name, safe override.
   ============================================ */

/**
 * buildBlogContent()
 * Called by buildAllSections() in script.js.
 * Returns the section shell; FeedController.init()
 * hydrates it after the DOM is ready.
 */
function buildBlogContent() {
  // Return a minimal section shell — FeedController.init() fills it
  return `<section id="blog-content" class="view tab-content"></section>`;
}

/**
 * Hook into the existing openTab() function.
 * When blog-content is opened, initialize the feed engine.
 * We patch by observing tab switches with a MutationObserver.
 */
(function patchOpenTab() {
  const _originalOpenTab = typeof openTab === 'function' ? openTab : null;

  // Wait for openTab to be defined (it's in script.js loaded after this file)
  // We use a delegation approach: listen for the section becoming visible
  document.addEventListener('DOMContentLoaded', () => {
    // Observe the blog section becoming active
    const observer = new MutationObserver(() => {
      const section = document.getElementById('blog-content');
      if (section && section.classList.contains('active')) {
        observer.disconnect();
        FeedController.init();
      }
    });

    const target = document.getElementById('contentMain') || document.body;
    observer.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

    // Also handle direct init if blog is the first/restored tab
    setTimeout(() => {
      const section = document.getElementById('blog-content');
      if (section && section.classList.contains('active')) {
        FeedController.init();
      }
    }, 200);
  });
})();
