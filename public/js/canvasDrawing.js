// Keep everything in anonymous function, called on window load.
let canvas = document.getElementById('canvas');
canvas.width="1000";
canvas.height="600";

let context=canvas.getContext('2d');

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

selectLine=document.getElementById('select-line');
selectLine.addEventListener('change', function(){
    line=this.options[this.selectedIndex].text;
    context.lineWidth=line;
});

context.lineCap='round';


let username="USER";
let room="ROOM";

const usernameInput=document.getElementById("username");
const roomInput=document.getElementById("room");

const userList=document.getElementById("users");

window.addEventListener('load', function () {
    
    let x,y;
    let drawing=false;

    function startDrawing(e){
        drawing=true;
        draw(e);
    }

    function finishedDrawing(){
        drawing=false;
        context.beginPath();
    }

    function draw(e){
        if(!drawing) return;
        if (e.layerX || e.layerX == 0) { // Firefox
            // added -this.offsetLeft, and -this.offsetTop
            x = e.layerX - this.offsetLeft;
            y = e.layerY - this.offsetTop;
        } 
        else if (e.offsetX || e.offsetX == 0) { // Opera
            x = e.offsetX;
            y = e.offsetY;
        }
        context.lineTo(x,y);
        context.stroke();
        context.beginPath();
        context.moveTo(x,y);
        sendmouse(x,y, context.strokeStyle, context.lineWidth);
    } 

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mouseup', finishedDrawing);
    canvas.addEventListener('mousemove', draw);

    username=usernameInput.innerHTML;
    room=roomInput.innerHTML;
    socket.emit('joinRoom', {username, room});
}); 


function watchColorPicker(event) {
    context.strokeStyle=event.target.value;
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


// Sending data to the socket
function sendmouse(x, y,color, width) {
    const data = {
        x: x,
        y: y,
        color: color,
        width: width
    }
    socket.emit('mouse', data);
}

socket.on('mouse', data => {
    context.strokeStyle=data.color;
    context.lineWidth=data.width;
    context.beginPath();
    context.moveTo(data.x, data.y);
    context.lineTo(data.x, data.y);
    context.stroke();
    context.beginPath();
});

socket.on('clear screen', data => {
    context.clearRect(0, 0, canvas.width, canvas.height);
});

//get room and users
socket.on('roomUsers', ({room, users})=>{
    outputUsers(users);
});

function outputUsers(users){
    userList.innerHTML=`${users.map(user=>`<li class="nav">${user.username}</li>`).join('')}`;
}