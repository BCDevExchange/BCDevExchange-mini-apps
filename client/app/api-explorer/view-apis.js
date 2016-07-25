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

'use strict'

angular.module('bcdevxApp.apiExplorer', ['swaggerUi'])
  .run(function (swaggerModules, swaggerUiExternalReferences, swagger1ToSwagger2Converter, swaggerExplorerProxy, swaggerUiXmlFormatter) {
    swaggerModules.add(swaggerModules.BEFORE_PARSE, swagger1ToSwagger2Converter)
    swaggerModules.add(swaggerModules.BEFORE_PARSE, swaggerUiExternalReferences)
    swaggerModules.add(swaggerModules.AFTER_EXPLORER_LOAD, swaggerUiXmlFormatter)
    swaggerModules.add(swaggerModules.BEFORE_EXPLORER_LOAD, swaggerExplorerProxy)
    swaggerModules.add(swaggerModules.BEFORE_LOAD, swaggerExplorerProxy)
    swaggerExplorerProxy.proxyUrl = '/api/proxy/'
  })
  .controller('ViewApiCtrl', ['$scope','$routeParams', function ($scope,$routeParams) {
    $scope.swaggerUrl = encodeURIComponent($routeParams.swaggerUrl)
}])