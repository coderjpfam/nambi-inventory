import mongoose, { Schema, Document, Model } from "mongoose";

export interface IParty extends Document {
  name: string;
  mobileNo?: string;
  emailId?: string;
  createdBy: string; // User email or ID
  createdAt: Date;
  updatedAt: Date;
}

const PartySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobileNo: {
      type: String,
      trim: true,
    },
    emailId: {
      type: String,
      trim: true,
      lowercase: true,
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
PartySchema.index({ name: 1 });
PartySchema.index({ mobileNo: 1 });
PartySchema.index({ emailId: 1 });
PartySchema.index({ createdBy: 1 });

const Party: Model<IParty> =
  mongoose.models.Party || mongoose.model<IParty>("Party", PartySchema);

export default Party;

