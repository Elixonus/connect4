class Game
{
  constructor()
  {
    this.players = [];
    this.started = false;
    this.turn = "red";
    this.dots = [];
    this.dotColumns = [];
    for(var n = 0; n < 7; n++)
    {
      this.dotColumns.push([]);
    }
  }

  addDot(color, column)
  {
    // color is "red" or "yellow"
    // column is 0-6 int
    let dot = new Dot(color, column);
    if(this.putDotInRow(dot) === false)
    {
      return false;
    }
    this.dots.push(dot);
    this.dotColumns[column].push(dot);
  }

  putDotInRow(dot)
  {
    let highestRow = -1;
    let column = this.dotColumns[dot.column];
    for(var n = 0; n < column.length; n++)
    {
      if(column[n].row > highestRow)
      {
        highestRow = column[n].row;
      }
    }

    let newRow = highestRow + 1;

    if(newRow > 5)
    {
      return false;
    }

    dot.row = newRow;
  }

  sendData()
  {
    for(var n = 0; n < this.players.length; n++)
    {
      this.players[n].socket.emit("game",
      {
        id: this.players[n].id,
        color: this.players[n].color,
        game:
        {
          started: this.started,
          dots: this.dots,
          dotColumns: this.dotColumns
        }
      });
    }
  }
}

class Dot
{
  constructor(color, column)
  {
    this.color = color;
    this.row = null;
    this.column = column;
  }
}

var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var games = [];

var clients = [];
var _id = 0;

app.get("/", function(req, res)
{
  res.sendFile(__dirname + "/public/index.html");
});

io.on("connection", function(socket)
{
  console.log("a user connected");
  var client =
  {
    socket: socket,
    id: ++_id,
    color: "red"
  };

  clients.push(client);

  let game;

  for(var n = 0; n < games.length; n++)
  {
    if(games[n].players.length === 1)
    {
      client.color = "yellow";
      game = games[n];
      game.started = true;
      break;
    }

    // if game players length is 2, skip
  }

  // if game with 1 player not found, create new game

  if(game == undefined)
  {
    game = new Game();
    games.push(game);
  }

  game.players.push(client);
  
  if(game.players.length === 2)
  {
    for(var n = 0; n < game.players.length; n++)
    {
      game.players[n].socket.emit("found");
    }
  }

  socket.emit("hello",
  {
    id: client.id
  });

  socket.on("dot", function(data)
  {
    if(!game.started)
    {
      return;
    }

    let column = data.column;

    if(isNaN(column))
    {
      return;
    }

    if(column < 0 || column > 6)
    {
      return;
    }

    if(Math.floor(column) !== column || Math.ceil(column) !== column)
    {
      return;
    }

    if(game.dots.length === 0)
    {
      let index = game.players.indexOf(client);
      game.players[index].color = "red";
      game.players[1 - index].color = "yellow";
    }

    if(game.turn === client.color)
    {
      game.addDot(client.color, column);

      if(game.turn === "red")
      {
        game.turn = "yellow";
      }

      else if(game.turn === "yellow")
      {
        game.turn = "red";
      }

      game.sendData();
    }
  });

  socket.on("disconnect", function()
  {
    clients.splice(clients.indexOf(client), 1);
    game.players.splice(game.players.indexOf(client), 1);
    if(game.players.length === 1)
    {
      games.splice(games.indexOf(game), 1);
      game.players[0].socket.emit("reset");
    }

    console.log("a user disconnected");
  });
});

http.listen(3000, function()
{
  console.log("listening on *:3000");
});

function clampMin(num, min)
{
    return num < min ? min : num;
}

function clampMax(num, max)
{
    return num > max ? max : num;
}

function clamp(num, min, max)
{
    return num < min ? min : num > max ? max : num;
}