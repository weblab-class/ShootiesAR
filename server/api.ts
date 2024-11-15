import express from "express";
import auth from "./auth";
import User from "./models/User";
const router = express.Router();

router.post("/login", auth.login);
router.post("/logout", auth.logout);
router.get("/whoami", (req, res) => {
  if (!req.user) {
    // Not logged in.
    return res.send({});
  }
  res.send(req.user);
});
// router.post("/initsocket", (req, res) => {
//   // do nothing if user not logged in
//   if (req.user) {
//     const socket = socketManager.getSocketFromSocketID(req.body.socketid);
//     if (socket !== undefined) socketManager.addUser(req.user, socket);
//   }
//   res.send({});
// });

// |------------------------------|
// | write your API methods below!|
// |------------------------------|

// req.body.coins
router.post("/giveCoins", (req, res) => {
  if (!req.user) {
    // only give coins if user is logged in
    return;
  }
  User.findOne({_id: req.user._id}).then((user) => {
    if (!user) {
      // should not get here
      return;
    }
    user.coins = user.coins + req.body.coins;
    user.save().then((user) => res.send(user));
  })
});

// req.body.upgrade
router.post("/upgrade", (req, res) => {
  if (!req.user) {
    // only process if user is logged in
    return;
  }
  User.findOne({_id: req.user._id}).then((user) => {
    if (!user) {
      // should not get here
      return;
    }
    if (user.coins < 5) {
      // user can't afford upgrade
      return;
    }
    user.coins = user.coins - 5;
    if (req.body.upgrade === "health") {
      user.health = user.health + 0.1;
    } else if (req.body.upgrade === "damage") {
      user.damage = user.damage + 0.1;
    } else if (req.body.upgrade === "healing") {
      user.healing = user.healing + 0.1;
    } else {
      // invalid upgrade type
      return;
    }
    user.save().then((user) => res.send(user));
  });
});

// req.body.gameId, req.body.coins
router.post("/gameover", (req, res) => {
  if (!req.user) {
    return;
  }
  User.findOne({_id: req.user._id}).then((user) => {
    if (!user) {
      // should not get here
      return;
    }
    if (user.lastGameId >= req.body.gameId) {
      // we have already processed the gameover for this game
      return;
    }
    user.coins = user.coins + req.body.coins;
    user.lastGameId = req.body.gameId;
    user.save().then((user) => res.send(user));
  });
});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  const msg = `Api route not found: ${req.method} ${req.url}`;
  res.status(404).send({ msg });
});

export default router;
