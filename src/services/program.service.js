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
}

module.exports = new ProgramService(); 