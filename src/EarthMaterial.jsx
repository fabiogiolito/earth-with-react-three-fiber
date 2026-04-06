import * as THREE from "three";
import React from "react";
import { useLoader } from "@react-three/fiber";

const defaultDir = new THREE.Vector3(0, 0, 1);

function getEarthMat({ keyLightDir, contourLightDir }) {
  const map         = useLoader(THREE.TextureLoader, "./textures/earth-daymap-4k.jpg");
  const cloudsMap   = useLoader(THREE.TextureLoader, "./textures/earth-clouds-4k.jpg");
  const landMaskMap = useLoader(THREE.TextureLoader, "./textures/earth-landmask.jpg");

  const uniforms = {
    dayTexture:      { value: map },
    cloudsTexture:   { value: cloudsMap },
    landMaskTexture: { value: landMaskMap },
    keyLightDir:     { value: keyLightDir     ?? defaultDir },
    contourLightDir: { value: contourLightDir ?? defaultDir },
  };

  const vs = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * viewMatrix * modelPosition;
      vUv       = uv;
      vNormal   = (modelMatrix * vec4(normal, 0.0)).xyz;
      vPosition = modelPosition.xyz;
    }
  `;

  const fs = `
    uniform sampler2D dayTexture;
    uniform sampler2D cloudsTexture;
    uniform sampler2D landMaskTexture;
    uniform vec3 keyLightDir;
    uniform vec3 contourLightDir;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec3  normal   = normalize(vNormal);
      vec3  viewDir  = normalize(cameraPosition - vPosition);
      float facing   = clamp(dot(viewDir, normal), 0.0, 1.0);

      vec3  dayColor = texture2D(dayTexture, vUv).rgb;
      float landMask = texture2D(landMaskTexture, vUv).r;

      // Key light — smooth diffuse, no hard terminator
      float keyDot     = dot(keyLightDir, normal);
      float keyDiffuse = pow(max(keyDot, 0.0), 0.8);

      // Warm ambient constant — keeps shadow side dark but faintly visible
      // Reference: shadow side is nearly black with a hint of warm amber
      vec3 warmAmbient = vec3(0.05, 0.03, 0.01);

      vec3 color = dayColor * (keyDiffuse + warmAmbient);

      // Metallic specular on continents — moderate spread, warm gold
      vec3  keyHalf = normalize(keyLightDir + viewDir);
      float spec    = pow(max(dot(keyHalf, normal), 0.0), 38.0);
      spec *= max(keyDot, 0.0);
      color += vec3(1.00, 0.84, 0.28) * spec * landMask * 1.1;

      // Contour: very subtle rim on the back-lit silhouette
      float contourDot = max(dot(contourLightDir, normal), 0.0);
      float rimWeight  = pow(1.0 - facing, 3.5);
      color += vec3(1.00, 0.88, 0.60) * contourDot * rimWeight * 0.6;

      // Strong Fresnel edge darkening — reference shows edges going quite dark
      color *= mix(0.08, 1.0, pow(facing, 2.5));

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  return new THREE.ShaderMaterial({ uniforms, vertexShader: vs, fragmentShader: fs });
}

function EarthMaterial(props) {
  const material = React.useMemo(() => getEarthMat(props), []);
  return <primitive object={material} />;
}

export default EarthMaterial;
