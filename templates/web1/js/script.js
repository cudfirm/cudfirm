/** Web1 template-only interactions. No CMS, Supabase, role, or security logic. */
(function () {
  'use strict';

  const state = {
    initialized: false,
    aosInitialized: false,
    heroSwiper: null,
    testimonialSwiper: null,
    counterObserver: null,
  };

  function destroySwiper(instance) {
    if (instance && typeof instance.destroy === 'function') {
      instance.destroy(true, true);
    }
  }

  function updateNavbar() {
    document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 50);
  }

  function updateScrollButton() {
    document.getElementById('scrollToTopBtn')?.classList.toggle('show', window.scrollY > 300);
  }

  function initializeAos() {
    if (!window.AOS) return;
    if (!state.aosInitialized) {
      window.AOS.init({ duration: 800, once: true, offset: 50 });
      state.aosInitialized = true;
      return;
    }
    window.AOS.refreshHard?.();
  }

  function animateCounter(element) {
    const target = Number(element.dataset.target || 0);
    if (!Number.isFinite(target)) return;

    const duration = 800;
    const startedAt = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      element.textContent = String(Math.round(target * progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function initializeCounters() {
    state.counterObserver?.disconnect?.();
    const section = document.getElementById('why-choose-us');
    if (!section) return;

    const counters = Array.from(section.querySelectorAll('.counter'));
    counters.forEach((counter) => { counter.textContent = '0'; });

    if (!('IntersectionObserver' in window)) {
      counters.forEach(animateCounter);
      return;
    }

    state.counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        counters.forEach(animateCounter);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.35 });
    state.counterObserver.observe(section);
  }

  function initializeSliders() {
    if (!window.Swiper) return;

    destroySwiper(state.heroSwiper);
    destroySwiper(state.testimonialSwiper);

    if (document.querySelector('.hero-car-slider')) {
      state.heroSwiper = new window.Swiper('.hero-car-slider', {
        effect: 'coverflow',
        grabCursor: true,
        centeredSlides: true,
        slidesPerView: 'auto',
        loop: document.querySelectorAll('.hero-car-slider .swiper-slide').length > 1,
        coverflowEffect: {
          rotate: 0,
          stretch: 80,
          depth: 200,
          modifier: 1,
          slideShadows: false,
        },
        navigation: {
          nextEl: '.hero-slider-nav .swiper-button-next',
          prevEl: '.hero-slider-nav .swiper-button-prev',
        },
      });
    }

    if (document.querySelector('.testimonial-slider')) {
      state.testimonialSwiper = new window.Swiper('.testimonial-slider', {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: document.querySelectorAll('.testimonial-slider .swiper-slide').length > 1,
        autoplay: {
          delay: 5000,
          disableOnInteraction: false,
        },
        pagination: {
          el: '.testimonial-slider .swiper-pagination',
          clickable: true,
        },
        breakpoints: {
          768: { slidesPerView: 2 },
        },
      });
    }
  }

  function initialize() {
    if (!state.initialized) {
      window.addEventListener('scroll', updateNavbar, { passive: true });
      window.addEventListener('scroll', updateScrollButton, { passive: true });

      const scrollButton = document.getElementById('scrollToTopBtn');
      scrollButton?.addEventListener('click', () => {
        scrollButton.classList.add('is-boosting');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.setTimeout(() => scrollButton.classList.remove('is-boosting'), 800);
      });
      state.initialized = true;
    }

    updateNavbar();
    updateScrollButton();
    initializeAos();
    initializeCounters();
    initializeSliders();
  }

  window.CUDFIRMWeb1UI = Object.freeze({
    initialize,
    refresh: initialize,
    getState: () => Object.freeze({
      initialized: state.initialized,
      aosInitialized: state.aosInitialized,
      heroSliderReady: Boolean(state.heroSwiper),
      testimonialSliderReady: Boolean(state.testimonialSwiper),
    }),
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
