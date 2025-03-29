const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  room_id: {
    type: Schema.Types.ObjectId,
    ref: 'RevisionRoom',
    required: true
  },
  user_id: {
    type: Schema.Types.ObjectId,
    required: true
  },
  user_name: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'resource', 'announcement', 'poll', 'timer', 'system'],
    default: 'text'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  likes: {
    type: Number,
    default: 0
  },
  liked_by: [{
    type: Schema.Types.ObjectId
  }],
  parent_id: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  // For resource sharing
  resource_data: {
    type: Schema.Types.Mixed
  },
  // For polls
  poll_data: {
    type: Schema.Types.Mixed
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
messageSchema.index({ room_id: 1, timestamp: -1 });
messageSchema.index({ parent_id: 1 });

// Static methods
messageSchema.statics = {
  /**
   * Get messages for a room
   * @param {ObjectId} roomId - Room ID
   * @param {number} limit - Maximum number of messages to return
   * @param {Date} before - Get messages before this timestamp
   * @returns {Promise<Array>} Array of messages
   */
  async getRoomMessages(roomId, limit = 50, before = null) {
    const query = { room_id: roomId };
    
    if (before) {
      query.timestamp = { $lt: before };
    }
    
    return this.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('parent_id', 'content user_name')
      .exec();
  },
  
  /**
   * Get replies to a message
   * @param {ObjectId} messageId - Parent message ID
   * @returns {Promise<Array>} Array of reply messages
   */
  async getReplies(messageId) {
    return this.find({ parent_id: messageId })
      .sort({ timestamp: 1 })
      .exec();
  },
  
  /**
   * Add like to a message
   * @param {ObjectId} messageId - Message ID
   * @param {ObjectId} userId - User ID who liked the message
   * @returns {Promise<Document>} Updated message
   */
  async addLike(messageId, userId) {
    return this.findOneAndUpdate(
      { 
        _id: messageId,
        liked_by: { $ne: userId }
      },
      { 
        $inc: { likes: 1 },
        $push: { liked_by: userId }
      },
      { new: true }
    );
  },
  
  /**
   * Remove like from a message
   * @param {ObjectId} messageId - Message ID
   * @param {ObjectId} userId - User ID who unliked the message
   * @returns {Promise<Document>} Updated message
   */
  async removeLike(messageId, userId) {
    return this.findOneAndUpdate(
      { 
        _id: messageId,
        liked_by: userId
      },
      { 
        $inc: { likes: -1 },
        $pull: { liked_by: userId }
      },
      { new: true }
    );
  }
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;