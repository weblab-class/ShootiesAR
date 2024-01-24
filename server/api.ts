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
})

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  const msg = `Api route not found: ${req.method} ${req.url}`;
  res.status(404).send({ msg });
});

export default router;
