const mongoose = require('mongoose');

const programApplicationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  studentId: { type: String, required: true },
  idCardUrl: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  appliedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin
  reason: { type: String }
}, { timestamps: true });

programApplicationSchema.index(
  { student: 1, program: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'approved'] } } }
);

module.exports = mongoose.model('ProgramApplication', programApplicationSchema); 