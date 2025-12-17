import React from 'react';
import { useCurrentFrame } from 'remotion';
import { makeFrameEvaluator } from '@realify/compiler';
import elementsJson from '../../../../packages/schemas/examples/simple-ui.json';

// Minimal mock IR to demo camera
const ir = {
  timeline: 120,
  tracks: [
    { kind: 'camera', keyframes: [ { frame: 0, x: 0, y: 0, z: 1 }, { frame: 60, x: 200, y: 200, z: 2 } ] }
  ]
};

const evalFrame = makeFrameEvaluator(ir as any, elementsJson as any);

export const Composition: React.FC = () => {
  const frame = useCurrentFrame();
  const props = evalFrame(frame);
  const t = `translate(${-props.camera.x}px, ${-props.camera.y}px) scale(${props.camera.z}) rotate(${props.camera.rotation}deg)`;
  return (
    <div style={{ transform: t, transformOrigin: '0 0' }}>
      {/* Render static SVG layers (placeholder). In real app, include cleaned SVG and map elements to layers) */}
      <svg width={elementsJson.meta.width} height={elementsJson.meta.height} viewBox={`0 0 ${elementsJson.meta.width} ${elementsJson.meta.height}`}>
        {elementsJson.elements.map((el) => (
          <rect key={el.id} x={el.bbox.x} y={el.bbox.y} width={el.bbox.width} height={el.bbox.height} fill="rgba(0,0,0,0.1)" stroke="#555" />
        ))}
      </svg>
    </div>
  );
};
