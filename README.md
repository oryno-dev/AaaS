# AaaS

REALIFY — PROGRAMMATIC VIDEO ENGINE (TEXT BLUEPRINT)
Purpose: This file is the single source of truth for building Realify. It defines the full pipeline, roles, data formats, and constraints. LLMs must follow this file strictly. No improvisation.

0. CORE PRINCIPLES (NON‑NEGOTIABLE)
Vectors are static (SVG never animates itself)
Intent ≠ Motion ≠ Rendering (each is isolated)
LLMs never touch rendering code
Every LLM output is validated before execution
Camera is a first‑class entity (not a CSS transform)
Deterministic output (same input → same video)
1. HIGH‑LEVEL FLOW (PIPELINE)
USER INPUT (Image + Prompt) ↓ IMAGE VECTOR PIPELINE (PNG → SVG) ↓ ELEMENT SCHEMA EXTRACTION (What exists?) ↓ NARRATIVE PLANNING (What should happen?) ↓ MOTION IR (How it happens over time) ↓ MOTION VALIDATION (Rules + Constraints) ↓ REMOTION COMPILATION (IR → Frames) ↓ VIDEO RENDER (MP4 / WEBM) 
2. IMAGE VECTOR PIPELINE
Role: Image Processor
Input: PNG / JPG / Screenshot
Tools:
Inkscape CLI
IntKit (or equivalent)
SVGO (cleanup)
Output: Clean SVG
Rules:
Every visible element MUST have a stable id
No animation tags
No editor metadata
Flat groups (deep nesting discouraged)
Why: SVG is the static geometry truth. It is readable, inspectable, and editable.
3. ELEMENT SCHEMA (STRUCTURAL TRUTH)
Role: Mapper Service (LLM‑Assisted, Constrained)
Input: SVG
Output: Element Schema (JSON)
Purpose: Describe what exists, not what moves.
Example (conceptual):
Element { id: string type: button | text | input | cursor | container bbox: { x, y, width, height } editable: boolean semanticRole: string } 
Rules:
No timing
No animation
No camera
Why: This is the vocabulary the Director will use.
4. NARRATIVE DIRECTOR
Role: Narrative Director (LLM)
Input:
User prompt
Element Schema (summary only)
Output: Narrative Beats
Example:
1. Cursor enters screen 2. Camera focuses on input field 3. Text is typed 
Rules:
NO coordinates
NO easing
NO frame numbers
Why: This mimics a human director: intent first, mechanics later.
5. STORYBOARD (OPTIONAL, HIGH‑LEVEL)

Storyboard is allowed but NOT authoritative. It is human‑readable planning, not execution.
Used only for:
Debugging
UI preview
Logging
6. MOTION IR (AUTHORITATIVE)
Role: Motion Compiler (LLM + Rules)
Input:
Narrative Beats
Element Schema
Output: Motion IR (JSON)
What Motion IR Is
A timeline‑based, deterministic instruction set. It is equivalent to After Effects keyframes — but in code.
What Motion IR Is NOT
Not SVG animation
Not JSX
Not imperative code
Motion IR Structure (Conceptual)
MotionIR { timeline: number (frames) tracks: [ ElementTrack | CameraTrack ] } 
7. ELEMENT TRACKS
Purpose
Define how an element changes over time.
Allowed Properties:
position
opacity
scale
rotation
textContent
Example:
ElementTrack { targetId: "cursor" keyframes: [ { frame: 0, x: -200, y: 300, opacity: 0 }, { frame: 30, x: 100, y: 300, opacity: 1 } ] easing: "easeOut" } 
8. CAMERA TRACKS (CRITICAL)
Purpose
Replicate After Effects camera behavior.
Camera is an ACTOR.
Properties:
x, y (pan)
z (zoom)
rotation
Example:
CameraTrack { keyframes: [ { frame: 0, x: 0, y: 0, z: 1 }, { frame: 40, x: 120, y: 200, z: 2.2 } ] easing: "easeInOut" } 
Rules:
Camera cannot exceed bounds
Camera always interpolates
9. VALIDATION LAYER (MANDATORY)
Role: Validator (Code, NOT LLM)
Checks:
Schema validity
Timeline consistency
Element existence
Action legality
Examples:
Cursor cannot type if input is hidden
Camera cannot zoom beyond max Z
Text edits only on editable nodes
Failure = reject generation
10. REMOTION COMPILER
Role: Render Compiler
Input: Motion IR
Output: Remotion Composition
Responsibilities:
Convert tracks → useCurrentFrame() interpolations
Apply camera transforms at root level
Render SVG as static layers
Rules:
No logic in JSX
No randomness
11. RENDER ENGINE

Engine: Remotion
Output:
MP4
WEBM
Properties:
Frame‑accurate
Deterministic
Cloud‑renderable
12. LLM SAFETY CONTRACT
LLMs:
NEVER generate JSX
NEVER generate SVG
ONLY generate JSON within schemas
If violated → output discarded.

13. WHY THIS WORKS
Matches film logic
Matches compiler logic
Prevents hallucination
Scales to SaaS automation

14. DEVELOPMENT ORDER (FAST SHIPPING)
SVG → Element Schema
Motion IR schema + validator
Camera system in Remotion
Element tracks
LLM integration (last)
END OF BLUEPRINT

