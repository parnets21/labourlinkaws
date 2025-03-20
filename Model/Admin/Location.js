const mongoose = require('mongoose');

const calculateDistance = (coord1, coord2) => {
  //Implementation for calculating distance between two coordinates
  const earthRadius = 6371; // Radius of the earth in km
  const lat1 = coord1[1];
  const lon1 = coord1[0];
  const lat2 = coord2[1];
  const lon2 = coord2[0];

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c;
  return distance;
};

const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};


const locationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Location must belong to a user']
  },
  type: {
    type: String,
    enum: ['Office', 'Remote', 'Meeting', 'Travel'],
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    },
    address: String,
    floor: String,
    room: String,
    desk: String
  },
  status: {
    type: String,
    enum: ['active', 'on-break', 'in-meeting', 'off-duty'],
    default: 'active'
  },
  activity: {
    type: String,
    enum: ['work', 'meeting', 'break', 'travel'],
    required: true
  },
  workMode: {
    type: String,
    enum: ['office', 'remote', 'hybrid'],
    required: true
  },
  schedule: {
    startTime: Date,
    endTime: Date,
    breakTime: Number, // in minutes
    totalHours: Number
  },
  tracking: {
    deviceId: String,
    ipAddress: String,
    browser: String,
    platform: String
  }
}, {
  timestamps: true
});

// Indexes
locationSchema.index({ user: 1, createdAt: -1 });
locationSchema.index({ location: '2dsphere' });

// Methods
locationSchema.methods.isWithinOfficeRadius = function(officeCoordinates, radius) {
  // Calculate distance between current location and office
  const currentLocation = this.location.coordinates;
  const distance = calculateDistance(currentLocation, officeCoordinates);
  return distance <= radius;
};

// Statics
locationSchema.statics.getLocationHistory = async function(userId, startDate, endDate) {
  return this.find({
    user: userId,
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ createdAt: -1 });
};

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;