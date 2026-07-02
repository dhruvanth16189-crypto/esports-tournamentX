import mongoose, { Schema, Document } from 'mongoose';

export interface ITournament extends Document {
  matchMode: 'BR' | 'CS' | 'LW';
  subMode: string;
  entryFee: number;
  prizePool: number;
  startTime: Date;
  matchStatus: 'scheduled' | 'full' | 'ongoing' | 'completed';
  registeredUsers: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TournamentSchema: Schema = new Schema(
  {
    matchMode: { 
      type: String, 
      required: true,
      enum: ['BR', 'CS', 'LW']
    },
    subMode: { 
      type: String, 
      required: true,
      enum: ['1v1', '2v2', '4v4', '6v6', 'Solo', 'Duo', 'Squad (4v4)']
    },
    entryFee: { type: Number, required: true, default: 0 },
    prizePool: { type: Number, required: true, default: 0 },
    startTime: { type: Date, required: true },
    matchStatus: {
      type: String,
      enum: ['scheduled', 'full', 'ongoing', 'completed'],
      default: 'scheduled',
    },
    registeredUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

TournamentSchema.pre('validate', function(this: any) {
  if (this.matchMode === 'LW') {
    if (this.subMode !== '1v1' && this.subMode !== '2v2') {
      this.invalidate('subMode', 'LW mode only allows 1v1 and 2v2 sub-modes.');
    }
  }
});

export const Tournament = (mongoose.models.Tournament as mongoose.Model<ITournament>) || mongoose.model<ITournament>('Tournament', TournamentSchema);
