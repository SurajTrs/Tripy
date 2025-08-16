// components/Globe.tsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Globe component to avoid SSR issues
const Globe = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: () => (
    <div className="w-80 h-80 relative rounded-full shadow-[0_0_60px_rgba(124,58,237,0.3)] p-2 flex items-center justify-center bg-gradient-to-br from-violet-600 to-purple-600">
      <div className="text-white text-lg font-semibold">Loading Globe...</div>
    </div>
  )
});

const GlobeComponent = () => {
  const globeRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!globeRef.current || !isClient) return;

    const controls = globeRef.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1;
    globeRef.current.pointOfView({ altitude: 2.5 }, 0);
  }, [isClient]);

  if (!isClient) {
    return (
      <div className="w-80 h-80 relative rounded-full shadow-[0_0_60px_rgba(124,58,237,0.3)] p-2 flex items-center justify-center bg-gradient-to-br from-violet-600 to-purple-600">
        <div className="text-white text-lg font-semibold">Loading Globe...</div>
      </div>
    );
  }

  return (
    <div className="w-80 h-80 relative rounded-full shadow-[0_0_60px_rgba(124,58,237,0.3)] p-2">
      <Globe
        ref={globeRef}
        globeImageUrl="/images/earth-night.jpg"
        backgroundColor="rgba(0,0,0,0)"
        width={320}
        height={320}
      />
    </div>
  );
};

export default GlobeComponent;
