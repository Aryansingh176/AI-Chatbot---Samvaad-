const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

console.log('LOADING passport config - GCLIENT present?', !!process.env.GOOGLE_CLIENT_ID);

try {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('GoogleStrategy callback for id:', profile && profile.id);
        let user = await User.findOne({ googleId: profile.id });
        if (user) return done(null, user);

        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          user.googleId = profile.id;
          user.picture = profile.photos?.[0]?.value || user.picture;
          await user.save();
          return done(null, user);
        }

        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          password: Math.random().toString(36).slice(-8),
          picture: profile.photos?.[0]?.value || ''
        });
        return done(null, user);
      } catch (err) {
        console.error('Error in GoogleStrategy callback:', err);
        return done(err, null);
      }
    }
  ));
  console.log('GoogleStrategy registered');
} catch (err) {
  console.error('Failed to register GoogleStrategy:', err);
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
