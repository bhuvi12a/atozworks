import { Schema, model, Document, Types } from "mongoose";

export interface IReview extends Document {
  bookingId: Types.ObjectId;
  customerId: Types.ObjectId;
  providerId: Types.ObjectId;
  rating: number;
  review?: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    providerId: { type: Schema.Types.ObjectId, ref: "Provider", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const ReviewModel = model<IReview>("Review", ReviewSchema);
export default ReviewModel;
