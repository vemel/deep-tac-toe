var c_width = 500;
var c_height = 500;

function Game(){
    this.height = c_height;
    this.width = c_width;
    this.cells_x = 3;
    this.cells_y = 3;
    this.players = ["x", "o"];
    this.players_color = {x: "blue", o: "green"};
    this.players_last_fields = {};
    this.curr_player = false;
}


Game.prototype.init = function(){
    var cont = $('#game_cont');
    this.paper = Raphael(
        cont.offset().left + parseInt(cont.css("border-left-width"), 10),
        cont.offset().top + parseInt(cont.css("border-top-width"), 10),
        cont.width(),
        cont.height());
    this.won = false;
    this.curr_player = false;
    this.lastTurn = false;
    this.field = [];
    this.field_lines = [];
    this.small_fields = [];
    for (var y=0; y<this.cells_y; y++){
        this.field.push([]);
        this.field_lines.push([]);
        this.small_fields.push([]);
        for (var x=0; x<this.cells_x; x++){
            this.field[y].push("");
            this.field_lines[y].push(false);
            this.small_fields[y].push([]);
            for (var y1=0; y1<this.cells_y; y1++){
                this.small_fields[y][x].push([]);
                for (var x1=0; x1<this.cells_x; x1++){
                    this.small_fields[y][x][y1].push("p");
                }
            }
        }
    }

    this.players_turns = {}
    for (var i=0; i< this.players.length; i++){
        this.players_turns[this.players[i]] = [];
    }

    this.player = this.players[0];

    this.draw();
}

Game.prototype.isValueEmpty = function(value){
    if (value == "" || value  == "p") return true;
    return false;
}

Game.prototype.isFieldFull = function(field){
    var values = {};
    for (var y1=0; y1<this.cells_y; y1++){
        for (var x1=0; x1<this.cells_x; x1++){
            var value = field[y1][x1];
            values[value] = (values[value] || 0) + 1;
            if (this.isValueEmpty(value)) return false;
        }
    }
    return true;
}

Game.prototype.getFieldLeader = function(field){
    var values = {};
    for (var y1=0; y1<this.cells_y; y1++){
        for (var x1=0; x1<this.cells_x; x1++){
            var value = field[y1][x1];
            values[value] = (values[value] || 0) + 1;
            if (this.isValueEmpty(value)) return false;
        }
    }
    var max_value = "";
    var max_value_count = 0;
    for (var i in values){
        if (values[i] > max_value_count){
            max_value = i;
            max_value_count = values[i];
        }
    }
    return max_value;
}

Game.prototype.checkPossible = function(player, prev_player){
    var last_turn = [-1 , -1, -1, -1];
    if (this.players_turns[player].length){
        last_turn = this.players_turns[player][this.players_turns[player].length - 1];
    }
    
    var opp_turn = this.players_turns[prev_player][this.players_turns[prev_player].length - 1];
    var force_x = opp_turn[2];
    var force_y = opp_turn[3];

    var free_turn = false;
    if (force_x == last_turn[0] && force_y == last_turn[1]){
        free_turn = true;
    }

    if (this.isFieldFull(this.small_fields[force_x][force_y])){
        free_turn = true;
    }

    for (var y=0; y<this.cells_y; y++){
        for (var x=0; x<this.cells_x; x++){
            for (var y1=0; y1<this.cells_y; y1++){
                for (var x1=0; x1<this.cells_x; x1++){
                    var value = this.small_fields[y][x][y1][x1];
                    if (!this.isValueEmpty(value)) continue;
                    if (this.won) {value = ""; continue;}
                    if (free_turn || (force_x == x && force_y == y)){
                        value = "p";
                    } else {
                        value = "";
                    }
                    this.small_fields[y][x][y1][x1] = value;
                }
            }
        }
    }
}

Game.prototype.checkWinField = function(field){
    var value = undefined;
    for (var y=0; y< field.length;y++){
        value = field[y][0];
        if (this.isValueEmpty(value)) continue;
        for (var x=0; x < field[y].length; x++){
            if (field[y][x] != value){value=false; break;}
        }
        if (value)
            return [value, [0, y, this.cells_x - 1, y]]
    }

    for (var x=0; x < field[0].length; x++){
        value = field[0][x];
        if (this.isValueEmpty(value)) continue;
        for (var y=0; y < field.length; y++){
            if (field[y][x] != value){value=false; break;}
        }
        if (value)
            return [value, [x, 0, x, this.cells_y - 1]]
    }

    if (this.cells_x == this.cells_y){
        value = field[0][0];
        if (!this.isValueEmpty(value)){
            for (var y=0; y< field.length;y++){
                if (field[y][y] != value){value=false; break;}
            }
            if (value)
                return [value, [0, 0, this.cells_y - 1, this.cells_y - 1]];
        }

        value = field[0][this.cells_y - 1];
        if (!this.isValueEmpty(value)){
            for (var y=0; y<field.length;y++){
                if (field[y][this.cells_y - 1 - y] != value){value=false; break;}
            }
            if (value)
                return [value, [0, this.cells_y - 1, this.cells_y - 1, 0]];
        }
    }

    if (this.isFieldFull(field)){
        return [this.getFieldLeader(field), false]
    }

    return false;
}


Game.prototype.checkWin = function(x, y){
    if (this.field[y][x] == ""){
        var win_res = this.checkWinField(this.small_fields[y][x]);
        if (win_res){
            this.field[y][x] = win_res[0];
            if (win_res[1])
                this.field_lines[y][x] = win_res[1];
        }
    }

    var win = this.checkWinField(this.field);
    if (win){
        this.won = win;
    }
}


Game.prototype.makeTurn = function(x, y, x1, y1){
    this.small_fields[y][x][y1][x1] = this.player;
    this.players_turns[this.player].push([x, y, x1, y1]);
    next_player = this.players[(this.players.indexOf(this.player)+1) % this.players.length];
    this.checkWin(x, y);
    this.checkPossible(next_player, this.player);
    this.next_player = next_player;
    this.sendTurn(x, y, x1, y1);
    this.player = next_player;
    this.draw();
}

Game.prototype.sendTurn = function(x, y, x1, y1){
    return
}

Game.prototype.drawPossibleCell = function(x, y, x1, y1){
    if (this.player != this.curr_player) return;
    if (this.won) return;
    var value = this.small_fields[y][x][y1][x1];
    if (value == "p"){
        // this.paper.circle(
        //     this.width * x / this.cells_x + this.width * (x1 + 0.5) / this.cells_x / this.cells_x,
        //     this.height * y / this.cells_y + this.height * (y1 + 0.5) / this.cells_y / this.cells_y,
        //     this.width/this.cells_x/this.cells_x / 10)
        // .attr({fill: this.players_color[this.player], "fill-opacity":0.5, "stroke-opacity": 0.0})

        this.drawHighlight(x, y, x1, y1, this.players_color[this.player]);

        this.paper.rect(
            this.width * x / this.cells_x + this.width * x1 / this.cells_x / this.cells_x,
            this.height * y / this.cells_y + this.height * y1 / this.cells_y / this.cells_y,
            this.width/this.cells_x/this.cells_x,
            this.height/this.cells_y/this.cells_y)
        .attr({fill: this.players_color[this.player], "fill-opacity":0.0, "stroke-opacity": 0.0})
        .data({x: x, y:y, x1:x1, y1:y1, game: this})
        .click(function(){
            var data = this.data();
            if (data.game.player != data.game.curr_player)
                return;
            data.game.makeTurn(data.x, data.y, data.x1, data.y1);
        })
        .hover(function(){
            this.animate({"fill-opacity":0.2}, 300);
        }, function(){
            this.animate({"fill-opacity":0.0}, 300);
        })
    }

}

Game.prototype.drawHighlight = function(x, y, x1, y1, color){
    this.paper.rect(
        this.width * x / this.cells_x + this.width * x1 / this.cells_x / this.cells_x,
        this.height * y / this.cells_y + this.height * y1 / this.cells_y / this.cells_y,
        this.width/this.cells_x/this.cells_x,
        this.height/this.cells_y/this.cells_y)
    .attr({fill: color, "fill-opacity":0.05, "stroke-opacity": 0.0})
}

Game.prototype.drawCell = function(x, y, x1, y1){
    var value = this.small_fields[y][x][y1][x1];
    if (this.lastTurn){
        if (this.lastTurn[1][0] == x && this.lastTurn[1][1] == y && this.lastTurn[1][2] == x1 && this.lastTurn[1][3] == y1){
            var player_team = this.lastTurn[0];
            console.log(player_team);
            this.drawHighlight(x, y, x1, y1, this.players_color[player_team]);
        }
    }
    if (value == "x"){
        this.drawX(
            this.width * x / this.cells_x + this.width * x1 / this.cells_x / this.cells_x,
            this.height * y / this.cells_y + this.height * y1 / this.cells_y / this.cells_y,
            this.width/this.cells_x/this.cells_x,
            this.height/this.cells_y/this.cells_y)
    }
    if (value == "o"){
        this.drawO(
            this.width * x / this.cells_x + this.width * x1 / this.cells_x / this.cells_x,
            this.height * y / this.cells_y + this.height * y1 / this.cells_y / this.cells_y,
            this.width/this.cells_x/this.cells_x,
            this.height/this.cells_y/this.cells_y)
    }
}

Game.prototype.draw = function(){
    this.paper.clear();
    this.drawBorder(0, 0, this.width, this.height);
    this.drawField(0, 0, this.width, this.height);
    for (var y=0; y< this.cells_y; y++){
        for (var x=0; x< this.cells_x; x++){
            this.drawField(
                this.width * x / this.cells_x,
                this.height * y / this.cells_y,
                this.width/this.cells_x,
                this.height/this.cells_y
            );

            for (var y1=0; y1 < this.cells_y; y1++){
                for (var x1=0; x1 < this.cells_x; x1++){
                    this.drawCell(x, y, x1, y1);
                }
            }

            if (this.field[y][x] == "x"){
                this.drawX(
                    this.width * x / this.cells_x,
                    this.height * y / this.cells_y,
                    this.width/this.cells_x,
                    this.height/this.cells_y,
                    {"opacity": 0.5, "stroke-width": 4}
                );
            }

            if (this.field[y][x] == "o"){
                this.drawO(
                    this.width * x / this.cells_x,
                    this.height * y / this.cells_y,
                    this.width/this.cells_x,
                    this.height/this.cells_y,
                    {"opacity": 0.5, "stroke-width": 4}
                );
            }

            if (this.field_lines[y][x]){
                this.drawFieldLine(
                    this.width * x / this.cells_x,
                    this.height * y / this.cells_y,
                    this.width/this.cells_x,
                    this.height/this.cells_y,
                    this.field_lines[y][x]
                );
            }

            if (this.player == this.curr_player){
                for (var y1=0; y1 < this.cells_y; y1++){
                    for (var x1=0; x1 < this.cells_x; x1++){
                        this.drawPossibleCell(x, y, x1, y1);
                    }
                }
            }
        }
    }

    if (this.won){
        this.drawWin(this.won[0], this.won[1]);
    }
}

Game.prototype.drawWin = function(player, line){
    this.drawFieldLine(0, 0, this.width, this.height, line, {"stroke-width": 2});
    this.paper.text(
        this.width / 2, 
        this.height / 2,
        player.toUpperCase() + ' WON'
    ).attr({
        "font-size": 100,
        "stroke": "white",
        "stroke-width": 3,
        "fill": this.players_color[player]
    });
}


Game.prototype.drawBorder = function(x, y, w, h){
    // var border = this.paper.rect(x, y, w, h);
}

Game.prototype.drawFieldLine = function(x, y, w, h, coords, attr){
    var x1 = x + w / 2 / this.cells_x + w * coords[0] / this.cells_x;
    var y1 = y + h / 2 / this.cells_y + h * coords[1] / this.cells_y;
    var x2 = x + w / 2 / this.cells_x + w * coords[2] / this.cells_x;
    var y2 = y + h / 2 / this.cells_y + h * coords[3] / this.cells_y;

    if (!attr) attr= {};
    attr["stroke"] = "red";
    attr["stroke-width"] = 2 * (attr["stroke-width"] || 1);

    this.paper.path("M"+ x1 +" " + y1 + "L" + x2 + " " + y2).attr(attr)
}

Game.prototype.drawX = function(x, y, w, h, attr){
    var left = x + w / 10;
    var top = y + h / 10;
    var right = x + w * 9 / 10;
    var bottom = y + h * 9 / 10;

    if (!attr) attr = {};
    attr["stroke"] = this.players_color["x"];
    attr["stroke-width"] = 2 * (attr["stroke-width"] || 1);

    this.paper.path("M"+ left +" " + top + "L" + right + " " + bottom)
        .attr(attr);
    this.paper.path("M"+ left +" " + bottom + "L" + right + " " + top)
        .attr(attr);
}

Game.prototype.drawO = function(x, y, w, h, attr){
    if (!attr) attr = {};
    attr["stroke"] = this.players_color["o"];
    attr["fill-opacity"] = 0.0;
    attr["stroke-width"] = 2 * (attr["stroke-width"] || 1);

    this.paper.ellipse(x + w / 2, y + h / 2, w / 2.5, h / 2.5)
        .attr(attr);
}

Game.prototype.drawField = function(x, y, w, h){
    var top = y + h/10;
    var bottom = y + 9*h/10;
    var left = x + w/10;
    var right = x + 9*w/10;
    for (var i=1; i < this.cells_y;i++){
        this.paper.path("M"+ (x + w * i / this.cells_x) +" " + top + "L" + (x + w * i / this.cells_x) + " " + bottom);
    }

    for (var i=1; i < this.cells_x;i++){
        this.paper.path("M"+ left +" " + (y + h * i / this.cells_y) + "L" + right + " " + (y + h * i / this.cells_y));
    }
}

var game = new Game();


var show_message = function(message){
    $('#message_cont').find('.message').fadeOut(500, function(){ $(this).remove(); });
    $('#message_cont').append('<div class="message">'+message+'</div>');
    var message = $('#message_cont').find('.message:last');
    message
        .css({
            'margin-top': '20px',
            'margin-left': (message.parent().width() - message.width()) / 2
        })
        .animate({'margin-top': '0px'}, 500);
}


// Generated by CoffeeScript 1.4.0
var start_game_network = function(){
    socket = io.connect(window.location.origin.split('/')[2].split(':')[0]);
    // show_message('Connecting to server...');
    socket.on('connect', function() {
        Game.prototype.sendTurn = function(x, y, x1, y1){
            return socket.emit('turn', {
              x: x,
              y: y,
              x1: x1,
              y1: y1,
            });
        };

        socket.emit('startGame');
        // show_message('Trying to create new game...');
    });

    socket.on('waitingForOpponent', function() {
        show_message('Waiting for opponent...');
    });

    socket.on('gameStarted', function(data) {
        show_message("You are playing for " + game.curr_player);
        // show_message('Game started');
        game.init();
        game.curr_player = data.team;
    });

    socket.on('gameStateChanged', function(data) {
      turnTeam = data.currentTeam;
      game.field = data.field;
      game.small_fields = data.small_fields;
      game.field_lines = data.field_lines;
      game.players_turns = data.players_turns;
      game.won = data.won;
      game.player = data.currentTeam;
      game.is_free_turn = data.is_free_turn;
      game.lastTurn = data.last_turn;
      console.log(data)
      game.draw();

      var turn_message = game.is_free_turn  && 'free turn' || 'turn';
      var message = 'Now is your '+turn_message;
      if (game.curr_player !== game.player){
        message = 'Now is your opponent\'s ' + turn_message;
      }

      show_message(message);
    });

    socket.on('gameFinished', function(data) {
      show_message("Game finished");
    });
};

var start_game_hotseat = function(){
    var announce_turn = function(){
        show_message("Now is " + game.curr_player.toUpperCase() + " turn");
    }

    Game.prototype.sendTurn = function(x, y, x1, y1){
        this.curr_player = this.next_player;
        this.lastTurn = [this.player, [x, y, x1, y1]];
        announce_turn();
    };
    game.init();
    game.curr_player = game.player;
    announce_turn();
    game.draw();
};
