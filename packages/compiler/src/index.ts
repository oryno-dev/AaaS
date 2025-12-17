import type { MotionIR, Track, ElementTrack, CameraTrack } from '@realify/motion-ir';
import type { ElementSchema } from '@realify/schemas';

export type FrameProps = {
  camera: { x: number; y: number; z: number; rotation: number };
  elements: Record<string, { x?: number; y?: number; opacity?: number; scale?: number; rotation?: number; textContent?: string }>;
};

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function interpKey<T extends Record<string, number | string | undefined>>(a: any, b: any, t: number) {
  const out: any = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const va = a[k];
    const vb = b[k];
    if (typeof va === 'number' && typeof vb === 'number') out[k] = lerp(va, vb, t);
    else out[k] = vb ?? va;
  }
  return out as T;
}

function easeFn(name?: string) {
  switch (name) {
    case 'easeIn': return (t: number) => t * t;
    case 'easeOut': return (t: number) => 1 - (1 - t) * (1 - t);
    case 'easeInOut': return (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    default: return (t: number) => t;
  }
}

function sampleTrack(track: Track, frame: number) {
  const kfs = track.keyframes.slice().sort((a, b) => a.frame - b.frame);
  if (frame <= kfs[0].frame) return kfs[0];
  if (frame >= kfs[kfs.length - 1].frame) return kfs[kfs.length - 1];
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i];
    const b = kfs[i + 1];
    if (frame >= a.frame && frame <= b.frame) {
      const lin = (frame - a.frame) / (b.frame - a.frame);
      const e = easeFn((b as any).easing || (a as any).easing);
      const t = e(lin);
      return interpKey(a, b, t);
    }
  }
  return kfs[kfs.length - 1];
}

export function makeFrameEvaluator(ir: MotionIR, elements: ElementSchema) {
  return function getFrameProps(frame: number): FrameProps {
    const camera: FrameProps['camera'] = { x: 0, y: 0, z: 1, rotation: 0 };
    const elProps: FrameProps['elements'] = {};

    for (const t of ir.tracks) {
      const k = sampleTrack(t, frame);
      if (t.kind === 'camera') {
        const ck = k as any;
        camera.x = ck.x ?? camera.x;
        camera.y = ck.y ?? camera.y;
        camera.z = ck.z ?? camera.z;
        camera.rotation = ck.rotation ?? camera.rotation;
      } else {
        const ek = k as any;
        const id = (t as any).targetId as string;
        elProps[id] = { ...elProps[id], ...ek };
      }
    }

    return { camera, elements: elProps };
  };
}
