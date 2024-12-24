const jwt = require('jsonwebtoken');
const admin = require('../config/firebase');

exports.generateToken = (user) => {
  console.log('Generating token for user:', {
    id: user._id,
    firebaseUID: user.firebaseUID,
    email: user.email,
    roles: user.roles
  });
  
  const token = jwt.sign(
    { 
      id: user._id,
      firebaseUID: user.firebaseUID,
      email: user.email,
      roles: user.roles 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  console.log('Generated token:', token.substring(0, 50) + '...');
  return token;
};

exports.verifyToken = async (req, res, next) => {
  try {
    console.log('Verifying token...');
    
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    console.log('Token received:', token.substring(0, 50) + '...');

    // First try JWT verification
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('JWT verification successful:', decoded);
      req.user = decoded;
      return next();
    } catch (jwtError) {
      console.log('JWT verification failed, trying Firebase:', jwtError.message);
      
      // If JWT fails, try Firebase verification
      try {
        const decodedFirebase = await admin.auth().verifyIdToken(token);
        console.log('Firebase verification successful:', decodedFirebase);

        // Find or create user
        const User = require('../models/User');
        let user = await User.findOne({ firebaseUID: decodedFirebase.uid });
        
        if (!user) {
          console.log('Creating new user from Firebase token');
          user = new User({
            firebaseUID: decodedFirebase.uid,
            email: decodedFirebase.email,
            name: decodedFirebase.name || decodedFirebase.email.split('@')[0],
            roles: ['customer']
          });
          await user.save();
          console.log('New user created:', user);
        }

        // Generate JWT token
        const jwtToken = exports.generateToken(user);
        
        // Add token to response headers
        res.setHeader('X-Auth-Token', jwtToken);
        
        req.user = {
          id: user._id,
          firebaseUID: user.firebaseUID,
          email: user.email,
          roles: user.roles
        };
        
        // Add logging
        console.log('User in request:', req.user);
        
        return next();
      } catch (firebaseError) {
        console.error('Firebase verification failed:', firebaseError);
        return res.status(401).json({ 
          message: 'Invalid token',
          error: firebaseError.message 
        });
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

exports.checkRole = (roles) => {
  return (req, res, next) => {
    console.log('Checking roles:', {
      required: roles,
      userRoles: req.user?.roles,
      user: req.user
    });

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const hasRole = req.user.roles.some(role => roles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
}; 