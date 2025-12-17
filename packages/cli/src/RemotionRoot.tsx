import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Video } from './Video.js';

export const RemotionRoot: React.FC = () => {
  const width = 1280;
  const height = 720;
  const durationInFrames = 300;
  const fps = 30;
  const svg = '';
  return (
    <>
      <Composition
        id="RealifyVideo"
        component={Video as React.FC<any>}
        durationInFrames={durationInFrames}
        fps={fps}
        width={width}
        height={height}
        defaultProps={{ svg }}
      />
    </>
  );
};

registerRoot(RemotionRoot);
