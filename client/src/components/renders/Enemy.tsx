// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React from "react";

type Props = Record<string, never>;

const Enemy = (props: Props) => {
  return (
    <a-box ref={myRef} position="-1 0.5 -13" rotation="0 45 0" color="blue"></a-box>
  )
};

export default Enemy;