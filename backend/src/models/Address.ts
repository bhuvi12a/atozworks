import { Schema, model, Document, Types } from "mongoose";

export interface IAddress extends Document {
  userId: Types.ObjectId;
  houseNo: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  location: {
    type: "Point";
    coordinates: number[]; // [longitude, latitude]
  };
  isDefault: boolean;
  createdAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    houseNo: { type: String, required: true },
    street: { type: String, default: '' },
    landmark: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point", required: true },
      coordinates: { type: [Number], required: true, default: [77.8270, 12.7409] }, // [longitude, latitude] — default: Hosur
    },
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Enable geospatial queries on coordinates
AddressSchema.index({ location: "2dsphere" });

export const AddressModel = model<IAddress>("Address", AddressSchema);
export default AddressModel;
