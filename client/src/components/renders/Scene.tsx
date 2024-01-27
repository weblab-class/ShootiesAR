// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React, { useEffect, useRef } from "react";
import "./Scene.css";
import { socket } from "../../client-socket";
import { PlayerSerialized, EnemySerialized, GameStateSerialized } from "../../../../shared/serialized";
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

  const newPlayerElement = () => {
    const player = document.createElement("a-entity");

    const cone1 = document.createElement("a-cone");
    cone1.setAttribute("color", "green");
    cone1.setAttribute("radius-bottom", "0.5");
    cone1.object3D.rotation.x -= Math.PI / 2;
    player.appendChild(cone1);

    return player;
  }

  const newEnemyElement = () => {
    const enemy = document.createElement("a-entity");

    const box1 = document.createElement("a-box");
    box1.setAttribute("color", "red");
    enemy.appendChild(box1);

    return enemy;
  }

  useEffect(() => {
    document.addEventListener("click", () => socket.emit("shoot"));
  }, [])

  useEffect(() => {
    socket.on("gameState", (gameState: GameStateSerialized) => {
      // console.log("clientPos:", gameCamRef.current.object3D.position);
      // console.log("clientRot:", gameCamRef.current.object3D.rotation);
      // console.log("server:", gameState.players.filter((p) => p.userId === props.userId));

      socket.emit("playerUpdate", {
        position: gameCamRef.current.object3D.position,
        rotation: {
          x: gameCamRef.current.object3D.rotation.x,
          y: gameCamRef.current.object3D.rotation.y,
          z: gameCamRef.current.object3D.rotation.z,
        },
      });
      
      gameState.players.forEach((player: PlayerSerialized) => {
        if (!entities.current.players.has(player.userId)) {
          if (props.userId === player.userId) {
            gameCamRef.current.object3D.position.set(player.position.x, player.position.y, player.position.z);
            entities.current.players.set(player.userId, null);
            return;
          }
          const newPlayer = newPlayerElement();
          entities.current.players.set(player.userId, newPlayer);
          newPlayer.setAttribute("position", player.position);
          newPlayer.setAttribute("rotation", player.rotation);
          alliesRef.current.appendChild(newPlayer);
        }
      });
      
      gameState.enemies.forEach((enemy: EnemySerialized) => {
        if (!entities.current.enemies.has(enemy.id)) {
          const newEnemy = newEnemyElement();
          entities.current.enemies.set(enemy.id, newEnemy);
          newEnemy.setAttribute("position", enemy.position);
          enemiesRef.current.appendChild(newEnemy);
        }
      });

      for (const [enemyId, enemy] of entities.current.enemies.entries()) {
        if (!gameState.enemies.some(e => e.id === enemyId)) {
          entities.current.enemies.delete(enemyId);
          enemiesRef.current.removeChild(enemy);
        }
      }
      
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
    })
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
      </a-scene>
      <div className="center-container">
        <img id="crosshair" src={crosshairImg} />
      </div>
    </>
  );
}

export default Scene;