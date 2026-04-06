import * as THREE from "three";
import React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import EarthMaterial from "./EarthMaterial";
import AtmosphereMesh from "./AtmosphereMesh";

// Pre-allocated vectors — mutated each frame, passed by reference into shader uniforms
const keyLightDir     = new THREE.Vector3(); // main key: right, 45° down
const fillLightDir    = new THREE.Vector3(); // fill: left, 45° down, warmer
const bounceLightDir  = new THREE.Vector3(); // bounce: soft from below
const contourLightDir = new THREE.Vector3(); // contour/rim: upper-right, from behind
const _right          = new THREE.Vector3();
const _up             = new THREE.Vector3();

function Earth() {
  const ref = React.useRef();

  useFrame(({ camera }) => {
    ref.current.rotation.y += 0.001;

    _right.setFromMatrixColumn(camera.matrix, 0);
    _up.setFromMatrixColumn(camera.matrix, 1);

    // Key: right side, high above globe, pointing down
    keyLightDir.copy(camera.position).addScaledVector(_right, 3).addScaledVector(_up, 7).normalize();

    // Fill: left side, high above globe, pointing down (warmer, handled in shader)
    fillLightDir.copy(camera.position).addScaledVector(_right, -3).addScaledVector(_up, 7).normalize();

    // Bounce: soft from below
    bounceLightDir.copy(camera.position).addScaledVector(_up, -8).normalize();

    // Contour: behind the sphere, upper-right — rim on the silhouette edge
    contourLightDir.copy(camera.position).negate().addScaledVector(_right, 2).addScaledVector(_up, 3).normalize();
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[2, 64]} />
      <EarthMaterial
        keyLightDir={keyLightDir}
        fillLightDir={fillLightDir}
        bounceLightDir={bounceLightDir}
        contourLightDir={contourLightDir}
      />
      <AtmosphereMesh />
    </mesh>
  );
}

function App() {
  return (
    <Canvas
      camera={{ position: [0, 0.1, 5] }}
      gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}>
      <color attach="background" args={["black"]} />
      <Earth />
      <OrbitControls minPolarAngle={Math.PI / 2} maxPolarAngle={Math.PI / 2} />
    </Canvas>
  );
}

export default App;
