const canvas = document.getElementById('canvas');
let context=canvas.getContext('2d');

canvas.width = canvas.clientWidth;
canvas.height=3*canvas.clientHeight;

colorPicker=document.getElementById('color-picker');
colorPicker.addEventListener("input", watchColorPicker);
colorPicker.addEventListener("change", watchColorPicker);

clear=document.getElementById('clear');
if(clear!==null)
    clear.addEventListener("click", clearCanvas);

let selectedColor=colorPicker.value;
let line=5;

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


function mousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return [
        (e.clientX - rect.left) * (canvas.width / rect.width),
        (e.clientY - rect.top) * (canvas.height / rect.height),
    ];
}

function draw(e) {
    const [x, y] = mousePos(e);
    if (lastPos) {
        lastPos = [x, y];
    } else {
        lastPos = [x, y];
    }
    context.strokeStyle = selectedColor;
    context.lineWidth = line;
    context.lineJoin = "round";
    
    context.lineTo(...[x, y]);
    context.stroke();
    context.beginPath();
    context.moveTo(...lastPos);
}

function drawTouch(e){
    e.preventDefault();
    let touches = e.changedTouches;
    alert(e);
    alert(touches.lengnth);
    for (let i = 0; i < touches.length; i++) {
        let idx = ongoingTouchIndexById(touches[i].identifier);
        alert(touches.lengnth);
        if (idx >= 0) {
            lastPos=[touches[i].pageX, touches[i].pageY];
            context.strokeStyle = selectedColor;
            context.lineWidth = line;
            context.lineJoin = "round";
            context.lineTo(...[ongoingTouches[idx].pageX, ongoingTouches[idx].pageY]);
            context.stroke();
            context.beginPath();
            context.moveTo(...lastPos);

            ongoingTouches.splice(idx, 1, copyTouch(touches[i]));  // swap in the new touch record
        } 
    }
}

function copyTouch({ identifier, pageX, pageY }) {
  return { identifier, pageX, pageY };
}

function ongoingTouchIndexById(idToFind) {
  for (var i = 0; i < ongoingTouches.length; i++) {
    var id = ongoingTouches[i].identifier;

    if (id == idToFind) {
      return i;
    }
  }
  return -1;    // not found
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
    touchPressed = true;
    drawTouch(e);

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
    context.beginPath();
});

function watchColorPicker(event) {
    selectedColor=event.target.value;
    context.strokeStyle=selectedColor;
}

function clearCanvas(event){
    event.preventDefault();
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function download_png(el) {
  // get image URI from canvas object
  var imageURI = canvas.toDataURL("image/jpg");
  el.href = imageURI;
};

