const mongoose = require('mongoose');
const Driver = require('../models/Driver');
const User = require('../models/User');

async function migrateDriverFirebaseUID() {
  try {
    const drivers = await Driver.find({ firebaseUID: { $exists: false } });
    
    for (const driver of drivers) {
      const user = await User.findById(driver.userId);
      if (user) {
        driver.firebaseUID = user.firebaseUID;
        await driver.save();
      }
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.disconnect();
  }
}

mongoose.connect(process.env.MONGODB_URI)
  .then(migrateDriverFirebaseUID)
  .catch(console.error); 