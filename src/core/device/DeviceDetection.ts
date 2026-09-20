/**
 * THE KATHA - Adaptive Device & Input Environment Detection
 * 
 * Accurately detects Android mobile phones, Android tablets, iPads, and Desktop/Laptop browsers.
 * Distinguishes true touch-first handheld devices from touchscreen-enabled laptops.
 */

import { useState, useEffect } from 'react';

export type DeviceCategory = 'phone' | 'tablet' | 'desktop';

export interface DeviceInfo {
  isMobile: boolean;      // Handheld Smartphone (Android phone, iPhone)
  isTablet: boolean;      // Tablet device (Android tablet, iPad)
  isTouchDevice: boolean; // Phone or Tablet (touch-first UI controls active)
  isDesktop: boolean;     // Desktop PC or Laptop (keyboard/mouse controls active)
  isPortrait: boolean;
  isLandscape: boolean;
  category: DeviceCategory;
}

export function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isTouchDevice: false,
      isDesktop: true,
      isPortrait: false,
      isLandscape: true,
      category: 'desktop',
    };
  }

  const ua = navigator.userAgent || '';
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isPortrait = height > width;
  const isLandscape = !isPortrait;

  // Media Query Checks
  const hasCoarsePointer = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
  const hasFinePointer = window.matchMedia ? window.matchMedia('(pointer: fine)').matches : false;
  const canHover = window.matchMedia ? window.matchMedia('(hover: hover)').matches : false;

  // 1. Android Phone vs Android Tablet
  const isAndroid = /Android/i.test(ua);
  const isAndroidMobile = isAndroid && /Mobile/i.test(ua);
  const isAndroidTablet = isAndroid && !/Mobile/i.test(ua);

  // 2. iOS Devices (iPhone / iPod vs iPad including iPadOS 13+ desktop UA)
  const isIPhone = /iPhone|iPod/i.test(ua);
  const isIPad = /iPad/i.test(ua) || (Boolean(maxTouchPoints > 1) && /Macintosh/i.test(ua) && !canHover);

  // 3. Other Generic Tablets
  const isOtherTablet = /(Tablet|PlayBook|Silk|Kindle)/i.test(ua);

  // 4. Determine Phone
  const isPhone = isAndroidMobile || isIPhone;

  // 5. Determine Tablet
  let isTablet = isAndroidTablet || isIPad || isOtherTablet;
  if (!isPhone && !isTablet && hasCoarsePointer && !canHover && maxTouchPoints > 0) {
    // Coarse touch-only screen without mouse hover
    if (Math.min(width, height) >= 600 || Math.max(width, height) >= 960) {
      isTablet = true;
    } else {
      // Small screen handheld
      // isPhone
    }
  }

  // 6. Determine Desktop/Laptop
  // Touchscreen laptops (e.g. Surface, ThinkPad Touch) report maxTouchPoints > 0,
  // but their primary pointer is fine (mouse/trackpad), canHover is true, and UA is Windows/Mac/Linux.
  // Desktop users must NOT receive mobile touch driving controls.
  const isExplicitMobileOrTablet = isPhone || isTablet;
  const isDesktop = !isExplicitMobileOrTablet && (hasFinePointer || canHover || (!isAndroid && !isIPhone && !isIPad));

  // Determine Touch Gaming Mode (Controls displayed on screen)
  // Only true for mobile phones and tablets (or when explicitly emulating touch in mobile devtools)
  const isTouchDevice = isExplicitMobileOrTablet || (!isDesktop && maxTouchPoints > 0);

  let category: DeviceCategory = 'desktop';
  if (isPhone) {
    category = 'phone';
  } else if (isTablet) {
    category = 'tablet';
  }

  return {
    isMobile: isPhone,
    isTablet,
    isTouchDevice,
    isDesktop,
    isPortrait,
    isLandscape,
    category,
  };
}

/**
 * React Hook for responsive device state updates
 */
export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => detectDevice());

  useEffect(() => {
    const handleUpdate = () => {
      setDeviceInfo(detectDevice());
    };

    window.addEventListener('resize', handleUpdate, { passive: true });
    window.addEventListener('orientationchange', handleUpdate, { passive: true });

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('orientationchange', handleUpdate);
    };
  }, []);

  return deviceInfo;
}
