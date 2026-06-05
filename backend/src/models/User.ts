import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: "CUSTOMER" | "PROVIDER" | "ADMIN";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["CUSTOMER", "PROVIDER", "ADMIN"], default: "CUSTOMER" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "SUSPENDED"], default: "ACTIVE" },
  },
  {
    timestamps: true,
  }
);

export const UserModel = model<IUser>("User", UserSchema);
export default UserModel;
