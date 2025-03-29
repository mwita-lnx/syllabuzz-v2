const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Participant schema
const participantSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    required: true
  },
  user_name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'idle', 'away'],
    default: 'active'
  },
  joined_at: {
    type: Date,
    default: Date.now
  }
});

// Resource schema
const resourceSchema = new Schema({
  type: {
    type: String,
    enum: ['past_paper', 'study_note', 'flashcard_set', 'external_link'],
    required: true
  },
  resource_id: {
    type: Schema.Types.ObjectId
  },
  title: {
    type: String,
    required: true
  },
  url: {
    type: String
  },
  added_by: {
    type: Schema.Types.ObjectId,
    required: true
  },
  added_at: {
    type: Date,
    default: Date.now
  }
});

// Revision room schema
const revisionRoomSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  unit_id: {
    type: Schema.Types.ObjectId,
    required: true
  },
  unit_code: {
    type: String,
    required: true
  },
  faculty_code: {
    type: String
  },
  topic: {
    type: String,
    required: true
  },
  created_by: {
    type: Schema.Types.ObjectId,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  is_active: {
    type: Boolean,
    default: true
  },
  current_focus: {
    type: String,
    default: ''
  },
  participants: [participantSchema],
  resources: [resourceSchema],
  tags: [String]
}, {
  timestamps: true,
  // This converts the _id to id when converting to JSON
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Add index for fast querying
revisionRoomSchema.index({ unit_id: 1, is_active: 1 });
revisionRoomSchema.index({ 'participants.user_id': 1 });

// Static methods
revisionRoomSchema.statics = {
  /**
   * Get active revision rooms for a unit
   * @param {ObjectId} unitId - Unit ID
   * @returns {Promise<Array>} Array of active revision rooms
   */
  async getActiveRoomsByUnit(unitId) {
    return this.find({
      unit_id: unitId,
      is_active: true
    }).sort({ created_at: -1 });
  },
  
  /**
   * Get rooms where a user is a participant
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Array>} Array of rooms
   */
  async getRoomsByParticipant(userId) {
    return this.find({
      'participants.user_id': userId,
      is_active: true
    }).sort({ 'participants.joined_at': -1 });
  }
};

const RevisionRoom = mongoose.model('RevisionRoom', revisionRoomSchema);

module.exports = RevisionRoom;