import { Schema, model, Document, Types } from "mongoose";

export interface IPayment extends Document {
  bookingId: Types.ObjectId;
  amount: number;
  transactionId?: string;
  paymentGateway: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    amount: { type: Number, required: true },
    transactionId: { type: String },
    paymentGateway: { type: String, default: "RAZORPAY" },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const PaymentModel = model<IPayment>("Payment", PaymentSchema);
export default PaymentModel;
