import * as THREE from "three";
import React from "react";
import { useLoader, useFrame } from "@react-three/fiber";

const defaultSunDirection = new THREE.Vector3(-2, 0.5, 1.5).normalize();

function getEarthMat(sunDirection = defaultSunDirection) {
  const map = useLoader(
    THREE.TextureLoader,
    "./textures/earth-daymap-4k.jpg"
  );
  // const nightMap = useLoader(
  //   THREE.TextureLoader,
  //   "./textures/earth-nightmap-4k.jpg"
  // );
  const cloudsMap = useLoader(
    THREE.TextureLoader,
    "./textures/earth-clouds-4k.jpg"
  );
  const landMaskMap = useLoader(
    THREE.TextureLoader,
    "./textures/earth-landmask.jpg"
  );

  const uniforms = {
    dayTexture: { value: map },
    // nightTexture: { value: nightMap },
    cloudsTexture: { value: cloudsMap },
    landMaskTexture: { value: landMaskMap },
    sunDirection: { value: sunDirection },
    iTime: { value: 0 },
  };

  const vs = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * viewMatrix * modelPosition;
      vec3 modelNormal = (modelMatrix * vec4(normal, 0.0)).xyz;
      vUv = uv;
      vNormal = modelNormal;
      vPosition = modelPosition.xyz;
    }
  `;

  const fs = `
    #define PI  3.141592654
    #define TAU (2.0*PI)

    uniform sampler2D dayTexture;
    // uniform sampler2D nightTexture;
    uniform sampler2D cloudsTexture;
    uniform sampler2D landMaskTexture;
    uniform vec3 sunDirection;
    uniform float iTime;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    // ---- Gold shader helpers ----

    void rot(inout vec2 p, float a) {
      float c = cos(a), s = sin(a);
      p = vec2(c*p.x + s*p.y, -s*p.x + c*p.y);
    }
    float hash(in vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 58.233))) * 13758.5453);
    }
    float psin(float a) { return 0.5 + 0.5*sin(a); }
    float tanh_approx(float x) {
      float x2 = x*x;
      return clamp(x*(27.0 + x2) / (27.0 + 9.0*x2), -1.0, 1.0);
    }
    float onoise(vec2 x) {
      x *= 0.5;
      float a = sin(x.x), b = sin(x.y);
      return mix(a, b, psin(TAU * tanh_approx(a*b + a + b)));
    }
    float vnoise(vec2 x) {
      vec2 i = floor(x), w = fract(x);
      vec2 u = w*w*w*(w*(w*6.0 - 15.0) + 10.0);
      float a = hash(i), b = hash(i + vec2(1,0)), c = hash(i + vec2(0,1)), d = hash(i + vec2(1,1));
      return a + (b-a)*u.x + (c-a)*u.y + (d-c+a-b)*u.x*u.y;
    }
    float fbm1(vec2 p) {
      vec2 op = p; const float aa = 0.45, pp = 2.03, rr = 1.2; const vec2 oo = -vec2(1.23, 1.5);
      float h = 0., d = 0., a = 1.;
      for (int i = 0; i < 4; ++i) { h += a*onoise(p); d += a; a *= aa; p += oo; p *= pp; rot(p, rr); }
      return mix(h/d, -0.5*(h/d), pow(vnoise(0.9*op), 0.25));
    }
    float fbm2(vec2 p) {
      vec2 op = p; const float aa = 0.45, pp = 2.03, rr = 1.2; const vec2 oo = -vec2(1.23, 1.5);
      float h = 0., d = 0., a = 1.;
      for (int i = 0; i < 5; ++i) { h += a*onoise(p); d += a; a *= aa; p += oo; p *= pp; rot(p, rr); }
      return mix(h/d, -0.5*(h/d), pow(vnoise(0.9*op), 0.25));
    }
    float fbm3(vec2 p) {
      vec2 op = p; const float aa = 0.45, pp = 2.03, rr = 1.2; const vec2 oo = -vec2(1.23, 1.5);
      float h = 0., d = 0., a = 1.;
      for (int i = 0; i < 3; ++i) { h += a*onoise(p); d += a; a *= aa; p += oo; p *= pp; rot(p, rr); }
      return mix(h/d, -0.5*(h/d), pow(vnoise(0.9*op), 0.25));
    }
    float warp(vec2 p) {
      vec2 v = vec2(fbm1(p), fbm1(p + 0.7*vec2(1,1)));
      rot(v, 1.0 + iTime*0.04);
      vec2 vv = vec2(fbm2(p + 3.7*v), fbm2(p - 2.7*v.yx + 0.7*vec2(1,1)));
      rot(vv, -1.0 + iTime*0.018);
      return fbm3(p + 9.0*vv);
    }
    float goldHeight(vec2 p) {
      float a = 0.0009 * iTime;
      p += 9.0 * vec2(cos(a), sin(a));
      p *= 2.0; p += 13.0;
      float h = warp(p);
      return 0.35 * tanh_approx(3.0*h) / 3.0;
    }
    vec3 goldNormal(vec2 p) {
      const float eps = 0.002;
      vec3 n;
      n.x = goldHeight(p + vec2(eps, 0.0)) - goldHeight(p - vec2(eps, 0.0));
      n.y = 2.0 * eps;
      n.z = goldHeight(p + vec2(0.0, eps)) - goldHeight(p - vec2(0.0, eps));
      return normalize(n);
    }
    vec3 goldTonemap(vec3 c) {
      float lum = dot(c, vec3(0.213, 0.715, 0.072));
      float lum2 = lum / (1.0 + lum);
      return c * (lum > 0.0 ? lum2/lum : 1.0);
    }
    vec3 computeGold(vec2 uv) {
      // Map UV to aspect-corrected centered coords (sphere UVs are 2:1 ratio)
      vec2 p = uv * 2.0 - 1.0;
      p.x *= 2.0;

      const vec3 lp1 = vec3(2.1, -0.5, -0.1);
      const vec3 lp2 = vec3(-2.1, -0.5, -0.1);

      float h = goldHeight(p);
      vec3 pp = vec3(p.x, h, p.y);
      vec3 ld1 = normalize(lp1 - pp);
      vec3 ld2 = normalize(lp2 - pp);

      vec3 n = goldNormal(p);
      float diff1 = max(dot(ld1, n), 0.0);
      float diff2 = max(dot(ld2, n), 0.0);

      vec3 goldBright = vec3(1.00, 0.78, 0.18);
      vec3 goldMid    = vec3(0.82, 0.50, 0.04);
      vec3 goldDark   = vec3(0.28, 0.10, 0.01);
      vec3 specCol    = vec3(1.00, 0.88, 0.40);

      float shadowMask = clamp(h*6.0, 0.0, 1.0) * clamp(1.0 - n.y*3.0, 0.0, 1.0);

      vec3 col = goldDark;
      col += goldMid    * 0.70 * pow(diff1, 1.0);
      col += goldBright * 0.80 * pow(diff1, 3.0);
      col += goldDark   * 0.40 * pow(diff2, 1.0);
      col += goldMid    * 0.35 * pow(diff2, 2.0);
      col += specCol    * 0.60 * pow(diff1, 10.0);
      col += specCol    * 0.25 * pow(diff2,  7.0);
      col += goldBright * shadowMask * 0.5;

      col = goldTonemap(col);
      col = pow(clamp(col, 0.0, 1.0), vec3(0.85));
      return col;
    }

    // Overlay blend: lets base texture show through the gold
    vec3 overlayBlend(vec3 base, vec3 blend) {
      return vec3(
        base.r < 0.5 ? 2.0*base.r*blend.r : 1.0 - 2.0*(1.0-base.r)*(1.0-blend.r),
        base.g < 0.5 ? 2.0*base.g*blend.g : 1.0 - 2.0*(1.0-base.g)*(1.0-blend.g),
        base.b < 0.5 ? 2.0*base.b*blend.b : 1.0 - 2.0*(1.0-base.b)*(1.0-blend.b)
      );
    }

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(cameraPosition - vPosition);
      vec3 sunDir = normalize(sunDirection);

      vec3 dayColor = texture(dayTexture, vUv).rgb;

      // Land mask from dedicated B&W texture (white = land, black = ocean)
      float landMask = texture(landMaskTexture, vUv).r;

      // Gold effect overlaid on day texture, showing texture through
      vec3 goldColor = computeGold(vUv);
      vec3 blended = overlayBlend(dayColor, goldColor);
      vec3 color = mix(dayColor, blended, landMask * 0.55);

      // Single sun source — sharp terminator with slight penumbra
      float sunDot = dot(sunDir, normal);
      float light = smoothstep(-0.05, 0.2, sunDot);

      // Limb darkening: edges of the lit side dim toward the terminator
      float rim = pow(clamp(dot(viewDir, normal), 0.0, 1.0), 0.5);
      light *= mix(0.5, 1.0, rim);

      color *= light;

      // Metallic specular on continents — Blinn-Phong, gold tint, tight highlight
      vec3 halfDir = normalize(sunDir + viewDir);
      float spec = pow(max(dot(halfDir, normal), 0.0), 128.0);
      spec *= smoothstep(0.0, 0.3, sunDot); // only on lit side
      color += vec3(1.0, 0.82, 0.28) * spec * landMask * 2.5;

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vs,
    fragmentShader: fs,
  });
  return material;
}

function EarthMaterial({ sunDirection }) {
  const material = React.useMemo(() => getEarthMat(sunDirection), []);

  useFrame(({ clock }) => {
    material.uniforms.iTime.value = clock.getElapsedTime();
  });

  return <primitive object={material} />;
}

export default EarthMaterial;
