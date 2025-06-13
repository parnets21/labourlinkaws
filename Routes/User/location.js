const express = require('express');
const router = express.Router();
const Location = require('../../Model/User/location');
const User = require("../../Model/User/user");
// POST /api/jobseeker/location - Update jobseeker location
router.post('/location', async (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;

    // Check if jobseeker exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Jobseeker not found' });
    }
console.log('📍 Location received:', userId, latitude, longitude);

    // Update or insert location
    await Location.findOneAndUpdate(
      { userId },
      { latitude, longitude, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    res.status(200).send('Location updated');
  } catch (err) {
    console.error('Error updating location:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET: Get the latest location of a jobseeker
router.get('/location/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if jobseeker exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Jobseeker not found' });
    }

    const location = await Location.findOne({ userId })
      .sort({ updatedAt: -1 }) // use updatedAt for latest
      .exec();

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.status(200).json(location);
  } catch (err) {
    console.error('Error fetching location:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;