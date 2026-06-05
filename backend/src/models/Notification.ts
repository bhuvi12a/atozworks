import { Schema, model, Document, Types } from "mongoose";

export interface INotification extends Document {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: string;
  readStatus: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true },
    readStatus: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const NotificationModel = model<INotification>("Notification", NotificationSchema);
export default NotificationModel;
