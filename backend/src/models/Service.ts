import { Schema, model, Document, Types } from "mongoose";

export interface IService extends Document {
  categoryId: Types.ObjectId;
  title: string;
  description: string;
  duration: number; // in minutes
  basePrice: number;
  active: boolean;
  createdAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    basePrice: { type: Number, required: true },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const ServiceModel = model<IService>("Service", ServiceSchema);
export default ServiceModel;
