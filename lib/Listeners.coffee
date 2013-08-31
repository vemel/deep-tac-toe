Player   = require './Player'
async    = require 'async'
console    = require 'console'
Game     = require './XO'

###
socket io events handlers
###

Listeners =

  startGame: (connection, data) ->
    games  = app.storage.games
    player = new Player connection
    game   = null

    async.waterfall(
      [
        (player.getData.bind player, ['gameId', 'playerIndex'])
        (data, next) ->
          return next() if (!data.gameId? or !data.playerIndex?)
          oldGame = app.storage.findGame data.gameId

          #if user has old uncompleted game - finish it
          if oldGame
            # oldGame.reconnectPlayer(data.playerIndex, player)
            oldGame.finish {reason: 'opponentLeaving', team: oldGame.players[data.playerIndex].team}, next
          else
            next()
          undefined
      ]
      (err) ->
        console.error err if err
        game = if games.length then games[games.length - 1] else null

        if !game or game.players.length == 2
          game = new Game()

        game.addPlayer player
        undefined
    )


  turn: (connection, turn) ->
    #todo: send errors to client

    if not turn.x? or not turn.y? or not turn.x1? or not turn.y1?
      return console.error 'Not enough parameters'

    Player::getData.call {connection: connection}, ['gameId', 'playerIndex'], (err, data) ->
      console.error err if err
      game   = if data.gameId? then app.storage.findGame data.gameId else null
      player = if game then game.players[data.playerIndex] else null

      return console.error 'game not found', data.gameId if !game
      return console.error 'player not found', data.gameId, data.playerIndex if !player
      return if game.currentTeam isnt player.team

      game.turn turn.x, turn.y, turn.x1, turn.y1
      undefined

  disconnect: (connection, data) ->
    Player::getData.call {connection: connection}, ['gameId', 'playerIndex'], (err, data) ->
      console.error err if err
      return if !data.gameId? || !data.playerIndex?

      game   = app.storage.findGame data.gameId
      player = if data.playerIndex? then game.players[data.playerIndex] else null

      game.finish reason: 'opponentLeaving',  team: if player then player.team else null



module.exports = Listeners