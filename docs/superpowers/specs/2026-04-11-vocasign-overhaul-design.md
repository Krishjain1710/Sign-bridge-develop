# VocaSign Overhaul — Design Spec

**Date:** 2026-04-11
**Goal:** Transform VocaSign from a working prototype into a competition-ready, visually stunning, technically impressive sign language translation app that wows both technical judges and accessibility advocates.

**Approach:** Visual overhaul + animation rewrite + architecture cleanup + pipeline reliability + targeted new features.

---

## 1. UI Visual Overhaul

### 1.1 Layout Redesign

**Current:** 3-column grid (Input | SignWriting | Animation) feels like a dashboard.

**New:** Vertical pipeline flow with responsive split.
- **Mobile/tablet:** Single column — Input (top) -> SignWriting (middle) -> Animation (bottom)
- **Desktop (>=1280px):** 2-column split — Left = Input + controls, Right = SignWriting + Animation stacked
- User's eye follows the natural translation flow top-to-bottom / left-to-right

### 1.2 Brand Identity — "Clarity" Design Language

**Color palette:**
- Primary: Deep teal `#0D9488` (communication/accessibility)
- Accent: Warm amber `#F59E0B` (energy/connection)
- Accent gradient: Teal-to-emerald for CTAs (`#0D9488` -> `#059669`)
- Neutrals: Slate scale for text and backgrounds
- Dark mode: Deep slate `#0F172A` base with teal/amber accents preserved

**Typography:** Inter font family, consistent scale:
- Hero/title: 32px bold
- Section headers: 20px semibold
- Body: 16px regular
- Caption/metadata: 14px regular
- Small/badge: 12px medium

### 1.3 Card System

- Drop glassmorphism for consistent subtle shadow cards (`shadow-sm` base, `shadow-md` on hover)
- Left colored border per pipeline stage:
  - Teal (`border-l-teal-500`) for input
  - Emerald (`border-l-emerald-500`) for SignWriting
  - Amber (`border-l-amber-500`) for animation
- Rounded corners: `rounded-2xl` consistently
- Padding: `p-6` standard, `p-4` compact

### 1.4 Header Simplification

**Current header:** Logo, history, favorites, language selector, simplify toggle, settings, theme toggle — all crammed in one row.

**New header:** Logo + app name (left), minimal controls (right): theme toggle, settings gear, notifications badge.

**New toolbar (collapsible, below header):** Language selector, simplify toggle, phrase book button, recording source toggle. Collapses to a "..." overflow menu on mobile.

### 1.5 Micro-interactions

- Pipeline progress: Animated horizontal stepper with icons per stage, active stage pulses
- Buttons: `scale-95` on press, `scale-105` on hover, 150ms transitions
- SignWriting signs: Stagger animation on appear (each sign fades in with 50ms delay)
- Panels: Slide-in from right with backdrop blur overlay, 200ms ease-out
- Cards: Gentle elevation change on hover (shadow-sm -> shadow-md)

### 1.6 Empty States & Onboarding

- Custom illustrated empty states for each section:
  - Input: Microphone icon with "Speak or type to begin"
  - SignWriting: Hand icon with "Your signs will appear here"
  - Animation: Play icon with "Translation animation will play here"
- All empty states use the teal/amber palette with soft gradients

---

## 2. Animation System Rewrite

### 2.1 Anatomically Correct Base Pose

Define a neutral standing pose with realistic proportions in normalized 0-1 space:

```
NOSE:            (0.50, 0.15)
NECK:            (0.50, 0.22)
MID_SPINE:       (0.50, 0.45)
LEFT_SHOULDER:   (0.38, 0.25)
RIGHT_SHOULDER:  (0.62, 0.25)
LEFT_ELBOW:      (0.30, 0.38)
RIGHT_ELBOW:     (0.70, 0.38)
LEFT_WRIST:      (0.28, 0.50)
RIGHT_WRIST:     (0.72, 0.50)
LEFT_HIP:        (0.42, 0.55)
RIGHT_HIP:       (0.58, 0.55)
LEFT_HAND:       (0.27, 0.53)
RIGHT_HAND:      (0.73, 0.53)
LEFT_INDEX:      (0.26, 0.55)
RIGHT_INDEX:     (0.74, 0.55)
LEFT_THUMB:      (0.29, 0.54)
RIGHT_THUMB:     (0.71, 0.54)
```

All movements are offsets from this base pose, not absolute positions.

### 2.2 Expanded Joint Set (17 Joints)

New joints added to the existing 9:
- NECK, MID_SPINE (torso articulation)
- LEFT_HAND, RIGHT_HAND (palm centers)
- LEFT_INDEX, RIGHT_INDEX (index fingertip — hand shape hint)
- LEFT_THUMB, RIGHT_THUMB (thumb tip — hand shape hint)

New limb connections:
- NOSE -> NECK -> MID_SPINE (spine)
- NECK -> LEFT_SHOULDER, NECK -> RIGHT_SHOULDER
- Wrists -> Hands -> Index, Wrists -> Thumbs
- MID_SPINE -> LEFT_HIP, MID_SPINE -> RIGHT_HIP

### 2.3 Two-Handed Movement System

- Parse FSW to determine which hand(s) are involved:
  - FSW format: `M{cx}x{cy}S{id}{x}x{y}...` — M defines sign box center, S symbols have x,y positions
  - Symbol x-position < sign box center (cx) = left hand
  - Symbol x-position > sign box center (cx) = right hand
  - Symbol x-position within 20px of center = both hands
  - Hand shape symbols (0x100-0x204) paired with their nearest movement symbol determine which hand moves
- Support movement modes:
  - DOMINANT_ONLY: Only active hand moves
  - MIRROR: Both hands mirror the same movement
  - OPPOSE: Hands move in opposite directions
  - ALTERNATING: Hands take turns (e.g., "walk" sign)

### 2.4 Movement Interpolation

Replace linear ramps with eased keyframe animation:

```
Frame layout for a single movement:
[anticipation: 15%] [main movement: 60%] [follow-through: 25%]

Anticipation: Slight movement in opposite direction (10% of main amplitude)
Main: Cubic ease-in-out from start to target position
Follow-through: Overshoot by 5%, then settle back to target
```

Implementation: Use cubic Bezier function `ease(t) = t * t * (3 - 2 * t)` for smooth interpolation.

### 2.5 Movement Vocabulary (12 Types)

| Movement | Joint behavior |
|----------|---------------|
| UP | Hand(s) move upward from base |
| DOWN | Hand(s) move downward from base |
| LEFT | Hand(s) move left from base |
| RIGHT | Hand(s) move right from base |
| CIRCLE | Hand(s) trace circular path |
| WAVE | Hand oscillates side-to-side (3 cycles) |
| TAP | Quick down-up contact movement |
| TWIST | Wrist rotation (hand/index/thumb rotate around wrist) |
| PINCH | Index and thumb converge toward each other |
| SPREAD | Index and thumb diverge from each other |
| SHAKE | Rapid small-amplitude oscillation (5 cycles) |
| HOLD | Maintain position for duration (no movement, used between other movements) |

### 2.6 Dynamic Frame Count

- Base: 30 frames per movement (1 sec at 30fps)
- Per additional movement: +20 frames
- Transition between signs: 10 blend frames
- Min: 30 frames, Max: 150 frames (5 sec)
- Formula: `frames = min(150, 30 + (num_movements - 1) * 20 + (num_signs - 1) * 10)`

### 2.7 Sign Transition Smoothing

For multi-word translations (multiple FSW tokens):
- After completing sign N, add 10 frames of linear interpolation
- Smoothly move all joints from sign N end pose to sign N+1 start pose
- Creates continuous, flowing animation instead of jerky resets

---

## 3. App Architecture & State Management

### 3.1 TranslationContext

New context: `src/contexts/TranslationContext.tsx`

**State owned:**
- `inputText`, `transcription`, `signWriting`, `poseFile`
- `loadingStates: { transcribing, simplifying, translating, generatingSigns, generatingAnimation }`
- `errors: { transcribe?, simplify?, translate?, pose? }` (per-stage errors)
- `pipelineStatus: 'idle' | 'running' | 'complete' | 'partial-error'`

**Actions exposed:**
- `setInputText(text)`
- `triggerTranslation(text, options?)`
- `handleRecordComplete(audioBlob)`
- `handleSimplifyAndTranslate()`
- `cancelTranslation()`
- `retryStage(stage)` — retry a specific failed stage

### 3.2 PanelContext

New context: `src/contexts/PanelContext.tsx`

**State:**
- `activePanel: 'history' | 'favorites' | 'settings' | 'phraseBook' | 'learningMode' | 'onboarding' | null`

**Actions:**
- `openPanel(name)` — closes current panel, opens new one
- `closePanel()` — closes active panel
- `togglePanel(name)` — open if closed, close if open

Replaces 5 boolean states in App.tsx.

### 3.3 Simplified App.tsx

After refactoring, App.tsx becomes:

```tsx
function App() {
  return (
    <TranslationProvider>
      <PanelProvider>
        <Header />
        <Toolbar />
        <PipelineProgress />
        <main>
          <InputSection />
          <SignWritingSection />
          <AnimationSection />
          <TranscriptionDisplay />
        </main>
        <PanelRenderer />  {/* Renders whichever panel is active */}
        <MetricsOverlay />
        <ToastContainer />
      </PanelProvider>
    </TranslationProvider>
  );
}
```

~30 lines instead of ~420.

### 3.4 Error Handling

- Each pipeline stage returns `{ success: boolean, data?: T, error?: string }`
- Errors stored per-stage in TranslationContext
- Components render inline error + retry button for their specific stage
- Partial success supported: SignWriting displays even if pose generation fails

### 3.5 AbortController Fix

- `ApiService` methods accept optional `AbortSignal` parameter
- `TranslationContext.triggerTranslation()` creates AbortController, passes signal to all API calls
- `cancelTranslation()` calls `controller.abort()`

---

## 4. Pipeline Reliability & Backend

### 4.1 Model Preloading

```python
@app.on_event("startup")
async def load_models():
    app.state.whisper_model = whisper.load_model("base")
    app.state.signwriting_model = load_signwriting_model()
    app.state.models_ready = True
```

### 4.2 Health Check Endpoint

```
GET /health
Response: { status: "ready" | "loading", models: { whisper: bool, signwriting: bool } }
```

Frontend polls `/health` on startup, shows "Connecting to backend..." until ready.

### 4.3 Input Validation

| Endpoint | Validation |
|----------|-----------|
| POST /transcribe | File size <= 25MB, type in [wav, webm, ogg, mp3], non-empty |
| POST /simplify_text | Text length 1-1000 chars, non-empty after trim |
| POST /translate_signwriting | Text length 1-500 chars, non-empty after trim |
| POST /generate_pose | FSW format regex check, non-empty |

All return 422 with `{ error: string, code: string, stage: string }`.

### 4.4 Graceful Degradation

- Groq unreachable: Skip simplification, translate original, return warning
- Pose generation fails: Return SignWriting result with `pose_error` field
- Timeouts: transcribe=30s, simplify=10s, translate=15s, pose=10s

### 4.5 Structured Error Responses

All error responses follow:
```json
{
  "error": "Human-readable message",
  "code": "TRANSCRIBE_TIMEOUT",
  "stage": "transcribe"
}
```

Stage values: `transcribe`, `simplify`, `translate`, `pose`.

---

## 5. New Features

### 5.1 Onboarding Flow

- 3-step animated overlay on first visit
- Step 1: Microphone icon + "Speak or type anything"
- Step 2: SignWriting preview + "See it translated to sign language"
- Step 3: Animation preview + "Watch the animated translation"
- "Get Started" button dismisses, sets `localStorage.onboardingComplete = true`
- "Skip" link available on all steps
- Component: `src/components/Onboarding.tsx`
- Triggered by PanelContext on app mount if not completed

### 5.2 Export & Share

**Animation export:**
- "Download" button on AnimationSection
- Captures pose-viewer frames to canvas, encodes as GIF using existing `mp4-muxer`/`webm-muxer` dependencies
- Fallback: Export as WebM video

**SignWriting export:**
- "Save as Image" button on SignWritingSection
- Renders FSW signs to a canvas element, exports as PNG
- Includes the original text as a label below the signs

**Share card:**
- "Share" button generates a styled summary card with:
  - Original text
  - SignWriting notation
  - QR code or link (if deployed) — for demo, just the image export
- Uses `html2canvas` or DOM-to-image approach

### 5.3 Real-time Streaming Translation

**Implementation approach:**
- Use chunked audio processing (not true Whisper streaming, which requires additional setup)
- Record in 3-second chunks while recording is active
- Send each chunk to `/transcribe` as it completes
- Append transcription results progressively
- Auto-trigger translation when a sentence boundary is detected (period, question mark, pause > 2s)

**Frontend changes:**
- New `useStreamingRecorder` hook that extends `useAudioRecorder`
- Words appear with typing animation in TranscriptionDisplay
- SignWriting section updates progressively as sentences complete
- Visual: Pulsing "live" indicator during streaming mode

**Backend changes:**
- New endpoint `POST /transcribe_chunk` — same as `/transcribe` but optimized for short audio (keeps model warm)
- Returns `{ text, is_final, detected_language }`

### 5.4 Enhanced Learning Mode

**Practice mode:**
- App shows a SignWriting sign, 4 multiple-choice text options
- User selects answer, gets immediate feedback (correct/incorrect with the right answer)
- Pull questions from translation history + favorites (signs the user has actually seen)
- Track score: correct / total attempts

**Sign breakdown:**
- For each FSW token, show a tooltip/expandable section:
  - Symbol IDs mapped to descriptions ("Hand shape: flat hand", "Movement: upward arc")
  - Which joints are involved in the animation
  - Visual highlight: when hovering a breakdown item, the corresponding joint lights up in the animation

**Progress tracking:**
- Signs learned counter (saved to localStorage)
- Daily streak (consecutive days with at least 1 practice session)
- Simple progress bar: "You've practiced X of Y signs in your history"

### 5.5 Accessibility Dashboard

**"How to Use" panel:**
- Accessible from header help icon (?)
- Lists all keyboard shortcuts in a clean table
- Brief description of each app section
- Tips for screen reader users

**Accessibility improvements:**
- Audit all interactive elements for ARIA labels (many buttons currently missing `aria-label`)
- Add `role="alert"` to error messages for screen reader announcement
- Ensure focus management: opening a panel traps focus, closing returns focus to trigger
- Skip-to-content link at top of page
- All color combinations must meet WCAG AA contrast (4.5:1 for text)

---

## 6. Files Changed / Created

### New files:
- `frontend/src/contexts/TranslationContext.tsx`
- `frontend/src/contexts/PanelContext.tsx`
- `frontend/src/components/Onboarding.tsx`
- `frontend/src/components/Toolbar.tsx`
- `frontend/src/components/PanelRenderer.tsx`
- `frontend/src/components/ExportControls.tsx`
- `frontend/src/components/ShareCard.tsx`
- `frontend/src/components/AccessibilityHelp.tsx`
- `frontend/src/components/SignBreakdown.tsx`
- `frontend/src/components/PracticeMode.tsx`
- `frontend/src/hooks/useStreamingRecorder.ts`
- `frontend/src/hooks/useOnboarding.ts`
- `backend/api/health.py`
- `backend/api/transcribe_chunk.py`

### Modified files:
- `frontend/src/pages/App.tsx` (major refactor — slimmed down)
- `frontend/src/index.css` (new Clarity design tokens, remove glassmorphism)
- `frontend/src/components/Header.tsx` (simplified)
- `frontend/src/components/InputSection.tsx` (consume TranslationContext)
- `frontend/src/components/SignWritingSection.tsx` (export button, context)
- `frontend/src/components/AnimationSection.tsx` (export button, context)
- `frontend/src/components/PipelineProgress.tsx` (new stepper design)
- `frontend/src/components/PoseViewer.tsx` (updated for new joint set)
- `frontend/src/components/LearningMode.tsx` (practice mode, breakdown, progress)
- `frontend/src/components/TranscriptionDisplay.tsx` (streaming animation)
- `frontend/src/components/HistoryPanel.tsx` (new card style)
- `frontend/src/components/FavoritesPanel.tsx` (new card style)
- `frontend/src/components/SettingsPanel.tsx` (new card style)
- `frontend/src/components/PhraseBook.tsx` (move to toolbar)
- `frontend/src/components/AudioRecorder.tsx` (streaming support)
- `frontend/src/components/MetricsOverlay.tsx` (new style)
- `frontend/src/components/SimplifyChoiceModal.tsx` (new style)
- `frontend/src/components/LoadingSpinner.tsx` (new style)
- `frontend/src/hooks/useAudioRecorder.ts` (streaming chunk support)
- `frontend/src/services/ApiService.ts` (AbortSignal, new endpoints, error format)
- `frontend/src/config.ts` (new color tokens, feature flags)
- `backend/main.py` (model preloading, health endpoint, validation)
- `backend/api/transcribe.py` (validation, model reuse, structured errors)
- `backend/api/signwriting_translation_pytorch.py` (validation, structured errors)
- `backend/pose/signwriting_parser.py` (expanded movement vocabulary)
- `backend/pose/signwriting_pose_generator.py` (complete rewrite — 17 joints, interpolation, two-handed)
- `backend/pose/local_pose_generator.py` (updated for 17-joint skeleton)
- `backend/config.py` (timeout configs)

---

## 7. Out of Scope

- Camera-based sign language recognition (separate ML project)
- Multi-language sign output (model only supports ASL)
- Collaborative/classroom mode (scope creep)
- Offline text simplification (internet dependency accepted)
- Replacing Groq with local model
- Native mobile app (Tauri desktop is sufficient)
- User accounts / authentication
