import { Schema, model, Document, Types } from "mongoose";

export interface IProviderAvailability {
  day: number;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface IProviderServiceArea {
  latitude: number;
  longitude: number;
  serviceRadiusKm: number;
}

export interface IProvider extends Document {
  userId: Types.ObjectId;
  kycStatus: "PENDING" | "APPROVED" | "REJECTED";
  experience: number;
  rating: number;
  verificationStatus: "VERIFIED" | "UNVERIFIED";
  totalJobs: number;
  categories: Types.ObjectId[];
  serviceAreas: IProviderServiceArea[];
  availabilities: IProviderAvailability[];
  selfie?: string;
  idCard?: string;
  createdAt: Date;
}

const ProviderAvailabilitySchema = new Schema<IProviderAvailability>({
  day: { type: Number, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  available: { type: Boolean, default: true },
}, { _id: false });

const ProviderServiceAreaSchema = new Schema<IProviderServiceArea>({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  serviceRadiusKm: { type: Number, required: true },
}, { _id: false });

const ProviderSchema = new Schema<IProvider>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    kycStatus: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    experience: { type: Number, default: 0 },
    rating: { type: Number, default: 0.0 },
    verificationStatus: { type: String, enum: ["VERIFIED", "UNVERIFIED"], default: "UNVERIFIED" },
    totalJobs: { type: Number, default: 0 },
    categories: [{ type: Schema.Types.ObjectId, ref: "Category", index: true }],
    serviceAreas: [ProviderServiceAreaSchema],
    availabilities: [ProviderAvailabilitySchema],
    selfie: { type: String, default: "" },
    idCard: { type: String, default: "" },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const ProviderModel = model<IProvider>("Provider", ProviderSchema);
export default ProviderModel;
