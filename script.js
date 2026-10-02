/**
 * CUT BLEND STUDIOS — ULTRA ANIMATION & INTERACTIVE ENGINE
 * Features: Lenis Smooth Scroll, GSAP ScrollTrigger, Custom Cursor, Web Audio Engine,
 * Camera Preloader, Before/After Color Grade Slider, Side-by-Side Video Controls.
 */

function initStudioApp() {
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  /* ==========================================================================
     01. CINEMATIC AUDIO SYNTHESIZER (WEB AUDIO API)
     ========================================================================== */
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.isAudioEnabled = false;
      this.ambientDrone = null;
      this.ambientGain = null;
    }

    init() {
      try {
        if (!this.ctx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            this.ctx = new AudioContext();
          }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      } catch (e) {}
    }

    playClickSound() {
      if (!this.isAudioEnabled || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);
        
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.04);
      } catch (e) {
        console.warn(e);
      }
    }

    playShutterSound() {
      if (!this.isAudioEnabled || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
      } catch (e) {
        console.warn(e);
      }
    }

    toggleAmbientDrone() {
      this.init();
      this.isAudioEnabled = !this.isAudioEnabled;

      const audioIcon = document.getElementById('audioIcon');
      if (this.isAudioEnabled) {
        if (audioIcon) {
          audioIcon.setAttribute('data-lucide', 'volume-2');
          window.lucide.createIcons();
        }
        // Start subtle low drone
        this.ambientDrone = this.ctx.createOscillator();
        this.ambientGain = this.ctx.createGain();
        
        this.ambientDrone.type = 'sine';
        this.ambientDrone.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note
        
        this.ambientGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        this.ambientGain.gain.exponentialRampToValueAtTime(0.04, this.ctx.currentTime + 2);

        this.ambientDrone.connect(this.ambientGain);
        this.ambientGain.connect(this.ctx.destination);
        this.ambientDrone.start();
      } else {
        if (audioIcon) {
          audioIcon.setAttribute('data-lucide', 'volume-x');
          window.lucide.createIcons();
        }
        if (this.ambientGain) {
          this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
          setTimeout(() => {
            if (this.ambientDrone) {
              this.ambientDrone.stop();
              this.ambientDrone.disconnect();
            }
          }, 500);
        }
      }
    }
  }

  const sound = new SoundEngine();
  const audioBtn = document.getElementById('audioToggleBtn');
  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      sound.toggleAmbientDrone();
    });
  }

  /* ==========================================================================
     02. PURE 8-SECOND FULL-SCREEN VIDEO PRELOADER (ONLY & ONLY VIDEO)
     ========================================================================== */
  const preloader = document.getElementById('preloader');
  const loaderVideo = document.getElementById('loaderVideo');
  const btnSkipLoader = document.getElementById('btnSkipLoader');
  const btnAudioPrompt = document.getElementById('btnAudioPrompt');
  let hasDismissed = false;

  function dismissPreloader() {
    if (hasDismissed) return;
    hasDismissed = true;

    try {
      if (sound && sound.ctx && sound.ctx.state === 'running') {
        sound.playShutterSound();
      }
    } catch (e) {}

    if (loaderVideo) {
      try {
        loaderVideo.pause();
      } catch (e) {}
    }

    if (preloader) {
      preloader.classList.add('preloader-hidden');
      setTimeout(() => {
        preloader.style.display = 'none';
        initScrollAnimations();
        if (window.ScrollTrigger) {
          ScrollTrigger.refresh();
        }
      }, 900);
    }
  }

  if (loaderVideo) {
    // 1. Ensure video starts playing immediately on page load in muted mode
    // (Chromium and iOS WebKit strictly pause the video element if muted=false before user gesture)
    loaderVideo.muted = true;
    loaderVideo.defaultMuted = true;

    const startPlayback = () => {
      const p = loaderVideo.play();
      if (p !== undefined) {
        p.catch(() => {
          loaderVideo.muted = true;
          loaderVideo.play().catch(() => {});
        });
      }
    };
    startPlayback();

    // 2. Unmute and unlock pure video audio on ANY user touch/click/gesture
    const unlockAudio = () => {
      try {
        loaderVideo.muted = false;
        loaderVideo.volume = 1.0;
        if (loaderVideo.paused) {
          loaderVideo.play().catch(() => {});
        }
      } catch (e) {}

      if (btnAudioPrompt) {
        btnAudioPrompt.classList.add('hidden');
      }

      try {
        sound.init();
      } catch (e) {}

      ['touchstart', 'touchend', 'click', 'pointerdown', 'keydown'].forEach(evt => {
        window.removeEventListener(evt, unlockAudio);
      });
    };

    ['touchstart', 'touchend', 'click', 'pointerdown', 'keydown'].forEach(evt => {
      window.addEventListener(evt, unlockAudio, { passive: true, once: true });
    });

    if (btnAudioPrompt) {
      btnAudioPrompt.addEventListener('click', (e) => {
        e.stopPropagation();
        unlockAudio();
      });
    }

    if (preloader) {
      preloader.addEventListener('click', unlockAudio, { once: true });
      preloader.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
    }

    // 4. Auto-dismiss when 8-second video completes
    loaderVideo.addEventListener('ended', () => {
      dismissPreloader();
    });

    // 5. Dismiss slightly before video ends for a seamless transition
    loaderVideo.addEventListener('timeupdate', () => {
      if (loaderVideo.duration && loaderVideo.currentTime >= loaderVideo.duration - 0.25) {
        dismissPreloader();
      }
    });

    // 6. Absolute fail-safe: guarantee transition to landing page after 8.2s
    setTimeout(() => {
      dismissPreloader();
    }, 8200);
  } else {
    setTimeout(dismissPreloader, 4000);
  }

  // Skip button click
  if (btnSkipLoader) {
    btnSkipLoader.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissPreloader();
    });
  }

  /* ==========================================================================
     03. LENIS SMOOTH SCROLL INITIALIZATION
     ========================================================================== */
  let lenis;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ==========================================================================
     04. CUSTOM INTERACTIVE CURSOR & FOLLOWER (DESKTOP ONLY)
     ========================================================================== */
  const isTouchDevice = () => window.matchMedia('(hover: none) or (pointer: coarse)').matches || window.innerWidth <= 1024;
  
  const cursor = document.getElementById('custom-cursor');
  const follower = document.getElementById('cursor-follower');
  const cursorText = document.getElementById('cursor-text');

  if (isTouchDevice()) {
    if (cursor) cursor.style.display = 'none';
    if (follower) follower.style.display = 'none';
  } else {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let followerX = mouseX;
    let followerY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (cursor) {
        cursor.style.left = `${mouseX}px`;
        cursor.style.top = `${mouseY}px`;
      }
    });

    function renderCursor() {
      followerX += (mouseX - followerX) * 0.15;
      followerY += (mouseY - followerY) * 0.15;

      if (follower) {
        follower.style.left = `${followerX}px`;
        follower.style.top = `${followerY}px`;
      }
      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);

    // Magnetic & Cursor Hover States
    const interactiveElements = document.querySelectorAll('a, button, .cat-tab, .showcase-video, .grade-slider-wrapper, .gear-card');
    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        document.body.classList.add('cursor-hover');
        sound.playClickSound();

        if (el.tagName === 'VIDEO' || el.classList.contains('showcase-video') || el.classList.contains('camera-card-3d')) {
          if (cursorText) cursorText.textContent = 'PLAY REEL';
        } else if (el.classList.contains('grade-slider-wrapper')) {
          if (cursorText) cursorText.textContent = 'DRAG LUT';
        } else {
          if (cursorText) cursorText.textContent = 'VIEW';
        }
      });

      el.addEventListener('mouseleave', () => {
        document.body.classList.remove('cursor-hover');
        if (cursorText) cursorText.textContent = 'EXPLORE';
      });
    });

    // Magnetic Button Effect
    const magneticTargets = document.querySelectorAll('.magnetic-target');
    magneticTargets.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0px, 0px)';
      });
    });
  }

  /* ==========================================================================
     05. CAMERA HUD REAL-TIME TIMECODE & TOGGLE
     ========================================================================== */
  const hudTimecode = document.getElementById('hudTimecode');
  const cinemaHud = document.getElementById('cinemaHud');
  const cinemaHudToggleBtn = document.getElementById('cinemaHudToggleBtn');

  let frames = 0, seconds = 0, minutes = 0, hours = 0;
  setInterval(() => {
    frames++;
    if (frames >= 24) {
      frames = 0;
      seconds++;
      if (seconds >= 60) {
        seconds = 0;
        minutes++;
        if (minutes >= 60) {
          minutes = 0;
          hours++;
        }
      }
    }
    const pad = (n) => String(n).padStart(2, '0');
    if (hudTimecode) {
      hudTimecode.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
    }
  }, 1000 / 24);

  if (cinemaHudToggleBtn && cinemaHud) {
    cinemaHudToggleBtn.addEventListener('click', () => {
      cinemaHud.classList.toggle('hud-hidden');
      sound.playShutterSound();
    });
  }

  /* ==========================================================================
     06. HERO PARTICLE CANVAS
     ========================================================================== */
  const canvas = document.getElementById('particlesCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = 45;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.8 + 0.5,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    function animateParticles() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${p.alpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#d4af37';
        ctx.fill();
      });

      requestAnimationFrame(animateParticles);
    }
    animateParticles();
  }

  /* ==========================================================================
     06B. MOBILE DRAWER NAVIGATION
     ========================================================================== */
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileDrawer.classList.add('open');
      sound.playClickSound();
    });
  }

  if (closeDrawerBtn && mobileDrawer) {
    closeDrawerBtn.addEventListener('click', () => {
      mobileDrawer.classList.remove('open');
      sound.playClickSound();
    });
  }

  mobileLinks.forEach((link) => {
    link.addEventListener('click', () => {
      mobileDrawer?.classList.remove('open');
      sound.playClickSound();
    });
  });

  /* ==========================================================================
     07. GSAP SCROLL-TRIGGER ANIMATIONS (100K ANIMATION MATRIX)
     ========================================================================== */
  function initScrollAnimations() {
    if (!window.gsap || !window.ScrollTrigger) return;

    // Header Blur on Scroll
    const header = document.getElementById('mainHeader');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header?.classList.add('scrolled');
      } else {
        header?.classList.remove('scrolled');
      }
    });

    // Hero Text Parallax & Entrance
    gsap.from('.hero-line', {
      duration: 1.2,
      y: 80,
      opacity: 0,
      stagger: 0.15,
      ease: 'power4.out',
    });

    gsap.from('.hero-subtitle', {
      duration: 1,
      y: 40,
      opacity: 0,
      delay: 0.4,
      ease: 'power3.out',
    });

    gsap.from('.hero-cta-group, .hero-camera-card-wrap', {
      duration: 1.2,
      y: 50,
      opacity: 0,
      delay: 0.6,
      ease: 'power3.out',
    });

    // Animate Number Counters on Scroll
    const counters = document.querySelectorAll('.counter');
    counters.forEach((counter) => {
      const target = parseFloat(counter.getAttribute('data-target'));
      gsap.to(counter, {
        scrollTrigger: {
          trigger: counter,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        duration: 2.2,
        ease: 'power2.out',
        onUpdate: function () {
          const val = (this.progress() * target).toFixed(target % 1 === 0 ? 0 : 1);
          counter.textContent = val;
        },
      });
    });

    // Side-by-Side Showcase Section Scroll Triggers
    const showcaseRows = document.querySelectorAll('.showcase-row');
    showcaseRows.forEach((row) => {
      const infoCol = row.querySelector('.showcase-info-col');
      const videoCol = row.querySelector('.showcase-video-col');

      if (infoCol) {
        gsap.from(infoCol, {
          scrollTrigger: {
            trigger: row,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
          x: infoCol.classList.contains('scroll-fade-left') ? -60 : 60,
          opacity: 0,
          duration: 1.2,
          ease: 'power3.out',
        });
      }

      if (videoCol) {
        gsap.from(videoCol, {
          scrollTrigger: {
            trigger: row,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
          x: videoCol.classList.contains('scroll-fade-left') ? -60 : 60,
          opacity: 0,
          duration: 1.2,
          ease: 'power3.out',
        });
      }
    });

    // Gear Arsenal Stagger Animation (check elements first)
    const gearCards = document.querySelectorAll('.gear-card');
    const arsenalSec = document.querySelector('.arsenal-section');
    if (gearCards.length && arsenalSec) {
      gsap.from('.gear-card', {
        scrollTrigger: {
          trigger: '.arsenal-section',
          start: 'top 75%',
        },
        y: 60,
        opacity: 0,
        stagger: 0.12,
        duration: 0.9,
        ease: 'power3.out',
      });
    }

    // Timeline Steps Stagger
    gsap.from('.timeline-step', {
      scrollTrigger: {
        trigger: '.workflow-section',
        start: 'top 75%',
      },
      y: 50,
      opacity: 0,
      stagger: 0.15,
      duration: 0.9,
      ease: 'power3.out',
    });

    // High-Velocity Liquid Scroll Physics (Awwwards-style Momentum Skew)
    let currentSkew = 0;
    let targetSkew = 0;
    
    if (lenis) {
      lenis.on('scroll', (e) => {
        const velocity = e.velocity || 0;
        targetSkew = Math.max(-2.5, Math.min(2.5, velocity * 0.08));
      });
    }

    function renderVelocitySkew() {
      currentSkew += (targetSkew - currentSkew) * 0.12;
      targetSkew *= 0.9; // Smooth damping
      
      const skewTargets = document.querySelectorAll('.showcase-row, .gear-card');
      skewTargets.forEach((el) => {
        el.style.transform = `skewY(${currentSkew.toFixed(2)}deg)`;
      });
      requestAnimationFrame(renderVelocitySkew);
    }
    renderVelocitySkew();
  }

  /* ==========================================================================
     08. SIDE-BY-SIDE VIDEO CONTROLS & MULTI-ANGLE SWITCHER
     ========================================================================== */
  const videoFrames = document.querySelectorAll('.video-monitor-frame');

  videoFrames.forEach((frame) => {
    const video = frame.querySelector('.showcase-video');
    const playCenterBtn = frame.querySelector('.video-center-btn');
    const toggleSoundBtn = frame.querySelector('.toggle-sound');
    const fullscreenBtn = frame.querySelector('.toggle-fullscreen');
    const progressFill = frame.querySelector('.inline-progress-fill');
    const progressBar = frame.querySelector('.inline-progress');
    const timeDisplay = frame.querySelector('.inline-time');
    const angleBtns = frame.querySelectorAll('.angle-btn');

    if (!video) return;

    // Center Play/Pause Click
    if (playCenterBtn) {
      playCenterBtn.addEventListener('click', () => {
        sound.playClickSound();
        if (video.paused) {
          video.play();
          playCenterBtn.querySelector('.icon-play')?.classList.add('hidden');
          playCenterBtn.querySelector('.icon-pause')?.classList.remove('hidden');
        } else {
          video.pause();
          playCenterBtn.querySelector('.icon-play')?.classList.remove('hidden');
          playCenterBtn.querySelector('.icon-pause')?.classList.add('hidden');
        }
      });
    }

    // Sound Toggle
    if (toggleSoundBtn) {
      toggleSoundBtn.addEventListener('click', () => {
        sound.playClickSound();
        video.muted = !video.muted;
        const volMuted = toggleSoundBtn.querySelector('.vol-muted');
        const volActive = toggleSoundBtn.querySelector('.vol-active');
        if (video.muted) {
          volMuted?.classList.remove('hidden');
          volActive?.classList.add('hidden');
        } else {
          volMuted?.classList.add('hidden');
          volActive?.classList.remove('hidden');
        }
      });
    }

    // Fullscreen Toggle
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        sound.playClickSound();
        if (video.requestFullscreen) {
          video.requestFullscreen();
        } else if (video.webkitRequestFullscreen) {
          video.webkitRequestFullscreen();
        }
      });
    }

    // Progress Bar & Timecode Update
    video.addEventListener('timeupdate', () => {
      if (video.duration) {
        const percent = (video.currentTime / video.duration) * 100;
        if (progressFill) progressFill.style.width = `${percent}%`;

        const curMin = Math.floor(video.currentTime / 60);
        const curSec = Math.floor(video.currentTime % 60);
        const durMin = Math.floor(video.duration / 60);
        const durSec = Math.floor(video.duration % 60);
        const pad = (n) => String(n).padStart(2, '0');

        if (timeDisplay) {
          timeDisplay.textContent = `${pad(curMin)}:${pad(curSec)} / ${pad(durMin)}:${pad(durSec)}`;
        }
      }
    });

    // Scrubber click
    if (progressBar) {
      progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        video.currentTime = pos * video.duration;
      });
    }

    // Multi-Cam Angle button switcher effect
    angleBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        sound.playClickSound();
        angleBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        // Cinematic glitch pulse to simulate angle switch
        video.style.opacity = '0.4';
        setTimeout(() => {
          video.style.opacity = '1';
        }, 120);
      });
    });
  });

  /* ==========================================================================
     09. COLOR GRADING LAB (BEFORE / AFTER COMPARISON SLIDER & LUT SELECTOR)
     ========================================================================== */
  const gradeSlider = document.getElementById('gradeSliderWrapper');
  const gradeBefore = document.getElementById('gradeBeforeLayer');
  const gradeHandle = document.getElementById('gradeHandle');
  const lutBtns = document.querySelectorAll('.lut-btn');

  if (gradeSlider && gradeBefore && gradeHandle) {
    let isSliding = false;

    const updateSlider = (clientX) => {
      const rect = gradeSlider.getBoundingClientRect();
      let offsetX = clientX - rect.left;
      if (offsetX < 0) offsetX = 0;
      if (offsetX > rect.width) offsetX = rect.width;

      const percentage = (offsetX / rect.width) * 100;
      gradeBefore.style.width = `${percentage}%`;
      gradeHandle.style.left = `${percentage}%`;
    };

    gradeSlider.addEventListener('mousedown', (e) => {
      isSliding = true;
      updateSlider(e.clientX);
    });

    window.addEventListener('mouseup', () => {
      isSliding = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isSliding) return;
      updateSlider(e.clientX);
    });

    // Touch Support
    gradeSlider.addEventListener('touchstart', (e) => {
      isSliding = true;
      updateSlider(e.touches[0].clientX);
    });

    window.addEventListener('touchend', () => {
      isSliding = false;
    });

    window.addEventListener('touchmove', (e) => {
      if (!isSliding) return;
      updateSlider(e.touches[0].clientX);
    });

    // LUT Switcher
    const afterImg = document.querySelector('.grade-after .grade-img');
    lutBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        sound.playClickSound();
        lutBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const lut = btn.getAttribute('data-lut');
        if (afterImg) {
          if (lut === 'kodak') {
            afterImg.style.filter = 'contrast(120%) saturate(130%) sepia(20%)';
          } else if (lut === 'teal-orange') {
            afterImg.style.filter = 'contrast(135%) saturate(150%) hue-rotate(15deg)';
          } else if (lut === 'monochrome') {
            afterImg.style.filter = 'grayscale(100%) contrast(140%) brightness(105%)';
          } else if (lut === 'moody') {
            afterImg.style.filter = 'contrast(115%) saturate(85%) hue-rotate(180deg) brightness(90%)';
          }
        }
      });
    });
  }

  /* ==========================================================================
     10. CATEGORY FILTER TABS
     ========================================================================== */
  const catTabs = document.querySelectorAll('.cat-tab');
  const portfolioItems = document.querySelectorAll('.portfolio-item');

  catTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      sound.playClickSound();
      catTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.getAttribute('data-filter');

      portfolioItems.forEach((item) => {
        const itemCat = item.getAttribute('data-category');
        if (filter === 'all' || itemCat === filter) {
          item.style.display = 'block';
          if (window.gsap) {
            gsap.fromTo(item, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 });
          }
        } else {
          item.style.display = 'none';
        }
      });

      if (window.ScrollTrigger) {
        ScrollTrigger.refresh();
      }
    });
  });

  /* ==========================================================================
     11. CINEMA MODAL VIDEO PLAYER
     ========================================================================== */
  const videoModal = document.getElementById('videoModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalPlayer = document.getElementById('modalPlayer');
  const modalVideoTitle = document.getElementById('modalVideoTitle');
  const modalGenreTag = document.getElementById('modalGenreTag');
  const modalVideoSpecs = document.getElementById('modalVideoSpecs');
  const watchModalBtns = document.querySelectorAll('.btn-watch-modal-gold, .btn-watch-modal, #btnHeroShowreel, #btnPlayHeroVideo');

  function openCinemaModal(title, genre, specs, src) {
    if (!videoModal) return;
    sound.playShutterSound();
    
    if (modalVideoTitle) modalVideoTitle.textContent = title || '2026 Master Production Showreel';
    if (modalGenreTag) modalGenreTag.textContent = genre || '4K ULTRA CINEMA';
    if (modalVideoSpecs) modalVideoSpecs.textContent = specs || 'Master Cinema Package • Anamorphic Optics';
    
    if (modalPlayer) {
      modalPlayer.src = src || 'https://assets.mixkit.co/videos/preview/mixkit-cameraman-filming-with-a-professional-camera-41709-large.mp4';
      modalPlayer.play();
    }

    videoModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCinemaModal() {
    if (!videoModal) return;
    sound.playClickSound();
    videoModal.classList.remove('open');
    if (modalPlayer) modalPlayer.pause();
    document.body.style.overflow = 'auto';
  }

  watchModalBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const title = btn.getAttribute('data-video-title');
      const src = btn.getAttribute('data-video-src');
      const genre = btn.getAttribute('data-genre');
      const specs = btn.getAttribute('data-specs');
      openCinemaModal(title, genre, specs, src);
    });
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeCinemaModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeCinemaModal);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCinemaModal();
  });

  /* ==========================================================================
     12. 3D CARD TILT EFFECT (FOR CARDS WITH data-tilt)
     ========================================================================== */
  const tiltCards = document.querySelectorAll('[data-tilt], #heroCameraCard');
  tiltCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const rotateX = -(y / rect.height) * 12;
      const rotateY = (x / rect.width) * 12;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    });
  });


  /* ==========================================================================
     14. INQUIRY FORM SUBMISSION
     ========================================================================== */
  const inquiryForm = document.getElementById('projectInquiryForm');
  const formFeedback = document.getElementById('formFeedback');
  const btnSubmitForm = document.getElementById('btnSubmitForm');

  if (inquiryForm) {
    inquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      sound.playShutterSound();

      if (btnSubmitForm) {
        btnSubmitForm.innerHTML = `<span>DISPATCHING PRODUCTION BRIEF...</span>`;
        btnSubmitForm.style.opacity = '0.7';
      }

      setTimeout(() => {
        if (btnSubmitForm) {
          btnSubmitForm.innerHTML = `<span>DISPATCHED!</span> <i data-lucide="check"></i>`;
          btnSubmitForm.style.opacity = '1';
        }
        if (formFeedback) {
          formFeedback.classList.remove('hidden');
        }
        inquiryForm.reset();
        if (window.lucide) window.lucide.createIcons();
      }, 1200);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStudioApp);
} else {
  initStudioApp();
}
