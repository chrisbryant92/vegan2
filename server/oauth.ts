import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { storage } from './storage';

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with Google ID
      let user = await storage.getUserByGoogleId(profile.id);
      
      if (user) {
        return done(null, user);
      }
      
      // Check if user exists with same email
      if (profile.emails && profile.emails[0]) {
        user = await storage.getUserByEmail(profile.emails[0].value);
        if (user) {
          // Link Google account to existing user
          await storage.linkGoogleAccount(user.id, profile.id);
          return done(null, user);
        }
      }
      
      // Create new user
      const newUser = await storage.createUser({
        username: profile.emails?.[0]?.value || `google_${profile.id}`,
        name: profile.displayName || 'Google User',
        email: profile.emails?.[0]?.value,
        displayName: profile.displayName,
        profilePhoto: profile.photos?.[0]?.value,
        googleId: profile.id,
        authProvider: 'google',
        tags: []
      });
      
      return done(null, newUser);
    } catch (error) {
      return done(error, null);
    }
  }));
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/api/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with Facebook ID
      let user = await storage.getUserByFacebookId(profile.id);
      
      if (user) {
        return done(null, user);
      }
      
      // Check if user exists with same email
      if (profile.emails && profile.emails[0]) {
        user = await storage.getUserByEmail(profile.emails[0].value);
        if (user) {
          // Link Facebook account to existing user
          await storage.linkFacebookAccount(user.id, profile.id);
          return done(null, user);
        }
      }
      
      // Create new user
      const newUser = await storage.createUser({
        username: profile.emails?.[0]?.value || `facebook_${profile.id}`,
        name: profile.displayName || 'Facebook User',
        email: profile.emails?.[0]?.value,
        displayName: profile.displayName,
        profilePhoto: profile.photos?.[0]?.value,
        facebookId: profile.id,
        authProvider: 'facebook',
        tags: []
      });
      
      return done(null, newUser);
    } catch (error) {
      return done(error, null);
    }
  }));
}

// Export configured passport
export default passport;