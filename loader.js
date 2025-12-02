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
      var resolvedCount = 0;
      var totalCount = 0;
      var forcedDone = false;
      var startTime = Date.now();
      var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      
      // Use page-specific config or defaults
      var minTime = (config && config.minTime) || 300;
      var maxTime = (config && config.maxTime) || 12000;

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

    function setProgress(pct) {
      var clamped = Math.max(0, Math.min(100, pct));
      var loadingBar = root.querySelector('#arm-loadingBar');
      var percentage = root.querySelector('#arm-percentage');
      if (loadingBar) loadingBar.style.width = clamped + '%';
      if (percentage) percentage.textContent = Math.round(clamped) + '%';
      if (clamped >= 100) {
        clearInterval(cubeInterval);
        // allow a brief pause to let content settle
        setTimeout(function() {
          root.classList.add('hidden');
          // remove after transition
          setTimeout(function(){
            if (root && root.parentNode) root.parentNode.removeChild(root);
            // re-enable page scroll
            document.documentElement.classList.remove('arm-has-loader');
          }, 600);
        }, 250);
      }
    }

    function onOneResolved() {
      resolvedCount++;
      if (totalCount > 0) {
        // Calculate progress based on actual asset loading
        var basePct = (resolvedCount / totalCount) * 100;
        var timeElapsed = Date.now() - startTime;
        
        // Only apply minimum time if loading is very fast (likely cached)
        // This prevents the loader from flashing, but allows natural completion
        var pct = basePct;
        if (timeElapsed < minTime && basePct >= 100) {
          // If everything loaded super fast (cached), wait just a tiny bit
          pct = Math.min(pct, 95);
        }
        
        // Allow progress to reach 100% naturally when all assets are loaded
        // Don't cap at 98% - let it complete when ready
        setProgress(pct);
      }
    }

    function collectAssetPromises() {
      var promises = [];

      // Collect all images on the page (including those in hidden containers)
      // Wait for all images to load, whether they're cached or not
      Array.prototype.forEach.call(document.images || [], function(img) {
        // If image is already fully loaded (cached), resolve immediately
        if (img.complete && img.naturalWidth !== 0) {
          promises.push(Promise.resolve()); // Already loaded, count as resolved
          return;
        }
        // Track this image's loading
        promises.push(new Promise(function(resolve) {
          // Handle both successful load and errors (count errors as "loaded" to not block)
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
          
          // Safety: if image doesn't load within reasonable time, resolve anyway
          setTimeout(resolve, 10000);
        }));
      });

      // Fonts
      if (document.fonts && document.fonts.ready) {
        promises.push(document.fonts.ready.catch(function(){ /* ignore */ }));
      }

      // CSS files and stylesheets
      Array.prototype.forEach.call(document.styleSheets || [], function(ss) {
        if (ss.href) {
          promises.push(new Promise(function(resolve) {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = ss.href;
            link.addEventListener('load', resolve, { once: true });
            link.addEventListener('error', resolve, { once: true });
            // Don't actually add to DOM, just test loading
          }));
        }
      });

      // Mobile-specific: Wait for touch events to be ready
      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        promises.push(new Promise(function(resolve) {
          // Wait for mobile-specific resources
          setTimeout(resolve, 100);
        }));
      }

      // Window load (ensures CSS/other sub-resources)
      promises.push(new Promise(function(resolve){
        if (document.readyState === 'complete') resolve();
        else window.addEventListener('load', resolve, { once: true });
      }));

      return promises;
    }

    // Start cube switching animation
    cubeInterval = setInterval(switchCubes, 1500);

    var assetPromises = collectAssetPromises();
    totalCount = assetPromises.length;

    if (totalCount === 0) {
      // Nothing to wait for, finish quickly
      setProgress(100);
      return;
    }

    assetPromises.forEach(function(p){
      p.then(onOneResolved);
    });

    // Finalize when all have resolved - complete immediately when ready
    Promise.allSettled(assetPromises).then(function(){
      // Small delay to ensure smooth transition (200ms)
      setTimeout(function(){
        forcedDone = true;
        setProgress(100);
      }, 200);
    });

    // Safety timeout: force completion after appropriate time (in case of network issues)
    // Use page-specific maxTime
    setTimeout(function(){
      if (!forcedDone) {
        forcedDone = true;
        console.log('Loader timeout reached after ' + maxTime + 'ms for ' + (config && config.description || 'unknown') + ' page');
        setProgress(100);
      }
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


