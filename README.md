# node-passport-dingtalk
dingtalk authentication strategy for passport


using the OAuth 2.0 API.

This module lets you authenticate using dingtalk in your Node.js applications.
By plugging into Passport, qq authentication can be easily and
unobtrusively integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Installation

    $ npm install passport-dingtalk

## Usage

#### Configure Strategy

The qq authentication strategy authenticates users using a qq account
and OAuth 2.0 tokens.  The strategy requires a `verify` callback, which accepts
these credentials and calls `done` providing a user, as well as `options`
specifying a client ID, client secret, and callback URL.

    passport.use(new dingtalkStrategy({
        clientID: client_id,
        clientSecret: client_secret,
        callbackURL: "http://127.0.0.1:3000/auth/dingtalk/callback"
      },
      function(accessToken, refreshToken, profile, done) {
        User.findOrCreate({ Id: profile.id }, function (err, user) {
          return done(err, user);
        });
      }
    ));

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'dingtalk'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

    app.get('/auth/dingtalk',
      passport.authenticate('dingtalk'),
      function(req, res){
        // The request will be redirected to qq for authentication, so this
        // function will not be called.
      });

    app.get('/auth/dingtalk/callback',
      passport.authenticate('dingtalk', { failureRedirect: '/login' }),
      function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
      });

## License

MIT

