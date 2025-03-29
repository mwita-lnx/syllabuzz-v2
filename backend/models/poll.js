const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Poll option schema
const pollOptionSchema = new Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  votes: {
    type: Number,
    default: 0
  },
  voted_by: [{
    type: Schema.Types.ObjectId
  }]
});

// Poll schema
const pollSchema = new Schema({
  room_id: {
    type: Schema.Types.ObjectId,
    ref: 'RevisionRoom',
    required: true
  },
  message_id: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [pollOptionSchema],
  created_by: {
    type: Schema.Types.ObjectId,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  expires_at: {
    type: Date
  },
  is_active: {
    type: Boolean,
    default: true
  },
  allow_multiple_votes: {
    type: Boolean,
    default: false
  },
  total_votes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
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

// Add indexes for fast querying
pollSchema.index({ room_id: 1, created_at: -1 });
pollSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// Static methods
pollSchema.statics = {
  /**
   * Get active polls for a room
   * @param {ObjectId} roomId - Room ID
   * @returns {Promise<Array>} Array of active polls
   */
  async getActivePolls(roomId) {
    return this.find({
      room_id: roomId,
      is_active: true
    }).sort({ created_at: -1 });
  },
  
  /**
   * Cast a vote
   * @param {ObjectId} pollId - Poll ID
   * @param {ObjectId} optionId - Option ID
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Document>} Updated poll
   */
  async castVote(pollId, optionIndex, userId) {
    const poll = await this.findById(pollId);
    
    if (!poll || !poll.is_active) {
      throw new Error('Poll not found or not active');
    }
    
    if (optionIndex >= poll.options.length) {
      throw new Error('Invalid option index');
    }
    
    // Check if user has already voted in this poll
    const hasVoted = poll.options.some(option => 
      option.voted_by.includes(userId)
    );
    
    if (hasVoted && !poll.allow_multiple_votes) {
      throw new Error('User has already voted in this poll');
    }
    
    // Update the poll
    const result = await this.findOneAndUpdate(
      { _id: pollId },
      { 
        $inc: { 
          [`options.${optionIndex}.votes`]: 1,
          total_votes: 1
        },
        $push: { 
          [`options.${optionIndex}.voted_by`]: userId
        }
      },
      { new: true }
    );
    
    return result;
  },
  
  /**
   * Close a poll
   * @param {ObjectId} pollId - Poll ID
   * @returns {Promise<Document>} Updated poll
   */
  async closePoll(pollId) {
    return this.findByIdAndUpdate(
      pollId,
      { is_active: false },
      { new: true }
    );
  }
};

const Poll = mongoose.model('Poll', pollSchema);

module.exports = Poll;