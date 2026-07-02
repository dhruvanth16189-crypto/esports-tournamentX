import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'deposit' | 'withdraw';
  amount: number;
  status: 'pending' | 'approved' | 'denied';
  txnID: string; // Also handles UTR
  upiId?: string; // For withdrawals
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
    txnID: { type: String, required: function(this: any) { return this.type === 'deposit'; } },
    upiId: { type: String, required: function(this: any) { return this.type === 'withdraw'; } },
  },
  { timestamps: true }
);

export const Transaction = (mongoose.models.Transaction as mongoose.Model<ITransaction>) || mongoose.model<ITransaction>('Transaction', TransactionSchema);

