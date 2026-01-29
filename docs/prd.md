
# Product Requirements Document - studyfied

## Executive Summary

**Studyfied** is a Generative AI Web Application for EdTech that transforms static study materials (PDFs, URLs) into interactive, bite-sized **whiteboard video lessons**. Addressing the "Engagement Gap" in STEM learning, it uses a **"Live Canvas"** engine (React-Konva) to render lessons as real-time applications rather than static videos. This allows students to interact with the content (click, solve, explore) for deeper retention. The goal for this Hackathon is to prove the core loop: **Input (PDF/URL) -> Magic (AI Director) -> Insight (Interactive Lesson)**, prioritizing high-fidelity parsing and "hand-drawn" aesthetics over complex user management.


## Success Criteria

### User Success
*   **Time to Insight (TTI):** < 5 minutes from "Paste URL" to "First Quiz Interaction."
*   **Confidence Score:** >80% of users answer "Yes" to "Could you explain this to a friend?" post-lesson.

### Business Success (Hackathon Focused)
*   **Demo Effect:** Audience immediately understands the value proposition without external explanation.
*   **Differentiation:** Product is clearly distinct from "Video Generation" (Sora) and "Text Summarization" (NotebookLM) tools.

### Technical Success
*   **Interaction Rate:** Users interact with the canvas (click, draw, drag) at least 3 times per session (proving it's an app, not a video).
*   **Concept Coverage:** System successfully generates accurate lessons for 3 distinct STEM domains (Physics, Chemistry, Biology).

### Measurable Outcomes
1.  **Latency:** Lesson generation completes in under 60 seconds.
2.  **Accuracy:** < 10% hallucination rate in generated text/scripts.

## Product Scope

### MVP - Minimum Viable Product
*   **Core Systems:** React-Konva Canvas, Gemini 3 Flash Preview (Director/Librarian), Nano Banana Asset Engine, ElevenLabs TTS (Production) / Browser TTS (Dev).
*   **Features:** Parsing (Crawl4AI/PyMuPDF), "Librarian" Topic Selection, "Hand-Drawn" rendering, Tap-to-Answer Quizzes, Talk-and-Draw, Annotation Mode.
*   **Constraints:** Guest Mode only (No Auth), Single User (No Classrooms).

### Growth Features (Post-MVP)
*   **Teacher Mode:** Instructor dashboard to generate and push lessons to student devices.
*   **Remixing:** Ability for students to edit/annotate the AI's drawings and save their version.
*   **Visual Q&A:** User can circle an area of the canvas ("Lasso") to ask the AI specific questions. System employs **Optimistic UI**, placing a "Thinking..." note immediately while fetching the answer.

### Vision (Future)
*   **Full Textbook Mode:** Ingesting entire books to create a semester-long syllabus of video lessons.
*   **Smart Class:** Multi-device synchronization for real-time classroom teaching.

## Domain-Specific Requirements (EdTech)

### Student Data Privacy
*   **No PII Storage:** The system must not store any Personally Identifiable Information. All processing is transient (Guest Mode).
*   **Transient Inputs:** User uploaded PDFs and URLs must be processed in memory and discarded after the session ends.

### Content Safety (AI Guardrails)
*   **Safe Generation:** The AI Director must include system instructions to refuse generating content related to hate speech, violence, or sexually explicit material.
*   **Educational Focus:** The system must prioritize educational accuracy and neutrality in generated scripts.

## User Journeys

### Journey 1: The "Exam Panic" (Primary - Alex)
**Context:** It's 11 PM. Alex has a Fluid Dynamics exam tomorrow. He reads "Bernoulli's Principle" in his PDF textbook but just sees a wall of equations. He is panicking.
**Action:**
1.  Alex opens Studyfied (Guest Mode) and pastes the URL of the wiki page for "Bernoulli's Principle".
2.  **The Librarian:** The system analyzes the page and presents 3 focused topics. Alex selects "Bernoulli's Equation Usage".
3.  **The Magic:** Within 45 seconds, a whiteboard video starts. He sees a pipe being drawn. Blue "water particle" dots flow through it. The pipe narrows. The dots speed up.
3.  **Interaction:** The video pauses. A label appears on the narrow section: "Pressure?". Alex clicks the "Low" label on the drawing.
4.  **Result:** Correct! The derivation formula is written on the board next to the diagram, visually connecting $P + 1/2ρv^2$.
5.  **Outcome:** The mental model clicks. He didn't memorize the formula; he *saw* it.

### Journey 2: The "Classroom Spark" (Secondary - Ms. Sarah)
**Context:** Ms. Sarah wants to explain "Covalent Bonding" but drawing it on the chalkboard takes 15 mins and looks messy.
**Action:**
1.  She opens Studyfied on the classroom projector.
2.  She types "Covalent vs Ionic Bonds" into the topic generator.
3.  **The Magic:** The AI draws two atoms sharing an electron (animated looping orbit). The whole class watches the "hand" draw it.
4.  **Outcome:** She uses the generated video as a 3-minute intro hook, then pauses the video to lecture on top of the diagram.

### Journey Requirements Summary
*   **Latency:** Generation must happen at "panic speed" (<60s).
*   **Visuals:** Must handle *simple motion* (flow, orbit) using particle systems/moving dots.
*   **Interaction:** Canvas-based clicking (not external buttons) for immersion.
*   **Audio:** Voice must be synchronized to the drawing to explain *while* drawing.

## Innovation & Novel Patterns

### The "Live Canvas" Engine
Unlike traditional "AI Video" which generates raster pixels (MP4), Studyfied generates **Temporal Vector Events**. The "Video" is actually a real-time React application replay.
*   **Differentiation:** Allows for *in-frame interaction* (clicking a specific atom in a physics simulation) which is impossible in MP4.
*   **Zero-Cost Iteration:** Edits are just text changes in JSON (e.g., fixing a typo), requiring zero re-rendering time/cost, unlike pixels.

### Market Context
*   **Sora/Runway:** High fidelity, but zero interactivity (Passive).
*   **Khan Academy:** High pedagogical value, but static video (Passive).
*   **Studyfied:** Combines Generative AI with the interactivity of a Game Engine.

### Validation Approach
*   **"The Click Test":** Can a user click a moving object during playback? If yes, the innovation is proven.
*   **"The Typo Test":** Can we fix a text label in the "video" instantly without re-generating the visual assets?

## Web App Specific Requirements

### Project-Type Overview
Studyfied is a **Single Page Application (SPA)** built on **React**. The core experience is driven by the `react-konva` library, which renders the "video" on an HTML5 Canvas element. This approach treats the browser as a game engine rather than a document viewer.

### Technical Architecture Considerations
*   **Frontend Framework:** React (Vite).
*   **Rendering Function:** `react-konva` (Canvas API wrapper) is the primary view layer.
*   **State Management:** Complex temporal state (Time T=0 to T=End). Needs a robust store (e.g., Zustand/Recoil) to manage the "Playback Head" position.

### Browser & Device Support
*   **Target:** Modern Browsers (Chrome, Edge, Firefox, Safari 15+).
*   **Legacy:** No support for IE or older Safari (due to Canvas performance needs).
*   **Mobile:** Responsive layout required, but "Creation" flow optimized for Desktop. "Consumption" flow must work on Mobile.

### SEO Strategy
*   **Decision:** **No SEO**.
*   **Rationale:** The app is a functional tool. Generated lessons are ephemeral or private in Guest Mode. No need for Server-Side Rendering (SSR) of the canvas content.

### Accessibility (Workaround)
*   **Canvas Limitation:** Canvas elements are invisible to screen readers.
*   **Solution:** "Transcript Mode". The AI generates a text-based script alongside the visual JSON. Screen readers will read the script while the animation plays.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy
**MVP Approach:** "The Hackathon Wedge". Focus purely on the **"Input -> Magic -> Insight"** loop. We strip away all typical SaaS scaffolding (Auth, Dashboard, Payments) to maximize the quality of the generative engine.
**Resource Requirements:** Guest Mode Only. No Database (Local Storage).

### MVP Feature Set (Phase 1)
**Core User Journeys Supported:**
1.  Guest User -> Paste URL -> Watch Lesson
2.  Guest User -> Interactive Quiz -> Success

**Must-Have Capabilities:**
*   **Input Processor:** PDF/Text/URL scrapper.
*   **Gemini Director:** LLM pipeline to script the lesson.
*   **Playground:** React-Konva player with Play/Pause/Seek.
*   **Interactive Overlays:** Clickable zones on the canvas.

### Risk Mitigation Strategy
*   **Technical Risk (Audio Sync):** The audio may drift from the drawing. **Mitigation:** Use "Checkpoint Sync". Force the animation to wait for the TTS timestamp at the end of every sentence before starting the next stroke, rather than trying to sync every pixel.
*   **Market Risk (Hallucination):** The AI might draw the wrong diagram. **Mitigation:** "Edit Mode" (even if rudimentary) allowing the user to regenerate a specific scene.

## Functional Requirements

### FR Area: Content Ingestion (The Librarian)
*   **FR1:** Guest User can paste a URL (Wikipedia, Medium, etc). System uses **Crawl4AI** (Headless Browser) to extract content, bypassing anti-bot checks.
*   **FR2:** Guest User can upload a PDF document (<10MB). System uses **PyMuPDF (fitz)** for fast raw text extraction.
*   **FR3:** **Librarian Agent:** System analyzes extracted text and presents a "Topic Menu" (JSON) to the user.
*   **FR3.1:** User selects a single topic from the menu to initiate the Director.
*   **FR12:** System must detect unsupported/unreadable content (e.g., paywalls, YouTube URLs) and prompt the user to provide raw text.

### FR Area: Asset Generation (Image Steering & Factory)
*   **FR4:** **Image Steering Agent:** System analyzes selected topic and generates a set of Image Prompts (e.g., 4 specific + 1 grid) ensuring strict adherence to "Sketch Note" style (Black/White + Teal/Orange accents).
*   **FR5:** system generates High-Res images using **Gemini Images or an OpenAI-compatible Images API**. Prompts are executed in **parallel**.
*   **FR6:** **Asset Processor:** System processes raw images using **OpenCV HSV Smart Key** to remove backgrounds and slice grids into individual **Transparent PNG** assets. Reference usage of `asset_pipeline_lessons_learned.md`.

### FR Area: Lesson Generation (The AI Director)
*   **FR7:** **Director Agent:** System receives the *selected topic text* AND the *processed PNG assets*. Generates a "Lesson Script" (JSON) mapping TTS lines to visual placement/timing (Khan Academy style).
*   **FR8:** System generates TTS Audio synced with visual event timestamps. (Target: **ElevenLabs Rachel**).

### FR Area: Interactive Playback (The Canvas)
*   **FR7:** User can Play, Pause, and Seek the whiteboard animation.
*   **FR8:** User can click interactive elements (Quiz answers) directly on the canvas during a "Pause State".
*   **FR9:** **Annotation Mode:** User can draw (scribble) OR type notes on the canvas. Typed notes are rendered in a "Handwritten" font `Patrick Hand` to match the aesthetic.
*   **FR13:** **Layer Control:** User can toggle visibility of "My Notes" and "AI Explanations" (Non-destructive fading). Data is preserved when hidden.

### FR Area: Accessibility & System
*   **FR10:** System can display a scrolling text transcript synced to the audio.
*   **FR11:** System enforces a 3-minute maximum duration for generated content.

## Non-Functional Requirements

### Performance
*   **NFR1 (Latency):** Total time from "Input Submitted" to "Video Playing" must be < 60 seconds (for a 3 min lesson).
*   **NFR2 (FPS):** The Canvas animation must maintain 60fps on an average Laptop (Chrome/Edge).

### Reliability
*   **NFR3 (Hallucination Rate):** The generated script must be factually accurate >90% of the time (User reported).
*   **NFR4 (Recovery):** If generation fails (Gemini API timeout), system must alert user within 10 seconds (don't hang forever).

### Security
*   **NFR5 (Data Retention):** User inputs (PDFs/URLs) must NOT be stored in a permanent database. Process in memory, then discard.
*   **NFR6 (Anonymity):** No PII (Personally Identifiable Information) collection.

### Accessibility
*   **NFR7 (Transcript):** A screen-reader friendly text transcript must be available for all generated lessons.
