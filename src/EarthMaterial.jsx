import * as THREE from "three";
import React from "react";
import { useLoader } from "@react-three/fiber";

const defaultDir = new THREE.Vector3(0, 0, 1);

function getEarthMat({ keyLightDir, fillLightDir, bounceLightDir, contourLightDir }) {
  const map        = useLoader(THREE.TextureLoader, "./textures/earth-daymap-4k.jpg");
  const cloudsMap  = useLoader(THREE.TextureLoader, "./textures/earth-clouds-4k.jpg");
  const landMaskMap = useLoader(THREE.TextureLoader, "./textures/earth-landmask.jpg");

  const uniforms = {
    dayTexture:      { value: map },
    cloudsTexture:   { value: cloudsMap },
    landMaskTexture: { value: landMaskMap },
    keyLightDir:     { value: keyLightDir     ?? defaultDir },
    fillLightDir:    { value: fillLightDir    ?? defaultDir },
    bounceLightDir:  { value: bounceLightDir  ?? defaultDir },
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
    uniform vec3 fillLightDir;
    uniform vec3 bounceLightDir;
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

      // --- Key light: hard terminator, main illumination ---
      float keyDot     = dot(keyLightDir, normal);
      float keyDiffuse = smoothstep(-0.01, 0.06, keyDot)   // hard terminator
                       * mix(0.02, 1.0, pow(facing, 0.8)); // limb falloff

      // --- Fill light: warm, soft, no sharp terminator ---
      float fillDiffuse = max(dot(fillLightDir, normal), 0.0) * 0.30;

      // --- Bounce light: cool, very soft, from below ---
      float bounceDiffuse = max(dot(bounceLightDir, normal), 0.0) * 0.10;

      vec3 color = dayColor * (keyDiffuse + fillDiffuse + bounceDiffuse);

      // --- Key specular: metallic sheen on continents ---
      vec3  keyHalf = normalize(keyLightDir + viewDir);
      float keySpec = pow(max(dot(keyHalf, normal), 0.0), 48.0);
      keySpec *= smoothstep(0.0, 0.1, keyDot);
      color += vec3(1.00, 0.82, 0.25) * keySpec * landMask * 1.8;

      // --- Contour light: rim highlight on silhouette edge ---
      float contourDot = max(dot(contourLightDir, normal), 0.0);
      float rimWeight  = pow(1.0 - facing, 3.0); // concentrated at the edge
      color += vec3(1.00, 0.93, 0.75) * contourDot * rimWeight * 1.8;

      // --- Subtle edge falloff for depth ---
      color *= mix(0.65, 1.0, pow(facing, 2.0));

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
