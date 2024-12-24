const emailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  },
  defaultFrom: `RideFlow <${process.env.EMAIL_USER}>`,
  retryAttempts: 3,
  retryDelay: 1000 // 1 second
};

module.exports = emailConfig; 