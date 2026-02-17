const mongoose = require('mongoose');

const specialitySchema = new mongoose.Schema({
  name: { 
    type: String,
    required: true,
    unique: true ,
    trim: true    
}
});

module.exports = mongoose.model('Speciality', specialitySchema);
