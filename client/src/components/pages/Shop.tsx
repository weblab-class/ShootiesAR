import { Link, RouteComponentProps } from "@reach/router";
import React from "react";
import "./Shop.css";

type Props = RouteComponentProps &  {
  userId?: string;
  coins: number;
  health: number;
  damage: number;
  healing: number;
  purchaseUpgrade: (upgrade: "health" | "damage" | "healing") => void;
  addCoins: (amount: number) => void;
}

const Shop = (props: Props) => {
  return (<>
    <h1>Shop</h1>
    <Link to="/">
      Return Home
    </Link>
    {!props.userId
      ? <p>You must be logged in to view shop</p>
      : <>
          <h2>Your coins: {props.coins}¢</h2>
          <div id="shop-parent">
            <div id="s1">
              <p>Health Multiplier: {props.health.toFixed(1)}x</p>
            </div>
            <div id="s2">
              <button onClick={() => props.purchaseUpgrade("health")}>Upgrade (5¢)</button>
            </div>
            <div id="s3">
              <p>Damage Multiplier: {props.damage.toFixed(1)}x</p>
            </div>
            <div id="s4">
              <button onClick={() => props.purchaseUpgrade("damage")}>Upgrade (5¢)</button>
            </div>
            <div id="s5">
              <p>Healing Multiplier: {props.healing.toFixed(1)}x</p>
            </div>
            <div id="s6">
              <button onClick={() => props.purchaseUpgrade("healing")}>Upgrade (5¢)</button>
            </div>
          </div>
        </>}
  </>)
}

export default Shop;