import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentSettings extends Document {
  upiId: string;
}

const PaymentSettingsSchema: Schema = new Schema(
  {
    upiId: { type: String, required: true },
  },
  { timestamps: true }
);

export const PaymentSettings = (mongoose.models.PaymentSettings as mongoose.Model<IPaymentSettings>) || mongoose.model<IPaymentSettings>('PaymentSettings', PaymentSettingsSchema);
