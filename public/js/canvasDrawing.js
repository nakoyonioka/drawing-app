// Keep everything in anonymous function, called on window load.
let canvas = document.getElementById('canvas');
let context=canvas.getContext('2d');

const socket = io();

colorPicker=document.getElementById('color-picker');
//colorPicker.addEventListener("input", watchColorPicker, false);
colorPicker.addEventListener("change", watchColorPicker, false);

clear=document.getElementById('clear');
clear.addEventListener("click", clearCanvas);


let selectedColor=colorPicker.value;

context.strokeStyle=selectedColor;

if(window.addEventListener) {
    window.addEventListener('load', function () {
        let tool;
        socket.on('mouse', data => {
            var item = document.createElement('p');
            item.innerHTML = "Hello world";
            clear.appendChild(item);
        });

        function init () {
            // Pencil tool instance.
            tool = new tool_pencil();

            // Attach the mousedown, mousemove and mouseup event listeners.
            canvas.addEventListener('mousedown', ev_canvas, false);
            canvas.addEventListener('mousemove', ev_canvas, false);
            canvas.addEventListener('mouseup',   ev_canvas, false);
        }
        // This painting tool works like a drawing pencil which tracks the mouse 
        // movements.
        function tool_pencil () {
            const tool = this;
            this.started = false;
            

            // This is called when you start holding down the mouse button.
            // This starts the pencil drawing.
            this.mousedown = function (ev) {
                context.beginPath();
                context.moveTo(ev._x-canvas.offsetLeft, ev._y-canvas.offsetTop);
                tool.started = true;
            };

            // This function is called every time you move the mouse. Obviously, it only 
            // draws if the tool.started state is set to true (when you are holding down 
            // the mouse button).
            this.mousemove = function (ev) {
                if (tool.started) {
                    context.lineTo(ev._x-canvas.offsetLeft, ev._y-canvas.offsetTop);
                    context.stroke();
                }
                sendmouse(ev._x, ev._y, canvas.offsetLeft, canvas.offsetTop)
            };

            // This is called when you release the mouse button.
            this.mouseup = function (ev) {
                if (tool.started) {
                    tool.mousemove(ev);
                    tool.started = false;
                }
            };
        }

        // The general-purpose event handler. This function just determines the mouse 
        // position relative to the canvas element.
        function ev_canvas (ev) {
            if (ev.layerX || ev.layerX == 0) { // Firefox
                ev._x = ev.layerX;
                ev._y = ev.layerY;
            } else if (ev.offsetX || ev.offsetX == 0) { // Opera
                ev._x = ev.offsetX;
                ev._y = ev.offsetY;
            }

            // Call the event handler of the tool.
            const func = tool[ev.type];
            if (func) {
                func(ev);
            }
        }

        init();

    }, false); 
}

function watchColorPicker(event) {
    context.strokeStyle=event.target.value;
    //socket.emit('color', event.target.value);
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


// Sending data to the socket
function sendmouse(x, y, pX, pY,color) {
    const data = {
        x: x,
        y: y,
        px: pX,
        py: pY,
        color: color,
    }
    socket.emit('mouse', data);
}

