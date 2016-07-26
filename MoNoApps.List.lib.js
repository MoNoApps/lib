const MoNoApps = {
  List: class List {
    constructor(DBService, model = '') {
      this.model = model;
      this.search = '';
      this.commons = {};
      this.feed = [];
      this.resources = [];
      this.token = DBService.getToken();
    }
  }
}
