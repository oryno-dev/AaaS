import type { ElementSchema, ElementNode, BBox } from '@realify/schemas';

// Simple deterministic hash (djb2)
function hashString(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
  return (h >>> 0).toString(36);
}

// Minimal SVG parser using regex to pick common primitives and their attributes.
// This is a stub: In production use a robust XML parser. The goal here is deterministic IDs and bbox extraction.
export function svgToElementSchema(svg: string, opts?: { source?: string }): ElementSchema {
  const viewBoxMatch = svg.match(/viewBox\s*=\s*"([^"]+)"/i);
  const widthMatch = svg.match(/\bwidth\s*=\s*"([^"]+)"/i);
  const heightMatch = svg.match(/\bheight\s*=\s*"([^"]+)"/i);
  let width = 0, height = 0;
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].split(/\s+/).map(Number);
    if (parts.length === 4) { width = parts[2]; height = parts[3]; }
  }
  if ((!width || !height) && widthMatch && heightMatch) {
    width = Number(widthMatch[1]);
    height = Number(heightMatch[1]);
  }

  const elements: ElementNode[] = [];
  // Extract known element tags
  const tagRegex = /<(rect|text|circle|image|path|g)([^>]*)>/gim;
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(svg)) !== null) {
    const tag = m[1].toLowerCase();
    const attrs = m[2] || '';
    const id = getOrMakeId(tag, attrs);
    const bbox = computeBBox(tag, attrs);
    if (!bbox) continue;

    const node: ElementNode = {
      id,
      type: inferType(tag, attrs),
      bbox
    };
    // Heuristic: mark text as non-editable by default
    if (node.type === 'input') node.editable = true;
    elements.push(node);
  }

  return { elements, meta: { source: opts?.source, width, height } };
}

function getAttr(attrs: string, name: string): string | undefined {
  const re = new RegExp(name + '\\s*=\\s*"([^"]+)"', 'i');
  const m = attrs.match(re);
  return m ? m[1] : undefined;
}

function getOrMakeId(tag: string, attrs: string): string {
  const existing = getAttr(attrs, 'id');
  if (existing) return existing;
  const key = tag + '|' + attrs.replace(/\s+/g, ' ').trim();
  return tag.substring(0, 2) + '-' + hashString(key);
}

function computeBBox(tag: string, attrs: string): BBox | undefined {
  switch (tag) {
    case 'rect': {
      const x = Number(getAttr(attrs, 'x') || '0');
      const y = Number(getAttr(attrs, 'y') || '0');
      const width = Number(getAttr(attrs, 'width') || '0');
      const height = Number(getAttr(attrs, 'height') || '0');
      if (width && height) return { x, y, width, height };
      return undefined;
    }
    case 'text': {
      // Approximate text bbox using x/y and font-size
      const x = Number(getAttr(attrs, 'x') || '0');
      const y = Number(getAttr(attrs, 'y') || '0');
      const fontSize = Number((getAttr(attrs, 'font-size') || '16').replace(/px$/, ''));
      const width = Math.max(1, fontSize * 6); // heuristic width
      const height = Math.max(1, fontSize * 1.2);
      return { x, y: y - height, width, height };
    }
    case 'circle': {
      const cx = Number(getAttr(attrs, 'cx') || '0');
      const cy = Number(getAttr(attrs, 'cy') || '0');
      const r = Number(getAttr(attrs, 'r') || '0');
      if (r) return { x: cx - r, y: cy - r, width: 2 * r, height: 2 * r };
      return undefined;
    }
    case 'image': {
      const x = Number(getAttr(attrs, 'x') || '0');
      const y = Number(getAttr(attrs, 'y') || '0');
      const width = Number(getAttr(attrs, 'width') || '0');
      const height = Number(getAttr(attrs, 'height') || '0');
      if (width && height) return { x, y, width, height };
      return undefined;
    }
    case 'path':
    case 'g': {
      // Without path parsing, we cannot compute precise bbox; skip for now
      return undefined;
    }
    default:
      return undefined;
  }
}

function inferType(tag: string, attrs: string): ElementNode['type'] {
  if (tag === 'text') return 'text';
  if (tag === 'image') return 'image';
  // Heuristics for UI semantics by class or role
  const cls = getAttr(attrs, 'class') || '';
  const aria = getAttr(attrs, 'role') || '';
  if (/button/i.test(cls) || /button/i.test(aria)) return 'button';
  if (/input/i.test(cls) || /textbox|input/i.test(aria)) return 'input';
  if (tag === 'rect' || tag === 'circle') return 'shape';
  return 'container';
}
