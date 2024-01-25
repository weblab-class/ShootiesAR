// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React, { useEffect, useRef } from "react";
import "./Scene.css";
import { socket } from "../../client-socket";
import { PlayerSerialized, EnemySerialized, GameStateSerialized } from "../../../../shared/serialized";
import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import crosshairImg from "../../public/assets/crosshair.png";

// we want to update our scene directly through the DOM, since React re-renders are much slower
// so we want to minimize usage of props since they trigger re-renders
type Props = {
  userId: string;
}  

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

  const gameCamRef = useRef();
  const enemiesRef = useRef();
  const alliesRef = useRef();

  const entities = useRef({
    players: new Map<string, HTMLElement>(),
    enemies: new Map<number, HTMLElement>(),
  });

  const spaceshipModel = useLoader(GLTFLoader, '../../public/assets/low_poly_space_ship_glTF/scene.gltf')

  useEffect(() => {
    socket.on("gameState", (gameState: GameStateSerialized) => {
      socket.emit("playerUpdate", gameCamRef.current.object3D.rotation);
      
      gameState.players.forEach((player: PlayerSerialized) => {
        if (!entities.current.players.has(player.userId)) {
          if (props.userId === player.userId) {
            gameCamRef.current.object3D.position.set(player.position.x, player.position.y, player.position.z);
            return;
          }
        }
        const newPlayer = document.createElement("a-box");
        entities.current.players.set(player.userId, newPlayer);
        newPlayer.setAttribute("color", "green");
        newPlayer.setAttribute("position", player.position);
        newPlayer.setAttribute("rotation", player.rotation);
        alliesRef.current.appendChild(newPlayer);
      });

      const seenEnemies: Array<number> = new Array<number>();

      gameState.enemies.forEach((enemy: EnemySerialized) => {
        seenEnemies.push(enemy.id);
        if (!entities.current.enemies.has(enemy.id)) {
          const newEnemy = document.createElement("a-box");
          entities.current.enemies.set(enemy.id, newEnemy);
          newEnemy.setAttribute("color", "red");
          newEnemy.setAttribute("position", enemy.position);
          enemiesRef.current.appendChild(newEnemy);
        }
      });

      seenEnemies.forEach((enemyId) => {
        if (!gameState.enemies.some(e => e.id === enemyId)) {
          const enemyToRemove = entities.current.enemies.get(enemyId);
          entities.current.enemies.delete(enemyId);
          enemiesRef.current.removeChild(enemyToRemove);
        }
      });
      
      // update all data
      gameState.players.forEach((player: PlayerSerialized) => {
        if (player.userId === props.userId) {
          return; // let this player update itself based on phone movement
        }
        entities.current.players.get(player.userId).object3D.position.set(player.position.x, player.position.y, player.position.z);
        entities.current.players.get(player.userId).object3D.rotation.set(player.rotation.x, player.rotation.y, player.rotation.z);
      });
      
      gameState.enemies.forEach(enemy => {
        entities.current.enemies.get(enemy.id).object3D.position.set(enemy.position.x, enemy.position.y, enemy.position.z);
      });
    });
  }, []);
  
  return (
    <>
      <div className="video-container">
        <video ref={cameraFeedRef} playsInline autoPlay muted></video>
      </div>
      <a-scene xr-mode-ui="enabled: false">
        <a-camera ref={gameCamRef} camera="fov: 80;" id="camera" rotation-reader position="0 1.6 0" listener look-controls="reverseMouseDrag:true; touchEnabled: false"></a-camera>
        <a-entity ref={enemiesRef} id="enemies"></a-entity>
        <a-entity ref={alliesRef} id="allies"></a-entity>
        <a-assets>
          <a-asset-item id="spaceship" src={gltf.scene}></a-asset-item>
        </a-assets>
        <a-entity gltf-model="#spaceship"></a-entity>
      </a-scene>
      {/* <div className="center-container">
        <img id="crosshair" src={crosshairImg} />
      </div> */}
    </>
  );
}

export default Scene;