/*
  Mariposa Cork — Premium Animation Engine v2
  GSAP 3 + ScrollTrigger + Lenis Smooth Scroll
  ──────────────────────────────────────────────
  Fixed: Lenis+ScrollTrigger sync, logo visibility,
  robust scroll reveals with immediateRender safety
*/

(function () {
  'use strict';

  // ── Register GSAP plugins ──
  gsap.registerPlugin(ScrollTrigger);

  // ── Session Visit Caching Check ──
  const isReload = window.performance && window.performance.getEntriesByType &&
                   window.performance.getEntriesByType('navigation')[0] &&
                   window.performance.getEntriesByType('navigation')[0].type === 'reload';

  // If it's a reload/refresh, treat it as a fresh visit so loader runs
  const isSubsequentVisit = !isReload && sessionStorage.getItem('mariposa_loaded') === 'true';

  // ── Reduced motion check ──
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Lenis Smooth Scroll ──
  let lenis = null;
  try {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    // CRITICAL: Sync Lenis scroll with GSAP ScrollTrigger
    lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    // GSAP ticker drives Lenis raf loop
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    printSessionState();
  } catch (e) {
    console.warn('[Mariposa] Lenis not loaded, using native scroll:', e.message);
  }

  function printSessionState() {
    console.log('[Mariposa] Lenis smooth scroll initialized. Subsequent visit:', isSubsequentVisit);
  }

  // ── Utility: Split text into word spans ──
  function splitIntoWords(element) {
    const text = element.textContent.trim();
    const words = text.split(/\s+/).filter(w => w.length > 0);
    element.innerHTML = '';
    words.forEach((word) => {
      const span = document.createElement('span');
      span.className = 'split-word';
      span.textContent = word;
      span.style.display = 'inline-block';
      span.style.marginRight = '0.3em';
      element.appendChild(span);
    });
    return element.querySelectorAll('.split-word');
  }

  // ── Utility: Split text into character spans (grouped by words to prevent vertical wrapping) ──
  function splitIntoChars(element) {
    const text = element.textContent.trim();
    const words = text.split(/\s+/).filter(w => w.length > 0);
    element.innerHTML = '';
    const chars = [];
    words.forEach((wordText, wIdx) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'split-word';
      wordSpan.style.display = 'inline-block';
      wordSpan.style.whiteSpace = 'nowrap';
      
      for (let i = 0; i < wordText.length; i++) {
        const charSpan = document.createElement('span');
        charSpan.className = 'split-char';
        charSpan.style.display = 'inline-block';
        charSpan.textContent = wordText[i];
        wordSpan.appendChild(charSpan);
        chars.push(charSpan);
      }
      
      element.appendChild(wordSpan);
      
      if (wIdx < words.length - 1) {
        const spaceSpan = document.createElement('span');
        spaceSpan.className = 'split-space';
        spaceSpan.style.display = 'inline-block';
        spaceSpan.innerHTML = '&nbsp;';
        element.appendChild(spaceSpan);
      }
    });
    return chars;
  }

  // ══════════════════════════════════════════════════════════
  //  PAGE TRANSITION OVERLAY
  // ══════════════════════════════════════════════════════════
  function initPageTransition() {
    const overlay = document.querySelector('.page-transition-overlay');
    const logoImg = document.querySelector('.overlay-logo-img');
    const progressBar = document.querySelector('.loader-progress-bar');
    if (!overlay) return;

    if (isSubsequentVisit) {
      gsap.set(overlay, { opacity: 0, display: 'none' });
      return;
    }

    // Prepare initial state - background is black
    gsap.set(overlay, { opacity: 1, display: 'flex' });
    if (logoImg) {
      gsap.set(logoImg, { opacity: 0, scale: 0.95 });
    }
    if (progressBar) {
      gsap.set(progressBar, { scaleX: 0 });
    }

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(overlay, { display: 'none' });
      }
    });

    // 1. Fade in and scale up the original logo & animate progress bar filling (1.5s)
    if (logoImg) {
      tl.to(logoImg, {
        opacity: 1,
        scale: 1.05,
        duration: 1.5,
        ease: 'power2.out',
      });
    }
    if (progressBar) {
      tl.to(progressBar, {
        scaleX: 1,
        duration: 1.5,
        ease: 'power1.inOut',
      }, 0);
    }

    // 2. Smoothly fade out the loader overlay (0.1s hold + 0.4s fade-out = 2.0s total)
    tl.to(overlay, {
      opacity: 0,
      duration: 0.4,
      ease: 'power2.inOut',
    }, '+=0.1');

    sessionStorage.setItem('mariposa_loaded', 'true');
  }

  // ══════════════════════════════════════════════════════════
  //  HEADER & NAV ENTRANCE
  // ══════════════════════════════════════════════════════════
  function initHeaderAnimation() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const logo = header.querySelector('.brand-link');
    const navItems = header.querySelectorAll('.nav-list > li'); // Only direct children — dropdown sub-items must not be touched

    // Ensure logo is always visible
    if (logo) {
      gsap.set(logo, { opacity: 1, y: 0 });
    }

    const tl = gsap.timeline({ delay: isSubsequentVisit ? 0.05 : 1.5 });

    if (logo) {
      gsap.set(logo, { opacity: 0, y: -25 });
      tl.to(logo, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
      });
    }

    if (navItems.length) {
      gsap.set(navItems, { opacity: 0, y: -15 });
      tl.to(navItems, {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.07,
        ease: 'power2.out',
      }, '-=0.4');
    }
  }

  // ══════════════════════════════════════════════════════════
  //  HERO HEADLINE — WORD ROLLUP
  // ══════════════════════════════════════════════════════════
  // Helper: Prepare word spans as overflow-hidden wrappers with inner spans
  function prepareHeadline() {
    const headline = document.getElementById('hero-headline');
    if (!headline) return;

    const spans = headline.querySelectorAll('span');
    if (!spans.length) return;

    // Overwrite default CSS layout
    headline.style.animation = 'none';
    headline.style.opacity = '1';
    headline.style.transform = 'translateX(-50%)';

    spans.forEach((span) => {
      const text = span.textContent.trim();
      span.innerHTML = '';
      span.style.display = 'block';
      span.style.overflow = 'hidden';
      span.style.verticalAlign = 'bottom';

      const inner = document.createElement('span');
      inner.className = 'word-inner';
      inner.style.display = 'inline-block';
      inner.style.willChange = 'transform';
      inner.textContent = text;

      span.appendChild(inner);
    });
  }

  // Trigger word rollup sequentially
  function triggerHeadlineEntrance() {
    const headline = document.getElementById('hero-headline');
    if (!headline) return;

    const inners = headline.querySelectorAll('.word-inner');
    if (!inners.length) return;

    const tl = gsap.timeline();
    gsap.killTweensOf(inners);
    gsap.set(inners, { yPercent: 105 });

    tl.to(inners, {
      yPercent: 0,
      duration: 0.8,
      stagger: 0.2, // word rollup delay
      ease: 'power3.out'
    });
  }

  function initHeroHeadline() {
    const headline = document.getElementById('hero-headline');
    if (!headline) return;

    prepareHeadline();

    // Trigger sequential rollup on load
    gsap.delayedCall(isSubsequentVisit ? 0.05 : 1.6, () => {
      triggerHeadlineEntrance();
    });

    // Wave rollup effect on hover (word rollup wave)
    const inners = headline.querySelectorAll('.word-inner');
    headline.addEventListener('mouseenter', () => {
      if (headline.classList.contains('animating')) return;
      headline.classList.add('animating');

      const tl = gsap.timeline({
        onComplete: () => headline.classList.remove('animating')
      });

      // Roll out of view to the top (yPercent: -105)
      tl.to(inners, {
        yPercent: -105,
        duration: 0.4,
        stagger: 0.08,
        ease: 'power2.in'
      });

      // Reset bottom and roll back in smoothly
      tl.set(inners, { yPercent: 105 });
      tl.to(inners, {
        yPercent: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power3.out'
      }, '+=0.15');
    });
  }

  // ══════════════════════════════════════════════════════════
  //  HERO ANNOTATION PILLS — FADE IN (opacity only, no transform)
  // ══════════════════════════════════════════════════════════
  function initAnnotationPills() {
    const pills = document.querySelectorAll('.annotation');
    if (!pills.length) return;

    pills.forEach(pill => {
      pill.style.animation = 'none';
    });

    // IMPORTANT: Only animate opacity — never touch transform/scale
    // because pills use CSS transform: translate() for positioning.
    gsap.set(pills, { opacity: 0 });

    gsap.to(pills, {
      opacity: 1,
      duration: 0.8,
      stagger: 0.25,
      ease: 'power3.out',
      delay: isSubsequentVisit ? 0.1 : 2.0,
    });
  }

  // ══════════════════════════════════════════════════════════
  //  HERO PARALLAX + SLIDE-DECK PINNING
  // ══════════════════════════════════════════════════════════
  function initHeroParallax() {
    const heroImage = document.querySelector('.hero-picture img');
    const heroViewport = document.querySelector('.hero-viewport');
    if (!heroViewport) return;

    // Pin the hero so it stays in place while the next section slides over it
    ScrollTrigger.create({
      trigger: heroViewport,
      start: 'top top',
      end: 'bottom top',
      pin: true,
      pinSpacing: false, // No extra space — next section slides right over
    });

    // Subtle parallax on the hero image while pinned
    if (heroImage) {
      gsap.to(heroImage, {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
          trigger: heroViewport,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
        },
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  //  PHILOSOPHY SECTION — TEXT HIGHLIGHT ON SCROLL
  // ══════════════════════════════════════════════════════════
  function initTextHighlight() {
    const descParagraphs = document.querySelectorAll('.objective-desc p');
    if (!descParagraphs.length) return;

    descParagraphs.forEach((p) => {
      const words = splitIntoWords(p);

      // Start dim bold text, reveal to solid dark black
      gsap.set(words, { opacity: 0.15, color: 'rgba(0, 0, 0, 0.15)' });

      ScrollTrigger.create({
        trigger: p,
        start: 'top 82%',
        end: 'bottom 40%',
        scrub: 0.4,
        animation: gsap.to(words, {
          opacity: 1.0,
          color: '#000000',
          duration: 0.3,
          stagger: 0.04,
          ease: 'none',
        }),
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  //  PHILOSOPHY TITLE REVEAL
  // ══════════════════════════════════════════════════════════
  function initPhilosophyTitle() {
    const subTitle = document.querySelector('.objective-title .sub-title');
    const mainTitle = document.querySelector('.objective-title .main-title');
    if (!subTitle || !mainTitle) return;

    gsap.set(subTitle, { y: 40, opacity: 0 });
    ScrollTrigger.create({
      trigger: subTitle,
      start: 'top 85%',
      animation: gsap.to(subTitle, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }),
      toggleActions: "play none none reset"
    });

    const chars = splitIntoChars(mainTitle);
    gsap.set(chars, { opacity: 0, y: 30, rotateY: -60 });
    ScrollTrigger.create({
      trigger: mainTitle,
      start: 'top 85%',
      animation: gsap.to(chars, {
        opacity: 1, y: 0, rotateY: 0,
        duration: 0.6, stagger: 0.03, ease: 'power3.out',
      }),
      toggleActions: "play none none reset"
    });
  }

  // ══════════════════════════════════════════════════════════
  //  GALLERY MARQUEE — SCROLL VELOCITY MODULATION
  // ══════════════════════════════════════════════════════════
  function initMarqueeParallax() {
    const rows = document.querySelectorAll('.marquee-row');
    if (!rows.length) return;

    rows.forEach((row) => {
      const scrollContainer = row.querySelector('.marquee-scroll-container');
      if (!scrollContainer) return;

      const direction = row.classList.contains('marquee-left') ? -1 : 1;

      gsap.to(scrollContainer, {
        x: direction * -50,
        ease: 'none',
        scrollTrigger: {
          trigger: row,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.5,
        },
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  //  GALLERY ROWS — ENTRANCE REVEAL
  // ══════════════════════════════════════════════════════════
  function initGalleryReveal() {
    const gallery = document.querySelector('.objective-gallery');
    if (!gallery) return;

    const rows = gallery.querySelectorAll('.marquee-row');
    rows.forEach((row, index) => {
      const fromX = index % 2 === 0 ? -100 : 100;
      gsap.set(row, { x: fromX, opacity: 0 });

      ScrollTrigger.create({
        trigger: row,
        start: 'top 92%',
        animation: gsap.to(row, { x: 0, opacity: 1, duration: 1.0, ease: 'power3.out' }),
        toggleActions: "play none none reset"
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  //  SECTION HEADERS — UNIVERSAL SCROLL REVEAL
  // ══════════════════════════════════════════════════════════
  function initSectionReveals() {
    // Sub-titles
    document.querySelectorAll('.section-header .sub-title, .reviews-title .sub-title').forEach(el => {
      gsap.set(el, { y: 30, opacity: 0 });
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        animation: gsap.to(el, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }),
        toggleActions: "play none none reset"
      });
    });

    // Main titles — char-by-char reveal
    document.querySelectorAll('.section-header .main-title, .reviews-title .main-title').forEach(el => {
      const chars = splitIntoChars(el);
      gsap.set(chars, { opacity: 0, y: 20 });
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        animation: gsap.to(chars, {
          opacity: 1, y: 0,
          duration: 0.5, stagger: 0.015, ease: 'power2.out',
        }),
        toggleActions: "play none none reset"
      });
    });

    // Section intros
    document.querySelectorAll('.section-intro').forEach(el => {
      gsap.set(el, { y: 30, opacity: 0 });
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        animation: gsap.to(el, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }),
        toggleActions: "play none none reset"
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  //  FEATURE CARDS — STAGGER REVEAL
  // ══════════════════════════════════════════════════════════
  function initCardReveals() {
    // Feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    if (featureCards.length) {
      gsap.set(featureCards, { y: 60, opacity: 0, scale: 0.95 });
      ScrollTrigger.create({
        trigger: '.features-grid',
        start: 'top 82%',
        animation: gsap.to(featureCards, {
          y: 0, opacity: 1, scale: 1,
          duration: 0.7, stagger: 0.15, ease: 'power3.out',
        }),
        toggleActions: "play none none reset"
      });
    }

    // Service cards (homepage)
    const serviceCards = document.querySelectorAll('.featured-services .service-card');
    if (serviceCards.length) {
      gsap.set(serviceCards, { y: 60, opacity: 0, scale: 0.95 });
      ScrollTrigger.create({
        trigger: '.featured-services .services-grid',
        start: 'top 82%',
        animation: gsap.to(serviceCards, {
          y: 0, opacity: 1, scale: 1,
          duration: 0.7, stagger: 0.15, ease: 'power3.out',
        }),
        toggleActions: "play none none reset"
      });
    }

    // Review cards
    const reviewCards = document.querySelectorAll('.review-card');
    if (reviewCards.length) {
      gsap.set(reviewCards, { y: 50, opacity: 0, scale: 0.96 });
      ScrollTrigger.create({
        trigger: '.reviews-marquee',
        start: 'top 82%',
        animation: gsap.to(reviewCards, {
          y: 0, opacity: 1, scale: 1,
          duration: 0.6, stagger: 0.12, ease: 'power3.out',
        }),
        toggleActions: "play none none reset"
      });
    }

    // Team cards (old grid — kept for fallback)
    const teamCards = document.querySelectorAll('.team-card');
    if (teamCards.length) {
      gsap.set(teamCards, { y: 60, opacity: 0, scale: 0.95 });
      ScrollTrigger.create({
        trigger: '.team-grid',
        start: 'top 82%',
        animation: gsap.to(teamCards, {
          y: 0, opacity: 1, scale: 1,
          duration: 0.8, stagger: 0.2, ease: 'power3.out',
        }),
        toggleActions: "play none none reset"
      });
    }

    // Instagram items
    const instagramItems = document.querySelectorAll('.instagram-item');
    if (instagramItems.length) {
      gsap.set(instagramItems, { y: 50, opacity: 0, scale: 0.95 });
      ScrollTrigger.create({
        trigger: '.instagram-grid',
        start: 'top 82%',
        animation: gsap.to(instagramItems, {
          y: 0, opacity: 1, scale: 1,
          duration: 0.6, stagger: 0.08, ease: 'power3.out',
        }),
        toggleActions: "play none none reset"
      });
    }

    // Instagram Follow CTA button
    const instagramCta = document.querySelector('.instagram-cta .btn');
    if (instagramCta) {
      gsap.set(instagramCta, { y: 25, opacity: 0, scale: 0.9 });
      ScrollTrigger.create({
        trigger: '.instagram-cta',
        start: 'top 88%',
        animation: gsap.to(instagramCta, {
          y: 0, opacity: 1, scale: 1,
          duration: 0.6, ease: 'power3.out',
        }),
        toggleActions: "play none none reset"
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  //  SERVICE / TEAM CARD IMAGE PARALLAX
  // ══════════════════════════════════════════════════════════
  function initCardImageParallax() {
    document.querySelectorAll('.service-image img, .team-image img').forEach(img => {
      const parent = img.closest('.service-card, .team-card');
      if (!parent) return;

      gsap.fromTo(img,
        { yPercent: -8 },
        {
          yPercent: 8,
          ease: 'none',
          scrollTrigger: {
            trigger: parent,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.4,
          },
        }
      );
    });
  }

  // ══════════════════════════════════════════════════════════
  //  REVIEWS — RATING COUNTER ANIMATION
  // ══════════════════════════════════════════════════════════
  function initCounterAnimation() {
    const ratingScore = document.querySelector('.rating-score');
    const ratingCount = document.querySelector('.rating-count');

    if (ratingScore) {
      const scoreObj = { val: 0 };
      ScrollTrigger.create({
        trigger: ratingScore,
        start: 'top 85%',
        animation: gsap.to(scoreObj, {
          val: 5.0,
          duration: 2,
          ease: 'power2.out',
          onUpdate: () => {
            ratingScore.textContent = scoreObj.val.toFixed(1);
          },
        }),
        toggleActions: "play none none reset"
      });
    }

    if (ratingCount) {
      const originalText = ratingCount.textContent;
      const numberMatch = originalText.match(/(\d+)/);
      if (numberMatch) {
        const targetNum = parseInt(numberMatch[1], 10);
        const suffix = originalText.replace(numberMatch[1], '').trim();
        const countObj = { val: 0 };

        ScrollTrigger.create({
          trigger: ratingCount,
          start: 'top 85%',
          animation: gsap.to(countObj, {
            val: targetNum,
            duration: 2.5,
            ease: 'power2.out',
            onUpdate: () => {
              ratingCount.textContent = Math.round(countObj.val) + ' ' + suffix;
            },
          }),
          toggleActions: "play none none reset"
        });
      }
    }

    // Stars pop-in
    const stars = document.querySelector('.rating-badge .stars');
    if (stars) {
      gsap.set(stars, { scale: 0, opacity: 0 });
      ScrollTrigger.create({
        trigger: stars,
        start: 'top 85%',
        animation: gsap.to(stars, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2)', delay: 0.3 }),
        toggleActions: "play none none reset"
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  //  REVIEWS HEADER — LAYOUT REVEAL
  // ══════════════════════════════════════════════════════════
  function initReviewsReveal() {
    const ratingBadge = document.querySelector('.rating-badge');
    if (ratingBadge) {
      gsap.set(ratingBadge, { x: -50, opacity: 0 });
      ScrollTrigger.create({
        trigger: ratingBadge,
        start: 'top 85%',
        animation: gsap.to(ratingBadge, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }),
        toggleActions: "play none none reset"
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  //  CTA SECTION — HEADLINE & BUTTONS REVEAL
  // ══════════════════════════════════════════════════════════
  function initCTAAnimation() {
    const ctaHeading = document.querySelector('.cta-section h2');
    const ctaImage = document.querySelector('.cta-image-col');
    const ctaContent = document.querySelector('.cta-content-col');

    if (ctaHeading) {
      // Gradient wipe on the heading
      ScrollTrigger.create({
        trigger: ctaHeading,
        start: 'top 80%',
        animation: gsap.fromTo(ctaHeading,
          { backgroundPosition: '100% 0%' },
          {
            backgroundPosition: '0% 0%',
            duration: 1.5,
            ease: 'power2.inOut',
          }
        ),
        toggleActions: "play none none reset"
      });
    }

    if (ctaImage) {
      gsap.set(ctaImage, { x: -40, opacity: 0 });
      ScrollTrigger.create({
        trigger: ctaImage,
        start: 'top 85%',
        animation: gsap.to(ctaImage, { x: 0, opacity: 1, duration: 1.0, ease: 'power3.out' }),
        toggleActions: "play none none reset"
      });
    }

    if (ctaContent) {
      const elements = ctaContent.children;
      gsap.set(elements, { y: 30, opacity: 0 });
      ScrollTrigger.create({
        trigger: ctaContent,
        start: 'top 85%',
        animation: gsap.to(elements, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out'
        }),
        toggleActions: "play none none reset"
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  //  MAGNETIC BUTTONS (Desktop pointer devices only)
  // ══════════════════════════════════════════════════════════
  function initMagneticButtons() {
    if (prefersReducedMotion) return;
    if (!window.matchMedia('(hover: hover)').matches) return;

    const magneticEls = document.querySelectorAll('.btn, .float-book');

    magneticEls.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to(el, {
          x: x * 0.25,
          y: y * 0.25,
          duration: 0.3,
          ease: 'power2.out',
        });
      });

      el.addEventListener('mouseleave', () => {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'elastic.out(1, 0.4)',
        });
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  //  FOOTER REVEAL
  // ══════════════════════════════════════════════════════════
  function initFooterReveal() {
    const footerBrand = document.querySelector('.footer-brand');
    const footerCols = document.querySelectorAll('.footer-col');

    if (footerBrand) {
      gsap.set(footerBrand, { y: 40, opacity: 0 });
      ScrollTrigger.create({
        trigger: footerBrand,
        start: 'top 92%',
        animation: gsap.to(footerBrand, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }),
        toggleActions: "play none none reset"
      });
    }

    if (footerCols.length) {
      gsap.set(footerCols, { y: 40, opacity: 0 });
      ScrollTrigger.create({
        trigger: footerCols[0],
        start: 'top 92%',
        animation: gsap.to(footerCols, {
          y: 0, opacity: 1, duration: 0.7, stagger: 0.15, ease: 'power3.out',
        }),
        toggleActions: "play none none reset"
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  //  FLOATING ACTIONS — ENTRANCE
  // ══════════════════════════════════════════════════════════
  function initFloatingActions() {
    const floatBook = document.querySelector('.float-book');
    const floatCall = document.querySelector('.float-call');

    if (floatBook) {
      gsap.set(floatBook, { y: 80, opacity: 0 });
      gsap.to(floatBook, {
        y: 0, opacity: 1,
        duration: 0.8, ease: 'back.out(1.5)', delay: isSubsequentVisit ? 0.15 : 2.1,
      });
    }

    if (floatCall) {
      gsap.set(floatCall, { y: 80, opacity: 0 });
      gsap.to(floatCall, {
        y: 0, opacity: 1,
        duration: 0.8, ease: 'back.out(1.5)', delay: isSubsequentVisit ? 0.15 : 2.0,
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  //  TEAM SPLIT SECTION — CINEMATIC REVEAL
  // ══════════════════════════════════════════════════════════
  function initTeamSplitReveal() {
    const imageFrame = document.querySelector('.team-image-frame');
    const contentSide = document.querySelector('.team-split-content');
    if (!imageFrame && !contentSide) return;

    // Image slides in from left
    if (imageFrame) {
      gsap.set(imageFrame, { x: -80, opacity: 0, scale: 0.95 });
      ScrollTrigger.create({
        trigger: '.team-split',
        start: 'top 80%',
        animation: gsap.to(imageFrame, {
          x: 0, opacity: 1, scale: 1,
          duration: 1.1, ease: 'power3.out',
        }),
        toggleActions: 'play none none reset',
      });
    }

    // Content children stagger in from right
    if (contentSide) {
      const children = Array.from(contentSide.children);
      gsap.set(children, { x: 60, opacity: 0 });
      ScrollTrigger.create({
        trigger: '.team-split',
        start: 'top 78%',
        animation: gsap.to(children, {
          x: 0, opacity: 1,
          duration: 0.8, stagger: 0.1, ease: 'power3.out',
        }),
        toggleActions: 'play none none reset',
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  //  WHY CHOOSE US — STAGGER CARD REVEAL + TRUST COUNTER
  // ══════════════════════════════════════════════════════════
  function initWCUReveal() {
    // Header fade-up
    const wcuHeader = document.querySelector('.wcu-header');
    if (wcuHeader) {
      const kids = Array.from(wcuHeader.children);
      gsap.set(kids, { y: 40, opacity: 0 });
      ScrollTrigger.create({
        trigger: wcuHeader,
        start: 'top 85%',
        animation: gsap.to(kids, {
          y: 0, opacity: 1,
          duration: 0.8, stagger: 0.15, ease: 'power3.out',
        }),
        toggleActions: 'play none none reset',
      });
    }

    // Cards stagger up + scale from 0.92
    const wcuCards = document.querySelectorAll('.wcu-card');
    if (wcuCards.length) {
      gsap.set(wcuCards, { y: 70, opacity: 0, scale: 0.93 });
      ScrollTrigger.create({
        trigger: '.wcu-grid',
        start: 'top 82%',
        animation: gsap.to(wcuCards, {
          y: 0, opacity: 1, scale: 1,
          duration: 0.75, stagger: 0.14, ease: 'power3.out',
        }),
        toggleActions: 'play none none reset',
      });
    }

    // Trust numbers count up
    const trustNumbers = document.querySelectorAll('.trust-number');
    trustNumbers.forEach((el) => {
      const text = el.textContent.trim();
      const numMatch = text.match(/(\d+)/);
      if (!numMatch) {
        // Non-numeric (e.g. "Cork's") — just fade in
        gsap.set(el, { opacity: 0, y: 20 });
        ScrollTrigger.create({
          trigger: el,
          start: 'top 90%',
          animation: gsap.to(el, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }),
          toggleActions: 'play none none reset',
        });
        return;
      }
      const target = parseInt(numMatch[1], 10);
      const prefix = text.slice(0, numMatch.index);
      const suffix = text.slice(numMatch.index + numMatch[1].length);
      const obj = { val: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        animation: gsap.to(obj, {
          val: target,
          duration: 1.8, ease: 'power2.out',
          onUpdate: () => { el.textContent = prefix + Math.round(obj.val) + suffix; },
        }),
        toggleActions: 'play none none reset',
      });
    });

    // Trust labels fade in
    const trustLabels = document.querySelectorAll('.trust-label');
    if (trustLabels.length) {
      gsap.set(trustLabels, { opacity: 0, y: 10 });
      ScrollTrigger.create({
        trigger: '.wcu-trust-bar',
        start: 'top 88%',
        animation: gsap.to(trustLabels, {
          opacity: 1, y: 0,
          duration: 0.6, stagger: 0.1, ease: 'power2.out',
        }),
        toggleActions: 'play none none reset',
      });
    }
  }

  // Pill mouse parallax removed — GSAP x/y transforms conflict with
  // CSS transform: translate() positioning on the annotation pills.

  // ══════════════════════════════════════════════════════════
  //  CTA BACKGROUND GRADIENT SHIFT
  // ══════════════════════════════════════════════════════════
  function initCTAGradientShift() {
    const ctaSection = document.querySelector('.cta-section');
    if (!ctaSection) return;

    gsap.fromTo(ctaSection,
      { backgroundImage: 'linear-gradient(180deg, #080808 0%, #0d0d0d 100%)' },
      {
        backgroundImage: 'linear-gradient(180deg, #0d0d0d 0%, #1a100d 100%)',
        ease: 'none',
        scrollTrigger: {
          trigger: ctaSection,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.5,
        },
      }
    );
  }

  // ══════════════════════════════════════════════════════════
  //  SERVICES PAGE — HERO REVEAL
  // ══════════════════════════════════════════════════════════
  function initServicesHero() {
    const heroSection = document.querySelector('.services-hero');
    if (!heroSection) return;

    const subTitle = heroSection.querySelector('.sub-title');
    const mainTitle = heroSection.querySelector('.main-title');
    const intro = heroSection.querySelector('.section-intro');

    const tl = gsap.timeline({ delay: isSubsequentVisit ? 0.05 : 1.5 });

    if (subTitle) {
      gsap.set(subTitle, { y: 30, opacity: 0 });
      tl.to(subTitle, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
    }

    if (mainTitle) {
      const chars = splitIntoChars(mainTitle);
      gsap.set(chars, { opacity: 0, y: 40, rotateX: -45 });
      tl.to(chars, {
        opacity: 1, y: 0, rotateX: 0,
        duration: 0.7, stagger: 0.025, ease: 'power3.out',
      }, '-=0.3');
    }

    if (intro) {
      gsap.set(intro, { y: 20, opacity: 0 });
      tl.to(intro, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.3');
    }
  }

  // ══════════════════════════════════════════════════════════
  //  SERVICES PAGE — MENU ITEMS STAGGER REVEAL
  // ══════════════════════════════════════════════════════════
  function initServicesMenuReveals() {
    const categories = document.querySelectorAll('.menu-category');
    if (!categories.length) return;

    categories.forEach(cat => {
      const title = cat.querySelector('.category-title');
      if (title) {
        gsap.set(title, { x: -60, opacity: 0 });
        ScrollTrigger.create({
          trigger: title,
          start: 'top 85%',
          animation: gsap.to(title, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }),
          toggleActions: "play none none reset"
        });
      }

      const items = cat.querySelectorAll('.menu-item');
      if (items.length) {
        gsap.set(items, { y: 40, opacity: 0 });
        ScrollTrigger.create({
          trigger: cat,
          start: 'top 78%',
          animation: gsap.to(items, {
            y: 0, opacity: 1,
            duration: 0.6, stagger: 0.1, ease: 'power3.out',
          }),
          toggleActions: "play none none reset"
        });
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  //  SERVICES PAGE — SIDEBAR HOVER ANIMATION
  // ══════════════════════════════════════════════════════════
  function initServicesSidebarAnimation() {
    const sidebarLinks = document.querySelectorAll('.category-nav a');
    if (!sidebarLinks.length) return;

    sidebarLinks.forEach(link => {
      link.addEventListener('mouseenter', () => {
        gsap.to(link, { x: 6, duration: 0.3, ease: 'power2.out' });
      });
      link.addEventListener('mouseleave', () => {
        if (!link.classList.contains('active')) {
          gsap.to(link, { x: 0, duration: 0.3, ease: 'power2.out' });
        }
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  //  SERVICES PAGE — STICKY SHOWCASE SYNC
  // ══════════════════════════════════════════════════════════
  function initServicesShowcase() {
    const categories = document.querySelectorAll('.menu-category');
    const imgWraps = document.querySelectorAll('.showcase-img-wrap');
    const rollingTitleWrapper = document.querySelector('.rolling-title-wrapper');
    const rollingTitles = document.querySelectorAll('.rolling-title');

    if (!categories.length || !imgWraps.length || !rollingTitleWrapper) return;

    let activeIndex = 0;

    categories.forEach((cat, index) => {
      ScrollTrigger.create({
        trigger: cat,
        start: 'top 45%', // trigger slightly above midpoint for fast visual update
        end: 'bottom 45%',
        onEnter: () => {
          changeActiveCategory(index);
        },
        onEnterBack: () => {
          changeActiveCategory(index);
        }
      });
    });

    function changeActiveCategory(index) {
      if (activeIndex === index) return;

      // 1. Highlight sidebar link
      const sidebarLinks = document.querySelectorAll('.category-nav a');
      sidebarLinks.forEach((link, idx) => {
        link.classList.toggle('active', idx === index);
      });

      // 2. Animate image transition
      const incomingWrap = imgWraps[index];
      const outgoingWrap = imgWraps[activeIndex];

      gsap.killTweensOf(imgWraps);
      
      // Reset all wraps z-index and clip-paths so transition is clean
      gsap.set(imgWraps, { zIndex: 1 });
      gsap.set(outgoingWrap, { zIndex: 2 });
      gsap.set(incomingWrap, { zIndex: 3 });

      // Animate incoming wrap from bottom to top (inset(100% 0% 0% 0%) to inset(0% 0% 0% 0%))
      gsap.fromTo(incomingWrap,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 0.8,
          ease: 'power3.inOut',
          onComplete: () => {
            imgWraps.forEach((wrap, idx) => {
              wrap.classList.toggle('active', idx === index);
              if (idx !== index) {
                gsap.set(wrap, { clipPath: 'inset(100% 0% 0% 0%)' });
              }
            });
          }
        }
      );

      // 3. Roll title vertically
      const activeTitle = rollingTitles[index];
      if (activeTitle) {
        gsap.to(rollingTitleWrapper, {
          y: -activeTitle.offsetTop,
          duration: 0.6,
          ease: 'power3.out'
        });
      }

      activeIndex = index;
    }
  }

  // ══════════════════════════════════════════════════════════
  //  HEADER STICKY & SHRINK & FLOAT SOCIAL MOVEMENT ON SCROLL
  // ══════════════════════════════════════════════════════════
  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    const floatSocial = document.getElementById('float-social');
    if (!header) return;

    ScrollTrigger.create({
      start: 'top -50',
      onEnter: () => {
        header.classList.add('scrolled');
        if (floatSocial) floatSocial.classList.add('moved');
      },
      onLeaveBack: () => {
        header.classList.remove('scrolled');
        if (floatSocial) floatSocial.classList.remove('moved');
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  //  HOME CLICK SMOOTH SCROLL & HEADLINE RE-TRIGGER
  // ══════════════════════════════════════════════════════════
  function initHomeClickScroll() {
    const homeLinks = document.querySelectorAll('.brand-link, a[href="#site-header"], a[href="./index.html#site-header"]');
    homeLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const isServicesPage = document.body.classList.contains('services-page');
        const href = link.getAttribute('href');

        // Only handle smooth scroll if on the homepage
        if (!isServicesPage && (href === '#' || href === '#site-header' || href.includes('index.html'))) {
          e.preventDefault();
          if (lenis) {
            lenis.scrollTo(0, {
              duration: 2.2,
              easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
              onComplete: () => {
                triggerHeadlineEntrance();
              }
            });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            triggerHeadlineEntrance();
          }
        }
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  //  INITIALIZE ALL
  // ══════════════════════════════════════════════════════════
  function init() {
    console.log('[Mariposa] Initializing animations...');

    if (prefersReducedMotion) {
      initPageTransition();
      console.log('[Mariposa] Reduced motion: minimal animations only.');
      return;
    }

    // Page entry
    initPageTransition();
    initHeaderAnimation();
    initFloatingActions();
    initHeaderScroll();
    initHomeClickScroll();

    // Hero (index.html)
    initHeroHeadline();
    initAnnotationPills();
    initHeroParallax();

    // Philosophy section
    initPhilosophyTitle();
    initTextHighlight();
    initMarqueeParallax();
    initGalleryReveal();

    // Main sections scroll reveals
    initSectionReveals();
    initCardReveals();
    initCardImageParallax();

    // Team split + Why Choose Us
    initTeamSplitReveal();
    initWCUReveal();

    // Reviews
    initCounterAnimation();
    initReviewsReveal();

    // CTA
    initCTAAnimation();
    initCTAGradientShift();

    // Footer
    initFooterReveal();

    // Interactive
    initMagneticButtons();

    // Services page specific
    initServicesHero();
    initServicesMenuReveals();
    initServicesSidebarAnimation();
    initServicesShowcase();

    // Force ScrollTrigger recalculation after all setup
    ScrollTrigger.refresh();

    console.log('[Mariposa] All animations initialized. ScrollTrigger count:', ScrollTrigger.getAll().length);
  }

  // Kick off
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
