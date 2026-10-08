import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, index: true, sparse: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    phone: String,
    name: String,
    picture: String,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    active: { type: Boolean, default: true },
    lastLoginAt: Date,
    gmail: {
      email: { type: String, lowercase: true, trim: true },
      refreshToken: { type: String, select: false },
      scope: String,
      connectedAt: Date,
      lastError: String,
    },
  },
  { timestamps: true },
);

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    email: this.email,
    name: this.name,
    picture: this.picture,
    role: this.role,
    gmail: this.gmail?.email ? { email: this.gmail.email, connectedAt: this.gmail.connectedAt } : null,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);
