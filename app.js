const express=require('express');
const path=require('path');
const app=express();
const http=require('http');
const server=http.createServer(app);
const io=require('socket.io')(server)
const mongoose = require('mongoose');
const Room = require('./models/room');

mongoose.connect('mongodb://localhost:27017/drawing', {useNewUrlParser: true, useUnifiedTopology: true})
.then(()=>{
    console.log("MONGO connection open");
})
.catch (err=>{
    console.log("Error on MONGO");
    console.log(err);
})

const {userJoin, getCurrentUser, userLeave, getRoomUsers}=require('./utils/users');

const PORT=3000 || process.env.PORT;

let username="USER";
let room="DEFAULT";
let password="PASS";

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/views'));

app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));

app.get('/', (req,res)=>{
    res.render("home");
});

app.get('/offline', (req,res)=>{
    res.render('offline');
});

app.get('/join', (req,res)=>{
    res.render('join');
});

app.get('/create', (req,res)=>{
    res.render('create');
});

app.post('/createroom', async (req,res)=>{
    username=req.body.username;
    room=req.body.room;
    password=req.body.password;
    const newRoom=await new Room({
        name:room,
        password:password
    });
    console.log(newRoom);
    newRoom.save();
    res.redirect('drawing');
})

app.post('/joinroom', async (req,res,next)=>{
    const findRoom=await Room.findOne({name:req.body.room});
    if(findRoom){
        if(findRoom.password===req.body.password){
            username=req.body.username;
            room=req.body.room;
            password=req.body.password;
            
            res.redirect('drawing');
        }
        else{
            res.render('join');
        }
    }
    else{
        res.render('join');
    }
    
});

app.get('/drawing', (req,res)=>{
    res.render('drawing', {username, room})
})

io.on('connection', (socket)=>{
    console.log('a user connected');
    socket.on('joinRoom', ({username, room})=>{
        const user=userJoin(socket.id, username, room);
        socket.join(user.room);

        //send info on users that are in room
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users:getRoomUsers(user.room)
        });
    });

    socket.on('mouse', (data) => {
        const user=getCurrentUser(socket.id);
        //socket.broadcast.emit('mouse', data)
        socket.broadcast.to(user.room).emit('mouse', data);
    });

    socket.on('clear screen', (data) => {
        socket.broadcast.emit('clear screen', data)
    });

    socket.on('disconnect', () => {
        const user=userLeave(socket.id);
        if(user){
            console.log(`${user.username} has diconnected.`);
            //send info on users that are in room
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users:getRoomUsers(user.room)
            });
        }
    })
})


server.listen(PORT, ()=>{
    console.log("Server up on port 3000");
});