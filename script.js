(function(){
  const heartsBg = document.getElementById('heartsBg');
  if (heartsBg){
    const HEART_COUNT = 42;
    for (let i = 0; i < HEART_COUNT; i++){
      const h = document.createElement('span');
      h.className = 'heart';
      h.textContent = '❤';
      h.style.left = (Math.random() * 100).toFixed(2) + '%';
      h.style.top = (Math.random() * 100).toFixed(2) + '%';
      h.style.fontSize = (12 + Math.random() * 30).toFixed(0) + 'px';
      h.style.opacity = (0.08 + Math.random() * 0.18).toFixed(2);
      h.style.animationDuration = (2.2 + Math.random() * 2.6).toFixed(2) + 's';
      h.style.animationDelay = (Math.random() * 3.4).toFixed(2) + 's';
      heartsBg.appendChild(h);
    }
  }

  const reduceMotionHearts = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHoverHearts = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (heartsBg && !reduceMotionHearts && canHoverHearts){
    const H_STRENGTH_X = 34, H_STRENGTH_Y = 24, H_EASE = 0.05;
    let hTargetX = 0, hTargetY = 0, hCurX = 0, hCurY = 0;
    window.addEventListener('pointermove', (e) => {
      const nx = (e.clientX / window.innerWidth) - 0.5;
      const ny = (e.clientY / window.innerHeight) - 0.5;
      hTargetX = nx * H_STRENGTH_X;
      hTargetY = ny * H_STRENGTH_Y;
    }, { passive: true });
    function heartsWobbleLoop(){
      hCurX += (hTargetX - hCurX) * H_EASE;
      hCurY += (hTargetY - hCurY) * H_EASE;
      heartsBg.style.transform = 'translate3d(' + hCurX.toFixed(2) + 'px, ' + hCurY.toFixed(2) + 'px, 0)';
      requestAnimationFrame(heartsWobbleLoop);
    }
    requestAnimationFrame(heartsWobbleLoop);
  }
})();

(function(){
  const ROSE_FRAME_COUNT  = 150;
  const OPENING_FRAMES    = 50;
  const ROSE_BASE         = 'Assets/Rose_frames/';
  const ROSE_NAME         = (i) => 'frames_' + String(i).padStart(3, '0') + '.png';

  const PAPER_FRAME_COUNT = 130;
  const PAPER_TURN_FRACTION = 0.75;
  const PAPER_BASE        = 'Assets/Paper_frames/';
  const PAPER_NAME        = (i) => 'frame_' + String(i).padStart(3, '0') + '.png';

  const PHOTOBOOTH_FRAME_COUNT = 177;
  const PHOTOBOOTH_TURN_FRACTION = 0.70;
  const PHOTOBOOTH_BASE   = 'Assets/Photobooth_frames/';
  const PHOTOBOOTH_NAME   = (i) => 'frame_' + String(i).padStart(3, '0') + '.png';

  const CONCURRENCY = 8;

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  function createSequence(opts){
    const frameCount = opts.frameCount;
    const images = new Array(frameCount + 1);
    const loaded = new Array(frameCount + 1).fill(false);
    let loadedCount = 0;
    let current = 1;
    let lastDrawn = null;

    const canvas = opts.canvas;
    const ctx = canvas.getContext('2d');
    const wrapEl = opts.wrapEl;

    function resize(){
      const rect = wrapEl.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastDrawn = null;
      draw(current, true);
    }

    function nearestLoaded(target){
      if (loaded[target]) return target;
      for (let d = 1; d < frameCount; d++){
        const lo = target - d, hi = target + d;
        if (lo >= 1 && loaded[lo]) return lo;
        if (hi <= frameCount && loaded[hi]) return hi;
      }
      return null;
    }

    function draw(target, force){
      current = target;
      const i = nearestLoaded(target);
      if (i === null) return;
      if (!force && i === lastDrawn) return;
      lastDrawn = i;

      const img = images[i];
      const rect = wrapEl.getBoundingClientRect();
      const cw = rect.width, ch = rect.height;
      if (!cw || !ch || !img.naturalWidth) return;

      ctx.clearRect(0, 0, cw, ch);
      
      const fitContain = opts.fit === 'contain';
      const scale = fitContain 
        ? Math.min(cw / img.naturalWidth, ch / img.naturalHeight)
        : Math.max(cw / img.naturalWidth, ch / img.naturalHeight);

      const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
      const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    function onFrameLoaded(i){
      loaded[i] = true;
      loadedCount++;
      if (opts.onProgress) opts.onProgress(loadedCount, frameCount);
      if (i === current || loadedCount === 1) draw(current);
      if (loadedCount === frameCount && opts.onDone) opts.onDone();
    }

    function load(){
      let next = 1;
      function loadOne(){
        if (next > frameCount) return;
        const i = next++;
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => { onFrameLoaded(i); loadOne(); };
        img.onerror = () => { onFrameLoaded(i); loadOne(); };
        img.src = opts.base + opts.nameFn(i);
        images[i] = img;
      }
      for (let c = 0; c < CONCURRENCY; c++) loadOne();
    }

    return { resize, draw, load, frameCount };
  }

  const stageRose = document.getElementById('stageRose');
  const roseWrap = document.getElementById('roseWrap');
  const roseParallax = document.getElementById('roseParallax');
  const roseCanvas = document.getElementById('roseCanvas');
  const loader = document.getElementById('loader');
  const loaderFill = document.getElementById('loaderFill');
  const loaderLabel = document.getElementById('loaderLabel');
  const chapters = Array.from(document.querySelectorAll('#stageRose .chapter'));
  const ambient = document.getElementById('ambient');
  const copyColumns = Array.from(document.querySelectorAll('.stage-copy'));
  const scrollCue = document.getElementById('scrollCue');
  const nextBtnWrap = document.getElementById('nextBtnWrap');

  const glowColors = [
    'rgba(163,22,33,0.35)',
    'rgba(60,107,69,0.30)',
    'rgba(160,128,86,0.34)'
  ];

  const roseSeq = createSequence({
    frameCount: ROSE_FRAME_COUNT,
    base: ROSE_BASE,
    nameFn: ROSE_NAME,
    canvas: roseCanvas,
    wrapEl: roseWrap,
    onProgress(loadedCount, total){
      const pct = Math.round((loadedCount / total) * 100);
      loaderFill.style.width = pct + '%';
      loaderLabel.textContent = 'LOADING ROSE — ' + pct + '%';
    },
    onDone(){ loader.classList.add('is-hidden'); }
  });

  let lastAmbientIndex = -1;
  function updateRose(){
    const rect = stageRose.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    let progress = total > 0 ? (-rect.top) / total : 0;
    progress = clamp(progress, 0, 1);

    const frame = 1 + Math.round(progress * (ROSE_FRAME_COUNT - 1));
    roseSeq.draw(frame);

    const textRevealed = frame > OPENING_FRAMES;
    copyColumns.forEach((col) => col.classList.toggle('is-ready', textRevealed));
    if (scrollCue) scrollCue.classList.toggle('is-hidden', textRevealed);

    const atLastFrame = frame >= ROSE_FRAME_COUNT;
    if (nextBtnWrap) nextBtnWrap.classList.toggle('is-visible', atLastFrame);

    if (textRevealed){
      const storyFrame = frame - OPENING_FRAMES;
      const storyTotal = ROSE_FRAME_COUNT - OPENING_FRAMES;
      let activeIndex = 0;
      if (storyFrame > storyTotal * (2 / 3)) activeIndex = 2;
      else if (storyFrame > storyTotal * (1 / 3)) activeIndex = 1;

      chapters.forEach((ch) => ch.classList.toggle('is-active', Number(ch.dataset.chapter) === activeIndex));

      // Rewriting a full-viewport gradient repaints the whole screen, so
      // only do it when the active chapter actually changes rather than
      // on every scroll frame.
      if (activeIndex !== lastAmbientIndex){
        lastAmbientIndex = activeIndex;
        ambient.style.background =
          'radial-gradient(60% 50% at 78% 30%, ' + glowColors[activeIndex] + ' 0%, transparent 60%), radial-gradient(45% 40% at 10% 80%, rgba(163,22,33,0.10) 0%, transparent 70%)';
      }
    } else {
      chapters.forEach((ch) => ch.classList.remove('is-active'));
      if (lastAmbientIndex !== -1){
        lastAmbientIndex = -1;
        ambient.style.background = '';
      }
    }
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (roseParallax && !reduceMotion && canHover){
    const STRENGTH_X = 26, STRENGTH_Y = 18, EASE = 0.06;
    let targetX = 0, targetY = 0, curX = 0, curY = 0;
    window.addEventListener('pointermove', (e) => {
      const nx = (e.clientX / window.innerWidth) - 0.5;
      const ny = (e.clientY / window.innerHeight) - 0.5;
      targetX = nx * STRENGTH_X;
      targetY = ny * STRENGTH_Y;
    }, { passive: true });
    function wobbleLoop(){
      // page1 is display:none while viewing the paper/gallery pages — skip
      // the work (but keep the loop alive) so it isn't competing for main
      // thread time with the canvas drawing happening on those pages. (This
      // callback only ever runs asynchronously, after the `page1` const
      // declared further below has already been assigned.)
      if (!page1.classList.contains('is-hidden')){
        curX += (targetX - curX) * EASE;
        curY += (targetY - curY) * EASE;
        roseParallax.style.transform = 'translate3d(' + curX.toFixed(2) + 'px, ' + curY.toFixed(2) + 'px, 0)';
      }
      requestAnimationFrame(wobbleLoop);
    }
    requestAnimationFrame(wobbleLoop);
  }

  const continueBtn = document.getElementById('continueBtn');

  const stagePaper = document.getElementById('stagePaper');
  const paperWrap = document.getElementById('paperWrap');
  const paperCanvas = document.getElementById('paperCanvas');
  const loader2 = document.getElementById('loader2');
  const loaderFill2 = document.getElementById('loaderFill2');
  const loaderLabel2 = document.getElementById('loaderLabel2');
  const letterOverlay = document.getElementById('letterOverlay');
  const page1 = document.getElementById('page1');
  const page2 = document.getElementById('page2');
  const page3 = document.getElementById('page3');
  const galleryBtnWrap = document.getElementById('galleryBtnWrap');
  const galleryBtn = document.getElementById('galleryBtn');
  const backToLetter = document.getElementById('backToLetter');

  let paperUnlocked = false;
  let paperLoaded = false;

  const paperSeq = createSequence({
    frameCount: PAPER_FRAME_COUNT,
    base: PAPER_BASE,
    nameFn: PAPER_NAME,
    canvas: paperCanvas,
    wrapEl: paperWrap,
    onProgress(loadedCount, total){
      const pct = Math.round((loadedCount / total) * 100);
      loaderFill2.style.width = pct + '%';
      loaderLabel2.textContent = 'LOADING — ' + pct + '%';
    },
    onDone(){ loader2.classList.add('is-hidden'); }
  });

  function updatePaper(){
    if (!paperUnlocked) return;
    const rect = stagePaper.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    let progress = total > 0 ? (-rect.top) / total : 0;
    progress = clamp(progress, 0, 1);

    const turnProgress = clamp(progress / PAPER_TURN_FRACTION, 0, 1);
    const frame = 1 + Math.round(turnProgress * (PAPER_FRAME_COUNT - 1));
    paperSeq.draw(frame);

    const holdReached = progress > PAPER_TURN_FRACTION;
    letterOverlay.classList.toggle('is-ready', holdReached);
    if (galleryBtnWrap) galleryBtnWrap.classList.toggle('is-visible', holdReached);
  }

  const stagePhotobooth = document.getElementById('stagePhotobooth');
  const photoboothWrap = document.getElementById('photoboothWrap');
  const photoboothCanvas = document.getElementById('photoboothCanvas');
  const loader3 = document.getElementById('loader3');
  const loaderFill3 = document.getElementById('loaderFill3');
  const loaderLabel3 = document.getElementById('loaderLabel3');
  const scrollCuePhotobooth = document.getElementById('scrollCuePhotobooth');

  let photoboothUnlocked = false;
  let photoboothLoaded = false;

  const photoboothSeq = createSequence({
    frameCount: PHOTOBOOTH_FRAME_COUNT,
    base: PHOTOBOOTH_BASE,
    nameFn: PHOTOBOOTH_NAME,
    canvas: photoboothCanvas,
    wrapEl: photoboothWrap,
    fit: 'contain',
    onProgress(loadedCount, total){
      const pct = Math.round((loadedCount / total) * 100);
      loaderFill3.style.width = pct + '%';
      loaderLabel3.textContent = 'LOADING — ' + pct + '%';
    },
    onDone(){ loader3.classList.add('is-hidden'); }
  });

  const galleryOverlay = document.getElementById('galleryOverlay');

  function updatePhotobooth(){
    if (!photoboothUnlocked) return;
    const rect = stagePhotobooth.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    let progress = total > 0 ? (-rect.top) / total : 0;
    progress = clamp(progress, 0, 1);

    const turnProgress = clamp(progress / PHOTOBOOTH_TURN_FRACTION, 0, 1);
    const frame = 1 + Math.round(turnProgress * (PHOTOBOOTH_FRAME_COUNT - 1));
    photoboothSeq.draw(frame);

    const holdReached = progress >= PHOTOBOOTH_TURN_FRACTION;
    
    if (photoboothWrap) photoboothWrap.classList.toggle('is-shifted', holdReached);
    if (galleryOverlay) galleryOverlay.classList.toggle('is-ready', holdReached);

    if (scrollCuePhotobooth) scrollCuePhotobooth.classList.toggle('is-hidden', holdReached || progress > 0.02);
  }

  // The photobooth canvas only needs to be resized when its wrapper's own
  // box actually changes size (the is-shifted layout swap), not on every
  // scroll tick — resize() reallocates the canvas backing store, which is
  // expensive, so re-running it ~60x/sec while scrolling was the main
  // source of jank in this section. Re-sync once that CSS transition ends.
  if (photoboothWrap){
    photoboothWrap.addEventListener('transitionend', (e) => {
      if (['width', 'height', 'left', 'top', 'transform'].includes(e.propertyName)){
        photoboothSeq.resize();
      }
    });
  }

  const paperTransition = document.getElementById('paperTransition');
  const backToFlower = document.getElementById('backToFlower');

  function playPaperTransition(onCovered){
    paperTransition.classList.remove('is-leaving');
    paperTransition.classList.add('is-covering');
    setTimeout(() => {
      onCovered();
      paperTransition.classList.remove('is-covering');
      paperTransition.classList.add('is-leaving');
      setTimeout(() => paperTransition.classList.remove('is-leaving'), 760);
    }, 760);
  }

  function showPage2(){
    page1.classList.add('is-hidden');
    page3.classList.add('is-hidden');
    page2.classList.remove('is-hidden');
    window.scrollTo(0, 0);
    paperUnlocked = true;
    paperSeq.resize();
    if (!paperLoaded){ paperLoaded = true; paperSeq.load(); }
    updatePaper();
    if (backToFlower) backToFlower.classList.add('is-visible');
    if (backToLetter) backToLetter.classList.remove('is-visible');
  }

  function showPage1(){
    page2.classList.add('is-hidden');
    page3.classList.add('is-hidden');
    page1.classList.remove('is-hidden');
    window.scrollTo(0, 0);
    roseSeq.resize();
    updateRose();
    if (backToFlower) backToFlower.classList.remove('is-visible');
    if (backToLetter) backToLetter.classList.remove('is-visible');
  }

  function showPage3(){
    page1.classList.add('is-hidden');
    page2.classList.add('is-hidden');
    page3.classList.remove('is-hidden');
    window.scrollTo(0, 0);
    photoboothUnlocked = true;
    photoboothSeq.resize();
    if (!photoboothLoaded){ photoboothLoaded = true; photoboothSeq.load(); }
    updatePhotobooth();
    if (backToFlower) backToFlower.classList.remove('is-visible');
    if (backToLetter) backToLetter.classList.add('is-visible');
  }

  continueBtn.addEventListener('click', () => {
    playPaperTransition(showPage2);
  });

  if (backToFlower){
    backToFlower.addEventListener('click', () => {
      playPaperTransition(showPage1);
    });
  }

  if (galleryBtn){
    galleryBtn.addEventListener('click', () => {
      playPaperTransition(showPage3);
    });
  }

  if (backToLetter){
    backToLetter.addEventListener('click', () => {
      playPaperTransition(showPage2);
    });
  }

  const galleryGrid = document.getElementById('galleryGrid');
  if (galleryGrid) {
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let isDragging = false;

    galleryGrid.addEventListener('mousedown', (e) => {
      isDown = true;
      isDragging = false;
      galleryGrid.classList.add('is-dragging');
      startX = e.pageX - galleryGrid.offsetLeft;
      scrollLeft = galleryGrid.scrollLeft;
    });

    galleryGrid.addEventListener('mouseleave', () => {
      isDown = false;
      galleryGrid.classList.remove('is-dragging');
    });

    galleryGrid.addEventListener('mouseup', () => {
      isDown = false;
      galleryGrid.classList.remove('is-dragging');
    });

    galleryGrid.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - galleryGrid.offsetLeft;
      const walk = (x - startX) * 1.5; 
      if (Math.abs(walk) > 5) {
        isDragging = true;
      }
      galleryGrid.scrollLeft = scrollLeft - walk;
    });

    galleryGrid.addEventListener('click', (e) => {
      if (isDragging) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);
  }

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCap = document.getElementById('lightboxCap');
  const lightboxClose = document.getElementById('lightboxClose');
  const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));

  function openLightbox(item){
    const img = item.querySelector('img');
    if (!img || img.style.display === 'none') return; 
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCap.textContent = item.dataset.caption || '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
  }
  function closeLightbox(){
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
  }
  galleryItems.forEach((item) => item.addEventListener('click', () => openLightbox(item)));
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox){
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  }
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  let ticking = false;
  function onScroll(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      updateRose();
      updatePaper();
      updatePhotobooth();
    });
  }

  function resizeAll(){
    roseSeq.resize();
    if (paperUnlocked) paperSeq.resize();
    if (photoboothUnlocked) photoboothSeq.resize();
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Debounced: mobile browsers (notably iOS Safari) fire 'resize' repeatedly
  // as the address bar collapses/expands while scrolling, not just on an
  // actual size change. Reacting to every one of those would reallocate the
  // canvases mid-scroll, so coalesce bursts into a single call once things
  // settle. orientationchange is also handled here for reliable rotation
  // support, with a short delay so the browser has finished laying out.
  let resizeTimer = null;
  function handleViewportChange(delay){
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeTimer = null;
      resizeAll();
      onScroll();
    }, delay);
  }
  window.addEventListener('resize', () => handleViewportChange(120), { passive: true });
  window.addEventListener('orientationchange', () => handleViewportChange(250));

  resizeAll();
  roseSeq.load();
  updateRose();
})();
