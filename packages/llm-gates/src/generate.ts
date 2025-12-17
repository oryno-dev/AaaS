import { gateElementSchemaJson, gateMotionIrJson } from './index.js';
import { callOpenRouter } from './openrouter.js';

export async function generateElementsFromSvgSummary(svgSummary: string) {
  const system = {
    role: 'system',
    content: 'You are a strict JSON generator. Only output valid Element Schema JSON. No JSX, no SVG.'
  } as const;
  const user = {
    role: 'user',
    content: `Given this SVG summary, produce Element Schema JSON. Summary:\n${svgSummary}`
  } as const;
  const content = await callOpenRouter([system as any, user as any]);
  return gateElementSchemaJson(content);
}

export async function generateMotionFromBeats(beats: string, elementSchemaJson: string) {
  const motionSchemaHints = `
MOTION IR SPEC (STRICT):
- Root object with required fields: { "timeline": number>=1, "tracks": Track[] }
- No additional properties at root or track objects.
- Track is one of:
  1) ElementTrack: { "kind": "element", "targetId": string (must exist in elements.elements[].id), "keyframes": ElementKeyframe[] }
     ElementKeyframe: { "frame": integer>=0, optional: x:number, y:number, opacity:number [0..1], scale:number>=0, rotation:number, textContent:string }
  2) CameraTrack: { "kind": "camera", "keyframes": CameraKeyframe[] }
     CameraKeyframe: { "frame": integer>=0, optional: x:number, y:number, z:number>0, rotation:number }
- Example minimal valid JSON:
{
  "timeline": 300,
  "tracks": [
    {
      "kind": "camera",
      "keyframes": [
        { "frame": 0, "x": 640, "y": 360, "z": 1 },
        { "frame": 150, "x": 640, "y": 360, "z": 2 }
      ]
    },
    {
      "kind": "element",
      "targetId": "search_bar",
      "keyframes": [
        { "frame": 0, "opacity": 1 },
        { "frame": 30, "x": 100, "y": 200 }
      ]
    }
  ]
}
- Output MUST be pure JSON only. No comments, no markdown fences, no trailing commas.`;

  const system = {
    role: 'system',
    content: 'You are a strict JSON generator. Only output valid Motion IR JSON. No JSX, no SVG.'
  } as const;
  const user = {
    role: 'user',
    content: `Given narrative beats and element schema, produce Motion IR JSON.\nFollow the MOTION IR SPEC exactly.\n${motionSchemaHints}\nBeats:\n${beats}\nElements:\n${elementSchemaJson}`
  } as const;
  const content = await callOpenRouter([system as any, user as any]);
  return gateMotionIrJson(content, JSON.parse(elementSchemaJson));
}
