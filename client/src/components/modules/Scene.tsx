// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React, { useEffect, useRef, useState } from "react";
import "./Scene.css";
import { socket } from "../../client-socket";
import { PlayerSerialized, EnemySerialized, GameStateSerialized, ProjectileSerialized } from "../../../../shared/serialized";
import crosshairImg from "../../public/assets/crosshair.png";
import { Subject, pairwise, map } from "rxjs";

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
  const projectilesRef = useRef();
  const graphicsRef = useRef();
  const healthbarsRef = useRef();

  const entities = useRef({
    players: new Map<string, HTMLElement>(),
    enemies: new Map<number, HTMLElement>(),
  });
  
  const beamGraphics = useRef(new Array<HTMLElement>());
  const projectiles = useRef(new Map<number, HTMLElement>());
  const healthBars = useRef(new Map<number | string, { element: HTMLElement, setHealth: (cur: number, max: number) => void }>());
  const screenFlash = useRef<HTMLElement | null>(null);
  
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

  const newProjectileElement = () => {
    const proj = document.createElement("a-entity");
    
    const icos = document.createElement("a-icosahedron");
    icos.setAttribute("color", "saddlebrown");
    proj.appendChild(icos);
    
    return proj;
  }

  const lerp = (a: number, b: number, t: number) => a + t * (b - a);

  const newHealthBar = (enemy: bool): { element: HTMLElement, setHealth: (cur: number, max: number) => void } => {
    const element = document.createElement("a-entity");
    const WIDTH = 2;
    const HEIGHT = 0.5;

    const backPlane = document.createElement("a-plane");
    backPlane.setAttribute("height", HEIGHT * 1.05);
    backPlane.setAttribute("width", WIDTH * 1.05);
    backPlane.setAttribute("color", "black");
    backPlane.object3D.position.z -= 0.05;
    element.appendChild(backPlane);
    
    const frontPlane = document.createElement("a-plane");
    frontPlane.setAttribute("height", HEIGHT);
    frontPlane.setAttribute("width", WIDTH);
    frontPlane.setAttribute("color", enemy ? "red" : "#4caf50");
    element.appendChild(frontPlane);
    

    const setHealth = (cur: number, max: number) => {
      frontPlane.setAttribute("width", (cur / max) * WIDTH);
      frontPlane.object3D.position.x = lerp(-WIDTH/2, 0, cur/max);
    };

    return { element, setHealth };
  };

  const setPlayerHealth = (cur: number, max: number) => {
    const healthBar = document.getElementById('health-bar');
    healthBar.style.width = `${100 * cur / max}%`;
    document.getElementById("health-info")?.innerText = `Your Health: ${Math.ceil(cur)}`;
  }
  
  useEffect(() => {
    document.addEventListener("click", () => socket.emit("shoot"));
  }, []);

  const serverGameState = useRef(new Subject<GameStateSerialized>());

  useEffect(() => {
    const updateGameState = (gameState: GameStateSerialized) => {
      serverGameState.current.next(gameState);
    };
    socket.on("gameState", updateGameState);
    return () => socket.off("gameState", updateGameState);
  }, []);

  useEffect(() => {
    const subscription = serverGameState.current.subscribe((gameState: GameStateSerialized) => {
      document.getElementById("top-left-text")?.innerText = `Wave: ${gameState.wave}`;

      socket.emit("playerUpdate", {
        rotation: {
          x: gameCamRef.current.object3D.rotation.x,
          y: gameCamRef.current.object3D.rotation.y,
          z: gameCamRef.current.object3D.rotation.z,
        },
      });
      
      // spawn and despawn entities to match the server gameState
      gameState.players.forEach((player: PlayerSerialized) => {
        // spawn players
        if (!entities.current.players.has(player.userId)) {
          if (props.userId === player.userId) {
            // we don't need to spawn ourself, just set the camera position
            gameCamRef.current.object3D.position.set(player.position.x, player.position.y, player.position.z);
            entities.current.players.set(player.userId, null);
            setPlayerHealth(player.health, player.maxHealth);
            return;
          }
          const newPlayer = newPlayerElement();
          entities.current.players.set(player.userId, newPlayer);
          newPlayer.setAttribute("position", player.position);
          newPlayer.setAttribute("rotation", player.rotation);
          alliesRef.current.appendChild(newPlayer);

          const healthBar = newHealthBar(false);
          healthBars.current.set(player.userId, healthBar);
          healthBar.element.setAttribute("position", { x: player.position.x, y: player.position.y + 1, z: player.position.z });
          healthbarsRef.current.appendChild(healthBar.element);
          healthBar.setHealth(player.health, player.maxHealth);
        }
      });
      
      gameState.enemies.forEach((enemy: EnemySerialized) => {
        // spawn new enemies that have appeared this frame
        if (!entities.current.enemies.has(enemy.id)) {
          const newEnemy = newEnemyElement();
          entities.current.enemies.set(enemy.id, newEnemy);
          newEnemy.setAttribute("position", { x: enemy.position.x, y: enemy.position.y, z: enemy.position.z });
          enemiesRef.current.appendChild(newEnemy);

          const healthBar = newHealthBar(true);
          healthBars.current.set(enemy.id, healthBar);
          healthBar.element.setAttribute("position", { x: enemy.position.x, y: enemy.position.y + 1, z: enemy.position.z });
          healthbarsRef.current.appendChild(healthBar.element);
          healthBar.setHealth(enemy.health, enemy.maxHealth);
        }
      });
      
      for (const [enemyId, enemy] of new Map(entities.current.enemies).entries()) {
        // despawn enemies that have died since the last frame
        if (!gameState.enemies.some(e => e.id === enemyId)) {
          entities.current.enemies.delete(enemyId);
          enemiesRef.current.removeChild(enemy);

          healthbarsRef.current.removeChild(healthBars.current.get(enemyId)?.element);
          healthBars.current.delete(enemyId);
        }
      }

      gameState.projectiles.forEach((proj: ProjectileSerialized) => {
        // spawn new projectiles that have appeared this frame
        if (projectiles.current.has(proj.id)) {
          return;
        }
        const newProj = newProjectileElement();
        projectiles.current.set(proj.id, newProj);
        newProj.setAttribute("position", proj.position);
        newProj.setAttribute("radius", proj.radius);
        projectilesRef.current.appendChild(newProj);

        const healthBar = newHealthBar(true);
        healthBars.current.set(proj.id, healthBar);
        healthBar.element.setAttribute("position", { x: proj.position.x, y: proj.position.y + 1, z: proj.position.z });
        healthbarsRef.current.appendChild(healthBar.element);
        healthBar.setHealth(proj.health, proj.maxHealth);
      });

      for (const [projId, proj] of projectiles.current.entries()) {
        // despawn projectiles that have been destroyed since the last frame
        if (!gameState.projectiles.some(p => p.id === projId)) {
          projectiles.current.delete(projId);
          projectilesRef.current.removeChild(proj);

          healthbarsRef.current.removeChild(healthBars.current.get(projId)?.element);
          healthBars.current.delete(projId);
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
          setPlayerHealth(player.health, player.maxHealth);
          return; // let this player update itself based on phone movement
        }
        const playerElement = entities.current.players.get(player.userId);
        const playerHp = healthBars.current.get(player.userId);
        playerElement.object3D.position.set(player.position.x, player.position.y, player.position.z);
        playerElement.object3D.rotation.set(player.rotation.x, player.rotation.y, player.rotation.z);
        playerHp?.element.object3D.position.set(player.position.x, player.position.y + 1, player.position.z);
        playerHp?.element.object3D.rotation.set(gameCamRef.current.object3D.rotation.x, gameCamRef.current.object3D.rotation.y, 0, "YXZ");
        playerHp.setHealth(player.health, player.maxHealth);
      });
      
      gameState.enemies.forEach(enemy => {
        const enemyElement = entities.current.enemies.get(enemy.id);
        const enemyhp = healthBars.current.get(enemy.id);
        enemyElement.object3D.position.set(enemy.position.x, enemy.position.y, enemy.position.z);
        enemyhp?.element.object3D.position.set(enemy.position.x, enemy.position.y + 1, enemy.position.z);
        enemyhp?.element.object3D.rotation.set(gameCamRef.current.object3D.rotation.x, gameCamRef.current.object3D.rotation.y, 0, "YXZ");
        enemyhp.setHealth(enemy.health, enemy.maxHealth);
      });
      
      gameState.projectiles.forEach(proj => {
        const projectile = projectiles.current.get(proj.id);
        const projHp = healthBars.current.get(proj.id);
        projectile.object3D.position.set(proj.position.x, proj.position.y, proj.position.z);
        projHp?.element.object3D.position.set(proj.position.x, proj.position.y + 1, proj.position.z)
        projHp?.element.object3D.rotation.set(gameCamRef.current.object3D.rotation.x, gameCamRef.current.object3D.rotation.y, 0, "YXZ");
        projHp.setHealth(proj.health, proj.maxHealth);
      });

    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // make laser beam disappear over time
    const subscription = serverGameState.current.subscribe((gameState: GameStateSerialized) => {
      for (const beamEntity of beamGraphics.current) {
        const beamCylinder = beamEntity.firstElementChild;
        const beamMaterial = beamEntity.firstElementChild.getAttribute("material");
        if (!beamMaterial) {
          continue;
        }
        const oldOpacity = beamMaterial.opacity;
        const newOpacity = oldOpacity - .08;
        if (newOpacity <= 0) {
          graphicsRef.current.removeChild(beamEntity);
          beamGraphics.current = beamGraphics.current.filter(b => b !== beamEntity);
          continue;
        }
        beamCylinder.setAttribute("material", "opacity", newOpacity);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // make screen flash red/green when taking damage/healing
    const subscription = serverGameState.current.pipe(
      map((state) => state.players.filter(p => p.userId === props.userId).at(0)?.health),
      pairwise(),
    ).subscribe(([prevHealth, curHealth]) => {
      if (prevHealth === undefined || curHealth === undefined) {
        return;
      }
      if (prevHealth !== curHealth) {
        if (screenFlash.current) {
          return; // don't do multiple flashes at the same time
        }
        const flash = document.createElement("a-circle");
        flash.object3D.position.z -= .2
        flash.setAttribute("material", "opacity", 1);
        flash.setAttribute("color", curHealth < prevHealth ? "red" : "green")
        gameCamRef.current.appendChild(flash);
        screenFlash.current = flash;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // make flash disappear over time
    const subscription = serverGameState.current.subscribe((gameState: GameStateSerialized) => {
      if (!screenFlash.current) {
        return;
      }
      const flashMaterial = screenFlash.current.getAttribute("material");
      if (!flashMaterial) {
        return; // this check might not be needed
      }
      const oldOpacity = flashMaterial.opacity;
      const newOpacity = oldOpacity - .1;
      if (newOpacity <= 0) {
        gameCamRef.current.removeChild(screenFlash.current);
        screenFlash.current = null;
      }
      screenFlash.current?.setAttribute("material", "opacity", newOpacity);
    });

    return () => subscription.unsubscribe();
  }, []);

  
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
        <a-entity ref={projectilesRef} id="projectiles"></a-entity>
        <a-entity ref={graphicsRef} id="graphics"></a-entity>
        <a-entity ref={healthbarsRef} id="healthbars"></a-entity>
      </a-scene>
      <div id="top-left-text">Wave:</div>
      <div id="health-info" className="Scene-disable-select">Your health:</div>
      <div id="health-bar-container">
        <div id="health-bar"></div>
      </div>
    </>
  );
}

export default Scene;