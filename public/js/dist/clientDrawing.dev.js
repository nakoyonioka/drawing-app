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
var context = canvas.getContext('2d');
canvas.height = 0.7 * canvas.clientHeight;
canvas.width = canvas.clientWidth;
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
  mousePressed = true;
  draw(e);
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

socket.on("touch", function (color, width, startPos, endPos) {
  context.beginPath();
  context.strokeStyle = color;
  context.lineWidth = width;
  context.lineJoin = "round";
  context.moveTo.apply(context, _toConsumableArray(startPos));
  context.lineTo.apply(context, _toConsumableArray(endPos));
  context.closePath();
  context.stroke();
});

function drawTouch(e) {
  var _touchPos = touchPos(e),
      _touchPos2 = _slicedToArray(_touchPos, 2),
      x = _touchPos2[0],
      y = _touchPos2[1];

  if (lastPos) {
    socket.emit("touch", selectedColor, line, lastPos, [x, y]);
    lastPos = [x, y];
  } else {
    lastPos = [x, y];
    socket.emit("touch", selectedColor, line, lastPos, [x, y]);
  }
}

canvas.addEventListener("touchstart", function (e) {
  touchPressed = true;
  drawTouch(e);
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
var usernameInput = document.getElementById("username");
var roomInput = document.getElementById("room");
var userList = document.getElementById("users");

function watchColorPicker(event) {
  selectedColor = event.target.value;
  context.strokeStyle = selectedColor; //socket.emit('color', event.target.value);
}

function clearCanvas(event) {
  event.preventDefault();
  context.clearRect(0, 0, canvas.width, canvas.height);
  socket.emit('clear screen', "clear");
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
username = usernameInput.innerHTML;
room = roomInput.innerHTML;
socket.emit('joinRoom', {
  username: username,
  room: room
});

function outputUsers(users) {
  userList.innerHTML = "".concat(users.map(function (user) {
    return "<li class=\"nav\">".concat(user.username, "</li>");
  }).join(''));
}