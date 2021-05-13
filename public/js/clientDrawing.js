const canvas = document.getElementById('canvas');
const context=canvas.getContext('2d');

canvas.width = canvas.clientWidth;
canvas.height=3*canvas.clientHeight;

const socket = io();

colorPicker=document.getElementById('color-picker');
colorPicker.addEventListener("input", watchColorPicker);
colorPicker.addEventListener("change", watchColorPicker);

clear=document.getElementById('clear');
if(clear!==null)
    clear.addEventListener("click", clearCanvas);

let selectedColor=colorPicker.value;
let line=5;
let pattern=[];

context.lineWidth=line;
context.strokeStyle=selectedColor;
context.lineCap='round';

selectLine=document.getElementById('select-line');
selectLine.addEventListener('change', function(){
    line=this.options[this.selectedIndex].text;
    context.lineWidth=line;
});

let mousePressed = false;
let lastPos = null;


function draw(e) {
    const [x, y] = mousePos(e);
    if (lastPos) {
        socket.emit("mouse", selectedColor, line, lastPos, [x, y]);
        lastPos = [x, y];
    } else {
        lastPos = [x, y];
        socket.emit("mouse", selectedColor, line, lastPos, [x, y]);
    }
}

socket.on("mouse", (color, width, startPos, endPos) => {
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = width;
    context.lineJoin = "round";
    context.moveTo(...startPos);
    context.lineTo(...endPos);
    context.closePath();
    context.stroke();
});

function mousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return [
        (e.clientX - rect.left) * (canvas.width / rect.width),
        (e.clientY - rect.top) * (canvas.height / rect.height),
    ];
}

canvas.addEventListener("mousedown", (e) => {
    mousePressed = true;
    draw(e);
});

canvas.addEventListener("mousemove", (e) => {
    if (mousePressed) {
        draw(e);
    }
});

canvas.addEventListener("mouseleave", () => {
    lastPos = null;
});

document.addEventListener("mouseup", (e) => {
    mousePressed = false;
    lastPos = null;
    context.beginPath();
});

canvas.addEventListener("touchstart", (e) => {
    mousePressed = true;
    draw(e);
});

canvas.addEventListener("touchmove", (e) => {
    if (mousePressed) {
        draw(e);
    }
});

canvas.addEventListener("touchcancel", () => {
    lastPos = null;
});

document.addEventListener("touchend", (e) => {
    mousePressed = false;
    lastPos = null;
    context.beginPath();
});

let username="USER";
let room="ROOM";

const usernameInput=document.getElementById("username");
const roomInput=document.getElementById("room");
const userList=document.getElementById("users");

function watchColorPicker(event) {
    selectedColor=event.target.value;
    context.strokeStyle=selectedColor;
    //socket.emit('color', event.target.value);
}

function clearCanvas(event){
    event.preventDefault();
    context.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('clear screen', "clear");
}

function download_png(el) {
  // get image URI from canvas object
  var imageURI = canvas.toDataURL("image/jpg");
  el.href = imageURI;
};

socket.on('clear screen', data => {
    context.clearRect(0, 0, canvas.width, canvas.height);
});

//get room and users
socket.on('roomUsers', ({room, users})=>{
    outputUsers(users);
});

username=usernameInput.innerHTML;
room=roomInput.innerHTML;
socket.emit('joinRoom', {username, room});

function outputUsers(users){
    userList.innerHTML=`${users.map(user=>`<li class="nav">${user.username}</li>`).join('')}`;
}

