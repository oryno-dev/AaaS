import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Ajv = require('ajv');
const elementSchemaJson = require('./element-schema.json');

export function makeElementValidator() {
  const ajv = new Ajv({ allErrors: true, strict: true });
  const validate = ajv.compile(elementSchemaJson as any);
  return validate;
}
