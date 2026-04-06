import * as THREE from "three";
import React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
// import Nebula from "./Nebula";
// import Starfield from "./Starfield";
import EarthMaterial from "./EarthMaterial";
import AtmosphereMesh from "./AtmosphereMesh";

const sunDirection = new THREE.Vector3(-2, 0.5, 1.5);
const _right = new THREE.Vector3();
const _up = new THREE.Vector3();

function Earth() {
  const ref = React.useRef();

  useFrame(({ camera }) => {
    ref.current.rotation.y += 0.001;
    // Light offset upper-right from camera by ~45 degrees
    _right.setFromMatrixColumn(camera.matrix, 0);
    _up.setFromMatrixColumn(camera.matrix, 1);
    sunDirection
      .copy(camera.position)
      .addScaledVector(_right, 3)
      .addScaledVector(_up, 3)
      .normalize();
  });
  const axialTilt = 23.4 * Math.PI / 180;
  return (
    <group rotation-z={axialTilt}>
      <mesh ref={ref}>
        <icosahedronGeometry args={[2, 64]} />
        <EarthMaterial sunDirection={sunDirection}/>
        <AtmosphereMesh />
      </mesh>
    </group>
  );
}

function App() {
  return (
    <Canvas 
      camera={{ position: [0, 0.1, 5]}}
      gl={{ toneMapping: THREE.NoToneMapping 
    }}>
      <color attach="background" args={["black"]} />
      <Earth />
      {/* <Nebula /> */}
      {/* <Starfield /> */}
      <OrbitControls />
    </Canvas>
  );
}

export default App;
