(function() {
  // Avoid duplicate injection
  if (window.__armLoaderInjected) return;
  window.__armLoaderInjected = true;

  function createLoaderMarkup() {
    const wrapper = document.createElement('div');
    wrapper.className = 'page-loader';
    wrapper.innerHTML = `
      <div class="loading-container">
        <div class="cube-container">
          <div id="arm-cube1-holder"></div>
          <div id="arm-cube2-holder"></div>
        </div>
        <div class="loading-text">Loading</div>
        <div class="loading-bar-container">
          <div class="loading-bar" id="arm-loadingBar"></div>
        </div>
        <div class="percentage" id="arm-percentage">0%</div>
        <div class="loading-dots">Please wait</div>
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

    function startLoaderAnimation(root) {
      var currentCube = 1;
      var cubeInterval;
      var resolvedCount = 0;
      var totalCount = 0;
      var forcedDone = false;
      var startTime = Date.now();
      var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

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
        // Calculate progress with mobile-specific adjustments
        var basePct = (resolvedCount / totalCount) * 100;
        var timeElapsed = Date.now() - startTime;
        var minTime = isMobile ? 2000 : 1500; // Mobile needs more time for smooth UX
        
        // Ensure minimum loading time for better UX
        if (timeElapsed < minTime && basePct > 90) {
          basePct = Math.min(basePct, 85);
        }
        
        // Smoothly map to 100%
        var pct = basePct;
        // Avoid jumping to 100% too early if not forced
        if (!forcedDone) pct = Math.min(pct, 98);
        setProgress(pct);
      }
    }

    function collectAssetPromises() {
      var promises = [];

      // Images not yet complete
      Array.prototype.forEach.call(document.images || [], function(img) {
        if (img.complete && img.naturalWidth !== 0) return;
        promises.push(new Promise(function(resolve) {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
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

    // Finalize when all have resolved
    Promise.allSettled(assetPromises).then(function(){
      forcedDone = true;
      setProgress(100);
    });

    // Safety timeout: force completion after appropriate time
    var timeoutDuration = isMobile ? 15000 : 12000; // Mobile gets more time
    setTimeout(function(){
      forcedDone = true;
      setProgress(100);
    }, timeoutDuration);
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

  function init() {
    // Check if mobile device
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                   ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    // Skip loader on mobile devices
    if (isMobile) {
      return;
    }
    
    injectStylesheet();
    var loader = createLoaderMarkup();
    document.documentElement.classList.add('arm-has-loader');
    document.body.appendChild(loader);

    // Inject the exact SVGs used in the Loading project
    Promise.all([
      loadAndInjectSvg('/Cube.svg', 'arm-cube1-holder', 'arm-cube1', 'cube-svg fade-in'),
      loadAndInjectSvg('/cube2.svg', 'arm-cube2-holder', 'arm-cube2', 'cube-svg fade-out')
    ]).finally(function(){
      // Start on DOMContentLoaded to match Loading app feel (earlier start)
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){ startLoaderAnimation(loader); });
      } else {
        startLoaderAnimation(loader);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


