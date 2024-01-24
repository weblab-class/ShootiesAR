import { Link, RouteComponentProps } from "@reach/router";
import React from "react";

type Props = RouteComponentProps &  {
  userId?: string;
  coins: number;
  addCoins: (coins: number) => void;
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
          <h2>Your coins: {props.coins}</h2>
          <p>Shop isn't implemented yet, but for now you can add coins to your account by clicking this button:</p>
          <button onClick={() => props.addCoins(1)}>Get Coin</button>
        </>}
  </>)
}

export default Shop;