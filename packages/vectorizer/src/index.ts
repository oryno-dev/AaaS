import fs from 'node:fs';
import { optimize } from 'svgo';

// Deterministic ID generation (same as mapper)
function hashString(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
  return (h >>> 0).toString(36);
}

export function cleanAndStabilizeSvg(svg: string): string {
  // Remove animation tags defensively
  svg = svg.replace(/<\/(?:animate|animateTransform|set)>/gi, '')
           .replace(/<\s*(animate|animateTransform|set)[^>]*>/gi, '');

  // Optimize with SVGO
  const res = optimize(svg, {
    multipass: true,
    plugins: [
      'preset-default',
      { name: 'removeEditorsNSData' },
      { name: 'removeScriptElement' },
      { name: 'removeUnknownsAndDefaults' }
    ]
  });
  let out = typeof res.data === 'string' ? res.data : svg;

  // Inject stable ids when missing for visible primitives
  const tagRegex = /<(rect|text|circle|image|path|g)([^>]*)(\/>|>)/gim;
  out = out.replace(tagRegex, (_m, tag: string, attrs: string, close: string) => {
    if (/\bid\s*=/.test(attrs)) return `<${tag}${attrs}${close}`; // keep existing
    const key = tag + '|' + attrs.replace(/\s+/g, ' ').trim();
    const id = tag.substring(0, 2) + '-' + hashString(key);
    return `<${tag} id="${id}"${attrs}${close}`;
  });

  return out;
}
