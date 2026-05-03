import mongoose from 'mongoose';

const historySchema = new mongoose.Schema(
  {
    id: String,
    url: String,
    mobileScore: Number,
    desktopScore: Number,
    createdAt: String,
  },
  { id: false }
);

export const History = mongoose.model('History', historySchema);
