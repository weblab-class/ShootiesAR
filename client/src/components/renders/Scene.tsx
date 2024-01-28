// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React, { useEffect, useRef, useState } from "react";
import "./Scene.css";
import { socket } from "../../client-socket";
import { PlayerSerialized, EnemySerialized, GameStateSerialized } from "../../../../shared/serialized";
import crosshairImg from "../../public/assets/crosshair.png";
import { Subject } from "rxjs";

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
  const graphicsRef = useRef();

  const entities = useRef({
    players: new Map<string, HTMLElement>(),
    enemies: new Map<number, HTMLElement>(),
  });
  
  const beamGraphics = useRef(new Array<HTMLElement>());
  
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
  }, []);

  const deviceVel = useRef({x:0, y:0, z:0});
  const timeOfLastMotionEvent = useRef(new Date());

  const [p, setP] = useState({x:-1, y:0, z:0});
  
  useEffect(() => {
    window.addEventListener("devicemotion", (event) => {
      // update camera position based on detected phone acceleration
      // const accel = event.acceleration;
      // const pos = gameCamRef.current.object3D.position;
      // const currentTime = new Date();
      // const dt = (currentTime.getTime() - timeOfLastMotionEvent.current.getTime()) / 1000;
      // if (accel.x*accel.x + accel.y*accel.y + accel.z*accel.z < .5) {
      //     deviceVel.current = {x:0, y:0, z:0};
      // }
      // deviceVel.current.x += accel.x * dt;
      // deviceVel.current.y += accel.y * dt;
      // deviceVel.current.z += accel.z * dt;
      // pos.x += deviceVel.current.x * dt;
      // pos.y += deviceVel.current.y * dt;
      // pos.z += deviceVel.current.z * dt;
      // timeOfLastMotionEvent.current = currentTime;
      // setP({x:pos.x, y:pos.y, z:pos.z})
    })
  }, []);

  const serverGameState = useRef(new Subject<GameStateSerialized>());

  useEffect(() => {
    socket.on("gameState", (gameState: GameStateSerialized) => {
      serverGameState.current.next(gameState);
    });
  }, []);

  useEffect(() => {
    serverGameState.current.subscribe((gameState: GameStateSerialized) => {

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
        if (player.fired) {
          // they fired their gun this frame; draw beam representing their shot
          const beam = document.createElement("a-entity");
          const cyl = document.createElement("a-cylinder");
          cyl.setAttribute("color", "cyan");
          cyl.setAttribute("height", 100);
          cyl.setAttribute("radius", 0.02);
          cyl.object3D.position.z -= 50;
          cyl.object3D.rotation.x -= Math.PI / 2;
          if (player.userId === props.userId) {
            // shoot the beam from slightly lower and farther forward for our POV so you can actually see the beam trail
            cyl.object3D.position.y -= .15;
            cyl.object3D.rotation.x += 3/1000;
          }
          beam.appendChild(cyl);
          const playerRotation = player.userId === props.userId ? gameCamRef.current.object3D.rotation : entities.current.players.get(player.userId).object3D.rotation;
          beam.object3D.rotation.copy(playerRotation);
          beam.object3D.position.set(player.position.x, player.position.y, player.position.z);
          graphicsRef.current.appendChild(beam);
          beamGraphics.current.push(beam);
        }
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

  useEffect(() => {
    serverGameState.current.subscribe((gameState: GameStateSerialized) => {
      for (const beamEntity of beamGraphics.current) {
        const beamCylinder = beamEntity.firstElementChild;
        const beamMaterial = beamEntity.firstElementChild.getAttribute("material");
        if (!beamMaterial) {
          continue;
        }
        const oldOpacity = beamMaterial.opacity;
        const newOpacity = oldOpacity - .04;
        if (newOpacity <= 0) {
          graphicsRef.current.removeChild(beamEntity);
          beamGraphics.current = beamGraphics.current.filter(b => b !== beamEntity);
        }
        beamCylinder.setAttribute("material", "opacity", newOpacity);
      }
    })
  }, [])
  
  return (
    <>
      <div className="video-container">
        <video ref={cameraFeedRef} playsInline autoPlay muted></video>
      </div>
      <a-scene xr-mode-ui="enabled: false">
        <a-assets>
          <img id="crosshair" src={crosshairImg} />
        </a-assets>
        <a-camera ref={gameCamRef} camera="fov: 80;" id="camera" rotation-reader position="0 1.6 0" listener look-controls="reverseMouseDrag:true; touchEnabled: false">
          {/* HUD */}
          <a-image src="#crosshair" position="0 0 -.1" width=".02" height=".02" alpha-test="0.5"></a-image>
        </a-camera>
        <a-entity ref={enemiesRef} id="enemies"></a-entity>
        <a-entity ref={alliesRef} id="allies"></a-entity>
        <a-entity ref={graphicsRef} id="graphics"></a-entity>
      </a-scene>
      {/* <div className="center-container">
        <img id="crosshair" src={crosshairImg} />
        <p>{`dt: ${((new Date()).getTime() - timeOfLastMotionEvent.current.getTime())/1000} x: ${p.x.toPrecision(3)}\ny: ${p.y.toPrecision(3)}\nz: ${p.z.toPrecision(3)}`}</p>
      </div> */}
    </>
  );
}

export default Scene;