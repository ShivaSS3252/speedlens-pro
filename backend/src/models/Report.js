import mongoose from 'mongoose';

const fixSchema = new mongoose.Schema(
  { language: String, code: String, explanation: String },
  { _id: false }
);

const issueSchema = new mongoose.Schema(
  { id: String, title: String, description: String, displayValue: String, fix: fixSchema },
  { _id: false }
);

const suggestionSchema = new mongoose.Schema(
  { id: String, title: String, description: String },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    url: String,
    mobileScore: Number,
    desktopScore: Number,
    issues: [issueSchema],
    suggestions: [suggestionSchema],
    techStack: String,
    createdAt: String,
  },
  { id: false }
);

export const Report = mongoose.model('Report', reportSchema);
