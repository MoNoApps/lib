(($W, $M) => {
  const Dependencies = [];

  class Messenger {
    constructor() {
      // return $W.io();
      return {
        on(channel, callback) {
          callback();
        },
        emmit(channel, message) {
          console.log(channel, message);
        }
      };
    }
  }

  $M.Core.Api.Messenger = Dependencies.concat(Messenger);

})(window, MoNoApps);
