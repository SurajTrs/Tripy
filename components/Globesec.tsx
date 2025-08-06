// components/Globe.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import Globe from 'react-globe.gl';

const GlobeComponent = () => {
  const globeEl = useRef<any>();

  useEffect(() => {
    if (!globeEl.current) return;

    globeEl.current.controls().autoRotate = true;
    globeEl.current.controls().autoRotateSpeed = 1;
    globeEl.current.pointOfView({ altitude: 2.5 }, 0);
  }, []);

  return (
    <div className="w-80 h-80 relative rounded-full shadow-[0_0_60px_rgba(124,58,237,0.3)] p-2">
      <Globe
        ref={globeEl}
globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"        backgroundColor="rgba(0,0,0,0)"
        width={320}
        height={320}
      />
    </div>
  );
};

export default GlobeComponent;
