const axios = require('axios');

const calculateRouteMetrics = async (origin, destination) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
        origin
      )}&destinations=${encodeURIComponent(
        destination
      )}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.status !== 'OK') {
      throw new Error('Failed to calculate route metrics');
    }

    const result = response.data.rows[0].elements[0];
    
    if (result.status !== 'OK') {
      throw new Error('Route calculation failed');
    }

    return {
      distance: {
        text: result.distance.text,
        value: result.distance.value
      },
      duration: {
        text: result.duration.text,
        value: result.duration.value
      }
    };
  } catch (error) {
    console.error('Error calculating route metrics:', error);
    return null;
  }
};

module.exports = { calculateRouteMetrics }; 