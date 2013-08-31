async = require 'async'

###
Game player wrapper
###

class Player
  constructor: (@connection) ->
    @team = 0;

  send: (eventName, data) ->
    @connection.emit eventName, data

  ###
  Setting data to player connection for it's identification

  @param {Object} data
  @param {Function} callback
  ###
  setData: (data, callback) ->
    async.forEach(
      Object.keys data
      (key, cb) =>
        @connection.set key, data[key], cb
      callback
    )

  ###
  Returns connection data for gotten keys

  @param {Array} keys
  @param {Function} callback
  ###
  getData: (keys, callback) ->
    parallels = {}
    for key in keys
      parallels[key] = @connection.get.bind @connection, key
    async.parallel parallels, callback

module.exports = Player