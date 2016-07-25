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


module.exports = function (app, db, passport) {

  var config = require('config')
  var logger = require('../../common/logging.js').logger
  var Q = require('q')
  var auth = require('./auth.js')
  var async = require('async')
  var request = require('request')
  var _ = require('lodash')

  var db = require('../models/db')
  var ProgramService = require('../services/program-service')

  app.get("/api/issues/:program?",
    function (req, res) {

      if (req.params.program) {
        var deferred = Q.defer();
        db.getProgramByName(req.params.program).then(function (program) {

          if (!program) {
            deferred.resolve([])
          }
          else {
            var githubUrl = program.githubStatsUrl || program.githubUrl
            if (!githubUrl) {
              deferred.resolve([])
            } else {
              var ghRepo = githubUrl.substr(githubUrl.indexOf('github.com') + 11)
              getGitHubIssuesForRepo(ghRepo, function (results) {
                deferred.resolve(results);
              })
            }
          }
          return deferred.promise;
        }).then(function (results) {
          res.send({issues: results});
        })
      } else {
        // get all programs and then fire off parallel requests to get all issues
        var deferred = Q.defer();
        var progs = function (programs) {
          ProgramService.getProgramsFromArray(config.programs, function (programs) {
            deferred.resolve(programs)
          });
          return deferred.promise
        };

        progs().then(function (programs) {
          var deferred2 = Q.defer();
          async.concat(programs, function (program, callback) {
            callback(null, db.getProgramByName(program.title));
          }, function (err, results) {
            console.log("results: " + results.length);
            deferred2.resolve(Q.all(results));
          });

          return deferred2.promise;
        }).then(function (programData) {
          console.log("programData: " + programData.length);
          var deferred3 = Q.defer();
          async.concat(programData, function (program, callback) {
            if (!program) {
              return callback(null, null)
            }
            var githubUrl = program.githubStatsUrl || program.githubUrl
            if (!githubUrl) {
              return callback(null, null)
            }
            var ghRepo = githubUrl.substr(githubUrl.indexOf('github.com') + 11)
            var state = req.query.state || 'open';
            ProgramService.getGitHubList(ghRepo, '/issues?labels=help wanted&per_page=100&state='+state, function (err, issues) {
              callback(err, issues.map(function(e){
                // populate BCDevX program name to the issue
                e.devXProgramNm = program.name
                return e
              }));
            });

          }, function (err, issues) {
            if (err) {
              deferred3.reject(err);
            } else {
              deferred3.resolve(issues)
            }
          });
          return deferred3.promise;
        }).then(function (issues) {
          if (issues && issues.length) {
            console.log(issues.length + " issues(s) found for all repos.")
          }
          res.send({issues: issues})
        }).fail(function (failure) {
          res.send({error: "something unexpected happened."});
        });
      }
    });
}

