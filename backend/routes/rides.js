router.get('/completed', auth, async (req, res) => {
  try {
    const rides = await Ride.find({
      userId: req.user.id,
      status: 'completed'
    }).sort({ date: -1 }); // Sort by date descending
    
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching completed rides' });
  }
}); 