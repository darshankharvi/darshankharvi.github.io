(function SpringBadgeModule() {
  function init() {
    const strap = document.getElementById('strap');
    const card = document.getElementById('badgeCard');
    if (!strap || !card) return;

    const config = window.WebShellConfig;
    let dragging = false;
    let startY = 0;
    let offsetY = 0;
    let vy = 0;
    let animId = null;
    let scrollLocked = false;
    let scrollPosition = { top: 0, left: 0 };

    function setTransforms(y) {
      const stretch = 1 + Math.min(Math.abs(y) / 220, 0.25);
      const tilt = Math.max(Math.min(y / 10, 10), -10);
      strap.style.transform = `scaleY(${stretch})`;
      card.style.transform = `translateY(${y}px) rotateX(${tilt}deg)`;
    }

    function lockScroll() {
      if (scrollLocked) return;
      scrollLocked = true;
      
      scrollPosition.top = window.pageYOffset || document.documentElement.scrollTop;
      scrollPosition.left = window.pageXOffset || document.documentElement.scrollLeft;
      
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPosition.top}px`;
      document.body.style.left = `-${scrollPosition.left}px`;
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    }

    function unlockScroll() {
      if (!scrollLocked) return;
      scrollLocked = false;
      
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      
      window.scrollTo(scrollPosition.left, scrollPosition.top);
    }

    function handlePointerDown(e) {
      dragging = true;
      document.body.classList.add('dragging');
      lockScroll(); // Lock scroll when dragging starts
      
      const y = (e.touches ? e.touches[0].clientY : e.clientY);
      startY = y - offsetY;
      cancelAnimationFrame(animId);
    }

    function handlePointerMove(e) {
      if (!dragging) return;
      e.preventDefault(); // Prevent default behavior
      
      const y = (e.touches ? e.touches.clientY : e.clientY);
      offsetY = Math.max(Math.min(y - startY, config.MAX_PULL), -config.MAX_PULL);
      setTransforms(offsetY);
    }

    function handlePointerUp() {
      if (!dragging) return;
      dragging = false;
      document.body.classList.remove('dragging');
      unlockScroll(); // Unlock scroll when dragging ends
      springBack();
    }

    function springBack() {
      function step() {
        const x = offsetY;
        const force = -config.SPRING_K * x;
        const dampingForce = -config.DAMPING * vy;
        const ay = (force + dampingForce) / config.MASS;
        vy += ay;
        offsetY += vy;

        if (Math.abs(offsetY) < 0.2 && Math.abs(vy) < 0.2) {
          offsetY = 0;
          vy = 0;
          setTransforms(0);
          cancelAnimationFrame(animId);
          return;
        }
        setTransforms(offsetY);
        animId = requestAnimationFrame(step);
      }
      animId = requestAnimationFrame(step);
    }

    // Event listeners
    card.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    
    // Touch events with passive: false to allow preventDefault
    card.addEventListener('touchstart', handlePointerDown, { passive: false });
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    // Safety nets
    window.addEventListener('pointercancel', () => {
      if (dragging) {
        dragging = false;
        document.body.classList.remove('dragging');
        unlockScroll();
        springBack();
      }
    });

    window.addEventListener('blur', () => {
      if (scrollLocked) unlockScroll();
    });

    // Keyboard demo
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        offsetY = 80;
        vy = 0;
        setTransforms(offsetY);
        springBack();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
