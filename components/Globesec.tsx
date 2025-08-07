// components/Globe.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';

const GlobeComponent = () => {
  const globeRef = useRef<any>(null);

  useEffect(() => {
    if (!globeRef.current) return;

    const controls = globeRef.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1;
    globeRef.current.pointOfView({ altitude: 2.5 }, 0);
  }, []);

  return (
    <div className="w-80 h-80 relative rounded-full shadow-[0_0_60px_rgba(124,58,237,0.3)] p-2">
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundColor="rgba(0,0,0,0)"
        width={320}
        height={320}
      />
    </div>
  );
};

export default GlobeComponent;
