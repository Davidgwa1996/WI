import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Stars, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Animated particles (floating dots)
function ParticleField() {
  const points = useRef();
  const particlesCount = 2000;
  const positions = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      pos[i*3] = (Math.random() - 0.5) * 200;
      pos[i*3+1] = (Math.random() - 0.5) * 100;
      pos[i*3+2] = (Math.random() - 0.5) * 100 - 50;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      points.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.2;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particlesCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#06b6d4" size={0.2} transparent opacity={0.6} />
    </points>
  );
}

// A glowing central sphere
function GlowSphere() {
  const meshRef = useRef();
  useFrame((state) => {
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.1;
  });
  return (
    <Sphere ref={meshRef} args={[2.5, 64, 64]} position={[0, 0, 0]}>
      <meshStandardMaterial color="#0891b2" emissive="#06b6d4" emissiveIntensity={0.8} metalness={0.9} roughness={0.2} />
    </Sphere>
  );
}

export default function Background3D() {
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10">
      <Canvas camera={{ position: [0, 0, 12], fov: 60 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <GlowSphere />
        <ParticleField />
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}