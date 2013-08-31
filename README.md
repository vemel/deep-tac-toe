Original game http://en.wikipedia.org/wiki/Tic-tac-toe

`deep-tac-toe` is simple multiplayer game written in CoffeeScript on node.js
using express, async and socket.io

Main goal is to play tictactoe while playing tictactoe.

Basic rules:

1. To win this game you shoud conquer big field
2. To conquer field (big or small) you can put three-in-a-row, or have
   five units in full field
3. You can only put new unit to cell of big field, where your opponent made
   last turn in small field/ It's a hard one.
4. If required field is full or your last turn was in that field, 
   you can make your step anywhere you want!

TL;DR:

1. Strenght in numbers
2. Conquer those small fields to win!
3. Keep your opponent in bounds.

You can [try it here](http://deep-tac-toe.jit.su/)

To install game:

1. Download project
2. From the project's root directory run `npm install`
3. Run `coffee application.coffee --test`
4. Open http://localhost:8081 page in you browser

Configure:

There is default config file `config.default.coffee`
You can override any setting by creating your own `config.coffee` with
the same structure as default config
