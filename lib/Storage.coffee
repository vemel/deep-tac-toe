###
Application memory storage... can be replaced with db library
###

Storage =
  games: []

  findGame: (id) ->
    for game in @games
      if game.id == id
        return game
        break

    null

  removeGame: (game) ->
    index = @games.indexOf game
    @games.splice index, 1 if index isnt -1
    undefined

module.exports = Storage