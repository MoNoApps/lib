const MoNoApps = {
  DB: class DB {
    constructor() {
      this.token = window.localStorage.getItem('token');
    }

    getToken() {
      return this.token;
    }
  }
}