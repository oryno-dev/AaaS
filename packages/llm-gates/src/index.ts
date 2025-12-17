import { validateElementSchema, validateMotion, validateGeneration } from '@realify/validator';
import type { ElementSchema } from '@realify/schemas';
import type { MotionIR } from '@realify/motion-ir';

export type GateResult<T> = { ok: true; value: T } | { ok: false; errors: string[] };

export function gateElementSchemaJson(json: string): GateResult<ElementSchema> {
  try {
    const obj = JSON.parse(json);
    const res = validateElementSchema(obj);
    if (res.ok) return { ok: true, value: obj };
    return { ok: false, errors: res.errors || ['Unknown element schema error'] };
  } catch (e: any) {
    return { ok: false, errors: ['Invalid JSON: ' + e.message] };
  }
}

export function gateMotionIrJson(json: string, elements: ElementSchema): GateResult<MotionIR> {
  try {
    const obj = JSON.parse(json);
    const res = validateMotion(obj, elements);
    if (res.ok) return { ok: true, value: obj };
    return { ok: false, errors: res.issues.map(i => `${i.code}: ${i.message}`) };
  } catch (e: any) {
    return { ok: false, errors: ['Invalid JSON: ' + e.message] };
  }
}

export function gateGeneration(elementJson: string, motionJson: string): GateResult<{ elements: ElementSchema; motion: MotionIR }> {
  try {
    const elements = JSON.parse(elementJson);
    const motion = JSON.parse(motionJson);
    const res = validateGeneration(elements, motion);
    if (res.ok) return { ok: true, value: { elements, motion } };
    return { ok: false, errors: res.issues.map(i => `${i.code}: ${i.message}`) };
  } catch (e: any) {
    return { ok: false, errors: ['Invalid JSON: ' + e.message] };
  }
}
