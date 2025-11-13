// Common JavaScript for all pages
document.addEventListener("DOMContentLoaded", () => {
  // Smooth scrolling with Lenis
  const lenis = new Lenis();
  
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  
  requestAnimationFrame(raf);
  
  // Prevent multiple rapid clicks from scrolling to top
  let clickCount = 0;
  let clickTimer;
  let lastClickTime = 0;
  
  // Track all clicks and prevent rapid multiple clicks
  document.addEventListener('click', function(e) {
    const currentTime = Date.now();
    const timeSinceLastClick = currentTime - lastClickTime;
    
    // If clicks are too close together, increment counter
    if (timeSinceLastClick < 500) {
      clickCount++;
      
      // If we have multiple rapid clicks and we're scrolled down, prevent default
      if (clickCount >= 2 && window.pageYOffset > 100) {
        e.preventDefault();
        e.stopPropagation();
        
        // Force scroll position to stay where it is
        const currentScroll = window.pageYOffset;
        setTimeout(() => {
          window.scrollTo(0, currentScroll);
        }, 10);
        
        return false;
      }
    } else {
      // Reset counter if enough time has passed
      clickCount = 1;
    }
    
    lastClickTime = currentTime;
    
    // Clear existing timer
    if (clickTimer) {
      clearTimeout(clickTimer);
    }
    
    // Reset counter after a delay
    clickTimer = setTimeout(() => {
      clickCount = 0;
    }, 800);
  });
  
  // Also prevent double-click and triple-click events specifically
  document.addEventListener('dblclick', function(e) {
    if (window.pageYOffset > 100) {
      e.preventDefault();
      e.stopPropagation();
      
      const currentScroll = window.pageYOffset;
      setTimeout(() => {
        window.scrollTo(0, currentScroll);
      }, 10);
      
      return false;
    }
  });
  
  // Additional protection for touch devices
  if ('ontouchstart' in window) {
    let touchStartY = 0;
    let touchStartTime = 0;
    let touchCount = 0;
    let touchTimer;
    
    document.addEventListener('touchstart', function(e) {
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    });
    
    document.addEventListener('touchend', function(e) {
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - touchStartTime;
      
      // If it's a quick tap and we're scrolled down, increment counter
      if (touchDuration < 300 && Math.abs(touchStartY - touchEndY) < 10 && window.pageYOffset > 100) {
        touchCount++;
        
        // If we have multiple rapid taps, prevent scroll-to-top
        if (touchCount >= 2) {
          e.preventDefault();
          e.stopPropagation();
          
          const currentScroll = window.pageYOffset;
          setTimeout(() => {
            window.scrollTo(0, currentScroll);
          }, 10);
        }
      }
      
      // Clear existing timer
      if (touchTimer) {
        clearTimeout(touchTimer);
      }
      
      // Reset counter after a delay
      touchTimer = setTimeout(() => {
        touchCount = 0;
      }, 800);
    });
  }

  // Navigation scroll effect
  const nav = document.querySelector('nav');
  let lastScroll = 0;
  const navHeight = nav.offsetHeight;
  
  // Set initial styles
  nav.style.transition = 'transform 0.3s ease-in-out';
  nav.style.transform = 'translateY(0)';
  
  window.addEventListener('scroll', function() {
    const currentScroll = window.pageYOffset;
    const isScrollingUp = currentScroll < lastScroll;
    
    // Always show nav when at the top of the page
    if (currentScroll <= 0) {
      nav.style.transform = 'translateY(0)';
      nav.style.background = 'transparent';
      nav.style.backdropFilter = 'none';
      nav.style.webkitBackdropFilter = 'none';
      nav.style.boxShadow = 'none';
    } 
    // Scrolling up - show nav with background
    else if (isScrollingUp) {
      nav.style.transform = 'translateY(0)';
      nav.style.background = 'rgba(64, 64, 64, 0.8)';
      nav.style.backdropFilter = 'blur(10px)';
      nav.style.webkitBackdropFilter = 'blur(10px)';
      nav.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
    // Scrolling down - hide nav
    else {
      nav.style.transform = `translateY(-${navHeight}px)`;
    }
    
    lastScroll = currentScroll;
  });
});
