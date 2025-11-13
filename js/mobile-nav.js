document.addEventListener('DOMContentLoaded', function() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  const body = document.body;
  const nav = document.querySelector('nav');
  
  // Responsive navigation links
  function updateNavigationLinks() {
    const isMobile = window.innerWidth <= 768;
    const homeLinks = document.querySelectorAll('.home-link');
    const logoLinks = document.querySelectorAll('.logo-link');
    const contactLinks = document.querySelectorAll('a[href="contact.html"]');
    const commercialLinks = document.querySelectorAll('#commercial-link');
    
    if (isMobile) {
      // Mobile: point to mobile versions
      homeLinks.forEach(link => link.href = 'home.html');
      logoLinks.forEach(link => link.href = 'home.html');
      contactLinks.forEach(link => link.href = 'contact-mobile.html');
      commercialLinks.forEach(link => link.href = 'commercial-mobile.html');
    } else {
      // Desktop: point to desktop versions
      homeLinks.forEach(link => link.href = 'index.html');
      logoLinks.forEach(link => link.href = 'index.html');
      contactLinks.forEach(link => link.href = 'contact.html');
      commercialLinks.forEach(link => link.href = 'commercial.html');
    }
  }
  
  // Update links on load and resize
  updateNavigationLinks();
  window.addEventListener('resize', updateNavigationLinks);
  
  // Scroll behavior variables
  let lastScrollTop = 0;
  let scrollThreshold = 50; // Minimum scroll distance to trigger hide/show
  let scrollPosition = 0; // Store scroll position when menu opens
  
  // Toggle menu function
  function toggleMenu() {
    const isMenuOpen = navLinks.classList.contains('active');
    
    if (!isMenuOpen) {
      // Opening menu - store current scroll position
      scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      body.style.top = `-${scrollPosition}px`;
      body.classList.add('menu-open');
    } else {
      // Closing menu - restore scroll position naturally
      body.classList.remove('menu-open');
      body.style.top = '';
      // Removed scrollTo to prevent conflicts with click prevention
    }
    
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
  }
  
  // Hamburger click event
  hamburger.addEventListener('click', toggleMenu);
  
  // Close menu when clicking on a link
  navLinks.addEventListener('click', function(e) {
    if (e.target.tagName === 'A') {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
      body.classList.remove('menu-open');
      body.style.top = '';
      // Removed scrollTo to prevent conflicts with click prevention
    }
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', function(e) {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
      body.classList.remove('menu-open');
      body.style.top = '';
      // Removed scrollTo to prevent conflicts with click prevention
    }
  });
  
  // Close menu on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
      body.classList.remove('menu-open');
      body.style.top = '';
      // Removed scrollTo to prevent conflicts with click prevention
    }
  });
  
  // Handle window resize
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
      body.classList.remove('menu-open');
      body.style.top = '';
    }
  });
  
  // Scroll behavior for mobile navigation
  window.addEventListener('scroll', function() {
    if (window.innerWidth <= 768 && !navLinks.classList.contains('active')) { // Only on mobile and when menu is closed
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollDelta = scrollTop - lastScrollTop;
      
      // Show navigation when scrolling up or at the top
      if (scrollTop <= 0 || scrollDelta < -scrollThreshold) {
        nav.classList.remove('nav-hidden');
      }
      // Hide navigation when scrolling down
      else if (scrollDelta > scrollThreshold) {
        nav.classList.add('nav-hidden');
      }
      
      lastScrollTop = scrollTop;
    }
  });
});
