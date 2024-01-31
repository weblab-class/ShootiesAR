import { RouteComponentProps } from "@reach/router";
import React from "react";

type Props = RouteComponentProps;

const About = (props: Props) => {
  return (
    <>
      <button onClick={() => window.location.replace("/")}>Home</button>
      <h1>About</h1>
      <p>Shooties is an AR multiplayer game in which you team up with friends to take down all enemies!</p>
      <p>Enemies get stronger every wave! Survive as many as you can!</p>
      <p>When signed in, earn coins for completing games and use them to upgrade your strength and make it farther!</p>
      <h2>How to Play</h2>
      <p>Tap anywhere on screen to shoot!</p>
      <p>Shots can damage enemies and asteroids, but they they can also heal allies</p>
      <h2>Troubleshooting</h2>
      <p>If the game isn't working, make sure your browser has permissions enabled for motion sensors and camera (they're required for AR)!</p>
    </>

  );
};

export default About;