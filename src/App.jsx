import * as THREE from "three";
import React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
// import Nebula from "./Nebula";
// import Starfield from "./Starfield";
import EarthMaterial from "./EarthMaterial";
import AtmosphereMesh from "./AtmosphereMesh";

const sunDirection = new THREE.Vector3();

function Earth() {
  const ref = React.useRef();

  useFrame(({ camera }) => {
    ref.current.rotation.y += 0.001;
    // Sun fixed relative to camera — always illuminates the visible hemisphere
    sunDirection.copy(camera.position).normalize();
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
