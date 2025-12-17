export type BBox = { x: number; y: number; width: number; height: number };
export type ElementType = 'button' | 'text' | 'input' | 'cursor' | 'container' | 'shape' | 'image';
export interface ElementNode { id: string; type: ElementType; bbox: BBox; editable?: boolean; semanticRole?: string }
export interface ElementSchema { elements: ElementNode[]; meta: { source?: string; width: number; height: number } }

// Export JSON Schema as an object for runtime validation consumers
import elementSchemaJson from './element-schema.json' with { type: 'json' };
export const ElementSchemaJson = elementSchemaJson as unknown as Record<string, unknown>;
