// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React, { useEffect, useRef } from "react";
import "./Scene.css";

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

  return (
    <>
      <div className="video-container">
        <video ref={cameraFeedRef} playsInline autoPlay muted></video>
      </div>
      <a-scene xr-mode-ui="enabled: false">
        <a-camera camera="fov: 80;" id="camera" rotation-reader position="0 1.6 0" listener look-controls="reverseMouseDrag:true; touchEnabled: false"></a-camera>
        {/* <a-entity id="enemies"></a-entity>
        <a-entity id="allies"></a-entity>
        <a-entity id="hazards"></a-entity> */}
        <a-box position="-1 0.5 -13" rotation="0 45 0" color="blue"></a-box>
      </a-scene>
    </>
  );
}

export default Scene;