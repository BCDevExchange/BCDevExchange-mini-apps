/*
Copyright 2015 Province of British Columbia

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/


var async = require('async');
var request = require('request');
var config = require('config');
var logger = require('../../common/logging.js').logger;

module.exports = function(app, db, passport) {
    app.get('/api/people', function(req, res) {
        // authN
        if (!req.isAuthenticated()) return res.sendStatus(401);
        // simple, crude, yet effective: todo replace with proper authZ package
        var admins = config.access.admin;
        var granted = false;
        for (var i = 0; i < admins.length; i++) {
            if (req.user._id === admins[i]) {
                granted = true;
            }
        }
        if (!granted) return res.sendStatus(403);

        getAllGitHubUsers(db, function (err, results) {
            res.send({"people": results});
        });
    });
};

function getAllGitHubUsers (db, callback) {
    db.getAccountsByOrigin("github", function (err, output) {
        async.concat(output, getGitHubUser, function (err, results) {
            callback(err, results);
        });
    });
}

function getGitHubUser(account, callback) {

    // get most recent access token
    var accessToken;
    for (var i = account.identities.length - 1; i >= 0; i--) {
        if (account.identities[i].origin === "github") {
            accessToken = account.identities[i].accessToken;
            break;
        }
    }

    if (!accessToken) return callback("Missing access token.");

    var options = {
        url: 'https://api.github.com/user?access_token=' + accessToken + "&client_id=" + config.github.clientID + "&client_secret=" + config.github.clientSecret,
        headers: {
            'User-Agent': config.github.clientApplicationName
        }
    };
    request(options, function (error, response, body) {
        if (!error &&
            typeof response !== 'undefined' &&
            response.statusCode === 200) {

            // parse out the yaml from content block
            var json = JSON.parse(body);

            // remove extraneous info from result
            var result = parseGitHubUserResult(account, json);

            // If email is missing (non-public email), call additional GitHub API

            if (!!result.email) {
                return callback(null, result);
            }
            else {
                getGitHubUserEmails(accessToken, function (err, emailList) {
                    if (err) return callback(err);
                    if (emailList) {
                        for (var i = 0; i < emailList.length; i++) {
                            if (emailList[i].primary === true) {
                                result.email = emailList[i].email;
                                break;
                            }
                        }
                    }
                    return callback(null, result);
                });
            }
        }
        else {
            logger.error('Error while fetching GitHub content: %s; response: %s; body: %s', error, response, body);
            return callback(error);
        }
    });
}

function getGitHubUserEmails(accessToken, callback) {

    if (!accessToken) return callback("Missing access token.");

    var options = {
        url: 'https://api.github.com/user/emails?access_token=' + accessToken + "&client_id=" + config.github.clientID + "&client_secret=" + config.github.clientSecret,
        headers: {
            'User-Agent': config.github.clientApplicationName
        }
    };
    request(options, function (error, response, body) {
        if (!error &&
            typeof response !== 'undefined' &&
            response.statusCode === 200) {

            // parse out the yaml from content block
            var json = JSON.parse(body);

            callback(null, json);

        }
        else {
            logger.error('Error while fetching GitHub content: %s; response: %s; body: %s', error, response, body);
            return callback(error);
        }
    });
}

function parseGitHubUserResult (account, result) {
    var transformed = {
        "id": account._id.toHexString(),
        "login": result.login,
        "name": result.name,
        "company": result.company,
        "location": result.location,
        "followers": result.followers,
        "email": result.email,
        "url": result.html_url,
        "avatar_url": result.avatar_url,
        "contactPreferences": account.profiles[0].contactPreferences,
        "identities": account.identities
    };

    return transformed;
}