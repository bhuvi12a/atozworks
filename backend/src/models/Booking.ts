import { Schema, model, Document, Types } from "mongoose";

export interface IBooking extends Document {
  bookingNumber: string;
  customerId: Types.ObjectId;
  providerId?: Types.ObjectId;
  serviceId: Types.ObjectId;
  addressId: Types.ObjectId;
  bookingDate: string;
  bookingTime: string;
  status:
    | "PENDING"
    | "SEARCHING_PROVIDER"
    | "PROVIDER_ASSIGNED"
    | "ACCEPTED"
    | "ON_THE_WAY"
    | "ARRIVED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "REFUNDED";
  estimatedPrice: number;
  finalPrice?: number;
  paymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  createdAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    providerId: { type: Schema.Types.ObjectId, ref: "Provider", index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    addressId: { type: Schema.Types.ObjectId, ref: "Address", required: true },
    bookingDate: { type: String, required: true },
    bookingTime: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "PENDING",
        "SEARCHING_PROVIDER",
        "PROVIDER_ASSIGNED",
        "ACCEPTED",
        "ON_THE_WAY",
        "ARRIVED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "REFUNDED",
      ],
      default: "PENDING",
      index: true,
    },
    estimatedPrice: { type: Number, required: true },
    finalPrice: { type: Number },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const BookingModel = model<IBooking>("Booking", BookingSchema);
export default BookingModel;
