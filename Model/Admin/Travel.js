const mongoose = require('mongoose');

const travelSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Travel must belong to an employee']
  },
  employer: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Travel must be assigned by an employer']
  },
  job: {
    type: mongoose.Schema.ObjectId,
    ref: 'Job',
    required: [true, 'Travel must be associated with a job']
  },
  travelType: {
    type: String,
    enum: ['flight', 'train', 'bus', 'cab'],
    required: [true, 'Travel type is required']
  },
  bookingDetails: {
    bookingId: String,
    pnr: String,
    provider: String,
    cost: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  journey: {
    from: {
      city: String,
      state: String,
      country: String,
      coordinates: {
        type: [Number],
        index: '2dsphere'
      }
    },
    to: {
      city: String,
      state: String,
      country: String,
      coordinates: {
        type: [Number],
        index: '2dsphere'
      }
    },
    departureTime: Date,
    arrivalTime: Date,
    duration: Number // in minutes
  },
  status: {
    type: String,
    enum: ['pending', 'booked', 'cancelled', 'completed'],
    default: 'pending'
  },
  ticketFile: {
    url: String,
    uploadedAt: Date
  },
  tracking: [{
    status: {
      type: String,
      enum: ['scheduled', 'boarding', 'in-transit', 'arrived', 'delayed'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number],
      address: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    message: String
  }],
  accommodation: {
    required: {
      type: Boolean,
      default: false
    },
    details: {
      hotelName: String,
      address: String,
      checkIn: Date,
      checkOut: Date,
      bookingId: String,
      cost: Number
    }
  },
  expenses: [{
    type: {
      type: String,
      enum: ['food', 'transport', 'accommodation', 'other']
    },
    amount: Number,
    currency: {
      type: String,
      default: 'INR'
    },
    receipt: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    notes: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
travelSchema.index({ employee: 1, status: 1 });
travelSchema.index({ employer: 1, status: 1 });
travelSchema.index({ 'journey.departureTime': 1 });

// Pre-save middleware to calculate duration
travelSchema.pre('save', function(next) {
  if (this.journey.departureTime && this.journey.arrivalTime) {
    this.journey.duration = Math.round(
      (this.journey.arrivalTime - this.journey.departureTime) / (1000 * 60)
    );
  }
  next();
});

// Virtual populate for related documents
travelSchema.virtual('relatedDocuments', {
  ref: 'Document',
  foreignField: 'travel',
  localField: '_id'
});

const Travel = mongoose.model('Travel', travelSchema);

module.exports = Travel;