import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

document.addEventListener("DOMContentLoaded", () => {
  // Mobile-specific script for home.html (3-column layout)
  const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    console.log('Mobile home page detected, loading desktop-identical animations');
  }
  
  // Debug: Check if body has any classes that might prevent scrolling
  console.log('Body classes:', document.body.className);
  console.log('Body style overflow:', document.body.style.overflow);
  console.log('HTML style overflow:', document.documentElement.style.overflow);
  
  // Check if menu is open and fix it
  const navLinks = document.getElementById('nav-links');
  const hamburger = document.getElementById('hamburger');
  
  if (navLinks && navLinks.classList.contains('active')) {
    console.log('Menu is open, closing it to restore scroll');
    navLinks.classList.remove('active');
    hamburger.classList.remove('active');
    document.body.classList.remove('menu-open');
    document.body.style.top = '';
  }
  
  // Ensure body can scroll
  document.body.style.overflow = 'auto';
  document.documentElement.style.overflow = 'auto';
  
  // Test scroll detection
  window.addEventListener('scroll', () => {
    console.log('Scroll detected! Y position:', window.pageYOffset);
  });
  
  gsap.registerPlugin(ScrollTrigger, SplitText);

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
  });
  
  lenis.on("scroll", ScrollTrigger.update);
  
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  
  requestAnimationFrame(raf);

  const spotlightImages = document.querySelector(".spotlight-images");
  const maskContainer = document.querySelector(".mask-container");
  const maskImage = document.querySelector(".mask-img");
  const maskHeader = document.querySelector(".mask-container .header h1");

  const spotlightContainerHeight = spotlightImages.offsetHeight;
  const viewportHeight = window.innerHeight;
  const initialOffset = spotlightContainerHeight * 0.05;
  const totalMovement = spotlightContainerHeight + initialOffset + viewportHeight;

  let headerSplit = null;
  if (maskHeader) {
    headerSplit = SplitText.create(maskHeader, {
      type: "words",
      wordsClass: "spotlight-word",
    });
    gsap.set(headerSplit.words, { opacity: 0 });
  }

  // Mobile ScrollTrigger - Mask container fixed to viewport
  ScrollTrigger.create({
    trigger: ".spotlight",
    start: "top top",
    end: "bottom bottom", // Cover entire spotlight section
    pin: false, // Don't pin the section
    pinSpacing: false,
    scrub: 1, // Smooth scrub for responsive animation
    id: "home-mask-animation",
    onEnter: () => {
      console.log('ScrollTrigger entered spotlight section');
    },
    onLeave: () => {
      console.log('ScrollTrigger left spotlight section');
    },
    onComplete: () => {
      // Animation complete
      console.log('Mask animation complete');
    },
    onUpdate: (self) => {
      const progress = self.progress;
      
      // Debug logging to see if scroll is being detected
      console.log('Scroll progress:', progress, 'Current Y:', spotlightImages.style.transform);

      // Image movement animation - works with pinned mask
      if (progress <= 0.8) {
        const imagesMoveProgress = progress / 0.8;
        const startY = 0;
        const endY = -200; // More movement to work with pinned mask
        const currentY = startY + (endY - startY) * imagesMoveProgress;
        
        gsap.set(spotlightImages, {
          y: `${currentY}%`,
        });
      }

      // Mask effect animation - mask stays pinned while content scrolls
      if (maskContainer && maskImage) {
        if (progress >= 0.4 && progress <= 0.9) {
          const maskProgress = (progress - 0.4) / 0.5;
          const maskSize = `${maskProgress * 500}%`; // Increased to 500% to cover everything
          const imageScale = 1.5 - maskProgress * 0.5; // Scale from 1.5 to 1

          maskContainer.style.setProperty("-webkit-mask-size", maskSize);
          maskContainer.style.setProperty("mask-size", maskSize);

          gsap.set(maskImage, {
            scale: imageScale,
          });
        } else if (progress < 0.4) {
          // Initial state
          maskContainer.style.setProperty("-webkit-mask-size", "0%");
          maskContainer.style.setProperty("mask-size", "0%");
          gsap.set(maskImage, {
            scale: 1.5,
          });
        } else if (progress > 0.9) {
          // Final state
          maskContainer.style.setProperty("-webkit-mask-size", "500%");
          maskContainer.style.setProperty("mask-size", "500%");
          gsap.set(maskImage, {
            scale: 1,
          });
        }
      }

      // Text animation - works with pinned mask
      if (headerSplit && headerSplit.words.length > 0) {
        if (progress >= 0.6 && progress <= 0.9) {
          const textProgress = (progress - 0.6) / 0.3;
          const totalWords = headerSplit.words.length;

          headerSplit.words.forEach((word, index) => {
            const wordRevealProgress = index / totalWords;

            if (textProgress >= wordRevealProgress) {
              gsap.set(word, { opacity: 1 });
            } else {
              gsap.set(word, { opacity: 0 });
            }
          });
        } else if (progress < 0.6) {
          gsap.set(headerSplit.words, { opacity: 0 });
        } else if (progress > 0.9) {
          gsap.set(headerSplit.words, { opacity: 1 });
        }
      }
    },
  });



  // Navigation element reference
  const nav = document.querySelector('nav');

  // Mobile-specific optimizations
  if (isMobile) {
    // Ensure smooth scrolling on mobile
    document.body.style.webkitOverflowScrolling = 'touch';
    
    // Fix mask container to viewport
    if (maskContainer) {
      maskContainer.style.position = 'fixed';
      maskContainer.style.top = '0';
      maskContainer.style.left = '0';
      maskContainer.style.width = '100vw';
      maskContainer.style.height = '100vh';
      maskContainer.style.transform = 'none';
      maskContainer.style.zIndex = '100'; // Lower z-index so nav stays on top
      maskContainer.style.pointerEvents = 'none'; // Ensure it doesn't block scroll events
    }
    
    // Ensure navigation always stays on top and visible
    if (nav) {
      nav.style.position = 'fixed';
      nav.style.top = '0';
      nav.style.left = '0';
      nav.style.right = '0';
      nav.style.zIndex = '2000'; // Higher than mask container
      // Remove forced background - let scroll behavior handle it
      nav.style.background = 'transparent';
      nav.style.backdropFilter = 'none';
      nav.style.webkitBackdropFilter = 'none';
      nav.style.boxShadow = 'none';
    }
    
    // Optimize for mobile performance
    gsap.config({
      nullTargetWarn: false,
      force3D: true
    });
    
    // Add mobile scroll behavior for navigation background
    let lastScroll = 0;
    window.addEventListener('scroll', function() {
      const currentScroll = window.pageYOffset;
      const isScrollingUp = currentScroll < lastScroll;
      
      // Always show nav when at the top of the page
      if (currentScroll <= 0) {
        nav.style.background = 'transparent';
        nav.style.backdropFilter = 'none';
        nav.style.webkitBackdropFilter = 'none';
        nav.style.boxShadow = 'none';
      } 
      // Scrolling up - show nav with background
      else if (isScrollingUp) {
        nav.style.background = 'rgba(64, 64, 64, 0.8)';
        nav.style.backdropFilter = 'blur(10px)';
        nav.style.webkitBackdropFilter = 'blur(10px)';
        nav.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
      }
      // Scrolling down - keep background (don't hide nav on mobile)
      else {
        nav.style.background = 'rgba(64, 64, 64, 0.8)';
        nav.style.backdropFilter = 'blur(10px)';
        nav.style.webkitBackdropFilter = 'blur(10px)';
        nav.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
      }
      
      lastScroll = currentScroll;
    });
    
    // Move mask container up slowly as you scroll
    if (maskContainer) {
      ScrollTrigger.create({
        trigger: ".commercial-footer",
        start: "top bottom", // When footer comes into view
        end: "top top", // Medium range - between fast and slow
        scrub: 0.5, // Slower movement
        onUpdate: (self) => {
          // Move mask up slowly based on scroll progress
          const progress = self.progress;
          const translateY = -100 * progress; // Move up from 0 to -100vh
          maskContainer.style.transform = `translateY(${translateY}vh)`;
        },
        onLeaveBack: () => {
          // Reset mask position when scrolling back up
          maskContainer.style.transform = 'none';
        }
      });
    }
  }
});
