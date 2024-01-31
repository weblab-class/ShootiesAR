import { Schema, model, Document } from "mongoose";

const UserSchema = new Schema({
  name: String,
  googleid: String,
  coins: Number,
  health: Number,
  damage: Number,
  healing: Number,
  lastGameId: Number,
});

export interface User extends Document {
  name: string;
  googleid: string;
  coins: number;
  health: number;
  damage: number;
  healing: number;
  lastGameId: number;
  _id: string;
}

const UserModel = model<User>("User", UserSchema);

export default UserModel;
