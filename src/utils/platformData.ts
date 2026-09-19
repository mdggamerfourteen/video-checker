import { PlatformConfig, PlatformId, PlatformAuditResult } from '../types';

export const PLATFORMS: Record<PlatformId, PlatformConfig> = {
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    tagline: 'High-Velocity Vertical Micro-Content',
    primaryRatio: '9:16 (1080x1920)',
    maxRecommendedDuration: 60,
    audioTargetLufs: -14,
    recommendedResolution: '1080 x 1920',
    colorScheme: {
      bg: 'rgba(238, 29, 82, 0.1)',
      text: '#fe2c55',
      border: 'rgba(238, 29, 82, 0.3)',
      accent: '#25f4ee',
    },
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    tagline: 'Long-Form Authority & Shorts Discovery',
    primaryRatio: '16:9 (or 9:16 for Shorts)',
    maxRecommendedDuration: 3600,
    audioTargetLufs: -14,
    recommendedResolution: '1920 x 1080 / 4K',
    colorScheme: {
      bg: 'rgba(255, 0, 0, 0.1)',
      text: '#ff0000',
      border: 'rgba(255, 0, 0, 0.3)',
      accent: '#ffffff',
    },
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    tagline: 'Social Feed & Silent Autoplay Reels',
    primaryRatio: '9:16 Reels / 1:1 or 4:5 Feed',
    maxRecommendedDuration: 300,
    audioTargetLufs: -15,
    recommendedResolution: '1080 x 1350 / 1080 x 1920',
    colorScheme: {
      bg: 'rgba(24, 119, 242, 0.1)',
      text: '#1877f2',
      border: 'rgba(24, 119, 242, 0.3)',
      accent: '#42b72a',
    },
  },
  rumble: {
    id: 'rumble',
    name: 'Rumble',
    tagline: 'Independent Creator & Widescreen Video',
    primaryRatio: '16:9 Landscape',
    maxRecommendedDuration: 7200,
    audioTargetLufs: -14,
    recommendedResolution: '1920 x 1080 / 4K UHD',
    colorScheme: {
      bg: 'rgba(133, 199, 66, 0.1)',
      text: '#85c742',
      border: 'rgba(133, 199, 66, 0.3)',
      accent: '#5a9624',
    },
  },
};

export function evaluatePlatformCompliance(
  platformId: PlatformId,
  params: {
    width: number;
    height: number;
    duration: number;
    fileSizeBytes: number;
  }
): PlatformAuditResult {
  const { width, height, duration } = params;
  const isVertical = height > width;
  const isLandscape = width >= height;
  const isSquare = Math.abs(width - height) < 20;

  switch (platformId) {
    case 'tiktok': {
      const aspectScore = isVertical ? 40 : 10;
      const durationScore = duration <= 60 ? 30 : duration <= 180 ? 20 : 10;
      const resScore = width >= 720 && height >= 1280 ? 30 : 15;
      const total = aspectScore + durationScore + resScore;

      return {
        score: total,
        status: total >= 80 ? 'pass' : total >= 60 ? 'warning' : 'fail',
        aspectRatioStatus: isVertical ? 'optimal' : 'suboptimal',
        durationStatus: duration <= 60 ? 'optimal' : duration <= 180 ? 'acceptable' : 'too_long',
        audioLufsTarget: -14,
        safeZoneCompliance: isVertical
          ? 'Clear bottom 20% and right rail 15% for TikTok UI elements'
          : 'Letterboxed: Pillarbox bars will appear. Use DaVinci Smart Reframe.',
        feedback: isVertical
          ? 'Native 9:16 ratio detected. Excellent baseline. Ensure critical text avoids the TikTok bottom caption area.'
          : 'Landscape video detected. For TikTok, convert timeline to 1080x1920 in DaVinci Project Settings or apply dynamic crop.',
        actionItems: [
          isVertical
            ? 'Verify subtitle height is at least 320px above bottom screen edge.'
            : 'In DaVinci: Change Timeline Resolution to 1080x1920 and use "Scale full frame with crop".',
          'Ensure first dialogue sentence begins within 1.5 seconds of playhead start.',
          'Fairlight target: -14 LUFS with True Peak ceiling at -1.0 dBTP.',
        ],
      };
    }

    case 'youtube': {
      // Long-form (16:9) vs Shorts (9:16 under 60s)
      const isShorts = isVertical && duration <= 60;
      const isStandardLongForm = isLandscape;

      let score = 75;
      if (isStandardLongForm) score = 95;
      else if (isShorts) score = 90;
      else if (isVertical && duration > 60) score = 55; // Vertical > 60s is awkward on YouTube

      return {
        score,
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        aspectRatioStatus: isStandardLongForm || isShorts ? 'optimal' : 'acceptable',
        durationStatus: 'optimal',
        audioLufsTarget: -14,
        safeZoneCompliance: isStandardLongForm
          ? 'Standard 16:9 Title Safe 80%. Reserve last 20 seconds for End Screen cards.'
          : 'Shorts: Avoid upper 150px (search/sound) and bottom 200px (channel name/subscribe).',
        feedback: isStandardLongForm
          ? 'Optimal 16:9 landscape aspect ratio. YouTube desktop, mobile, and connected TV playback ready.'
          : isShorts
          ? 'Complies with YouTube Shorts parameters (vertical under 60 seconds).'
          : 'Vertical video exceeds 60 seconds. YouTube will display as non-Shorts letterboxed vertical.',
        actionItems: [
          'Create chapter markers every 60-120 seconds in DaVinci Edit timeline.',
          'Fairlight Normalization: Set Track Limiter to -1.0 dBTP, Integrated Loudness to -14 LUFS.',
          'Color Page: Monitor Rec.709 color gamut to prevent clipping in YouTube VP9 transcoding.',
        ],
      };
    }

    case 'facebook': {
      const isFeedOptimal = isSquare || (isVertical && height / width <= 1.35);
      const isReelsOptimal = isVertical;

      const score = isReelsOptimal || isFeedOptimal ? 88 : 72;

      return {
        score,
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        aspectRatioStatus: isReelsOptimal || isFeedOptimal ? 'optimal' : 'acceptable',
        durationStatus: duration <= 180 ? 'optimal' : 'acceptable',
        audioLufsTarget: -15,
        safeZoneCompliance:
          'Crucial: 85% of Facebook users watch without audio. Burned-in captions must be center-weighted.',
        feedback:
          'Good social composition. Facebook algorithms strongly prioritize videos with immediate kinetic motion and high-contrast on-screen text.',
        actionItems: [
          'Generate high-contrast burned-in subtitles on DaVinci Subtitle Track.',
          'Inject visual hook: dynamic text title card in first 3 seconds.',
          'Target -14 to -16 LUFS audio mastering in Fairlight.',
        ],
      };
    }

    case 'rumble': {
      const score = isLandscape ? 94 : 58;

      return {
        score,
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        aspectRatioStatus: isLandscape ? 'optimal' : 'suboptimal',
        durationStatus: 'optimal',
        audioLufsTarget: -14,
        safeZoneCompliance: '16:9 broadcast safe zone compliant.',
        feedback: isLandscape
          ? 'Native 16:9 widescreen aligns with Rumble viewer demographics (desktop & smart TV audience).'
          : 'Vertical footage on Rumble creates heavy black letterbox pillars. Consider converting to 16:9 with blurred background.',
        actionItems: [
          'Maintain high dialogue presence: apply Fairlight vocal EQ boost at 3.2 kHz.',
          'Ensure thumbnail frame is visually punchy and informative.',
          'Export at minimum 1080p 60fps or 4K for Rumble high-bitrate streaming.',
        ],
      };
    }
  }
}
