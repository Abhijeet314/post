import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  customCategory: {
    type: String,
  },
  contentType: {
    type: String,
    required: true,
    enum: ['promotional', 'educational', 'entertaining', 'branding', 'conversational', 'news', 'storytelling'],
  },
  marketingPatterns: [{
    type: String,
    enum: ['question', 'list', 'how-to', 'call-to-action', 'statistics', 'social-proof', 'problem-solution'],
  }],
  format: {
    hasImages: Boolean,
    hasVideos: Boolean,
    hasLinks: Boolean,
    isThread: Boolean,
    hasCTA: Boolean,
    usesStatistics: Boolean,
    hashtags: Boolean,
    hashtagCount: {
      type: Number,
      default: 0,
    },
  },
  platform: {
    type: String,
    required: true,
    enum: ['twitter', 'linkedin'],
  },
  engagement: {
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    reposts: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
    engagementRate: {
      type: Number,
      default: 0,
    },
    engagementScore: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
});


contentSchema.pre('save', function(next) {
  const { views, likes, reposts, comments } : any = this.engagement;
  const totalEngagement = likes + (reposts * 2) + (comments * 3);
  
  // Calculate engagement rate (based on views instead of followers)
  if (views > 0 && this.engagement) {
    this.engagement.engagementRate = (totalEngagement / views) * 100;
  } else if (this.engagement) {
    this.engagement.engagementRate = 0;
  }
  
  // Calculate engagement score (0-100)
  const likeWeight = 1.0;
  const repostWeight = 2.0;
  const commentWeight = 3.0;
  const viewWeight = 0.1;
  
  const weightedEngagement = 
    (likes * likeWeight) + 
    (reposts * repostWeight) + 
    (comments * commentWeight) +
    (views * viewWeight);
  
  // Normalize score to 0-100 range based on weighted engagement
  if (this.engagement) {
    this.engagement.engagementScore = Math.min(100, weightedEngagement / 100);
  }
  
  next();
});

export default mongoose.models.Content || mongoose.model('Twitter', contentSchema, 'postcontent');