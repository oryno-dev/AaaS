import { ElementSchemaJson } from '@realify/schemas';
import { makeMotionIrValidator, validateMotionIR, MotionIR, MotionRules } from '@realify/motion-ir';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Ajv = require('ajv');
import type { ElementSchema } from '@realify/schemas';

export function validateElementSchema(spec: unknown): { ok: boolean; errors?: string[] } {
  const ajv = new Ajv({ allErrors: true, strict: true });
  const validate = ajv.compile(ElementSchemaJson as any);
  const ok = validate(spec);
  if (ok) return { ok: true };
  return { ok: false, errors: (validate.errors || []).map((e: any) => `${e.instancePath} ${e.message}`) };
}

export function validateMotion(spec: MotionIR, elements: ElementSchema, rules?: MotionRules) {
  return validateMotionIR(spec, elements, rules);
}

export function validateGeneration(elements: ElementSchema, motion: MotionIR, rules?: MotionRules) {
  const es = validateElementSchema(elements);
  if (!es.ok) return { ok: false, issues: (es.errors || []).map(m => ({ code: 'element_schema', message: m })) };
  return validateMotionIR(motion, elements, rules);
}
