import * as THREE from "three";
import React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
// import Nebula from "./Nebula";
// import Starfield from "./Starfield";
import EarthMaterial from "./EarthMaterial";
import AtmosphereMesh from "./AtmosphereMesh";

const sunDirection = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3();

function Earth() {
  const ref = React.useRef();

  useFrame(({ camera }) => {
    ref.current.rotation.y += 0.001;
    // Sun offset: higher above and to the right relative to camera
    _right.setFromMatrixColumn(camera.matrix, 0);
    _up.setFromMatrixColumn(camera.matrix, 1);
    sunDirection
      .copy(camera.position)
      .addScaledVector(_right, 2)
      .addScaledVector(_up, 4)
      .normalize();
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[2, 64]} />
      <EarthMaterial sunDirection={sunDirection}/>
      <AtmosphereMesh />
    </mesh>
  );
}

function App() {
  return (
    <Canvas 
      camera={{ position: [0, 0.1, 5]}}
      gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}>
      <color attach="background" args={["black"]} />
      <Earth />
      {/* <Nebula /> */}
      {/* <Starfield /> */}
      <OrbitControls minPolarAngle={Math.PI / 2} maxPolarAngle={Math.PI / 2} />
    </Canvas>
  );
}

export default App;
