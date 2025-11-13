// Wait for GSAP and Lenis to load from CDN
document.addEventListener("DOMContentLoaded", () => {
  // Check if GSAP is loaded
  if (typeof gsap === 'undefined') {
    console.error('GSAP is not loaded');
    return;
  }
  
  // Desktop-specific script for index.html (4-column layout)
  const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    console.log('Desktop script loaded on mobile device - this should not happen');
  }
  
  gsap.registerPlugin(ScrollTrigger);

  // Check if Lenis is loaded
  if (typeof Lenis === 'undefined') {
    console.error('Lenis is not loaded');
    return;
  }
  
  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  const spotlightImages = document.querySelector(".spotlight-images");
  const maskContainer = document.querySelector(".mask-container");
  const maskImage = document.querySelector(".mask-img");
  const maskHeader = document.querySelector(".mask-container .header h1");

  const spotlightContainerHeight = spotlightImages.offsetHeight;
  const viewportHeight = window.innerHeight;
  const initialOffset = spotlightContainerHeight * 0.05;
  const totalMovement =
    spotlightContainerHeight + initialOffset + viewportHeight;

  // SplitText is a premium plugin, so we'll use a simpler approach
  let headerWords = null;
  if (maskHeader) {
    // Simple word splitting without SplitText plugin
    const text = maskHeader.textContent;
    maskHeader.innerHTML = text.split(' ').map(word => `<span class="spotlight-word">${word}</span>`).join(' ');
    headerWords = maskHeader.querySelectorAll('.spotlight-word');
    gsap.set(headerWords, { opacity: 0 });
  }

  ScrollTrigger.create({
    trigger: ".spotlight",
    start: "top top",
    end: isMobile ? `+=${window.innerHeight * 5}px` : `+=${window.innerHeight * 4}px`, // Reduced scroll distance for faster mask effect
    pin: true, // Pin during animation
    pinSpacing: true,
    scrub: isMobile ? 0.3 : 0.2, // More responsive scrub for smoother scrolling
    onComplete: () => {
      // Unpin after animation completes so user can scroll normally
      ScrollTrigger.getById("desktop-spotlight-pin")?.kill();
    },
    id: "desktop-spotlight-pin", // Give it an ID so we can reference it
    onUpdate: (self) => {
      const progress = self.progress;

      if (progress <= 0.5) {
        const imagesMoveProgress = progress / 0.5;

        const startY = isMobile ? 0 : 5; // Start from top on mobile
        const endY = isMobile ? -50 : -(totalMovement / spotlightContainerHeight) * 100; // Less movement on mobile
        const currentY = startY + (endY - startY) * imagesMoveProgress;

        gsap.set(spotlightImages, {
          y: `${currentY}%`,
        });
      }

      if (maskContainer && maskImage) {
        const maskStart = isMobile ? 0.25 : 0.35; // Slightly earlier start point on desktop
        const maskEnd = isMobile ? 0.75 : 0.95; // Adjusted end point on desktop
        
        if (progress >= maskStart && progress <= maskEnd) {
          const maskProgress = (progress - maskStart) / (maskEnd - maskStart);
          const maskSize = isMobile ? `${maskProgress * 200}%` : `${maskProgress * 450}%`; // Smaller mask on mobile
          const imageScale = isMobile ? (1.2 - maskProgress * 0.2) : (1.5 - maskProgress * 0.5); // Less scale on mobile

          maskContainer.style.setProperty("-webkit-mask-size", maskSize);
          maskContainer.style.setProperty("mask-size", maskSize);

          gsap.set(maskImage, {
            scale: imageScale,
          });
        } else if (progress < maskStart) {
          const initialScale = isMobile ? 1.2 : 1.5;
          maskContainer.style.setProperty("-webkit-mask-size", "0%");
          maskContainer.style.setProperty("mask-size", "0%");
          gsap.set(maskImage, {
            scale: initialScale,
          });
        } else if (progress > maskEnd) {
          const finalMaskSize = isMobile ? "200%" : "450%";
          maskContainer.style.setProperty("-webkit-mask-size", finalMaskSize);
          maskContainer.style.setProperty("mask-size", finalMaskSize);
          gsap.set(maskImage, {
            scale: 1,
          });
        }
      }

      if (headerWords && headerWords.length > 0) {
        if (progress >= 0.75 && progress <= 0.95) {
          const textProgress = (progress - 0.75) / 0.2;
          const totalWords = headerWords.length;

          headerWords.forEach((word, index) => {
            const wordRevealProgress = index / totalWords;

            if (textProgress >= wordRevealProgress) {
              gsap.set(word, { opacity: 1 });
            } else {
              gsap.set(word, { opacity: 0 });
            }
          });
        } else if (progress < 0.75) {
          gsap.set(headerWords, { opacity: 0 });
        } else if (progress > 0.95) {
          gsap.set(headerWords, { opacity: 1 });
        }
      }
    },
  });

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
    // Scrolling down - hide nav (but not on mobile to avoid conflicts with mobile nav)
    else if (!isMobile) {
      nav.style.transform = `translateY(-${navHeight}px)`;
    }
    
    lastScroll = currentScroll;
  });
});
