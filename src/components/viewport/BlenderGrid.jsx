"use client";

import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/**
 * Unified Blender Viewport Ground Grid + Axis Lines
 * - Combines infinite ground grid and X/Z axis lines into ONE single shader material
 * - Permanently eliminates all z-fighting, clipping, and flickering between grid and axis lines
 * - Automatically respects 3D models and floor via depthTest={true} (models naturally occlude the lines)
 * - Renders Red (X) and Green (Z/Depth) axis lines using fwidth screen-space anti-aliasing
 * - Seamlessly fades opacity toward fadeDistance (disappearing together into the background fog)
 * - side={THREE.DoubleSide} ensures full visibility from above and below
 */
function BlenderUnifiedGrid({
  gridSize = 120,
  cellSize = 1,
  sectionSize = 5,
  fadeDistance = 120,
  fadeStrength = 1.0,
}) {
  const meshRef = useRef(null);
  const plane = useMemo(() => new THREE.Plane(), []);
  const upVector = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const zeroVector = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      extensions: {
        derivatives: true,
      },
      uniforms: {
        cellSize: { value: cellSize },
        sectionSize: { value: sectionSize },
        cellColor: { value: new THREE.Color("#4e4e53") },
        sectionColor: { value: new THREE.Color("#686870") },
        xAxisColor: { value: new THREE.Color("#e03535") },
        zAxisColor: { value: new THREE.Color("#52b536") },
        cellThickness: { value: 1.0 },
        sectionThickness: { value: 1.0 },
        axisThickness: { value: 0.9 },
        fadeDistance: { value: fadeDistance },
        fadeStrength: { value: fadeStrength },
        worldCamProjPosition: { value: new THREE.Vector3() },
        worldPlanePosition: { value: new THREE.Vector3() },
      },
      vertexShader: `
        varying vec3 vLocalPosition;
        varying vec4 vWorldPosition;

        uniform vec3 worldCamProjPosition;
        uniform vec3 worldPlanePosition;
        uniform float fadeDistance;

        void main() {
          vLocalPosition = position.xzy * (1.0 + fadeDistance);
          vWorldPosition = modelMatrix * vec4(vLocalPosition, 1.0);
          vWorldPosition.xyz += (worldCamProjPosition - worldPlanePosition);
          vLocalPosition = (inverse(modelMatrix) * vWorldPosition).xyz;

          gl_Position = projectionMatrix * viewMatrix * vWorldPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vLocalPosition;
        varying vec4 vWorldPosition;

        uniform vec3 worldCamProjPosition;
        uniform float cellSize;
        uniform float sectionSize;
        uniform vec3 cellColor;
        uniform vec3 sectionColor;
        uniform vec3 xAxisColor;
        uniform vec3 zAxisColor;
        uniform float cellThickness;
        uniform float sectionThickness;
        uniform float axisThickness;
        uniform float fadeDistance;
        uniform float fadeStrength;

        float getGrid(float size, float thickness) {
          vec2 r = vLocalPosition.xz / size;
          vec2 grid = abs(fract(r - 0.5) - 0.5) / fwidth(r);
          float line = min(grid.x, grid.y) + 1.0 - thickness;
          return 1.0 - min(line, 1.0);
        }

        void main() {
          // 1. Grid lines (minor 1m cells and major 5m sections)
          float g1 = getGrid(cellSize, cellThickness);
          float g2 = getGrid(sectionSize, sectionThickness);

          // 2. Axis lines with sub-pixel antialiasing (Red X on z=0, Green Z on x=0)
          float fz = fwidth(vLocalPosition.z);
          float distZ = abs(vLocalPosition.z);
          float axisX = 1.0 - smoothstep(axisThickness * fz * 0.2, axisThickness * fz * 0.9, distZ);

          float fx = fwidth(vLocalPosition.x);
          float distX = abs(vLocalPosition.x);
          float axisZ = 1.0 - smoothstep(axisThickness * fx * 0.2, axisThickness * fx * 0.9, distX);

          float gridTotal = g1 + g2;
          float axisTotal = max(axisX, axisZ);
          if (gridTotal <= 0.001 && axisTotal <= 0.001) discard;

          // 3. Distance fade (Névoa)
          float dist = distance(worldCamProjPosition, vWorldPosition.xyz);
          float d = clamp(1.0 - (dist / fadeDistance), 0.0, 1.0);
          float fade = pow(d, fadeStrength);

          if (fade <= 0.001) discard;

          // 4. Color blending
          vec3 color = mix(cellColor, sectionColor, min(1.0, sectionThickness * g2));
          float alpha = gridTotal * fade;
          alpha = mix(0.75 * alpha, alpha, g2);

          // If on axis line, smoothly blend vibrant Red/Green over grid
          if (axisTotal > 0.001) {
            vec3 axisColor = axisX > axisZ ? xAxisColor : zAxisColor;
            if (axisX > 0.0 && axisZ > 0.0) {
              axisColor = mix(zAxisColor, xAxisColor, axisX / (axisX + axisZ));
            }
            color = mix(color, axisColor, axisTotal);
            alpha = max(alpha, axisTotal * fade);
          }

          if (alpha <= 0.0) discard;

          gl_FragColor = vec4(color, alpha);

          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
  }, [cellSize, sectionSize, fadeDistance, fadeStrength]);

  useEffect(() => {
    if (material) {
      material.uniforms.cellSize.value = cellSize;
      material.uniforms.sectionSize.value = sectionSize;
      material.uniforms.fadeDistance.value = fadeDistance;
      material.uniforms.fadeStrength.value = fadeStrength;
    }
  }, [material, cellSize, sectionSize, fadeDistance, fadeStrength]);

  useFrame((state) => {
    if (!meshRef.current || !material) return;
    plane
      .setFromNormalAndCoplanarPoint(upVector, zeroVector)
      .applyMatrix4(meshRef.current.matrixWorld);
    plane.projectPoint(state.camera.position, material.uniforms.worldCamProjPosition.value);
    material.uniforms.worldPlanePosition.value.set(0, 0, 0).applyMatrix4(meshRef.current.matrixWorld);
  });

  return (
    <mesh
      ref={meshRef}
      frustumCulled={false}
      position={[0, -0.0005, 0]}
      renderOrder={0}
      material={material}
      raycast={() => null}
    >
      <planeGeometry args={[gridSize, gridSize]} />
    </mesh>
  );
}

/**
 * 3D Cursor at Origin (Blender Style)
 * Red/white dashed ring with crosshair lines.
 */
function BlenderCursor() {
  const crosshairGeo = useMemo(() => {
    const pts = [
      // X crosshair
      new THREE.Vector3(-0.35, 0, 0),
      new THREE.Vector3(0.35, 0, 0),
      // Z crosshair
      new THREE.Vector3(0, 0, -0.35),
      new THREE.Vector3(0, 0, 0.35),
      // Y crosshair (vertical)
      new THREE.Vector3(0, -0.35, 0),
      new THREE.Vector3(0, 0.35, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  return (
    <group position={[0, 0.001, 0]}>
      {/* Outer dashed ring (Blender Red & White) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={10}>
        <ringGeometry args={[0.22, 0.25, 48]} />
        <meshBasicMaterial
          color="#ea3838"
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={10}>
        <ringGeometry args={[0.25, 0.27, 48]} />
        <meshBasicMaterial
          color="#ffffff"
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Crosshair Lines */}
      <lineSegments geometry={crosshairGeo} renderOrder={10}>
        <lineBasicMaterial
          color="#18181b"
          depthWrite={false}
          transparent
          opacity={0.8}
        />
      </lineSegments>

      {/* Center dot */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={10}>
        <circleGeometry args={[0.03, 16]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

/**
 * Blender Ground Grid
 * Exact colors matching Blender's 3D Viewport Theme:
 * - Neutral gray floor
 * - Visible, high-contrast sub-grid & major grid
 * - Vibrant Red (X) and Green (Y/Z depth) axis lines fading into the distance fog
 * - Iconic 3D Cursor at (0, 0, 0)
 */
export default function BlenderGrid({
  gridSize = 120,
  cellSize = 1,
  sectionSize = 5,
  fadeDistance = 120,
}) {
  return (
    <group position={[0, 0, 0]}>
      {/* Unified Infinite Floor Grid with integrated Red & Green Axis Lines */}
      <BlenderUnifiedGrid
        gridSize={gridSize}
        cellSize={cellSize}
        sectionSize={sectionSize}
        fadeDistance={fadeDistance}
        fadeStrength={1.0}
      />

      {/* Blender 3D Cursor at Center */}
      <BlenderCursor />
    </group>
  );
}
