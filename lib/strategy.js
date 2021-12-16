// Load modules.
var OAuth2Strategy = require("passport-oauth2");
var querystring = require("querystring");
var util = require("util");
var crypto = require("crypto");
var urllib = require("urllib");
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
}

// Inherit from `OAuth2Strategy`.
util.inherits(Strategy, OAuth2Strategy);

Strategy.prototype.authenticate = function(req, options) {
  options || (options = {});
  req.query.code = req.query.authCode;
  OAuth2Strategy.prototype.authenticate.call(this, req, options);
};
OAuth2Strategy.prototype._loadUserProfile = function(
  accessToken,
  done,
  params
) {
  this.userProfile(accessToken, done, params);
};
Strategy.prototype.authorizationParams = function(params) {
  // 构建提交参数
  params = params || {};
  params["client_id"] = this._clientId;
  params["scope"] = "openid,corpid";
  params["prompt"] = "consent";
  params["response_type"] = "code";
  return params;
};
Strategy.prototype.userProfile = function(accessToken, done) {
  urllib.request(
    this._oauth2._userProfileURL,
    {
      headers: {
        "Content-Type": "application/json",
        "x-acs-dingtalk-access-token": accessToken
      },
      method: "GET",
      dataType: "json"
    },
    function(err, data, res) {
      return done(null, {
        provider: "dingtalk",
        id: data.openId,
        name: data.nick,
        privateId: data.unionId,
        mobile: data.mobile,
        email: data.mobile, //官方缺少email字段，待修复
        headurl: data.avatarUrl,
        _json: data
      });
    }
  );
};

// Expose constructor.
module.exports = Strategy;
