import * as THREE from "three";
import React from "react";
import { useLoader } from "@react-three/fiber";

const defaultSunDirection = new THREE.Vector3(-2, 0.5, 1.5).normalize();

function getEarthMat(sunDirection = defaultSunDirection) {
  const map = useLoader(THREE.TextureLoader, "./textures/earth-daymap-4k.jpg");
  // const nightMap = useLoader(THREE.TextureLoader, "./textures/earth-nightmap-4k.jpg");
  const cloudsMap = useLoader(THREE.TextureLoader, "./textures/earth-clouds-4k.jpg");
  const landMaskMap = useLoader(THREE.TextureLoader, "./textures/earth-landmask.jpg");

  const uniforms = {
    dayTexture:      { value: map },
    // nightTexture:    { value: nightMap },
    cloudsTexture:   { value: cloudsMap },
    landMaskTexture: { value: landMaskMap },
    sunDirection:    { value: sunDirection },
  };

  const vs = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * viewMatrix * modelPosition;
      vUv      = uv;
      vNormal  = (modelMatrix * vec4(normal, 0.0)).xyz;
      vPosition = modelPosition.xyz;
    }
  `;

  const fs = `
    uniform sampler2D dayTexture;
    uniform sampler2D cloudsTexture;
    uniform sampler2D landMaskTexture;
    uniform vec3 sunDirection;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec3 normal  = normalize(vNormal);
      vec3 viewDir = normalize(cameraPosition - vPosition);
      vec3 sunDir  = normalize(sunDirection);

      vec3  dayColor = texture2D(dayTexture, vUv).rgb;
      float landMask = texture2D(landMaskTexture, vUv).r;

      // Diffuse — single sun, sharp terminator, limb darkening
      float sunDot    = dot(sunDir, normal);
      float diffuse   = smoothstep(-0.05, 0.2, sunDot);
      float limb      = mix(0.45, 1.0, pow(clamp(dot(viewDir, normal), 0.0, 1.0), 0.5));
      float light     = diffuse * limb;

      vec3 color = dayColor * light;

      // Metallic sheen on continents only — Blinn-Phong, gold tint, dull metal
      vec3  halfDir = normalize(sunDir + viewDir);
      float spec    = pow(max(dot(halfDir, normal), 0.0), 32.0);
      spec         *= smoothstep(0.0, 0.25, sunDot);
      color        += vec3(1.0, 0.85, 0.35) * spec * landMask * 0.6;

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  return new THREE.ShaderMaterial({ uniforms, vertexShader: vs, fragmentShader: fs });
}

function EarthMaterial({ sunDirection }) {
  const material = React.useMemo(() => getEarthMat(sunDirection), []);
  return <primitive object={material} />;
}

export default EarthMaterial;
