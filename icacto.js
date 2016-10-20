var request = require('superagent');
var loading =  require('loading-cli');
var load = loading("Starting...")
var timeout = 1000;
var color = require('colors-cli')

// load.start();

var icacto = {
  errors: {
    NO_TOKEN: 'NO_TOKEN',
    NO_USER: 'NO_USER',
    NO_GAME: 'NO_GAME',
    CONNECTION_ERROR: 'CONNECTION_ERROR',
    HOST_REJECTION: 'HOST_REJECTION'
  },
  connect: function(host, token, callback) {
    this.token = token;
    this.host = host;
    if(this.token) {
      this.getUser(function(err, user) {
        console.log( color.blue(user.name+' -- '+user.token) )
        callback(err, user)
      });
    } else {
      this.createPlayer(callback);
    }
  },
  createPlayer: function(callback) {
    load.text = 'Creating a new player';
    request
      .post(this.host+'/api/v1/players')
      .send({})
      .end(function(err, res){
        if(err) return callback({status: this.errors.CONNECTION_ERROR, message: err.message});
        var status = res.body.status;
        if(status === 'success') {
          this.user = res.body.data
          this.token = this.user.token
          console.log( color.red(this.user.name+' -- '+this.user.token) )
          load.text = 'Successfully created '+this.user.name
          return callback(undefined, this.user);
        } else {
          load.text = 'Error creating player'
          return callback({status: this.errors.HOST_REJECTION, message: res.body.message});
        }
      }.bind(this))
  },
  getUser: function(callback) {
    if(!this.token) {
      return callback({status: this.errors.NO_TOKEN, message: 'No token found'});
    } else {
      load.text = 'Getting player with token';
      request
        .get(this.host+'/api/v1/players/'+this.token)
        .end(function(err, res){
          if(err) return callback({status: this.errors.CONNECTION_ERROR, message: err.message});
          var status = res.body.status;
          if(status === 'success') {
            this.game = res.body.currentgame;
            this.user = res.body.player;
            load.text = 'Successfully got '+this.user.name
            return callback(undefined, this.user);
          } else {
            return callback({status: this.errors.HOST_REJECTION, message: res.body.message});
          }
        }.bind(this))
    }
  },
  getGame: function(callback) {
    if(!this.game) {
      return callback(undefined, {status: this.errors.NO_GAME, message: 'No game defined'});
    } else {
      load.text = 'Getting game '+this.game.name;
      request
        .get(this.host+'/api/v1/games/'+this.game.name)
        .end(function(err, res){
          if(err) return callback({status: this.errors.CONNECTION_ERROR, message: err.message});
          var status = res.body.status;
          if(status === 'success') {
            this.game = res.body.game;
            load.text = 'Successfully got '+this.game.name
            return callback(undefined, this.game)
          } else {
            callback({status: this.errors.HOST_REJECTION, message: res.body.message});
          }
        }.bind(this))
    }
  },
  makePlay: function(move, callback) {
    if(!this.game) {
      return callback({status: this.errors.NO_GAME, message: 'No game defined'});
    } else if(!this.user) {
      return callback({status: this.errors.NO_USER, message: 'No user defined'});
    } else {
      load.text = 'Making move x:'+move.x+', y:'+move.y;
      request
        .put(this.host+'/api/v1/games/'+this.game.name)
        .send({
          token: this.user.token,
          move: move.x+','+move.y
        })
        .end(function(err, res) {
          if(err) return callback({status: this.errors.CONNECTION_ERROR, message: err.message});
          var status = res.body.status;
          if(status === 'success') {
            this.game = res.body.game;
            load.text = 'Successfully made move'
            return callback(undefined, this.game)
          } else {
            callback({status: this.errors.HOST_REJECTION, message: res.body.message});
          }
        }.bind(this))
    }
  },
  generateNextMove: function(board, playername, callback) {
    load.text = 'Doing silly random move thing with preference for first two cols/rows';
    var x, y;
    var position = 'something'
    if(board[1][1] == null) {
      x = 1;
      y = 1;
    } else {
      while(position !== null) {
        x = Math.floor(Math.random() * 3);
        y = Math.floor(Math.random() * 3);
        position = board[y][x]
      }
    }
    callback({x: x, y: y})
  },
  run () {
    load.start();
    load.text = 'Running';
    if(this.game) {
      if(this.game.status === 'open') {
        load.text = 'Game is still waiting for another player';
        setTimeout(function() {
          this.getGame(function(err, game) {
            if(err) return console.error(err);
            this.run();
          }.bind(this))
        }.bind(this), timeout);
      } else if(this.game.status === 'finished') {
        load.text = 'Game is finished so will request a new one';
        setTimeout(function() {
          this.getUser(function(err, user) {
            if(err) return console.error(err);
            this.run();
          }.bind(this))
        }.bind(this), timeout);
      } else {
        if(this.game.currentplayer !== this.user.name) {
          load.text = 'Waiting my turn';
          setTimeout(function() {
            this.getGame(function(err, game) {
              if(err) return console.error(err);
              this.run();
            }.bind(this))
          }.bind(this), timeout);
        } else {
          this.generateNextMove(this.game.board, this.user.name, function(move) {
            this.makePlay(move, function(err, result) {
              if(err) return console.error(err);
              this.run();
            }.bind(this))
          }.bind(this))
        }
      }
    } else {
      load.text = 'Getting current game';
      setTimeout(function() {
        this.getUser(function(err, game) {
          if(err) return console.error(err);
          this.run();
        }.bind(this))
      }.bind(this), timeout);
    }
  }
}

// init();
module.exports = icacto
