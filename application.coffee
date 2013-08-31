global.app =
  server  : {}
  config  : require './config.default'
  storage : require './lib/Storage'
exec          = (require 'child_process').exec
fs            = require 'fs'
express       = require 'express'
http          = require 'http'
console       = require 'console'
stdio         = require 'stdio'
jade          = require 'jade'
utils         = require './overrides'
expressServer = global.app.server = express()
server        = http.createServer expressServer
io            = (require 'socket.io').listen server, 'log level': 1
listeners     = require './lib/Listeners'
clientSetting = ['httpHost']

opts = stdio.getopt {
    'httpHost': {key: 'h', args: 1, description: 'Host for app'},
    'httpPort': {key: 'p', args: 1, description: 'Port for app'},
    'test': {key: 't', description: 'Port for app'},
}

try
  if opts.test
    appConfig = require('./config_test')
  else
    appConfig = require('./config')

  global.app.config.extend(appConfig);
catch error

global.app.config.extend(opts);

#generating config file for client-side
clientConfig = do ->
  return {} if !clientSetting? or typeof clientSetting isnt 'array'
  result = []
  for setting of app.config when (clientSetting.indexOf setting) isnt -1
    result[setting] = app.config[setting]
  result

clientConfig = "var appConfig = #{JSON.stringify global.app.config};"

fs.writeFile './public/js/config.js', clientConfig, (err) ->
  console.error(err) if err

#compiling clients files
exec 'coffee --compile --output ./public/js/ ./public/coffee/', (err, stdout, stderr) ->
  console.error err if err
  console.error stderr if stderr

server.listen global.app.config.httpPort

#static
expressServer.use '/static/', express.static './public'

expressServer.set 'views', './public/views/'
expressServer.set 'view engine', 'jade'

expressServer.get "/", (req, res) ->
  res.render "index"

expressServer.get "/hotseat", (req, res) ->
  res.render "game_hotseat"

expressServer.get "/network", (req, res) ->
  res.render "game_network"

#listeners
io.sockets.on 'connection', (socket) ->
  for actionName, action of listeners
    do (actionName) -> socket.on actionName, (data) ->
      listeners[actionName] socket, data
  undefined
