const express=require('express');
const path=require('path');
const app=express();
const http=require('http');
const server=http.createServer(app);
const io=require('socket.io')(server)


const PORT=3000;

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/views'));

app.use(express.static('public'));

app.get('/', (req,res)=>{
    res.render("home");
});

app.get('/offline', (req,res)=>{
    res.render('offline');
});

io.on('connection', (socket)=>{
    console.log('a user connected');
    // socket.on('position', (msg) => {
    //     console.log('position: ' + msg.xpos + ' '+msg.ypos);
    // });
    socket.on('mouse', (data) => socket.broadcast.emit('mouse', data))
    socket.on('disconnect', () => console.log('Client has disconnected'))
})


server.listen(PORT, ()=>{
    console.log("Server up on port 3000");
});