'use client';

import { useEffect } from 'react';

export default function ResponsiveScale() {
  useEffect(() => {
    function applyScaling() {
      // Better mobile device detection that accounts for landscape mode
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Check if this is a mobile device (considering both orientations)
      const isMobileDevice = isTouchDevice && (
        Math.min(screenWidth, screenHeight) <= 768 || // Portrait or landscape mobile
        (screenWidth <= 1024 && screenHeight <= 768) || // Tablet landscape
        navigator.userAgent.match(/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i)
      );
      
      // Check if we're in a mobile-sized viewport (for desktop responsive mode)
      const isMobileSizedViewport = viewportWidth <= 768 || 
        (viewportWidth <= 1024 && viewportHeight <= 600); // Include landscape tablets
      
      if (isMobileDevice) {
        // Real mobile device - remove any CSS scaling, let viewport meta handle it
        document.body.style.transform = '';
        document.body.style.transformOrigin = '';
        document.body.style.width = '';
        document.body.style.height = '';
      } else if (isMobileSizedViewport) {
        // Desktop responsive mode - apply CSS scaling since viewport meta doesn't work well
        document.body.style.transform = 'scale(0.7)';
        document.body.style.transformOrigin = '0 0';
        document.body.style.width = 'calc(100% / 0.7)';
        document.body.style.height = 'calc(100vh / 0.7)';
      } else {
        // Desktop viewport - remove any scaling
        document.body.style.transform = '';
        document.body.style.transformOrigin = '';
        document.body.style.width = '';
        document.body.style.height = '';
      }
    }

    // Apply scaling on load
    applyScaling();
    
    // Reapply on window resize (orientation changes, responsive mode changes)
    window.addEventListener('resize', applyScaling);
    
    return () => {
      window.removeEventListener('resize', applyScaling);
    };
  }, []);

  return null;
}
