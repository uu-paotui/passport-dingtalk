// Load modules.
var OAuth2Strategy = require("passport-oauth2");
var querystring = require("querystring");
var util = require("util");
var crypto = require("crypto");
var urllib = require("urllib");

function ensureToken(oauthIns) {
  var params = {
    appid: oauthIns._clientId,
    appsecret: oauthIns._clientSecret
  };
  var _ensure = function() {
    oauthIns._request(
      "GET",
      oauthIns._getAccessTokenUrl() + "?" + querystring.stringify(params),
      {
        "Content-Type": "application/json"
      },
      null,
      null,
      function(err, data, res) {
        if (err) throw err;
        data = JSON.parse(data);
        if (data && data.access_token) {
          oauthIns.access_token = data.access_token;
          setTimeout(_ensure, 60 * 1000 * 110);
        } else {
          setTimeout(_ensure, 2000);
        }
      }
    );
  };
  _ensure();
}

function Strategy(options, verify) {
  options = options || {};
  options.authorizationURL =
    options.authorizationURL || "https://login.dingtalk.com/oauth2/auth";
  options.callbackURL = options.callbackURL;
  options.scopeSeparator = options.scopeSeparator || ",";
  options.customHeaders = options.customHeaders || {};
  options.tokenURL =
    options.tokenURL || "https://oapi.dingtalk.com/sns/gettoken";
  if (!options.customHeaders["User-Agent"]) {
    options.customHeaders["User-Agent"] =
      options.userAgent || "node-passport-dingtalk";
  }
  OAuth2Strategy.call(this, options, verify);
  this.name = "dingtalk";
  this._oauth2._userProfileURL =
    options.userProfileURL || "https://api.dingtalk.com/v1.0/contact/users/me";
  this._oauth2._persistentTokenURL =
    options.persistentTokenURL ||
    "https://api.dingtalk.com/v1.0/oauth2/userAccessToken ";
  this._host = options.host;
  ensureToken(this._oauth2);
  this._oauth2.getOAuthAccessToken = function(code, params, callback) {
    var self = this;
    urllib.request(
      this._persistentTokenURL,
      {
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST",
        dataType: "json",
        data: {
          clientId: self._clientId,
          clientSecret: self._clientSecret,
          code: code,
          grantType: "authorization_code"
        }
      },
      function(err, data, res) {
        if (err) return callback(err);
        var accessToken = data.accessToken;
        var refreshToken = data.refreshToken;
        if (!accessToken || !refreshToken)
          return callback(new Error("refreshToken failed"));
        callback(null, accessToken, refreshToken, data); // callback results =-=
      }
    );
  };
  this._oauth2.getAuthorizeUrl = function(params) {
    params = params || {};
    params["client_id"] = this._clientId;
    let { client_id, scope, prompt, response_type, redirect_uri } = params;
    let tmpParams = {
      redirect_uri,
      client_id,
      scope: "openid",
      prompt: "consent",
      response_type: "code"
    };
    return (
      this._baseSite +
      this._authorizeUrl +
      "?" +
      querystring.stringify(tmpParams)
    );
  };
}

// Inherit from `OAuth2Strategy`.
util.inherits(Strategy, OAuth2Strategy);

Strategy.prototype.authenticate = function(req, options) {
  options || (options = {});
  req.query.code = req.query.authCode;
  OAuth2Strategy.prototype.authenticate.call(this, req, options);
};
// Strategy.prototype.authorizationParams = function(params, options) {
//   // 构建提交参数
//   params = params || {};
//   params["client_id"] = this._clientId;
//   params["scope"] = "openid,corpid";
//   params["prompt"] = "consent";
//   params["response_type"] = "code";
//   return params;
// };
// OAuth2Strategy.prototype._loadUserProfile = function(
//   accessToken,
//   done,
//   params
// ) {
//   this.userProfile(accessToken, done, params);
// };

Strategy.prototype.userProfile = function(params, done, accessToken) {
  urllib.request(
    this._oauth2._userProfileURL,
    {
      headers: {
        "Content-Type": "application/json",
        "x-acs-dingtalk-access-token": params.accessToken
      },
      method: "GET",
      dataType: "json"
    },
    function(err, data, res) {
      console.log("拿到用户返回信息", data);
      return done(null, {
        provider: "dingtalk",
        id: data.openId,
        name: data.nick,
        privateId: data.unionId,
        mobile: data.mobile,
        email: data.email,
        headurl: data.avatarUrl,
        _json: data
      });
    }
  );
};

// Expose constructor.
module.exports = Strategy;
