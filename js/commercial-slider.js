document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const navItems = document.querySelectorAll('.project-nav-item');
  const slides = document.querySelectorAll('.project-slide');
  const prevBtn = document.querySelector('.prev-slide');
  const nextBtn = document.querySelector('.next-slide');
  const currentSlideEl = document.querySelector('.current-slide');
  const totalSlidesEl = document.querySelector('.total-slides');
  
  // Set total slides count
  if (totalSlidesEl) {
    totalSlidesEl.textContent = slides.length;
  }
  
  // Current slide index
  let currentSlide = 0;
  
  // Touch gesture variables
  let touchStartX = 0;
  let touchEndX = 0;
  
  // Initialize the slider
  function initSlider() {
    // Show first slide and set active nav item
    showSlide(currentSlide);
    updateNavIndicator(currentSlide);
    updatePagination(currentSlide);
    
    // Add event listeners for nav items
    navItems.forEach((item, index) => {
      item.addEventListener('click', () => {
        currentSlide = index;
        showSlide(currentSlide);
        updateNavIndicator(currentSlide);
        updatePagination(currentSlide);
      });
    });
    
    // Add event listeners for navigation buttons
    if (prevBtn) prevBtn.addEventListener('click', () => navigate(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigate(1));
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        navigate(-1);
      } else if (e.key === 'ArrowRight') {
        navigate(1);
      }
    });
    
    // Touch gesture support for iPhone
    const slidesContainer = document.querySelector('.slides-container');
    if (slidesContainer) {
      slidesContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
      slidesContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
    
    // Auto-advance slides (optional)
    // setInterval(() => navigate(1), 7000);
  }
  
  // Touch gesture handlers
  function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
  }
  
  function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }
  
  function handleSwipe() {
    const swipeThreshold = 50; // Minimum swipe distance
    const swipeDistance = touchEndX - touchStartX;
    
    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance > 0) {
        // Swipe right - go to previous slide
        navigate(-1);
      } else {
        // Swipe left - go to next slide
        navigate(1);
      }
    }
  }
  
  // Navigate between slides
  function navigate(direction) {
    currentSlide += direction;
    
    // Loop back to first slide if at the end
    if (currentSlide >= slides.length) {
      currentSlide = 0;
    } else if (currentSlide < 0) {
      currentSlide = slides.length - 1;
    }
    
    showSlide(currentSlide);
    updateNavIndicator(currentSlide);
    updatePagination(currentSlide);
  }
  
  // Show specific slide
  function showSlide(index) {
    // Hide all slides
    slides.forEach(slide => {
      slide.classList.remove('active');
      setTimeout(() => {
        slide.style.display = 'none';
      }, 300);
    });
    
    // Show current slide
    slides[index].style.display = 'grid';
    // Force reflow
    void slides[index].offsetWidth;
    slides[index].classList.add('active');
    
    // Update current slide index
    currentSlide = index;
  }
  
  // Update navigation indicator
  function updateNavIndicator(index) {
    navItems.forEach((item, i) => {
      if (i === index) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }
  
  // Update pagination
  function updatePagination(index) {
    if (currentSlideEl) {
      currentSlideEl.textContent = index + 1;
    }
  }
  
  // Initialize the slider
  initSlider();
});
