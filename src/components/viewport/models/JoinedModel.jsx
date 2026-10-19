"use client";

import React from "react";
import WallModel from "./WallModel";
import BarModel from "./BarModel";
import CubeModel from "./CubeModel";
import FloorModel from "./FloorModel";

/**
 * JoinedModel (Modelo Combinado / União de Peças)
 * Renderiza múltiplas geometrias unidas como um único corpo tridimensional.
 *
 * Props:
 * - parts: Array de peças unidas com transforms locais relativos ao centro do modelo.
 */
export default function JoinedModel({ parts = [] }) {
  if (!parts || parts.length === 0) return null;

  return (
    <group>
      {parts.map((part, index) => {
        const key = part.id || `part-${index}`;
        const pos = part.position || [0, 0, 0];
        const rot = part.rotation || [0, 0, 0];
        const scl = part.scale || [1, 1, 1];

        return (
          <group key={key} position={pos} rotation={rot} scale={scl}>
            {part.type === "wall" && <WallModel {...part.props} />}
            {part.type === "bar" && <BarModel {...part.props} />}
            {part.type === "cube" && <CubeModel {...part.props} />}
            {part.type === "floor" && <FloorModel {...part.props} />}
            {part.type === "joined" && <JoinedModel {...part.props} />}
          </group>
        );
      })}
    </group>
  );
}
