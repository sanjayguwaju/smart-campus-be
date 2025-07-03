const Program = require('../models/program.model');

class ProgramService {
  async getAllPrograms(query = {}) {
    return Program.find(query);
  }

  async getProgramById(id) {
    return Program.findById(id);
  }

  async createProgram(data) {
    return Program.create(data);
  }

  async updateProgram(id, data) {
    return Program.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteProgram(id) {
    return Program.findByIdAndDelete(id);
  }

  async publishProgram(id, isPublished) {
    const program = await Program.findById(id);
    if (!program) throw new Error('Program not found');
    program.isPublished = isPublished;
    program.status = isPublished ? 'published' : 'draft';
    await program.save();
    return program;
  }
}

module.exports = new ProgramService(); 