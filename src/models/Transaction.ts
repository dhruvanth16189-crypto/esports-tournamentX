import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'deposit' | 'withdraw';
  amount: number;
  status: 'pending' | 'approved' | 'denied';
  txnID: string; // Also handles UTR
  upiId?: string; // For withdrawals
  proofImage?: string; // Base64 or URL of payment proof
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['deposit', 'withdraw'],
      required: true,
    },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied'],
      default: 'pending',
    },
    txnID: { type: String }, // Made optional if they upload proof
    upiId: { type: String },
    proofImage: { type: String },
  },
  { timestamps: true }
);

export const Transaction = (mongoose.models.Transaction as mongoose.Model<ITransaction>) || mongoose.model<ITransaction>('Transaction', TransactionSchema);

