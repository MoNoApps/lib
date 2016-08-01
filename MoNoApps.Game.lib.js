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