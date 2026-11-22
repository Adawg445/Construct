(function() {
  // Avoid duplicate injection
  if (window.__armLoaderInjected) return;
  window.__armLoaderInjected = true;

  function createLoaderMarkup(pageConfig) {
    const wrapper = document.createElement('div');
    wrapper.className = 'page-loader';
    
    // Page-specific loading messages
    var loadingMessages = {
      'gallery': { main: 'Loading Gallery', sub: 'Preparing images...' },
      'commercial': { main: 'Loading', sub: 'Please wait...' },
      'contact': { main: 'Loading', sub: 'Almost ready...' },
      'home': { main: 'Welcome', sub: 'Loading content...' },
      'default': { main: 'Loading', sub: 'Please wait...' }
    };
    
    var messages = loadingMessages[pageConfig.description] || loadingMessages.default;
    
    wrapper.innerHTML = `
      <div class="loading-container">
        <div class="cube-container">
          <div id="arm-cube1-holder"></div>
          <div id="arm-cube2-holder"></div>
        </div>
        <div class="loading-text">` + messages.main + `</div>
        <div class="loading-bar-container">
          <div class="loading-bar" id="arm-loadingBar"></div>
        </div>
        <div class="percentage" id="arm-percentage">0%</div>
        <div class="loading-dots">` + messages.sub + `</div>
      </div>
    `;
    return wrapper;
  }

  function loadAndInjectSvg(url, holderId, svgId, classNames) {
    return fetch(url, { cache: 'force-cache' })
      .then(function(res){ return res.text(); })
      .then(function(svgText){
        const holder = document.getElementById(holderId);
        if (!holder) return;
        // Parse SVG string to element
        const temp = document.createElement('div');
        temp.innerHTML = svgText.trim();
        const svgEl = temp.querySelector('svg');
        if (!svgEl) return;
        svgEl.id = svgId;
        svgEl.setAttribute('class', classNames);
        holder.innerHTML = '';
        holder.appendChild(svgEl);
      })
      .catch(function(){ /* ignore, loader will still work */ });
  }

  function startLoaderAnimation(root, config) {
    var currentCube = 1;
    var cubeInterval;
    var tickInterval;
    var safetyTimer;
    var observer;
    var startTime = Date.now();
    var minTime = (config && config.minTime) || 300;
    var maxTime = (config && config.maxTime) || 12000;
    var QUIET_TIME = 300; // everything must stay loaded this long before closing

    var tracked = [];            // one entry per thing we wait for: { done: bool }
    var seen = new WeakSet();    // images already being tracked
    var windowLoaded = document.readyState === 'complete';
    var shownPct = 0;
    var quietSince = 0;
    var finished = false;

    function switchCubes() {
      var cube1 = root.querySelector('#arm-cube1');
      var cube2 = root.querySelector('#arm-cube2');
      if (!cube1 || !cube2) return;
      if (currentCube === 1) {
        cube1.classList.remove('fade-in');
        cube1.classList.add('fade-out');
        cube2.classList.remove('fade-out');
        cube2.classList.add('fade-in');
        currentCube = 2;
      } else {
        cube2.classList.remove('fade-in');
        cube2.classList.add('fade-out');
        cube1.classList.remove('fade-out');
        cube1.classList.add('fade-in');
        currentCube = 1;
      }
    }

    function render(pct) {
      var loadingBar = root.querySelector('#arm-loadingBar');
      var percentage = root.querySelector('#arm-percentage');
      if (loadingBar) loadingBar.style.width = pct + '%';
      if (percentage) percentage.textContent = Math.round(pct) + '%';
    }

    function finish() {
      if (finished) return;
      finished = true;
      clearInterval(tickInterval);
      clearTimeout(safetyTimer);
      if (observer) observer.disconnect();
      render(100);
      // brief pause so the bar visibly reaches 100%, then fade out
      setTimeout(function() {
        clearInterval(cubeInterval);
        root.classList.add('hidden');
        setTimeout(function() {
          if (root && root.parentNode) root.parentNode.removeChild(root);
          // re-enable page scroll (other scripts wait for this class to go away)
          document.documentElement.classList.remove('arm-has-loader');
        }, 600);
      }, 250);
    }

    function addEntry() {
      var entry = { done: false };
      tracked.push(entry);
      return entry;
    }

    // Lazy images that are hidden or off screen are never downloaded by the
    // browser, so waiting for them would stall the loader.
    function willBrowserLoad(img) {
      if (img.loading !== 'lazy') return true;
      var r = img.getBoundingClientRect();
      if (!r.width && !r.height) return false;
      return r.bottom > 0 && r.top < window.innerHeight &&
             r.right > 0 && r.left < window.innerWidth;
    }

    function trackImage(img) {
      if (seen.has(img) || root.contains(img)) return;
      seen.add(img);
      if (img.complete || !willBrowserLoad(img)) return;

      var entry = addEntry();
      var markDone = function() { entry.done = true; };
      img.addEventListener('load', markDone, { once: true });
      img.addEventListener('error', markDone, { once: true }); // broken images shouldn't block
      setTimeout(markDone, 10000);                             // per-image safety net
      if (img.complete) markDone();                            // finished while attaching
    }

    function trackImagesIn(node) {
      if (node.nodeType !== 1) return;
      if (node.tagName === 'IMG') trackImage(node);
      else if (node.querySelectorAll) Array.prototype.forEach.call(node.querySelectorAll('img'), trackImage);
    }

    function realProgress() {
      var total = tracked.length + 1;        // +1 for the window "load" event
      var done = windowLoaded ? 1 : 0;
      for (var i = 0; i < tracked.length; i++) if (tracked[i].done) done++;
      return { pct: (done / total) * 100, allDone: done === total };
    }

    function tick() {
      var p = realProgress();
      // Ease the bar toward the real progress; never move backwards and
      // never show 100% until the page is actually ready.
      var target = Math.min(p.pct, 99);
      if (target > shownPct) shownPct = Math.min(target, shownPct + Math.max((target - shownPct) * 0.3, 0.5));
      render(shownPct);

      if (p.allDone) {
        if (!quietSince) quietSince = Date.now();
        // Wait a short quiet period to catch images added right after load
        // (gallery pages build their slides with script).
        if (Date.now() - quietSince >= QUIET_TIME && Date.now() - startTime >= minTime) {
          finish();
        }
      } else {
        quietSince = 0;
      }
    }

    cubeInterval = setInterval(switchCubes, 1500);

    // Images already on the page
    Array.prototype.forEach.call(document.images || [], trackImage);

    // Images added by scripts while the loader is showing (gallery slides, thumbnails)
    if (window.MutationObserver) {
      observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
          Array.prototype.forEach.call(m.addedNodes, trackImagesIn);
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    // Web fonts
    if (document.fonts && document.fonts.ready) {
      var fontEntry = addEntry();
      document.fonts.ready.then(
        function() { fontEntry.done = true; },
        function() { fontEntry.done = true; }
      );
    }

    // Stylesheets, scripts and everything else the browser was already loading
    if (!windowLoaded) {
      window.addEventListener('load', function() { windowLoaded = true; }, { once: true });
    }

    tickInterval = setInterval(tick, 100);
    tick();

    // Safety net for very slow or failed connections
    safetyTimer = setTimeout(function() {
      console.log('Loader timeout reached after ' + maxTime + 'ms for ' + (config && config.description || 'unknown') + ' page');
      finish();
    }, maxTime);
  }

  function injectStylesheet() {
    // If loader.css already present, skip
    var exists = Array.from(document.styleSheets || []).some(function(ss){
      try { return ss.href && ss.href.indexOf('loader.css') !== -1; } catch(e) { return false; }
    });
    if (exists) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'loader.css';
    document.head.appendChild(link);
  }

  // Page-specific loader configurations
  function getPageConfig() {
    var path = window.location.pathname;
    var filename = path.split('/').pop() || 'index.html';
    
    // Gallery pages - lots of images to scan
    if (filename.includes('gallery-')) {
      return {
        minTime: 500,
        maxTime: 20000,
        skipIfCached: false, // Always show loader for galleries
        description: 'gallery'
      };
    }
    
    // Commercial pages - medium content
    if (filename.includes('commercial')) {
      return {
        minTime: 300,
        maxTime: 8000,
        skipIfCached: true,
        description: 'commercial'
      };
    }
    
    // Contact pages - minimal content
    if (filename.includes('contact')) {
      return {
        minTime: 200,
        maxTime: 5000,
        skipIfCached: true,
        description: 'contact'
      };
    }
    
    // Home/Index - medium content
    if (filename === '' || filename === 'index.html' || filename === 'home.html') {
      return {
        minTime: 400,
        maxTime: 10000,
        skipIfCached: true,
        description: 'home'
      };
    }
    
    // Default for other pages
    return {
      minTime: 300,
      maxTime: 8000,
      skipIfCached: true,
      description: 'default'
    };
  }

  function init() {
    // Check if mobile device
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                   ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    // Skip loader on mobile devices
    if (isMobile) {
      return;
    }
    
    // Get page-specific configuration
    var pageConfig = getPageConfig();
    console.log('Loader config for ' + pageConfig.description + ' page:', pageConfig);
    
    // If page allows skipping when cached, check if everything is cached
    if (pageConfig.skipIfCached) {
      var allImagesCached = true;
      Array.prototype.forEach.call(document.images || [], function(img) {
        if (!img.complete || img.naturalWidth === 0) {
          allImagesCached = false;
        }
      });
      
      // If all images are cached and fonts are ready, skip loader
      if (allImagesCached && document.readyState === 'complete') {
        console.log('All content cached - skipping loader for fast experience');
        return;
      }
    }
    
    injectStylesheet();
    var loader = createLoaderMarkup(pageConfig);
    document.documentElement.classList.add('arm-has-loader');
    document.body.appendChild(loader);

    // Inject the exact SVGs used in the Loading project
    Promise.all([
      loadAndInjectSvg('/Cube.svg', 'arm-cube1-holder', 'arm-cube1', 'cube-svg fade-in'),
      loadAndInjectSvg('/cube2.svg', 'arm-cube2-holder', 'arm-cube2', 'cube-svg fade-out')
    ]).finally(function(){
      // Start on DOMContentLoaded to match Loading app feel (earlier start)
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){ startLoaderAnimation(loader, pageConfig); });
      } else {
        startLoaderAnimation(loader, pageConfig);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


