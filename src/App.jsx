import * as THREE from "three";
import React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
// import Nebula from "./Nebula";
// import Starfield from "./Starfield";
import EarthMaterial from "./EarthMaterial";
import AtmosphereMesh from "./AtmosphereMesh";

const sunDirection = new THREE.Vector3(-2, 0.5, 1.5);
const _lightOffset = new THREE.Vector3(4, 4, 0);

function Earth() {
  const ref = React.useRef();

  useFrame(({ camera }) => {
    ref.current.rotation.y += 0.001;
    // Light offset 45 degrees on world XY plane from camera position
    sunDirection.copy(camera.position).add(_lightOffset).normalize();
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
