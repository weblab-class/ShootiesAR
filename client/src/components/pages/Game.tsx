// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useRef, useEffect, useState } from "react";
import { RouteComponentProps } from "@reach/router";
import "./Game.css";

const colors = ["red", "orange", "yellow", "green", "blue", "purple", "gray"];

type Props = RouteComponentProps & {
  userId?: string;
};

const Game = (props: Props) => {
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

  const sphereRef = useRef(null);
  const [sphereColor, setSphereColor] = useState("red");
  let colorIdx = 0;

  const changeColor = () => {
    setSphereColor(colors[++colorIdx % colors.length]);
  };

  useEffect(() => {
    document.addEventListener("click", changeColor);
    return () => {
      document.removeEventListener("click", changeColor);
    }
  }, [])

  useEffect(() => {
    sphereRef.current.setAttribute('material', 'color', sphereColor);
  }, [sphereColor]);

  return (
    <>
      <div className="video-container">
        <video ref={cameraFeedRef} playsInline autoPlay muted></video>
      </div>
      <a-scene xr-mode-ui="enabled: false">
        <a-camera camera="fov: 80;" id="camera" rotation-reader position="0 1.6 0" listener look-controls="reverseMouseDrag:true; touchEnabled: false"></a-camera>
        <a-box position="-1 0.5 -13" rotation="0 45 0" color="blue"></a-box>
        <a-sphere ref={sphereRef} position="0 1.25 -15" radius="1.25" color="red"></a-sphere>
        <a-cylinder position="1 0.75 -13" radius="0.5" height="1.5" color="yellow"></a-cylinder>
        <a-plane position="0 0 -14" rotation="-90 0 0" width="4" height="4" color="#7BC8A4"></a-plane>
        {/* <a-sky color="#ECECEC"></a-sky> */}
      </a-scene>
    </>
  );
}

export default Game;