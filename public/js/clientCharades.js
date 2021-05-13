const canvas = document.getElementById('canvas');
const context=canvas.getContext('2d');

//canvas.width = canvas.clientWidth;
//canvas.height=1*canvas.clientHeight;

canvas.width=1094;
canvas.height=600;

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
let touchPressed = false;
let lastPos = null;

let allowDraw=false;


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
    if(allowDraw){
        mousePressed = true;
        draw(e);
    }
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

function touchPos(e) {
    const rect = canvas.getBoundingClientRect();
    return [
        (e.changedTouches[0].pageX - rect.left) * (canvas.width / rect.width),
        (e.changedTouches[0].pageY - rect.top) * (canvas.height / rect.height),
    ];
}

socket.on("touch", (color, width, startPos, endPos)=>{
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = width;
    context.lineJoin = "round";
    context.moveTo(...startPos);
    context.lineTo(...endPos);
    context.closePath();
    context.stroke();
})

function drawTouch(e){
    const [x, y] = touchPos(e);
    if (lastPos) {
        socket.emit("touch", selectedColor, line, lastPos, [x, y]);
        lastPos = [x, y];
    } else {
        lastPos = [x, y];
        socket.emit("touch", selectedColor, line, lastPos, [x, y]);
    }
}

canvas.addEventListener("touchstart", (e) => {
    if(allowDraw){
        touchPressed = true;
        drawTouch(e);
    }
});

canvas.addEventListener("touchmove", (e) => {
    if (touchPressed) {
        drawTouch(e);
    }
});

canvas.addEventListener("touchcancel", () => {
    lastPos = null;
});

document.addEventListener("touchend", (e) => {
    touchPressed = false;
    lastPos = null;
    //context.beginPath();
});

let username="USER";
let room="ROOM";
let admin="ADMIN";

const usernameInput=document.getElementById("username");
const roomInput=document.getElementById("room");
const userList=document.getElementById("users");
admin=document.getElementById("admin").innerHTML.trim();

function watchColorPicker(event) {
    selectedColor=event.target.value;
    context.strokeStyle=selectedColor;
    //socket.emit('color', event.target.value);
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

username=usernameInput.innerHTML.trim();
room=roomInput.innerHTML;
socket.emit('joinRoom', {username, room});

function outputUsers(users){
    userList.innerHTML=`${users.map((user)=>`<li class="mt-1 nav"><a id="side" class="btn btn-sm btn-dark users-btns">${user.username}</a></li>`).join('')}`;
    setAdmin();
}

const wordInput=document.getElementById('word-to-guess');
const buttonWord=document.getElementById('add-word');
const wordList=document.getElementById('word-list');
let wordsRoom=[];

let available=2;

//get room and words
socket.on('roomWords', ({room, words})=>{
    wordsRoom=[...words];
    outputWords(wordsRoom);
});

function outputWords(wordsRoom){
    wordList.innerHTML=`${wordsRoom.map(word=>`<li class="nav">${word}</li>`).join('')}`;
}

buttonWord.addEventListener('click', function(e){
    e.preventDefault();
    if(available>0){
        available=available-1;
        wordsRoom.push(wordInput.value);
        wordInput.value="";
        wordList.innerHTML=`${wordsRoom.map(word=>`<li class="nav">${word}</li>`).join('')}`;
        let words=wordsRoom;
        socket.emit('roomWords', {room, words});
    }
});

wordInput.addEventListener('keyup', (e)=>{
    if(available>0){
        if(e.key=="Enter"){
            available=available-1;
            wordsRoom.push(wordInput.value);
            wordInput.value="";
            wordList.innerHTML=`${wordsRoom.map(word=>`<li class="nav">${word}</li>`).join('')}`;
            let words=wordsRoom;
            socket.emit('roomWords', {room, words});
        }
    }
});

let sideItem="NULL";

function clearCanvas(event){
    if(allowDraw || username==admin){
        event.preventDefault();
        context.clearRect(0, 0, canvas.width, canvas.height);
        socket.emit('clear screen', "clear");
    }
}

const goodGuess=document.getElementById('correct-guess');

function setAdmin() {
    if(username==admin){
        allowDraw=true;
        goodGuess.classList.add('d-none');
    }
    else{
        allowDraw=false;
        goodGuess.classList.remove('d-none');
    }
    for(let child of userList.childNodes){
        if(child.childNodes[0].innerHTML.trim()==admin){
            child.childNodes[0].style.color="red";
            
        }
        else{
            child.childNodes[0].style.color="blue";
        }
    }
    sideItem=document.querySelectorAll('.users-btns');  
    for(let side of sideItem){
        side.addEventListener('click', adminPermissions);
    }
};

const drawer=document.getElementById('who-is-drawing');
drawer.innerHTML=`${admin} is drawing`;

 function adminPermissions(event){
    event.preventDefault();
    if(username===admin){
        let name=event.target.innerHTML;
        socket.emit('drawer', name);
    }
}

socket.on('drawer', (name)=>{
    drawer.innerHTML=`${name} is drawing`;
    if(username==name){
        allowDraw=true;
        goodGuess.classList.add('d-none');
    }
    else{
        allowDraw=false;
        goodGuess.classList.remove('d-none');
    }
});

goodGuess.addEventListener('click', (e)=>{
    e.preventDefault();
    socket.emit('correctWord', 'correct');
});

socket.on('correctWord', (data)=>{
    console.log("guess was good");
});

