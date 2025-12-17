import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Ajv = require('ajv');
const motionIrSchema = require('./motion-ir.schema.json');
import type { ElementSchema, ElementNode } from '@realify/schemas';

export type Easing = string;
export type ElementKeyframe = { frame: number; easing?: Easing; x?: number; y?: number; opacity?: number; scale?: number; rotation?: number; textContent?: string };
export type CameraKeyframe = { frame: number; easing?: Easing; x?: number; y?: number; z?: number; rotation?: number };
export type ElementTrack = { kind: 'element'; targetId: string; keyframes: ElementKeyframe[] };
export type CameraTrack = { kind: 'camera'; keyframes: CameraKeyframe[] };
export type Track = ElementTrack | CameraTrack;
export type MotionIR = { timeline: number; tracks: Track[] };

export function makeMotionIrValidator() {
  const ajv = new Ajv({ allErrors: true, strict: true });
  const validate = ajv.compile(motionIrSchema as any);
  return validate;
}

export type MotionRules = {
  maxZoom?: number; // max z
};

export type ValidationIssue = { code: string; message: string };

export function validateMotionIR(ir: MotionIR, elements: ElementSchema, rules: MotionRules = {}): { ok: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const ajvValidate = makeMotionIrValidator();
  if (!ajvValidate(ir)) {
    for (const err of ajvValidate.errors ?? []) {
      issues.push({ code: 'schema', message: `${err.instancePath} ${err.message}` });
    }
  }
  // Early return if schema invalid
  if (issues.length) return { ok: false, issues };

  // Timeline consistency
  if (!(ir.timeline > 0)) issues.push({ code: 'timeline', message: 'timeline must be > 0' });
  for (const t of ir.tracks) {
    const frames = t.keyframes.map(k => k.frame);
    for (const f of frames) {
      if (f < 0 || f > ir.timeline) issues.push({ code: 'frame_range', message: `keyframe ${f} out of [0, ${ir.timeline}]` });
    }
    for (let i = 1; i < frames.length; i++) {
      if (frames[i] < frames[i-1]) issues.push({ code: 'frame_order', message: 'keyframes must be non-decreasing by frame' });
    }
  }

  const idSet = new Set(elements.elements.map(e => e.id));

  // Element existence and legality
  for (const t of ir.tracks) {
    if (t.kind === 'element') {
      if (!idSet.has(t.targetId)) issues.push({ code: 'missing_element', message: `targetId ${t.targetId} not found` });
      const el = elements.elements.find(e => e.id === t.targetId);
      for (const kf of t.keyframes) {
        if (typeof kf.textContent === 'string') {
          const editable = !!el?.editable;
          if (!editable) issues.push({ code: 'text_edit_illegal', message: `textContent change requires editable=true on ${t.targetId}` });
          if ((kf as any).opacity === 0) issues.push({ code: 'hidden_text_edit', message: `textContent change while opacity=0 on ${t.targetId}` });
        }
        if (kf.scale != null && kf.scale <= 0) issues.push({ code: 'scale_illegal', message: `scale must be > 0 on ${t.targetId}` });
      }
    }
  }

  // Camera bounds and zoom
  const width = elements.meta.width;
  const height = elements.meta.height;
  const maxZoom = rules.maxZoom ?? 4;
  for (const t of ir.tracks) {
    if (t.kind === 'camera') {
      for (const kf of t.keyframes) {
        if (kf.x != null && (kf.x < 0 || kf.x > width)) issues.push({ code: 'camera_bounds', message: `camera x=${kf.x} outside [0, ${width}]` });
        if (kf.y != null && (kf.y < 0 || kf.y > height)) issues.push({ code: 'camera_bounds', message: `camera y=${kf.y} outside [0, ${height}]` });
        if (kf.z != null && (kf.z <= 0 || kf.z > maxZoom)) issues.push({ code: 'camera_zoom', message: `camera z=${kf.z} outside (0, ${maxZoom}]` });
      }
    }
  }

  return { ok: issues.length === 0, issues };
}
