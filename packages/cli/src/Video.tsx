import React from 'react';
import { useCurrentFrame } from 'remotion';
import { makeFrameEvaluator, FrameProps } from '@realify/compiler';
import type { MotionIR } from '@realify/motion-ir';
import type { ElementSchema } from '@realify/schemas';

export const makeVideoComponent = (ir: MotionIR, elements: ElementSchema) => {
  const evalFrame = makeFrameEvaluator(ir, elements);
  const width = elements.meta.width;
  const height = elements.meta.height;

  const VideoInner: React.FC<{ svg: string }> = ({ svg }) => {
    const frame = useCurrentFrame();
    const props: FrameProps = evalFrame(frame);
    const t = `translate(${-props.camera.x}px, ${-props.camera.y}px) scale(${props.camera.z}) rotate(${props.camera.rotation}deg)`;
    return (
      <div style={{width, height, overflow: 'hidden'}}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <g style={{ transform: t, transformOrigin: '0 0' }}>
            <g dangerouslySetInnerHTML={{ __html: svg }} />
          </g>
        </svg>
      </div>
    );
  };
  return VideoInner;
};

export const Video: React.FC<{ svg?: string }> = () => {
  // Placeholder if not bound; replaced at runtime by makeVideoComponent
  return React.createElement('div', null, 'bind with makeVideoComponent');
};
