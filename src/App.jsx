import * as THREE from "three";
import React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import EarthMaterial from "./EarthMaterial";
import AtmosphereMesh from "./AtmosphereMesh";

const keyLightDir     = new THREE.Vector3();
const contourLightDir = new THREE.Vector3();
const _right          = new THREE.Vector3();
const _up             = new THREE.Vector3();

function Earth() {
  const ref = React.useRef();

  useFrame(({ camera }) => {
    ref.current.rotation.y += 0.001;

    _right.setFromMatrixColumn(camera.matrix, 0);
    _up.setFromMatrixColumn(camera.matrix, 1);

    // Key: upper-right from camera — ~30° right, ~45° above
    keyLightDir.copy(camera.position)
      .addScaledVector(_right, 1.5)
      .addScaledVector(_up, 3)
      .normalize();

    // Contour: behind the sphere, upper-right — subtle rim definition
    contourLightDir.copy(camera.position).negate()
      .addScaledVector(_right, 1.5)
      .addScaledVector(_up, 2)
      .normalize();
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[2, 64]} />
      <EarthMaterial keyLightDir={keyLightDir} contourLightDir={contourLightDir} />
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
