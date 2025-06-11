const express = require('express');
const router = express.Router();
const Location = require('../../Model/User/location');

// POST: Store location
router.post('/location', async (req, res) => {
  try {
    const { jobseekerId, latitude, longitude, timestamp } = req.body;

    if (!jobseekerId || !latitude || !longitude) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const location = new Location({
      jobseekerId,
      latitude,
      longitude,
      timestamp
    });

    await location.save();
    res.status(201).json({ message: 'Location saved successfully' });
  } catch (err) {
    console.error('Error saving location:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// GET: Get the latest location of a jobseeker
router.get('/location/:jobseekerId', async (req, res) => {
  try {
    const { jobseekerId } = req.params;

    if (!jobseekerId) {
      return res.status(400).json({ message: 'Jobseeker ID is required' });
    }

    // Fetch the latest location (assuming you store multiple entries)
    const location = await Location.findOne({ jobseekerId })
      .sort({ timestamp: -1 }) // sort by latest timestamp
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
