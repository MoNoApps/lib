angular.module('MoNoApps', [])
  .constant('version', '1.0.0');
angular.module('MoNoApps.core', []);
angular.module('MoNoApps.core.api', [])
  .service('DB', MoNoApps.DB)
  .service('Messenger', MoNoApps.Core.Api.Messenger)
  .controller('List', ['DB', MoNoApps.List]);
