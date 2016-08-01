(($M) => {
  const Dependencies = [];

  class List {
    constructor() {
      this.model = model;
      this.search = '';
      this.commons = {};
      this.feed = [];
      this.resources = [];
      this.token = DBService.getToken();
    }
  }
  
  $M.Core.Api.List = Dependencies.concat(List);

})(MoNoApps);
