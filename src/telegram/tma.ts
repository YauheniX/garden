import {
  hapticFeedback,
  init as initSDK,
  isTMA,
  miniApp,
  retrieveLaunchParams,
  viewport,
} from '@telegram-apps/sdk-react';

export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error';

export interface TelegramUser {
  id: number | string;
  firstName: string;
  username?: string;
  isTelegram: boolean;
}

interface TelegramWebAppBridge {
  ready?: () => void;
  expand?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  initDataUnsafe?: {
    user?: {
      id?: number | string;
      first_name?: string;
      username?: string;
    };
    start_param?: string;
  };
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  };
  openTelegramLink?: (url: string) => void;
}

interface LaunchDataFallback {
  initData?: {
    user?: {
      id?: number | string;
      firstName?: string;
      username?: string;
    };
    startParam?: string;
  };
  startParam?: string;
}

function getWindowTelegramWebApp(): TelegramWebAppBridge | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return (window as unknown as { Telegram?: { WebApp?: TelegramWebAppBridge } })
    ?.Telegram?.WebApp;
}

/**
 * Initializes Telegram Mini App wrapper.
 * Sets warm cream diorama background & header (#FBF7F0) and expands viewport.
 * Safe to call in standard browsers, tests, or Telegram webview.
 */
export function initTelegramApp(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const webApp = getWindowTelegramWebApp();
  if (webApp) {
    try {
      webApp.ready?.();
      webApp.expand?.();
      webApp.setHeaderColor?.('#FBF7F0');
      webApp.setBackgroundColor?.('#FBF7F0');
    } catch {
      // Ignore errors on older Telegram desktop/web clients
    }
  }

  try {
    if (isTMA()) {
      initSDK();
      if (miniApp.ready.isAvailable()) {
        miniApp.ready();
      }
      if (viewport.expand.isAvailable()) {
        viewport.expand();
      }
      if (miniApp.setHeaderColor.isAvailable()) {
        miniApp.setHeaderColor('#FBF7F0');
      }
      if (miniApp.setBackgroundColor.isAvailable()) {
        miniApp.setBackgroundColor('#FBF7F0');
      }
    }
  } catch (err) {
    console.warn('[TMA] SDK init skipped:', err);
  }
}

/**
 * Retrieves the current Telegram user or returns a cozy Panda Florist demo user.
 */
export function getTelegramUser(): TelegramUser {
  if (typeof window !== 'undefined') {
    // 1. Try window.Telegram.WebApp.initDataUnsafe
    const webApp = getWindowTelegramWebApp();
    const user = webApp?.initDataUnsafe?.user;
    if (user && user.id) {
      return {
        id: user.id,
        firstName: user.first_name || 'Panda Florist',
        username: user.username,
        isTelegram: true,
      };
    }

    // 2. Try @telegram-apps/sdk-react
    try {
      if (isTMA()) {
        const lp = retrieveLaunchParams() as unknown as LaunchDataFallback;
        const lpUser = lp.initData?.user;
        if (lpUser && lpUser.id) {
          return {
            id: lpUser.id,
            firstName: lpUser.firstName || lpUser.username || 'Panda Florist',
            username: lpUser.username,
            isTelegram: true,
          };
        }
      }
    } catch {
      // Not in TMA environment
    }
  }

  // Fallback demo user for local development and browser testing
  return {
    id: 'demo_panda_001',
    firstName: 'Panda Florist',
    username: 'panda_florist',
    isTelegram: false,
  };
}

/**
 * Triggers safe haptic feedback.
 * No-op when running outside Telegram.
 */
export function haptic(type: HapticType): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const webApp = getWindowTelegramWebApp();
    if (webApp?.HapticFeedback) {
      if (type === 'light' || type === 'medium' || type === 'heavy') {
        webApp.HapticFeedback.impactOccurred(type);
        return;
      }
      if (type === 'success' || type === 'warning' || type === 'error') {
        webApp.HapticFeedback.notificationOccurred(type);
        return;
      }
    }

    if (isTMA()) {
      if (type === 'light' || type === 'medium' || type === 'heavy') {
        if (hapticFeedback.impactOccurred.isAvailable()) {
          hapticFeedback.impactOccurred(type);
          return;
        }
      } else {
        if (hapticFeedback.notificationOccurred.isAvailable()) {
          hapticFeedback.notificationOccurred(type);
          return;
        }
      }
    }
  } catch {
    // Silently handle environments where haptic is unsupported
  }
}

/**
 * Reads start_param from Telegram WebApp or browser URL (?startapp=gift_...).
 */
export function getStartParam(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const webApp = getWindowTelegramWebApp();
    if (webApp?.initDataUnsafe?.start_param) {
      return webApp.initDataUnsafe.start_param;
    }

    if (isTMA()) {
      const lp = retrieveLaunchParams() as unknown as LaunchDataFallback;
      if (typeof lp.startParam === 'string') {
        return lp.startParam;
      }
      if (typeof lp.initData?.startParam === 'string') {
        return lp.initData.startParam;
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const startAppParam =
      urlParams.get('startapp') || urlParams.get('tgWebAppStartParam');
    if (typeof startAppParam === 'string') {
      return startAppParam;
    }
  } catch {
    // Launch params unavailable
  }

  return null;
}

/**
 * Opens a Telegram share link or copies gift link to clipboard as browser fallback.
 */
export async function shareGiftLink(
  botUsername: string,
  giftToken: string,
  text: string
): Promise<string> {
  const cleanBot = botUsername.replace(/^@/, '');
  const appLink = `https://t.me/${cleanBot}?startapp=gift_${giftToken}`;
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
    appLink
  )}&text=${encodeURIComponent(text)}`;

  if (typeof window !== 'undefined') {
    const webApp = getWindowTelegramWebApp();
    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(shareUrl);
      return shareUrl;
    }

    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(appLink);
      } catch {
        // Clipboard write failed
      }
    }

    window.open(shareUrl, '_blank');
  }

  return shareUrl;
}
