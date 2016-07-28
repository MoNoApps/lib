(($) => {
  class DB {
    constructor() {
      this.token = window.localStorage.getItem('token');
    }

    getToken() {
      return this.token;
    }
  }
  
  $['DB'] = DB
})(MoNoApps = {});
