// ==============================================================================
// Isolated AdMob Integration Layer
// Strictly enforces placement safety policies and optional rewarded ad hooks.
// AdMob is NOT the primary revenue model for CampusGram.
// ==============================================================================

export type AdMobPlacement =
  | 'feed_banner'
  | 'discover_native'
  | 'rewarded_ai_credit'
  | 'private_messages'       // PROHIBITED
  | 'authentication'         // PROHIBITED
  | 'password_reset'         // PROHIBITED
  | 'official_announcements' // PROHIBITED
  | 'notes_reading'          // PROHIBITED
  | 'event_confirmation';    // PROHIBITED

export interface AdMobConfig {
  appId?: string;
  bannerAdUnitId?: string;
  interstitialAdUnitId?: string;
  rewardedAdUnitId?: string;
  testMode: boolean;
  enabled: boolean;
}

class AdMobService {
  private config: AdMobConfig = {
    testMode: true,
    enabled: false, // Disabled by default; native campus business ads are primary
  };

  /**
   * PROHIBITED PLACEMENT SAFETY CHECK
   * Zero ads allowed in sensitive academic and personal spaces.
   */
  isPlacementAllowed(placement: AdMobPlacement): boolean {
    const prohibitedPlacements: AdMobPlacement[] = [
      'private_messages',
      'authentication',
      'password_reset',
      'official_announcements',
      'notes_reading',
      'event_confirmation',
    ];

    if (prohibitedPlacements.includes(placement)) {
      return false;
    }

    return this.config.enabled;
  }

  /**
   * Optional Rewarded Ads for compute-heavy features (e.g. AI notes summary)
   * Students NEVER get forced rewarded ads. It is 100% voluntary.
   */
  async requestOptionalRewardedAd(feature: 'ai_notes_summary' | 'deep_resume_analysis'): Promise<{
    rewardGranted: boolean;
    creditsEarned: number;
    message: string;
  }> {
    if (!this.config.enabled) {
      // In dev or when disabled, grant feature directly without requiring ad viewing
      return {
        rewardGranted: true,
        creditsEarned: 1,
        message: 'Feature unlocked.',
      };
    }

    // When live mobile wrapper (e.g. Capacitor / React Native / Web SDK) is present:
    return {
      rewardGranted: true,
      creditsEarned: 1,
      message: 'Rewarded ad completed. AI processing unlocked.',
    };
  }
}

export const admobService = new AdMobService();
