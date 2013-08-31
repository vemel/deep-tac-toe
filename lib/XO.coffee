###
Game mechanics.
###
async = require 'async'
console = require 'console'

class Game
  constructor: ->
    @id          = Game::incrementedId++;
    @currentTeam = Game.CROSS;
    @turnsCount  = 0;
    @players     = [];

    @height = 500;
    @width = 500;
    @cells_x = 3;
    @cells_y = 3;
    @players_last_fields = {};
    @won = false;
    @player = undefined;
    @players_turns = {};

    @init()

    app.storage.games.push @


  incrementedId: 0


  ###
  Returns true if current player wins the game
  ###
  checkCompletion: ->
    return @won

  addPlayer: (player) ->
    player.team = if @players.length is 0 then Game.CROSS else Game.NOUGHT
    @players.push player

    connectionData =
      gameId      : @id,
      playerIndex : @players.indexOf player

    player.setData connectionData, (err) =>
      console.error err if err

      if @players.length == 2
        for player in @players
          @init_game()
          player.send 'gameStarted', {team: player.team}

        @stateChanged()
      else
        player.send 'waitingForOpponent'

  reconnectPlayer: (playerIndex, player) ->
    player_team = @players[playerIndex]
    players[data.playerIndex] = player
    players[data.playerIndex].team = player_team

    connectionData =
      gameId      : @id,
      playerIndex : @players.indexOf player

    player.setData connectionData, (err) =>
      console.error err if err

      if @players.length == 2
        for player in @players
          @init_game()
          player.send 'gameStarted', {team: player.team}

        @stateChanged()
      else
        player.send 'waitingForOpponent'

  init_game: ->
    @players_turns = {}
    for i in [0...@players.length]
        @players_turns[@players[i].team] = []

    @player = @players[0]

  init: ->
    @won = false
    @field = []
    @field_lines = [];
    @small_fields = [];
    for y in [0...@cells_y]
        @field.push []
        @field_lines.push []
        @small_fields.push []
        for x in [0...@cells_x]
            @field[y].push ""
            @field_lines[y].push false
            @small_fields[y].push []
            for y1 in [0...@cells_y]
                @small_fields[y][x].push []
                for x1 in [0...@cells_x]
                    @small_fields[y][x][y1].push "p"

  makeTurn: (x, y, x1, y1) ->
    prev_player = @players[((@players.indexOf @player) - 1 + @players.length) % @players.length]
    @checkPossible(@player.team, prev_player.team)
    if @small_fields[y][x][y1][x1] != "p"
      return

    @small_fields[y][x][y1][x1] = @player.team
    @players_turns[@player.team].push [x, y, x1, y1]
    next_player = @players[((@players.indexOf @player) + 1) % @players.length]
    @checkWin x, y
    @checkPossible(next_player.team, @player.team)
    @player = next_player
    @currentTeam = next_player.team

  checkWin: (x, y) ->
    if @field[y][x] == ""
        win_res = @checkWinField(@small_fields[y][x])
        if (win_res)
            @field[y][x] = win_res[0]
            if win_res[1]
                @field_lines[y][x] = win_res[1]

    win = @checkWinField @field
    if win
        @won = win

  isValueEmpty: (value) ->
    if value == "" || value  == "p"
      return true
    return false

  isFieldFull: (field) ->
    values = {}
    for y1 in [0...@cells_y]
      for x1 in [0...@cells_x]
        value = field[y1][x1]
        values[value] = (values[value] || 0) + 1
        if @isValueEmpty value
          return false

    return true

  getFieldLeader: (field) ->
    values = {}
    for y1 in [0...@cells_y]
      for x1 in [0...@cells_x]
        value = field[y1][x1];
        values[value] = (values[value] || 0) + 1;
        if @isValueEmpty value
          return false;

    max_value = ""
    max_value_count = 0
    for i in [0...values.length]
      if values[i] > max_value_count
        max_value = i
        max_value_count = values[i]

    return max_value;


  checkPossible: (player, prev_player) ->
    last_turn = [-1, -1, -1, -1]
    last_turn = @players_turns[player][@players_turns[player].length - 1]  if @players_turns[player].length
    opp_turn = [-1, -1, 0, 0]
    opp_turn = @players_turns[prev_player][@players_turns[prev_player].length - 1] if @players_turns[prev_player].length
    force_x = opp_turn[2]
    force_y = opp_turn[3]
    free_turn = false
    free_turn = true  if force_x is last_turn[0] and force_y is last_turn[1]
    free_turn = true  if @isFieldFull(@small_fields[force_x][force_y])
    free_turn = true  if opp_turn[0] < 0

    for y in [0...@cells_y]
      for x in [0...@cells_x]
        for y1 in [0...@cells_y]
          for x1 in [0...@cells_x]
            value = @small_fields[y][x][y1][x1]
            continue  unless @isValueEmpty(value)
            if @won
              value = ""
              @small_fields[y][x][y1][x1] = value
              continue
            if free_turn or (force_x is x and force_y is y)
              value = "p"
            else
              value = ""
            @small_fields[y][x][y1][x1] = value

  checkWinField: (field) ->
    value = `undefined`
    for y in [0...field.length]
      value = field[y][0]
      continue  if @isValueEmpty(value)
      for x in [0...field[y].length]
        unless field[y][x] is value
          value = false
          break
      return [value, [0, y, @cells_x - 1, y]]  if value
    for x in [0...field[0].length]
      value = field[0][x]
      continue  if @isValueEmpty(value)
      for y in [0...field.length]
        unless field[y][x] is value
          value = false
          break
      return [value, [x, 0, x, @cells_y - 1]]  if value

    if @cells_x is @cells_y
      value = field[0][0]
      unless @isValueEmpty(value)
        for y in [0...field.length]
          unless field[y][y] is value
            value = false
            break
        return [value, [0, 0, @cells_y - 1, @cells_y - 1]]  if value

      value = field[0][@cells_y - 1]
      unless @isValueEmpty(value)
        for y in [0...field.length]
          unless field[y][@cells_y - 1 - y] is value
            value = false
            break
        return [value, [0, @cells_y - 1, @cells_y - 1, 0]]  if value
    return [@getFieldLeader(field), false]  if @isFieldFull(field)
    false

  ###
  Notify players about changing state
  ###
  stateChanged: ->
    data =
      field: @field,
      small_fields: @small_fields,
      field_lines: @field_lines,
      players_turns: @players_turns,
      won: @won,
      currentTeam: @player.team

    for player in @players
      player.send 'gameStateChanged', data


  turn: (x, y, x1, y1) ->
    @turnsCount++;
    @makeTurn(x, y, x1, y1)

    @stateChanged()

    if @checkCompletion()
      @finish {reason: 'complete', won: @won}


  finish: (data, callback) ->
    callback = callback || (err) -> console.error err if err
    cleanConnectionData =
      gameId      : null
      playerIndex : null

    async.forEach(
      @players
      (player, cb) ->
        player.setData cleanConnectionData, cb
      (err) =>
        console.error err if err

        for player in @players
          player.send 'gameFinished', data

        app.storage.removeGame @

        callback()
    )


#Some static constants
Game.CROSS  = "x"
Game.NOUGHT = "o"


module.exports = Game