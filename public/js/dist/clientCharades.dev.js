"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d'); //canvas.width = canvas.clientWidth;
//canvas.height=1*canvas.clientHeight;

canvas.width = 1094;
canvas.height = 600;
var socket = io();
colorPicker = document.getElementById('color-picker');
colorPicker.addEventListener("input", watchColorPicker);
colorPicker.addEventListener("change", watchColorPicker);
clear = document.getElementById('clear');
if (clear !== null) clear.addEventListener("click", clearCanvas);
var selectedColor = colorPicker.value;
var line = 5;
var pattern = [];
context.lineWidth = line;
context.strokeStyle = selectedColor;
context.lineCap = 'round';
selectLine = document.getElementById('select-line');
selectLine.addEventListener('change', function () {
  line = this.options[this.selectedIndex].text;
  context.lineWidth = line;
});
var mousePressed = false;
var touchPressed = false;
var lastPos = null;
var allowDraw = false;

function draw(e) {
  var _mousePos = mousePos(e),
      _mousePos2 = _slicedToArray(_mousePos, 2),
      x = _mousePos2[0],
      y = _mousePos2[1];

  if (lastPos) {
    socket.emit("mouse", selectedColor, line, lastPos, [x, y]);
    lastPos = [x, y];
  } else {
    lastPos = [x, y];
    socket.emit("mouse", selectedColor, line, lastPos, [x, y]);
  }
}

socket.on("mouse", function (color, width, startPos, endPos) {
  context.beginPath();
  context.strokeStyle = color;
  context.lineWidth = width;
  context.lineJoin = "round";
  context.moveTo.apply(context, _toConsumableArray(startPos));
  context.lineTo.apply(context, _toConsumableArray(endPos));
  context.closePath();
  context.stroke();
});

function mousePos(e) {
  var rect = canvas.getBoundingClientRect();
  return [(e.clientX - rect.left) * (canvas.width / rect.width), (e.clientY - rect.top) * (canvas.height / rect.height)];
}

canvas.addEventListener("mousedown", function (e) {
  if (allowDraw) {
    mousePressed = true;
    draw(e);
  }
});
canvas.addEventListener("mousemove", function (e) {
  if (mousePressed) {
    draw(e);
  }
});
canvas.addEventListener("mouseleave", function () {
  lastPos = null;
});
document.addEventListener("mouseup", function (e) {
  mousePressed = false;
  lastPos = null;
  context.beginPath();
});

function touchPos(e) {
  var rect = canvas.getBoundingClientRect();
  return [(e.changedTouches[0].clientX - rect.left) * (canvas.width / rect.width), (e.changedTouches[0].clientY - rect.top) * (canvas.height / rect.height)];
}

function drawTouch(e) {
  e.preventDefault();

  var _touchPos = touchPos(e),
      _touchPos2 = _slicedToArray(_touchPos, 2),
      x = _touchPos2[0],
      y = _touchPos2[1];

  lastPos = [x, y];
  context.strokeStyle = selectedColor;
  context.lineWidth = line;
  context.lineJoin = "round";
  context.lineTo.apply(context, [x, y]);
  context.stroke();
  context.beginPath();
  context.moveTo.apply(context, _toConsumableArray(lastPos));
}

canvas.addEventListener("touchstart", function (e) {
  if (allowDraw) {
    touchPressed = true;
    drawTouch(e);
  }
});
canvas.addEventListener("touchmove", function (e) {
  if (touchPressed) {
    drawTouch(e);
  }
});
canvas.addEventListener("touchcancel", function () {
  lastPos = null;
});
document.addEventListener("touchend", function (e) {
  touchPressed = false;
  lastPos = null;
  context.beginPath();
});
var username = "USER";
var room = "ROOM";
var admin = "ADMIN";
var usernameInput = document.getElementById("username");
var roomInput = document.getElementById("room");
var userList = document.getElementById("users");
admin = document.getElementById("admin").innerHTML.trim();

function watchColorPicker(event) {
  selectedColor = event.target.value;
  context.strokeStyle = selectedColor; //socket.emit('color', event.target.value);
}

function download_png(el) {
  // get image URI from canvas object
  var imageURI = canvas.toDataURL("image/jpg");
  el.href = imageURI;
}

;
socket.on('clear screen', function (data) {
  context.clearRect(0, 0, canvas.width, canvas.height);
}); //get room and users

socket.on('roomUsers', function (_ref) {
  var room = _ref.room,
      users = _ref.users;
  outputUsers(users);
});
username = usernameInput.innerHTML.trim();
room = roomInput.innerHTML;
socket.emit('joinRoom', {
  username: username,
  room: room
});

function outputUsers(users) {
  userList.innerHTML = "".concat(users.map(function (user) {
    return "<li class=\"mt-1 nav\"><a id=\"side\" class=\"btn btn-sm btn-dark users-btns\">".concat(user.username, "</a></li>");
  }).join(''));
  setAdmin();
}

var wordInput = document.getElementById('word-to-guess');
var buttonWord = document.getElementById('add-word');
var wordList = document.getElementById('word-list');
var wordsRoom = [];
var available = 2; //get room and words

socket.on('roomWords', function (_ref2) {
  var room = _ref2.room,
      words = _ref2.words;
  wordsRoom = _toConsumableArray(words);
  outputWords(wordsRoom);
});

function outputWords(wordsRoom) {
  wordList.innerHTML = "".concat(wordsRoom.map(function (word) {
    return "<li class=\"nav\">".concat(word, "</li>");
  }).join(''));
}

buttonWord.addEventListener('click', function (e) {
  e.preventDefault();

  if (available > 0) {
    available = available - 1;
    wordsRoom.push(wordInput.value);
    wordInput.value = "";
    wordList.innerHTML = "".concat(wordsRoom.map(function (word) {
      return "<li class=\"nav\">".concat(word, "</li>");
    }).join(''));
    var words = wordsRoom;
    socket.emit('roomWords', {
      room: room,
      words: words
    });
  }
});
wordInput.addEventListener('keyup', function (e) {
  if (available > 0) {
    if (e.key == "Enter") {
      available = available - 1;
      wordsRoom.push(wordInput.value);
      wordInput.value = "";
      wordList.innerHTML = "".concat(wordsRoom.map(function (word) {
        return "<li class=\"nav\">".concat(word, "</li>");
      }).join(''));
      var words = wordsRoom;
      socket.emit('roomWords', {
        room: room,
        words: words
      });
    }
  }
});
var sideItem = "NULL";

function clearCanvas(event) {
  if (allowDraw || username == admin) {
    event.preventDefault();
    context.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('clear screen', "clear");
  }
}

var goodGuess = document.getElementById('correct-guess');

function setAdmin() {
  if (username == admin) {
    allowDraw = true;
    goodGuess.classList.add('d-none');
  } else {
    allowDraw = false;
    goodGuess.classList.remove('d-none');
  }

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = userList.childNodes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var child = _step.value;

      if (child.childNodes[0].innerHTML.trim() == admin) {
        child.childNodes[0].style.color = "red";
      } else {
        child.childNodes[0].style.color = "blue";
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  sideItem = document.querySelectorAll('.users-btns');
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = sideItem[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var side = _step2.value;
      side.addEventListener('click', adminPermissions);
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
        _iterator2["return"]();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }
}

;
var drawer = document.getElementById('who-is-drawing');
drawer.innerHTML = "".concat(admin, " is drawing");

function adminPermissions(event) {
  event.preventDefault();

  if (username === admin) {
    var name = event.target.innerHTML;
    socket.emit('drawer', name);
  }
}

socket.on('drawer', function (name) {
  drawer.innerHTML = "".concat(name, " is drawing");

  if (username == name) {
    allowDraw = true;
    goodGuess.classList.add('d-none');
  } else {
    allowDraw = false;
    goodGuess.classList.remove('d-none');
  }
});
goodGuess.addEventListener('click', function (e) {
  e.preventDefault();
  socket.emit('correctWord', 'correct');
});
socket.on('correctWord', function (data) {
  console.log("guess was good");
});