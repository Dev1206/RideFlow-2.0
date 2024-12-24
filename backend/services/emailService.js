const nodemailer = require('nodemailer');
const config = require('../config/email');

// Create transporter (configure with your email service)
const transporter = nodemailer.createTransport({
  service: config.service,
  auth: config.auth
});

// Email templates
const templates = {
  newBooking: {
    admin: (ride, user) => ({
      subject: 'New Ride Booking',
      html: `
        <h2>New Ride Booking</h2>
        <p>A new ride has been booked by ${user.name} (${user.email})</p>
        <h3>Ride Details:</h3>
        <ul>
          <li>Pickup: ${ride.pickupLocation}</li>
          <li>Drop-off: ${ride.dropLocation}</li>
          <li>Date: ${new Date(ride.date).toLocaleDateString()}</li>
          <li>Time: ${ride.time}</li>
          <li>Phone: ${ride.phone}</li>
          ${ride.notes ? `<li>Notes: ${ride.notes}</li>` : ''}
        </ul>
      `
    }),
    user: (ride) => ({
      subject: 'Ride Booking Confirmation',
      html: `
        <h2>Your Ride Booking is Confirmed</h2>
        <h3>Ride Details:</h3>
        <ul>
          <li>Pickup: ${ride.pickupLocation}</li>
          <li>Drop-off: ${ride.dropLocation}</li>
          <li>Date: ${new Date(ride.date).toLocaleDateString()}</li>
          <li>Time: ${ride.time}</li>
          ${ride.notes ? `<li>Notes: ${ride.notes}</li>` : ''}
        </ul>
        <p>We'll notify you once a driver is assigned to your ride.</p>
      `
    })
  },

  rideCancelled: {
    admin: (ride, user) => ({
      subject: 'Ride Cancelled',
      html: `
        <h2>Ride Cancellation Notice</h2>
        <p>${user.name} has cancelled their ride.</p>
        <h3>Cancelled Ride Details:</h3>
        <ul>
          <li>Pickup: ${ride.pickupLocation}</li>
          <li>Drop-off: ${ride.dropLocation}</li>
          <li>Date: ${new Date(ride.date).toLocaleDateString()}</li>
          <li>Time: ${ride.time}</li>
        </ul>
      `
    })
  },

  driverAssigned: {
    user: (ride, driver) => ({
      subject: 'Driver Assigned to Your Ride',
      html: `
        <h2>Driver Assigned</h2>
        <p>A driver has been assigned to your ride.</p>
        <h3>Driver Details:</h3>
        <ul>
          <li>Name: ${driver.name}</li>
          <li>Phone: ${driver.phone}</li>
          <li>Vehicle: ${driver.vehicle.color} ${driver.vehicle.make} ${driver.vehicle.model}</li>
          <li>Plate Number: ${driver.vehicle.plateNumber}</li>
        </ul>
        <h3>Ride Details:</h3>
        <ul>
          <li>Pickup: ${ride.pickupLocation}</li>
          <li>Drop-off: ${ride.dropLocation}</li>
          <li>Date: ${new Date(ride.date).toLocaleDateString()}</li>
          <li>Time: ${ride.time}</li>
        </ul>
      `
    }),
    driver: (ride, user) => ({
      subject: 'New Ride Assignment',
      html: `
        <h2>New Ride Assigned</h2>
        <h3>Passenger Details:</h3>
        <ul>
          <li>Name: ${user.name}</li>
          <li>Phone: ${ride.phone}</li>
        </ul>
        <h3>Ride Details:</h3>
        <ul>
          <li>Pickup: ${ride.pickupLocation}</li>
          <li>Drop-off: ${ride.dropLocation}</li>
          <li>Date: ${new Date(ride.date).toLocaleDateString()}</li>
          <li>Time: ${ride.time}</li>
          ${ride.notes ? `<li>Notes: ${ride.notes}</li>` : ''}
        </ul>
      `
    })
  },

  rideCompleted: {
    admin: (ride, driver, user) => ({
      subject: 'Ride Completed',
      html: `
        <h2>Ride Completed</h2>
        <p>The ride has been successfully completed.</p>
        <h3>Ride Summary:</h3>
        <ul>
          <li>Passenger: ${user.name}</li>
          <li>Driver: ${driver.name}</li>
          <li>Pickup: ${ride.pickupLocation}</li>
          <li>Drop-off: ${ride.dropLocation}</li>
          <li>Date: ${new Date(ride.date).toLocaleDateString()}</li>
          <li>Time: ${ride.time}</li>
        </ul>
      `
    }),
    user: (ride, driver) => ({
      subject: 'Ride Completed - Thank You!',
      html: `
        <h2>Thank You for Riding with Us!</h2>
        <p>Your ride has been completed. We hope you had a great experience!</p>
        <h3>Ride Summary:</h3>
        <ul>
          <li>Driver: ${driver.name}</li>
          <li>Pickup: ${ride.pickupLocation}</li>
          <li>Drop-off: ${ride.dropLocation}</li>
          <li>Date: ${new Date(ride.date).toLocaleDateString()}</li>
          <li>Time: ${ride.time}</li>
        </ul>
      `
    }),
    driver: (ride, user) => ({
      subject: 'Ride Completed - Summary',
      html: `
        <h2>Ride Completed</h2>
        <p>The ride has been marked as completed.</p>
        <h3>Ride Summary:</h3>
        <ul>
          <li>Passenger: ${user.name}</li>
          <li>Pickup: ${ride.pickupLocation}</li>
          <li>Drop-off: ${ride.dropLocation}</li>
          <li>Date: ${new Date(ride.date).toLocaleDateString()}</li>
          <li>Time: ${ride.time}</li>
        </ul>
      `
    })
  }
};

// Helper function to send email
const sendEmail = async (to, template, attempt = 1) => {
  try {
    await transporter.sendMail({
      from: config.defaultFrom,
      to,
      subject: template.subject,
      html: template.html
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Error sending email (attempt ${attempt}):`, error);
    
    // Retry logic
    if (attempt < config.retryAttempts) {
      console.log(`Retrying... (attempt ${attempt + 1})`);
      await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      return sendEmail(to, template, attempt + 1);
    }
    
    // Log but don't throw error after all retries fail
    console.error('Failed to send email after all retry attempts');
  }
};

// Email notification functions
const emailService = {
  async sendNewBookingNotifications(ride, user, adminEmail) {
    await Promise.all([
      sendEmail(adminEmail, templates.newBooking.admin(ride, user)),
      sendEmail(user.email, templates.newBooking.user(ride))
    ]);
  },

  async sendCancellationNotification(ride, user, adminEmail) {
    await sendEmail(adminEmail, templates.rideCancelled.admin(ride, user));
  },

  async sendDriverAssignedNotifications(ride, user, driver, adminEmail) {
    await Promise.all([
      sendEmail(user.email, templates.driverAssigned.user(ride, driver)),
      sendEmail(driver.email, templates.driverAssigned.driver(ride, user))
    ]);
  },

  async sendRideCompletedNotifications(ride, user, driver, adminEmail) {
    console.log('Sending ride completion notifications to:', {
      admin: adminEmail,
      user: user.email,
      driver: driver.email
    });

    try {
      await Promise.all([
        sendEmail(adminEmail, templates.rideCompleted.admin(ride, driver, user)),
        sendEmail(user.email, templates.rideCompleted.user(ride, driver)),
        sendEmail(driver.email, templates.rideCompleted.driver(ride, user))
      ]);
      
      console.log('All completion notifications sent successfully');
    } catch (error) {
      console.error('Error sending completion notifications:', error);
    }
  }
};

module.exports = emailService; 