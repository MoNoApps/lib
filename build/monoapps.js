(($W) => $W.MoNoApps || ($W.MoNoApps = {
  version: '1.0.0',
  Core: {
    Api: {}
  }
}))(window);

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

(($M) => {
  const Dependencies = [
    '$http',
    '$interval',
    '$log',
    '$timeout',
    'Messenger'];

  class Game {
    constructor(
      $http,
      $interval,
      $log,
      $timeout,
      Messenger
    ) {
      this.http = $http;
      this.interval = $interval;
      this.log = $log;
      this.timeout = $timeout;
      this.messenger = Messenger;
      this.peer = [];
      this.icons = [];
      this.board = [];
      this.peerIdx = [];
      this.challenges = [];
      this.scores = [];
      this.activity = [];
      this.wins = 0;
      this.loss = 0;
      this.gems = 0;
      this.tries = 0;
      this.time = 60;
      this.level = 1;
      this.done = false;
      this.isPaused = true;
      this.challenge = false;
      this.interval = false;
      this.checkForTimeInt = false;
      this.chapter = 'game';
      this.status = 'active';
      this.tapeCode = 9641;
    }

    onInit() {
      this.messenger.on('info', this.onInfo.bind(this));
      this.messenger.on('join', this.onJoin.bind(this));
      this.messenger.on('level', this.onLevel.bind(this));
      this.messenger.on('levels', this.onLevels.bind(this));
      this.messenger.on('challenges', this.onChallenges.bind(this));
      if (this.token) {
        this.messenger.emit('identify', this.token);
      }
    }

    codeToString(code = 10033) {
      return String.fromCharCode(code);
    }

    act(action) {
      switch (action) {
        case 'play':
          this.isPaused = false;
          this.time = 60;
          this.status = 'warning';
          this.messenger.emit('play', {
            challenge: angular.copy(this.challenge),
            level: angular.copy(this.level)
          });
          break;
        case 'pause':
          this.isPaused = true;
          this.status = 'danger';
          destroyTimer();
          this.reset();
          break;
        case 'stop':
          destroyTimer();
          this.time = 0;
          this.isPaused = true;
          this.status = 'active';
          this.board = [];
          break;
        case 'done':
          this.gems += 1;
          this.level += 1;
          this.messenger.emit('done', {
            challenge: angular.copy(this.challenge),
            time: angular.copy(this.time),
            board: angular.copy(this.board),
            level: angular.copy(this.level)
          });
          this.act('stop');
          break;
        default:
          timer();
          break;
      }
    }

    revealIcons(challenge) {
      this.icons = this.printIcons(challenge.start, challenge.end);
    }

    removelIcons() {
      this.icons = [];
    }

    setChallenge(challenge) {
      this.act('stop');
      this.challenge = challenge;
      this.messenger.emit('anchor', { id: challenge._id });
    }

    attempt(idx) {
      addOne(idx);

      if (this.peer.length == 2) {
        this.tries++;

        if (this.peer[0].c == this.peer[1].c) {
          this.board[this.peerIdx[0]].s = 'done';
          this.board[this.peerIdx[1]].s = 'done';
          checkIsDone();
        } else {
          this.board[this.peerIdx[0]].s = 0;
          this.board[this.peerIdx[1]].s = 0;
          this.peer = [];
          this.peerIdx = [];
        }

        this.reset();
      }
    }

    reset() {
      this.peer = [];
      this.peerIdx = [];
    }

    setChapter(chapter) {
      this.chapter = chapter;
    }

    addOne(idx) {
      switch (this.board[idx].s) {
        case 'done':
          break;
        case 'selected':
          this.board[this.peerIdx[0]].s = 0;
          this.reset();
          break;
        default:
          this.board[idx].s = 'selected';
          this.peer.push(this.board[idx]);
          this.peerIdx.push(idx);
          break;
      }
    }

    timer() {
      checkForTimeInt = checkForTimeInt || $interval(() => {
        if (this.time > 0) {
          this.time -= 1;
        } else {
          this.act('stop');
          clearInterval(checkForTimeInt);
        }
      }, 1000);
    }

    destroyTimer() {
      if (angular.isDefined(checkForTimeInt)) {
        $interval.cancel(checkForTimeInt);
        checkForTimeInt = false;
      }
      clearInterval(checkForTimeInt);
    }

    printIcons(start, end) {
      var icons = [];
      for (var i = start; i < end; i++) {
        icons.push({ icon: i, desc: '' });
      }
      return icons;
    }

    checkIsDone() {
      var done = true;
      for (var idx in this.board) {
        if (this.board[idx].s != 'done') {
          done = false;
          break;
        }
      }

      if (done) {
        this.act('done');
      }
    }

    onInfo(data) {
      this.timeout(() => {
        if (data.gems) {
          this.gems = data.gems;
        }
        if (data.scores) {
          this.scores = data.scores;
        }
        if (data.activity) {
          this.activity = data.activity;
        }
        if (data.completed) {
          this.completed = data.completed;
        }
      });
    }

    onJoin(data) {
      this.timeout(() => {
        for (var i = 0; i < this.challenges.length; i++) {
          var ch = this.challenges[i];
          if (ch._id === data.name) {
            this.challenges[i].users = data.size;
            break;
          }
        }
      });
    }

    onLevel(level) {
      this.timeout(() => {
        if (!level) {
          this.error = 'Level not found';
          return;
        }

        this.board = level.board;
        this.level = level.number;
        timer();
      });
    }

    onLevels(levels) {
      this.levels = levels;
    }

    onChallenges(challenges) {
      this.timeout(() => {
        this.challenges = challenges;
      });
    }
  }

  $M.Core.Api.Game = Dependencies.concat(Game);

})(MoNoApps);
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

(($A, $M) => {
  $A('monoapps', [])
    .constant('version', $M.version);
  $A('monoapps.core', []);
  $A('monoapps.core.api', [])
    .service('DB', $M.Core.Api.DB)
    .service('Messenger', $M.Core.Api.Messenger)
    .controller('Game', $M.Core.Api.Game)
    .controller('List', $M.Core.Api.List);
})(angular.module, MoNoApps);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk1vTm9BcHBzLk1haW4uanMiLCJNb05vQXBwcy5EQi5saWIuanMiLCJNb05vQXBwcy5HYW1lLmxpYi5qcyIsIk1vTm9BcHBzLkxpc3QubGliLmpzIiwiTW9Ob0FwcHMuTWVzc2VuZ2VyLmxpYi5qcyIsIk1vTm9BcHBzLk1vZHVsZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibW9ub2FwcHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoKCRXKSA9PiAkVy5Nb05vQXBwcyB8fCAoJFcuTW9Ob0FwcHMgPSB7XG4gIHZlcnNpb246ICcxLjAuMCcsXG4gIENvcmU6IHtcbiAgICBBcGk6IHt9XG4gIH1cbn0pKSh3aW5kb3cpO1xuIiwiKCgkTSkgPT4ge1xuICBjb25zdCBEZXBlbmRlbmNpZXMgPSBbXTtcblxuICBjbGFzcyBEQiB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICB0aGlzLnRva2VuID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKCd0b2tlbicpO1xuICAgIH1cblxuICAgIGdldFRva2VuKCkge1xuICAgICAgcmV0dXJuIHRoaXMudG9rZW47XG4gICAgfVxuICB9XG4gIFxuICAkTS5Db3JlLkFwaS5EQiA9IERlcGVuZGVuY2llcy5jb25jYXQoREIpO1xuXG59KShNb05vQXBwcyk7XG4iLCIoKCRNKSA9PiB7XG4gIGNvbnN0IERlcGVuZGVuY2llcyA9IFtcbiAgICAnJGh0dHAnLFxuICAgICckaW50ZXJ2YWwnLFxuICAgICckbG9nJyxcbiAgICAnJHRpbWVvdXQnLFxuICAgICdNZXNzZW5nZXInXTtcblxuICBjbGFzcyBHYW1lIHtcbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICRodHRwLFxuICAgICAgJGludGVydmFsLFxuICAgICAgJGxvZyxcbiAgICAgICR0aW1lb3V0LFxuICAgICAgTWVzc2VuZ2VyXG4gICAgKSB7XG4gICAgICB0aGlzLmh0dHAgPSAkaHR0cDtcbiAgICAgIHRoaXMuaW50ZXJ2YWwgPSAkaW50ZXJ2YWw7XG4gICAgICB0aGlzLmxvZyA9ICRsb2c7XG4gICAgICB0aGlzLnRpbWVvdXQgPSAkdGltZW91dDtcbiAgICAgIHRoaXMubWVzc2VuZ2VyID0gTWVzc2VuZ2VyO1xuICAgICAgdGhpcy5wZWVyID0gW107XG4gICAgICB0aGlzLmljb25zID0gW107XG4gICAgICB0aGlzLmJvYXJkID0gW107XG4gICAgICB0aGlzLnBlZXJJZHggPSBbXTtcbiAgICAgIHRoaXMuY2hhbGxlbmdlcyA9IFtdO1xuICAgICAgdGhpcy5zY29yZXMgPSBbXTtcbiAgICAgIHRoaXMuYWN0aXZpdHkgPSBbXTtcbiAgICAgIHRoaXMud2lucyA9IDA7XG4gICAgICB0aGlzLmxvc3MgPSAwO1xuICAgICAgdGhpcy5nZW1zID0gMDtcbiAgICAgIHRoaXMudHJpZXMgPSAwO1xuICAgICAgdGhpcy50aW1lID0gNjA7XG4gICAgICB0aGlzLmxldmVsID0gMTtcbiAgICAgIHRoaXMuZG9uZSA9IGZhbHNlO1xuICAgICAgdGhpcy5pc1BhdXNlZCA9IHRydWU7XG4gICAgICB0aGlzLmNoYWxsZW5nZSA9IGZhbHNlO1xuICAgICAgdGhpcy5pbnRlcnZhbCA9IGZhbHNlO1xuICAgICAgdGhpcy5jaGVja0ZvclRpbWVJbnQgPSBmYWxzZTtcbiAgICAgIHRoaXMuY2hhcHRlciA9ICdnYW1lJztcbiAgICAgIHRoaXMuc3RhdHVzID0gJ2FjdGl2ZSc7XG4gICAgICB0aGlzLnRhcGVDb2RlID0gOTY0MTtcbiAgICB9XG5cbiAgICBvbkluaXQoKSB7XG4gICAgICB0aGlzLm1lc3Nlbmdlci5vbignaW5mbycsIHRoaXMub25JbmZvLmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5tZXNzZW5nZXIub24oJ2pvaW4nLCB0aGlzLm9uSm9pbi5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMubWVzc2VuZ2VyLm9uKCdsZXZlbCcsIHRoaXMub25MZXZlbC5iaW5kKHRoaXMpKTtcbiAgICAgIHRoaXMubWVzc2VuZ2VyLm9uKCdsZXZlbHMnLCB0aGlzLm9uTGV2ZWxzLmJpbmQodGhpcykpO1xuICAgICAgdGhpcy5tZXNzZW5nZXIub24oJ2NoYWxsZW5nZXMnLCB0aGlzLm9uQ2hhbGxlbmdlcy5iaW5kKHRoaXMpKTtcbiAgICAgIGlmICh0aGlzLnRva2VuKSB7XG4gICAgICAgIHRoaXMubWVzc2VuZ2VyLmVtaXQoJ2lkZW50aWZ5JywgdGhpcy50b2tlbik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29kZVRvU3RyaW5nKGNvZGUgPSAxMDAzMykge1xuICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSk7XG4gICAgfVxuXG4gICAgYWN0KGFjdGlvbikge1xuICAgICAgc3dpdGNoIChhY3Rpb24pIHtcbiAgICAgICAgY2FzZSAncGxheSc6XG4gICAgICAgICAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMudGltZSA9IDYwO1xuICAgICAgICAgIHRoaXMuc3RhdHVzID0gJ3dhcm5pbmcnO1xuICAgICAgICAgIHRoaXMubWVzc2VuZ2VyLmVtaXQoJ3BsYXknLCB7XG4gICAgICAgICAgICBjaGFsbGVuZ2U6IGFuZ3VsYXIuY29weSh0aGlzLmNoYWxsZW5nZSksXG4gICAgICAgICAgICBsZXZlbDogYW5ndWxhci5jb3B5KHRoaXMubGV2ZWwpXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3BhdXNlJzpcbiAgICAgICAgICB0aGlzLmlzUGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLnN0YXR1cyA9ICdkYW5nZXInO1xuICAgICAgICAgIGRlc3Ryb3lUaW1lcigpO1xuICAgICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnc3RvcCc6XG4gICAgICAgICAgZGVzdHJveVRpbWVyKCk7XG4gICAgICAgICAgdGhpcy50aW1lID0gMDtcbiAgICAgICAgICB0aGlzLmlzUGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLnN0YXR1cyA9ICdhY3RpdmUnO1xuICAgICAgICAgIHRoaXMuYm9hcmQgPSBbXTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZG9uZSc6XG4gICAgICAgICAgdGhpcy5nZW1zICs9IDE7XG4gICAgICAgICAgdGhpcy5sZXZlbCArPSAxO1xuICAgICAgICAgIHRoaXMubWVzc2VuZ2VyLmVtaXQoJ2RvbmUnLCB7XG4gICAgICAgICAgICBjaGFsbGVuZ2U6IGFuZ3VsYXIuY29weSh0aGlzLmNoYWxsZW5nZSksXG4gICAgICAgICAgICB0aW1lOiBhbmd1bGFyLmNvcHkodGhpcy50aW1lKSxcbiAgICAgICAgICAgIGJvYXJkOiBhbmd1bGFyLmNvcHkodGhpcy5ib2FyZCksXG4gICAgICAgICAgICBsZXZlbDogYW5ndWxhci5jb3B5KHRoaXMubGV2ZWwpXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdGhpcy5hY3QoJ3N0b3AnKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aW1lcigpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldmVhbEljb25zKGNoYWxsZW5nZSkge1xuICAgICAgdGhpcy5pY29ucyA9IHRoaXMucHJpbnRJY29ucyhjaGFsbGVuZ2Uuc3RhcnQsIGNoYWxsZW5nZS5lbmQpO1xuICAgIH1cblxuICAgIHJlbW92ZWxJY29ucygpIHtcbiAgICAgIHRoaXMuaWNvbnMgPSBbXTtcbiAgICB9XG5cbiAgICBzZXRDaGFsbGVuZ2UoY2hhbGxlbmdlKSB7XG4gICAgICB0aGlzLmFjdCgnc3RvcCcpO1xuICAgICAgdGhpcy5jaGFsbGVuZ2UgPSBjaGFsbGVuZ2U7XG4gICAgICB0aGlzLm1lc3Nlbmdlci5lbWl0KCdhbmNob3InLCB7IGlkOiBjaGFsbGVuZ2UuX2lkIH0pO1xuICAgIH1cblxuICAgIGF0dGVtcHQoaWR4KSB7XG4gICAgICBhZGRPbmUoaWR4KTtcblxuICAgICAgaWYgKHRoaXMucGVlci5sZW5ndGggPT0gMikge1xuICAgICAgICB0aGlzLnRyaWVzKys7XG5cbiAgICAgICAgaWYgKHRoaXMucGVlclswXS5jID09IHRoaXMucGVlclsxXS5jKSB7XG4gICAgICAgICAgdGhpcy5ib2FyZFt0aGlzLnBlZXJJZHhbMF1dLnMgPSAnZG9uZSc7XG4gICAgICAgICAgdGhpcy5ib2FyZFt0aGlzLnBlZXJJZHhbMV1dLnMgPSAnZG9uZSc7XG4gICAgICAgICAgY2hlY2tJc0RvbmUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmJvYXJkW3RoaXMucGVlcklkeFswXV0ucyA9IDA7XG4gICAgICAgICAgdGhpcy5ib2FyZFt0aGlzLnBlZXJJZHhbMV1dLnMgPSAwO1xuICAgICAgICAgIHRoaXMucGVlciA9IFtdO1xuICAgICAgICAgIHRoaXMucGVlcklkeCA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJlc2V0KCkge1xuICAgICAgdGhpcy5wZWVyID0gW107XG4gICAgICB0aGlzLnBlZXJJZHggPSBbXTtcbiAgICB9XG5cbiAgICBzZXRDaGFwdGVyKGNoYXB0ZXIpIHtcbiAgICAgIHRoaXMuY2hhcHRlciA9IGNoYXB0ZXI7XG4gICAgfVxuXG4gICAgYWRkT25lKGlkeCkge1xuICAgICAgc3dpdGNoICh0aGlzLmJvYXJkW2lkeF0ucykge1xuICAgICAgICBjYXNlICdkb25lJzpcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnc2VsZWN0ZWQnOlxuICAgICAgICAgIHRoaXMuYm9hcmRbdGhpcy5wZWVySWR4WzBdXS5zID0gMDtcbiAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhpcy5ib2FyZFtpZHhdLnMgPSAnc2VsZWN0ZWQnO1xuICAgICAgICAgIHRoaXMucGVlci5wdXNoKHRoaXMuYm9hcmRbaWR4XSk7XG4gICAgICAgICAgdGhpcy5wZWVySWR4LnB1c2goaWR4KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aW1lcigpIHtcbiAgICAgIGNoZWNrRm9yVGltZUludCA9IGNoZWNrRm9yVGltZUludCB8fCAkaW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy50aW1lID4gMCkge1xuICAgICAgICAgIHRoaXMudGltZSAtPSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuYWN0KCdzdG9wJyk7XG4gICAgICAgICAgY2xlYXJJbnRlcnZhbChjaGVja0ZvclRpbWVJbnQpO1xuICAgICAgICB9XG4gICAgICB9LCAxMDAwKTtcbiAgICB9XG5cbiAgICBkZXN0cm95VGltZXIoKSB7XG4gICAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoY2hlY2tGb3JUaW1lSW50KSkge1xuICAgICAgICAkaW50ZXJ2YWwuY2FuY2VsKGNoZWNrRm9yVGltZUludCk7XG4gICAgICAgIGNoZWNrRm9yVGltZUludCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgY2xlYXJJbnRlcnZhbChjaGVja0ZvclRpbWVJbnQpO1xuICAgIH1cblxuICAgIHByaW50SWNvbnMoc3RhcnQsIGVuZCkge1xuICAgICAgdmFyIGljb25zID0gW107XG4gICAgICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgICBpY29ucy5wdXNoKHsgaWNvbjogaSwgZGVzYzogJycgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gaWNvbnM7XG4gICAgfVxuXG4gICAgY2hlY2tJc0RvbmUoKSB7XG4gICAgICB2YXIgZG9uZSA9IHRydWU7XG4gICAgICBmb3IgKHZhciBpZHggaW4gdGhpcy5ib2FyZCkge1xuICAgICAgICBpZiAodGhpcy5ib2FyZFtpZHhdLnMgIT0gJ2RvbmUnKSB7XG4gICAgICAgICAgZG9uZSA9IGZhbHNlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChkb25lKSB7XG4gICAgICAgIHRoaXMuYWN0KCdkb25lJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgb25JbmZvKGRhdGEpIHtcbiAgICAgIHRoaXMudGltZW91dCgoKSA9PiB7XG4gICAgICAgIGlmIChkYXRhLmdlbXMpIHtcbiAgICAgICAgICB0aGlzLmdlbXMgPSBkYXRhLmdlbXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRhdGEuc2NvcmVzKSB7XG4gICAgICAgICAgdGhpcy5zY29yZXMgPSBkYXRhLnNjb3JlcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGF0YS5hY3Rpdml0eSkge1xuICAgICAgICAgIHRoaXMuYWN0aXZpdHkgPSBkYXRhLmFjdGl2aXR5O1xuICAgICAgICB9XG4gICAgICAgIGlmIChkYXRhLmNvbXBsZXRlZCkge1xuICAgICAgICAgIHRoaXMuY29tcGxldGVkID0gZGF0YS5jb21wbGV0ZWQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIG9uSm9pbihkYXRhKSB7XG4gICAgICB0aGlzLnRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2hhbGxlbmdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHZhciBjaCA9IHRoaXMuY2hhbGxlbmdlc1tpXTtcbiAgICAgICAgICBpZiAoY2guX2lkID09PSBkYXRhLm5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuY2hhbGxlbmdlc1tpXS51c2VycyA9IGRhdGEuc2l6ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgb25MZXZlbChsZXZlbCkge1xuICAgICAgdGhpcy50aW1lb3V0KCgpID0+IHtcbiAgICAgICAgaWYgKCFsZXZlbCkge1xuICAgICAgICAgIHRoaXMuZXJyb3IgPSAnTGV2ZWwgbm90IGZvdW5kJztcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmJvYXJkID0gbGV2ZWwuYm9hcmQ7XG4gICAgICAgIHRoaXMubGV2ZWwgPSBsZXZlbC5udW1iZXI7XG4gICAgICAgIHRpbWVyKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBvbkxldmVscyhsZXZlbHMpIHtcbiAgICAgIHRoaXMubGV2ZWxzID0gbGV2ZWxzO1xuICAgIH1cblxuICAgIG9uQ2hhbGxlbmdlcyhjaGFsbGVuZ2VzKSB7XG4gICAgICB0aGlzLnRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLmNoYWxsZW5nZXMgPSBjaGFsbGVuZ2VzO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgJE0uQ29yZS5BcGkuR2FtZSA9IERlcGVuZGVuY2llcy5jb25jYXQoR2FtZSk7XG5cbn0pKE1vTm9BcHBzKTsiLCIoKCRNKSA9PiB7XG4gIGNvbnN0IERlcGVuZGVuY2llcyA9IFtdO1xuXG4gIGNsYXNzIExpc3Qge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgdGhpcy5tb2RlbCA9IG1vZGVsO1xuICAgICAgdGhpcy5zZWFyY2ggPSAnJztcbiAgICAgIHRoaXMuY29tbW9ucyA9IHt9O1xuICAgICAgdGhpcy5mZWVkID0gW107XG4gICAgICB0aGlzLnJlc291cmNlcyA9IFtdO1xuICAgICAgdGhpcy50b2tlbiA9IERCU2VydmljZS5nZXRUb2tlbigpO1xuICAgIH1cbiAgfVxuICBcbiAgJE0uQ29yZS5BcGkuTGlzdCA9IERlcGVuZGVuY2llcy5jb25jYXQoTGlzdCk7XG5cbn0pKE1vTm9BcHBzKTtcbiIsIigoJFcsICRNKSA9PiB7XG4gIGNvbnN0IERlcGVuZGVuY2llcyA9IFtdO1xuXG4gIGNsYXNzIE1lc3NlbmdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAvLyByZXR1cm4gJFcuaW8oKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG9uKGNoYW5uZWwsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfSxcbiAgICAgICAgZW1taXQoY2hhbm5lbCwgbWVzc2FnZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGNoYW5uZWwsIG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gICRNLkNvcmUuQXBpLk1lc3NlbmdlciA9IERlcGVuZGVuY2llcy5jb25jYXQoTWVzc2VuZ2VyKTtcblxufSkod2luZG93LCBNb05vQXBwcyk7XG4iLCIoKCRBLCAkTSkgPT4ge1xuICAkQSgnbW9ub2FwcHMnLCBbXSlcbiAgICAuY29uc3RhbnQoJ3ZlcnNpb24nLCAkTS52ZXJzaW9uKTtcbiAgJEEoJ21vbm9hcHBzLmNvcmUnLCBbXSk7XG4gICRBKCdtb25vYXBwcy5jb3JlLmFwaScsIFtdKVxuICAgIC5zZXJ2aWNlKCdEQicsICRNLkNvcmUuQXBpLkRCKVxuICAgIC5zZXJ2aWNlKCdNZXNzZW5nZXInLCAkTS5Db3JlLkFwaS5NZXNzZW5nZXIpXG4gICAgLmNvbnRyb2xsZXIoJ0dhbWUnLCAkTS5Db3JlLkFwaS5HYW1lKVxuICAgIC5jb250cm9sbGVyKCdMaXN0JywgJE0uQ29yZS5BcGkuTGlzdCk7XG59KShhbmd1bGFyLm1vZHVsZSwgTW9Ob0FwcHMpO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
