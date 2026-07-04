const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/user");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/users/auth/google/callback",
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google Profile:", profile);

        // Check if user already exists by Google ID
        let user = await User.findOne({
          googleId: profile.id,
        });

        if (user) {
          return done(null, user);
        }

        // Check if email already exists
        user = await User.findOne({
          email: profile.emails[0].value.toLowerCase(),
        });

        if (user) {
          user.googleId = profile.id;
          user.provider = "google";

          if (profile.photos && profile.photos.length > 0) {
            user.avatar = profile.photos[0].value;
          }

          await user.save();

          return done(null, user);
        }

        // Create a new user
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value.toLowerCase(),
          googleId: profile.id,
          provider: "google",
          avatar:
            profile.photos && profile.photos.length > 0
              ? profile.photos[0].value
              : undefined,

          // Default role for new OAuth users
          role: "freelancer",

          walletBalance: 1000,
        });

        return done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "/api/users/auth/github/callback",
        scope: ["user:email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let email = null;
  
          // GitHub sometimes doesn't return the email unless it's public
          if (profile.emails && profile.emails.length > 0) {
            email = profile.emails[0].value.toLowerCase();
          }
  
          // Check by GitHub ID
          let user = await User.findOne({
            githubId: profile.id,
          });
  
          if (user) {
            return done(null, user);
          }
  
          // Check existing account by email
          if (email) {
            user = await User.findOne({ email });
  
            if (user) {
              user.githubId = profile.id;
              user.provider = "github";
  
              if (profile.photos.length > 0) {
                user.avatar = profile.photos[0].value;
              }
  
              await user.save();
  
              return done(null, user);
            }
          }
  
          // Create new user
          user = await User.create({
            name: profile.displayName || profile.username,
            email,
            githubId: profile.id,
            provider: "github",
            avatar:
              profile.photos.length > 0
                ? profile.photos[0].value
                : undefined,
            role: "freelancer",
            walletBalance: 1000,
          });
  
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);

    done(null, user);
  } catch (err) {
    done(err, null);
  }
});