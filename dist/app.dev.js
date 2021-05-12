"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _toArray(arr) { return _arrayWithHoles(arr) || _iterableToArray(arr) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

if (process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}

var mongoose = require('mongoose');

var catchAsync = require('./utils/catchAsync');

var ExpressError = require('./utils/expressError');

var session = require('express-session');

var flash = require('connect-flash');

var engine = require('ejs-mate');

var express = require('express');

var path = require('path');

var app = express();

var http = require('http');

var server = http.createServer(app);

var io = require('socket.io')(server);

var helmet = require('helmet');

var Whiteboard = require('./models/whiteboard');

var Charades = require('./models/charades');

var _require = require('./schemas.js'),
    whiteboardSchema = _require.whiteboardSchema,
    charadesSchema = _require.charadesSchema;

var dbUrl = process.env.DB_URL; //const dbUrl='mongodb://localhost:27017/drawing';

var MongoStore = require("connect-mongo");

mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
}).then(function () {
  console.log("MONGO connection open");
})["catch"](function (err) {
  console.log("Error on MONGO");
  console.log(err);
});

var _require2 = require('./utils/users'),
    userJoin = _require2.userJoin,
    getCurrentUser = _require2.getCurrentUser,
    userLeave = _require2.userLeave,
    getRoomUsers = _require2.getRoomUsers;

var PORT = process.env.PORT || 3000;
var username = "USER";
var room = "DEFAULT";
var password = "PASS";
var message = "Invalid room name";
var owner = "NULL";
var drawQueue = [];
var secret = process.env.SECRET;
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express["static"]('public'));
app.use(express.urlencoded({
  extended: true
}));
var scriptSRC = ["https://cdn.jsdelivr.net", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.1/dist/umd/popper.min.js", "https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/js/bootstrap.min.js"];
var styleSRC = ["https://stackpath.bootstrapcdn.com", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://fonts.gstatic.com"];
var fontSRC = ["https://fonts.googleapis.com", "https://fonts.gstatic.com"];
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: [],
    connectSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"].concat(scriptSRC),
    styleSrc: ["'self'", "'unsafe-inline'"].concat(styleSRC),
    workerSrc: ["'self'", "blob:"],
    objectSrc: ["'self'"],
    imgSrc: ["'self'", "blob:", "data:"],
    fontSrc: ["'self'"].concat(fontSRC)
  }
}));
var sessionConfig = {
  store: MongoStore.create({
    mongoUrl: dbUrl,
    secret: secret,
    touchAfter: 24 * 60 * 60
  }),
  name: 'session',
  secret: secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    //secure:true,
    expires: Date.now() + 1000 * 3600 * 24 * 7,
    //expires in a week
    maxAge: 1000 * 3600 * 24 * 7
  }
};
app.use(session(sessionConfig));
app.use(flash());

var validateBoardName = function validateBoardName(req, res, next) {
  var _whiteboardSchema$val = whiteboardSchema.validate(req.body),
      error = _whiteboardSchema$val.error;

  if (error) {
    var msg = error.details.map(function (el) {
      return el.message;
    }).join(',');
    throw new ExpressError(msg, 400);
  }
};

var validateCharadesName = function validateCharadesName(req, res, next) {
  var _charadesSchema$valid = charadesSchema.validate(req.body),
      error = _charadesSchema$valid.error;

  if (error) {
    var msg = error.details.map(function (el) {
      return el.message;
    }).join(',');
    throw new ExpressError(msg, 400);
  }
};

app.use(function (req, res, next) {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});
app.get('/', function (req, res) {
  res.render("home");
});
app.get('/offline', function (req, res) {
  res.render('offline');
});
app.get('/join', function (req, res) {
  res.render('join');
});
app.get('/create', function (req, res) {
  res.render('create');
});
app.post('/whiteboard-create', validateBoardName, catchAsync(function _callee(req, res, next) {
  var newBoard, newRoom;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(Whiteboard.findOne({
            name: req.body.room.name
          }));

        case 2:
          newBoard = _context.sent;

          if (!(newBoard != null)) {
            _context.next = 8;
            break;
          }

          //self.invalidate('name', 'name already exists');
          //throw new ExpressError("Invalid room name", 400);
          req.flash('error', "Room name is already taken.");
          return _context.abrupt("return", res.redirect('create'));

        case 8:
          username = req.body.room.username;
          room = req.body.room.name;
          password = req.body.room.password;
          _context.next = 13;
          return regeneratorRuntime.awrap(new Whiteboard({
            name: room,
            password: password
          }));

        case 13:
          newRoom = _context.sent;
          newRoom.save();
          res.redirect('drawing');

        case 16:
        case "end":
          return _context.stop();
      }
    }
  });
}));
app.post('/charades-create', validateCharadesName, catchAsync(function _callee2(req, res, next) {
  var newCharades, newRoom;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          console.log(req.body.name);
          _context2.next = 3;
          return regeneratorRuntime.awrap(Charades.findOne({
            name: req.body.room.name
          }));

        case 3:
          newCharades = _context2.sent;

          if (!(newCharades != null)) {
            _context2.next = 9;
            break;
          }

          //self.invalidate('name', 'name already exists');
          //throw new ExpressError("Invalid room name", 400);
          req.flash('error', "Room name is already taken.");
          return _context2.abrupt("return", res.redirect('create'));

        case 9:
          username = req.body.room.username;
          room = req.body.room.name;
          password = req.body.room.password;
          owner = req.body.room.username;
          _context2.next = 15;
          return regeneratorRuntime.awrap(new Charades({
            name: room,
            password: password,
            owner: owner
          }));

        case 15:
          newRoom = _context2.sent;
          newRoom.save();
          res.redirect('charades');

        case 18:
        case "end":
          return _context2.stop();
      }
    }
  });
}));
app.post('/join-charades', catchAsync(function _callee3(req, res, next) {
  var findRoom;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          if (req.body.room) {
            _context3.next = 2;
            break;
          }

          throw new ExpressError('Invalid room name', 400);

        case 2:
          _context3.next = 4;
          return regeneratorRuntime.awrap(Charades.findOne({
            name: req.body.room
          }));

        case 4:
          findRoom = _context3.sent;

          if (findRoom) {
            if (findRoom.password === req.body.password) {
              if (findRoom.owner === req.body.username) {
                owner = req.body.username;
              } else {
                owner = findRoom.owner;
              }

              username = req.body.username;
              room = req.body.room;
              password = req.body.password;
              res.redirect('charades');
            } else {
              res.render('join');
            }
          } else {
            res.render('join');
          }

        case 6:
        case "end":
          return _context3.stop();
      }
    }
  });
}));
app.post('/join-whiteboard', catchAsync(function _callee4(req, res, next) {
  var findRoom;
  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          if (req.body.room) {
            _context4.next = 2;
            break;
          }

          throw new ExpressError('Invalid room name', 400);

        case 2:
          _context4.next = 4;
          return regeneratorRuntime.awrap(Whiteboard.findOne({
            name: req.body.room
          }));

        case 4:
          findRoom = _context4.sent;

          if (findRoom) {
            if (findRoom.password === req.body.password) {
              username = req.body.username;
              room = req.body.room;
              password = req.body.password;
              res.redirect('drawing');
            } else {
              res.render('join');
            }
          } else {
            res.render('join');
          }

        case 6:
        case "end":
          return _context4.stop();
      }
    }
  });
}));
app.get('/drawing', function (req, res) {
  res.render('drawing', {
    username: username,
    room: room
  });
});
app.get('/charades', function (req, res) {
  res.render('charades', {
    username: username,
    room: room,
    owner: owner
  });
});
app.all('*', function (req, res, next) {
  next(new ExpressError('Page not found', 404));
});
app.use(function (err, req, res, next) {
  var _err$statusCode = err.statusCode,
      statusCode = _err$statusCode === void 0 ? 500 : _err$statusCode;
  if (!err.message) err.message = "Something went wrong.";
  res.status(statusCode).render('error', {
    err: err
  });
});
io.on('connection', function (socket) {
  console.log('a user connected');
  socket.on('joinRoom', function (_ref) {
    var username = _ref.username,
        room = _ref.room;
    var user = userJoin(socket.id, username, room);
    socket.join(user.room); //send info on users that are in room

    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });
  drawQueue.forEach(function (_ref2) {
    var _ref3 = _toArray(_ref2),
        args = _ref3.slice(0);

    return socket.emit.apply(socket, ["mouse"].concat(_toConsumableArray(args)));
  });
  socket.on('mouse', function () {
    var _io$to;

    var user = getCurrentUser(socket.id);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    drawQueue.push([].concat(args));

    (_io$to = io.to(user.room)).emit.apply(_io$to, ["mouse"].concat(args));
  });
  socket.on('drawer', function (name) {
    var user = getCurrentUser(socket.id);
    io.to(user.room).emit('drawer', name);
  });
  socket.on('roomWords', function () {
    var _io$to2;

    var user = getCurrentUser(socket.id);

    for (var _len2 = arguments.length, data = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      data[_key2] = arguments[_key2];
    }

    (_io$to2 = io.to(user.room)).emit.apply(_io$to2, ["roomWords"].concat(data));
  });
  socket.on('clear screen', function (data) {
    var user = getCurrentUser(socket.id);
    io.to(user.room).emit("clear screen", data);
  });
  socket.on('correctWord', function (data) {
    var user = getCurrentUser(socket.id);
    io.to(user.room).emit("correctWord", data);
  });
  socket.on('disconnect', function () {
    var user = userLeave(socket.id);

    if (user) {
      console.log("".concat(user.username, " has diconnected.")); //send info on users that are in room

      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});
server.listen(PORT, function () {
  console.log("Server up");
});