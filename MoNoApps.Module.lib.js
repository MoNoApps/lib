(($A, $M) => {
  $A('monoapps', [])
    .constant('version', $M.version);
  $A('monoapps.core', []);
  $A('monoapps.core.api', [])
    .service('DB', $M.Core.Api.DB)
    .service('Messenger', $M.Core.Api.Messenger)
    .controller('Game', $M.Core.Api.Game)
    .controller('List', ['DB', $M.Core.Api.List]);
})(angular.module, monoapps);