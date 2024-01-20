// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React, { useEffect, useRef } from "react";
import "./Scene.css";
import { socket } from "../../client-socket";
import { GameStateSerialized } from "../../../../shared/serialized";

// we want to update our scene directly through the DOM, since React re-renders are much slower
type Props = Record<string, never>; // so don't allow any props since they trigger re-renders

const Scene = (props: Props) => {
  const cameraFeedRef = useRef();

  // Request rear-facing camera permissions
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'environment', // Use 'environment' for rear-facing camera
    }
    }).then((stream) => {
      // Set the video stream as the source for the video element
      cameraFeedRef.current.srcObject = stream;
    }).catch((error) => {
      console.error('Error accessing rear-facing camera:', error);
    });
  }, []);

  const enemiesRef = useRef();
  const alliesRef = useRef();

  const entities = {
    players: new Map<string, HTMLElement>(),
    enemies: new Map<number, HTMLElement>(),
  }

  socket.on("gameState", (gameState: GameStateSerialized) => {
    // add object to scene if it isn't already there
    // TODO: remove objects that are no longer in scene (e.g., enemies that died)

    gameState.players.forEach(player => {
      if (!new Array(entities.players.keys()).some(id => id === player.socketId)) {
        const newPlayer = document.createElement("a-entity");
        entities.players.set(player.socketId, newPlayer);
        alliesRef.current.appendChild(newPlayer);
      }
    });

    const seenEnemies: Array<number> = new Array<number>();

    gameState.enemies.forEach(enemy => {
      seenEnemies.push(enemy.id);
      if (!new Array(entities.enemies.keys()).some(id => id === enemy.socketId)) {
        const newEnemy = document.createElement("a-entity");
        entities.enemies.set(enemy.id, newEnemy);
        alliesRef.current.appendChild(newEnemy);
      }
    });

    seenEnemies.forEach((enemyId) => {
      if (!gameState.enemies.some(e => e.id === enemyId)) {
        const enemyToRemove = entities.enemies.get(enemyId);
        entities.enemies.delete(enemyId);
        document.removeChild(enemyToRemove);
      }
    });

    // update all data
    gameState.players.forEach(player => {
      entities.players.get(player.socketId).object3D.position.set(player.position.x, player.position.y, player.position.z);
      entities.players.get(player.socketId).object3D.rotation.set(player.rotation.x, player.rotation.y, player.rotation.z);
    });

    gameState.enemies.forEach(enemy => {
      entities.enemies.get(enemy.socketId).object3D.position.set(enemy.position.x, enemy.position.y, enemy.position.z);
    });
  })

  return (
    <>
      <div className="video-container">
        <video ref={cameraFeedRef} playsInline autoPlay muted></video>
      </div>
      <a-scene xr-mode-ui="enabled: false">
        <a-camera camera="fov: 80;" id="camera" rotation-reader position="0 1.6 0" listener look-controls="reverseMouseDrag:true; touchEnabled: false"></a-camera>
        <a-entity ref={} id="enemies"></a-entity>
        <a-entity ref={} id="allies"></a-entity>
        <a-box position="-1 0.5 -13" rotation="0 45 0" color="blue"></a-box>
      </a-scene>
    </>
  );
}

export default Scene;