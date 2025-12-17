import Ajv from 'ajv';
import elementSchemaJson from './element-schema.json';
export function makeElementValidator() {
    const ajv = new Ajv({ allErrors: true, strict: true });
    const validate = ajv.compile(elementSchemaJson);
    return validate;
}
