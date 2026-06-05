import { Schema, model, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  icon?: string;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    icon: { type: String },
  }
);

export const CategoryModel = model<ICategory>("Category", CategorySchema);
export default CategoryModel;
