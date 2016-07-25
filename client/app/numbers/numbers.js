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

'use strict';
angular.module('bcdevxApp.numbers', ['ngRoute',  'ngResource'])
.factory('NumbersCountService', ['$resource', function($resource) {
    return $resource('/api/numbers');
}])
.controller('NumbersCtrl', ['$scope', 'NumbersCountService', '$q', 'usSpinnerService', function($scope, NumbersCountService) {
    $scope.numbers = {
        isLoaded: false,
        accounts: '-',
        resources: '-',
        projects: '-',
        bcdevx: {
            stargazers: '-',
            watchers: '-',
            open_issues: '-'
        },
        bcgov: {
            stargazers: '-',
            watchers: '-',
            open_issues: '-'
        },
        bcdevx_activity: [],
        bcgov_activity: [],
        twitter_bcdev: [],
        analytics: {
            users: '-'
        }
    };

    NumbersCountService.get({}, function(data) {
        $scope.numbers.isLoaded = true;
        $scope.numbers.accounts = data.githubAccounts;
        $scope.numbers.resources = data.resources;
        $scope.numbers.projects = data.projects;
        $scope.numbers.bcdevx = data.bcdevx;
        $scope.numbers.bcgov = data.bcgov;
        $scope.numbers.bcdevx_activity = data.bcdevx_latest;
        $scope.numbers.bcgov_activity = data.bcgov_latest;
        $scope.numbers.analytics = data.analytics || $scope.numbers.analytics;
        $scope.numbers.twitter_bcdev = data.twitter_bcdev.recentTweets;
    });

}])
.directive('countUp', ['$compile',function($compile) {
    return {
        restrict: 'E',
        replace: false,
        scope: {
            countTo: '=countTo',
            interval: '=interval'
        },
        controller: ['$scope', '$element', function ($scope, $element) {
            $scope.millis = 0;
            if ($element.html().trim().length === 0) {
                $element.append($compile('<span>{{millis}}</span>')($scope));
            } else {
                $element.append($compile($element.contents())($scope));
            }

            var i=0;
            function timeloop () {
                setTimeout(function () {
                    $scope.millis++;
                    $scope.$digest();
                    i++;
                    if (i<$scope.countTo) {
                        timeloop();
                    }
                }, $scope.interval);
            }
            timeloop();
        }]
    };
}])
.directive('githubActivity', [function() {
    return {
        restrict: 'EA',
        replace: false,
        scope: {
            icon: '=icon',
            user_avatar: '=avatar',
            user_name: '=username',
            user_url: '=userUrl',
            description: '=description',
            details: '=details',
            details_url: '=detailsUrl',
            details_when: '=detailsWhen'
        },
        templateUrl: '/app/numbers/githubActivity.html'
    };
}])
.directive('twitterActivity', [function() {
    return {
        restrict: 'EA',
        replace: false,
        scope: {
            user_avatar: '=avatar',
            user_name: '=username',
            user_url: '=userUrl',
            tweet: '=tweet',
            tweet_when: '=tweetWhen',
            tweet_url: '=tweetUrl'
        },
        templateUrl: '/app/numbers/twitterActivity.html'
    };
}]);
