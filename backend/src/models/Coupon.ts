import { Schema, model, Document } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  expiryDate: Date;
  active: boolean;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, index: true },
    discountType: { type: String, enum: ["PERCENTAGE", "FIXED"], required: true },
    discountValue: { type: Number, required: true },
    expiryDate: { type: Date, required: true },
    active: { type: Boolean, default: true },
  }
);

export const CouponModel = model<ICoupon>("Coupon", CouponSchema);
export default CouponModel;
