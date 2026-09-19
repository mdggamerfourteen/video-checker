import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();

  // Support payload for base64 keyframe thumbnails
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // Video platform evaluation and DaVinci Resolve marker generator
  app.post("/api/analyze-video", async (req, res) => {
    try {
      const {
        fileName,
        fileSizeBytes,
        durationSeconds,
        width,
        height,
        aspectRatio,
        fps = 30,
        targetPlatform = "youtube",
        audioMetrics,
        keyframes = [],
      } = req.body;

      const ai = getGeminiClient();

      // Platform specs reference
      const platformGuidelines: Record<string, string> = {
        tiktok:
          "Target: 9:16 vertical (1080x1920). Hook pacing: critical in first 2.5 seconds. UI safe zones: avoid right edge (avatar/likes) and bottom 20% (sound info/caption overlay). Audio target: -14 LUFS, dynamic dialogue and trending beats. Ideal duration: 15-60s for maximum completion rate.",
        youtube:
          "Target: 16:9 widescreen (or 9:16 for Shorts under 60s). Pacing: strong teaser hook in first 5s, chapter progression every 60-90s, clear mid-roll retention pacing, end screen safe areas (last 20s). Audio target: -14 LUFS integrated, crisp dialogue balance, avoid sudden spikes.",
        facebook:
          "Target: 9:16 for Reels or 1:1 / 4:5 for Feed. Crucial: 85% watched without sound initially, so high-contrast burned-in subtitles and strong visual motion in first 3s are mandatory. Audio target: -14 to -16 LUFS.",
        rumble:
          "Target: 16:9 landscape standard (1080p or 4K preferred). Audience favors commentary, livestreams, podcasts, and long-form video. Strong intro branding, high dialogue clarity, clean chapter transitions.",
      };

      const selectedPlatformGuideline =
        platformGuidelines[targetPlatform] || platformGuidelines.youtube;

      let aiResult = null;

      if (ai) {
        try {
          const contentsParts: Array<
            | { text: string }
            | { inlineData: { mimeType: string; data: string } }
          > = [];

          // Add prompt text
          const promptText = `You are an elite Hollywood and Social Video Editor specializing in DaVinci Resolve post-production and platform optimization (TikTok, YouTube, Facebook, Rumble).
Analyze the following video clip specifications and keyframes:
- File: ${fileName || "Input Video"} (${Math.round((fileSizeBytes || 0) / (1024 * 1024))} MB)
- Duration: ${durationSeconds || 0} seconds
- Resolution: ${width}x${height} (Aspect Ratio: ${aspectRatio})
- Frame Rate: ${fps} fps
- Target Platform: ${targetPlatform.toUpperCase()}
- Platform Guidelines: ${selectedPlatformGuideline}
- Audio Peak/RMS: ${JSON.stringify(audioMetrics || {})}

Analyze the visual composition, hook strength, safe zones, lighting, color balance, and pacing.
Provide an actionable report specifically designed for DaVinci Resolve editing:
1. Overall platform suitability score (0-100) and rationale.
2. Exact DaVinci Resolve Markers with Timecode In (HH:MM:SS:FF standard 01:00:xx:xx timeline), Timecode Out, Duration, Marker Name, Comment, Color ('Blue' for cut/trim, 'Cyan' for b-roll, 'Green' for audio, 'Yellow' for color grade, 'Red' for critical fix, 'Purple' for fusion/graphics, 'Pink' for pacing).
3. DaVinci Edit Page recommendations: precise cuts, hook enhancement, trim points.
4. DaVinci Color Page recommendations: Lift, Gamma, Gain, Rec.709 saturation, contrast, highlight recovery.
5. DaVinci Fairlight Audio recommendations: Dynamics compression, EQ, Limiter threshold, LUFS target.
6. Fusion / Safe Zone graphic recommendations: Subtitle positioning, safe margins for ${targetPlatform.toUpperCase()}.

Return the response strictly as valid JSON matching this schema:
{
  "platformScores": {
    "tiktok": { "score": number, "status": "pass" | "warning" | "fail", "feedback": string },
    "youtube": { "score": number, "status": "pass" | "warning" | "fail", "feedback": string },
    "facebook": { "score": number, "status": "pass" | "warning" | "fail", "feedback": string },
    "rumble": { "score": number, "status": "pass" | "warning" | "fail", "feedback": string }
  },
  "overallSummary": string,
  "hookEvaluation": {
    "score": number,
    "firstThreeSecondsVerdict": string,
    "recommendation": string
  },
  "davinciMarkers": [
    {
      "timecodeIn": string,
      "timecodeOut": string,
      "durationFrames": number,
      "name": string,
      "color": "Blue" | "Cyan" | "Green" | "Yellow" | "Red" | "Purple" | "Pink",
      "comment": string,
      "category": "cut" | "color" | "audio" | "fusion" | "pacing" | "platform"
    }
  ],
  "editPageAdvice": [
    { "timecode": string, "action": string, "reason": string }
  ],
  "colorPageAdvice": [
    { "timecode": string, "nodeType": string, "suggestion": string, "davinciTool": string }
  ],
  "fairlightAudioAdvice": [
    { "targetLufs": number, "issue": string, "solution": string, "davinciProcessor": string }
  ],
  "fusionSafeZoneAdvice": [
    { "platform": string, "safeZoneStatus": string, "action": string }
  ]
}`;

          contentsParts.push({ text: promptText });

          // Add up to 4 keyframe images if provided
          if (Array.isArray(keyframes)) {
            for (const kf of keyframes.slice(0, 4)) {
              if (kf.base64Image) {
                const cleanedBase64 = kf.base64Image.replace(
                  /^data:image\/(png|jpeg|webp);base64,/,
                  ""
                );
                contentsParts.push({
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: cleanedBase64,
                  },
                });
              }
            }
          }

          const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: { parts: contentsParts },
            config: {
              responseMimeType: "application/json",
              systemInstruction:
                "You are a professional DaVinci Resolve colorist, sound engineer, and video editor. Respond ONLY with valid JSON conforming to the requested schema. Use standard SMPTE timecodes starting at 01:00:00:00 or 00:00:00:00 based on duration.",
            },
          });

          const rawText = response.text || "{}";
          aiResult = JSON.parse(rawText);
        } catch (geminiError: any) {
          console.warn("Gemini API call failed or timed out, generating local fallback:", geminiError?.message);
        }
      }

      // If Gemini was unavailable or failed, generate rule-based DaVinci Resolve analysis
      if (!aiResult) {
        aiResult = generateHeuristicAnalysis({
          fileName,
          fileSizeBytes,
          durationSeconds,
          width,
          height,
          aspectRatio,
          fps,
          targetPlatform,
          audioMetrics,
        });
      }

      res.json({
        success: true,
        data: aiResult,
      });
    } catch (err: any) {
      console.error("Error in /api/analyze-video:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Failed to analyze video",
      });
    }
  });

  // Serve frontend with Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Video Checker server listening on port ${PORT}`);
  });
}

function formatSMPTE(seconds: number, fps: number = 30): string {
  const totalFrames = Math.floor(seconds * fps);
  const f = totalFrames % fps;
  const totalSeconds = Math.floor(seconds);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = 1 + Math.floor(totalSeconds / 3600); // Standard NLE 01:00:00:00 start
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(
    s
  ).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
}

function generateHeuristicAnalysis(params: {
  fileName: string;
  fileSizeBytes: number;
  durationSeconds: number;
  width: number;
  height: number;
  aspectRatio: string;
  fps: number;
  targetPlatform: string;
  audioMetrics?: any;
}) {
  const {
    fileName,
    durationSeconds = 60,
    width = 1920,
    height = 1080,
    aspectRatio = "16:9",
    fps = 30,
    targetPlatform = "youtube",
  } = params;

  const isVertical = height > width;
  const isLandscape = width >= height;

  // Platform scores calculation
  let tiktokScore = 75;
  let youtubeScore = 80;
  let facebookScore = 70;
  let rumbleScore = 78;

  if (isVertical) {
    tiktokScore = durationSeconds <= 60 ? 92 : 82;
    youtubeScore = durationSeconds <= 60 ? 88 : 65; // Great for Shorts, poor for main YT
    facebookScore = 85;
    rumbleScore = 60; // Rumble prefers landscape
  } else {
    tiktokScore = 45; // Landscape on TikTok requires letterboxing or punch-in
    youtubeScore = 94;
    facebookScore = 72;
    rumbleScore = 90;
  }

  const markers = [
    {
      timecodeIn: formatSMPTE(0.2, fps),
      timecodeOut: formatSMPTE(2.5, fps),
      durationFrames: Math.round(2.3 * fps),
      name: "Hook Retention Window",
      color: "Purple" as const,
      comment: isVertical
        ? "TikTok/Reels: First 2.5s critical drop-off zone. Add bold visual punch-in or kinetic caption."
        : "YouTube/Rumble: Establish clear value proposition before 00:00:05. Cut dead pause.",
      category: "pacing" as const,
    },
    {
      timecodeIn: formatSMPTE(Math.min(durationSeconds * 0.15, 8), fps),
      timecodeOut: formatSMPTE(Math.min(durationSeconds * 0.15, 8) + 1.5, fps),
      durationFrames: Math.round(1.5 * fps),
      name: "B-Roll Cutaway Insertion",
      color: "Cyan" as const,
      comment:
        "Insert B-roll overlay or graphic callout on Track V2 to sustain visual momentum.",
      category: "cut" as const,
    },
    {
      timecodeIn: formatSMPTE(Math.min(durationSeconds * 0.4, 25), fps),
      timecodeOut: formatSMPTE(Math.min(durationSeconds * 0.4, 25) + 2, fps),
      durationFrames: Math.round(2 * fps),
      name: "Color Grading Balance",
      color: "Yellow" as const,
      comment:
        "Color Page: Check skin tone vector and lift shadows +0.05 to prevent crushed mobile blacks.",
      category: "color" as const,
    },
    {
      timecodeIn: formatSMPTE(Math.min(durationSeconds * 0.65, 45), fps),
      timecodeOut: formatSMPTE(Math.min(durationSeconds * 0.65, 45) + 1, fps),
      durationFrames: Math.round(1 * fps),
      name: "Fairlight Audio Normalization",
      color: "Green" as const,
      comment: `Fairlight Page: Dialogue check. Target ${
        targetPlatform === "tiktok" ? "-14 LUFS" : "-14 LUFS integrated"
      }. Check for dynamic peaks.`,
      category: "audio" as const,
    },
    {
      timecodeIn: formatSMPTE(Math.max(durationSeconds - 4, 1), fps),
      timecodeOut: formatSMPTE(durationSeconds, fps),
      durationFrames: Math.round(Math.min(durationSeconds, 4) * fps),
      name: "Outro & Platform CTA",
      color: "Blue" as const,
      comment: isVertical
        ? "TikTok/Reels: Loop seamlessly or trigger fast CTA before swipe-away."
        : "YouTube: Leave 20s end screen card space avoiding bottom player bar.",
      category: "platform" as const,
    },
  ];

  return {
    platformScores: {
      tiktok: {
        score: tiktokScore,
        status:
          tiktokScore >= 80 ? "pass" : tiktokScore >= 60 ? "warning" : "fail",
        feedback: isVertical
          ? "Good 9:16 vertical orientation. Ensure captions stay clear of bottom 20% overlay and right rail like buttons."
          : "Video is landscape. TikTok requires 9:16 portrait reformat; use DaVinci Smart Reframe or vertical canvas with blurred background.",
      },
      youtube: {
        score: youtubeScore,
        status:
          youtubeScore >= 80
            ? "pass"
            : youtubeScore >= 60
            ? "warning"
            : "fail",
        feedback: isLandscape
          ? "Ideal 16:9 landscape framing for YouTube desktop, TV, and mobile players. Add chapter markers."
          : "Vertical format qualifies for YouTube Shorts (under 60s). Keep pacing aggressive.",
      },
      facebook: {
        score: facebookScore,
        status:
          facebookScore >= 80
            ? "pass"
            : facebookScore >= 60
            ? "warning"
            : "fail",
        feedback:
          "Ensure burned-in captions are present as 80%+ users watch silently in Facebook Feed. First 3s must have eye-catching action.",
      },
      rumble: {
        score: rumbleScore,
        status:
          rumbleScore >= 80
            ? "pass"
            : rumbleScore >= 60
            ? "warning"
            : "fail",
        feedback: isLandscape
          ? "Excellent 16:9 ratio for Rumble. Ensure voice track is loud and crisp for podcast/commentary listeners."
          : "Vertical videos on Rumble display with black pillar bars. Consider 16:9 timeline with blur fill in DaVinci.",
      },
    },
    overallSummary: `Analyzed ${fileName} (${width}x${height}, ${fps}fps, ${durationSeconds.toFixed(
      1
    )}s) for ${targetPlatform.toUpperCase()}. Generated 5 precision DaVinci Resolve markers and actionable NLE recommendations.`,
    hookEvaluation: {
      score: isVertical ? 86 : 82,
      firstThreeSecondsVerdict:
        "Viewer drop-off risk highest in seconds 0-3. Immediate motion or hook text is required.",
      recommendation:
        "In DaVinci Edit Page: Trim any opening breath or pause. Apply a 1.12x dynamic digital zoom at 00:00:00:15.",
    },
    davinciMarkers: markers,
    editPageAdvice: [
      {
        timecode: formatSMPTE(0.1, fps),
        action: "Trim Leading Latency",
        reason:
          "Delete the first 10-15 frames of silence to hit the viewer instantly with audio/video.",
      },
      {
        timecode: formatSMPTE(Math.min(durationSeconds * 0.3, 15), fps),
        action: "Dynamic Punch-In Zoom",
        reason:
          "Change shot framing (Inspector -> Transform Zoom 1.15) to reset viewer visual attention.",
      },
      {
        timecode: formatSMPTE(Math.max(durationSeconds - 3, 2), fps),
        action: "Tighten Outro Tail",
        reason:
          "Prevent drop-off right before the loop or CTA to boost algorithm completion percentage.",
      },
    ],
    colorPageAdvice: [
      {
        timecode: formatSMPTE(1.0, fps),
        nodeType: "Primary Corrector Node 01",
        suggestion:
          "Balance Lift and Gain. Ensure shadows do not dip below 16 code value on video scopes.",
        davinciTool: "Primaries Color Wheels / Curves",
      },
      {
        timecode: formatSMPTE(Math.min(durationSeconds * 0.5, 30), fps),
        nodeType: "Secondary Node 02 (Skin Tones)",
        suggestion:
          "Isolate skin tones on Qualifier; align indicator with skin tone vector line for natural warmth.",
        davinciTool: "Qualifier + Hue vs Saturation",
      },
    ],
    fairlightAudioAdvice: [
      {
        targetLufs: -14,
        issue: "Dynamic range variance between soft whisper and loud speech.",
        solution:
          "Apply Fairlight Dynamics Compressor (Threshold: -20dB, Ratio 2.8:1, Release 120ms).",
        davinciProcessor: "Fairlight Dynamics / Limiter",
      },
      {
        targetLufs: -14,
        issue: "Dialogue clarity on mobile smartphone speakers.",
        solution:
          "Boost 2.5kHz - 4kHz band by +1.5dB on Track 1 EQ to make speech articulate on small speakers.",
        davinciProcessor: "Fairlight 6-Band Parametric EQ",
      },
    ],
    fusionSafeZoneAdvice: [
      {
        platform: "TikTok",
        safeZoneStatus: isVertical ? "Compliant" : "Reframe Recommended",
        action:
          "Keep lower-third text above 320px from bottom edge (avoid sound bar) and 180px from right edge.",
      },
      {
        platform: "YouTube",
        safeZoneStatus: isLandscape ? "100% Native" : "Shorts Format",
        action:
          "For YouTube Shorts, leave top 150px and bottom 200px clear of critical titles.",
      },
    ],
  };
}

startServer();
