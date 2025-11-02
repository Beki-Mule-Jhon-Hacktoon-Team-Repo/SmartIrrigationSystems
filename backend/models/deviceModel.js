
const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: { 
    type: String, 
    required: true, 
    unique: true
   },
  farmId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Farm'
   },
  registered: { 
    type: Boolean,
     default: false 
  },
  status: { 
    type: String, 
    enum: ['pending', 'active'], 
    default: 'pending' 
  },
  lastSeen: {
     type: Date
    },
},
 { 
  timestamps: true
 }
);

module.exports = mongoose.model('Device', deviceSchema);