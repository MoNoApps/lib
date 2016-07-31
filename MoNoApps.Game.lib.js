(($M) => {
  const GameDeps = [
    '$http',
    '$interval',
    '$log',
    '$timeout'];

  class Game {
    constructor(
      $http,
      $interval,
      $log,
      $timeout
    ) {
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
      console.log(this);
    }

    onInit() {
      this.socket.on('info', this.info);
      this.socket.on('join', this.join)
      this.socket.on('level', this.leave);
      this.socket.on('levels', this.onLevels);
      this.socket.on('challenges', this.onChallenges);
      if (this.token) {
        this.socket.emit('identify', this.token);
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
          this.socket.emit('play', {
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
          this.socket.emit('done', {
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
      this.scope.act('stop');
      this.scope.challenge = challenge;
      this.socket.emit('anchor', { id: challenge._id });
    }

    attempt(idx) {
      addOne(idx);

      if (this.scope.peer.length == 2) {
        this.scope.tries++;

        if (this.scope.peer[0].c == this.scope.peer[1].c) {
          this.scope.board[this.scope.peerIdx[0]].s = 'done';
          this.scope.board[this.scope.peerIdx[1]].s = 'done';
          checkIsDone();
        } else {
          this.scope.board[this.scope.peerIdx[0]].s = 0;
          this.scope.board[this.scope.peerIdx[1]].s = 0;
          this.scope.peer = [];
          this.scope.peerIdx = [];
        }

        this.scope.reset();
      }
    }

    reset() {
      this.scope.peer = [];
      this.scope.peerIdx = [];
    }

    setChapter(chapter) {
      this.scope.chapter = chapter;
    }

    addOne(idx) {
      switch (this.scope.board[idx].s) {
        case 'done':
          break;
        case 'selected':
          this.scope.board[this.scope.peerIdx[0]].s = 0;
          this.scope.reset();
          break;
        default:
          this.scope.board[idx].s = 'selected';
          this.scope.peer.push(this.scope.board[idx]);
          this.scope.peerIdx.push(idx);
          break;
      }
    }

    timer() {
      checkForTimeInt = checkForTimeInt || $interval(function () {
        if (this.scope.time > 0) {
          this.scope.time -= 1;
        } else {
          this.scope.act('stop');
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
      for (var idx in this.scope.board) {
        if (this.scope.board[idx].s != 'done') {
          done = false;
          break;
        }
      }

      if (done) {
        this.scope.act('done');
      }
    }

    info(data) {
      $timeout(() => {
        if (data.gems) {
          this.scope.gems = data.gems;
        }
        if (data.scores) {
          this.scope.scores = data.scores;
        }
        if (data.activity) {
          this.scope.activity = data.activity;
        }
        if (data.completed) {
          this.scope.completed = data.completed;
        }
      }, 1);
    }

    onJoin(data) {
      $timeout(function () {
        for (var i = 0; i < this.scope.challenges.length; i++) {
          var ch = this.scope.challenges[i];
          if (ch._id === data.name) {
            this.scope.challenges[i].users = data.size;
            break;
          }
        }
      }, 1);
    }

    onLevel(level) {
      $timeout(function () {
        if (!level) {
          this.scope.error = 'Level not found';
          return;
        }

        this.scope.board = level.board;
        this.scope.level = level.number;
        timer();
      }, 1);
    }

    onLevels(levels) {
      this.scope.levels = levels;
    }

    onChallenges(challenges) {
      $timeout(function () {
        this.scope.challenges = challenges;
      }, 1);
    }
  }

  $M.Core.Api.Game = GameDeps.concat(Game);

})(monoapps);
