import mongoose, { Schema, Document, Model } from "mongoose";

export interface IYarnCategory extends Document {
  name: string;
  description?: string;
  noOfCones?: number;
  weightPerBox?: number;
  isRegular: boolean;
  createdBy: string; // User email or ID
  createdAt: Date;
  updatedAt: Date;
}

const YarnCategorySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    noOfCones: {
      type: Number,
      min: 0,
      default: 6,
    },
    weightPerBox: {
      type: Number,
      min: 0,
      default: 36,
    },
    isRegular: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
YarnCategorySchema.index({ name: 1 });
YarnCategorySchema.index({ createdBy: 1 });

const YarnCategory: Model<IYarnCategory> =
  mongoose.models.YarnCategory ||
  mongoose.model<IYarnCategory>("YarnCategory", YarnCategorySchema);

export default YarnCategory;

