import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  googleId: string;
  role: 'user' | 'admin';
  virtualBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    googleId: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    virtualBalance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Ensure specific email is always admin if provided
UserSchema.pre<IUser>('save', async function () {
  const adminEmail = 'dhruvanth16189@gmail.com';
  if (this.email === adminEmail) {
    this.role = 'admin';
  }
});

export const User = (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>('User', UserSchema);
