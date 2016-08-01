(($M) => {
  const Dependencies = [];

  class DB {
    constructor() {
      this.token = window.localStorage.getItem('token');
    }

    getToken() {
      return this.token;
    }
  }
  
  $M.Core.Api.DB = Dependencies.concat(DB);

})(MoNoApps);
