const express=require('express');
const path=require('path');
const app=express();
const http=require('http');
const server=http.createServer(app);
const io=require('socket.io')(server)
const mongoose = require('mongoose');
const catchAsync=require('./utils/catchAsync');
const ExpressError=require('./utils/expressError');
const Joi=require('joi');
const session=require('express-session');
const flash=require('connect-flash');
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
let message="Invalid room name";
const drawQueue=[];

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/views'));

app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));

const sessionConfig={
    secret:'thisshouldbeabettersecret!',
    resave:false,
    saveUninitialized:true,
    cookie:{
        httpOnly:true,
        expires:Date.now()+1000*3600*24*7, //expires in a week
        maxAge:1000*3600*24*7
    }
}
app.use(session(sessionConfig));
app.use(flash());

app.use((req,res,next)=>{
    res.locals.success=req.flash('success');
    res.locals.error=req.flash('error');
    next();
});

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

app.post('/createroom', catchAsync(async (req,res,next)=>{
    const roomSchema=Joi.object({
        room:Joi.object({
            name:Joi.string().required(),
            username:Joi.string().required(),
            password:Joi.string().required()
        }).required()
    })
    const {error} =roomSchema.validate(req.body);
    if(error){
        const msg=error.details.map(el=>el.message).join(',');
        throw new ExpressError(msg,400);
    }
    const result= await Room.findOne({name : req.body.room.name});
    if(result!=null){
        //self.invalidate('name', 'name already exists');
        //throw new ExpressError("Invalid room name", 400);
        req.flash('error', "Room name is already taken.");
        return res.redirect('create');
    }
    else{
        username=req.body.room.username;
        room=req.body.room.name;
        password=req.body.room.password;
        const newRoom=await new Room({
            name:room,
            password:password

        });
        newRoom.save();
        res.redirect('drawing');
    }
    
}));

app.post('/joinroom', catchAsync(async (req,res,next)=>{
    if(!req.body.room) throw new ExpressError('Invalid room name', 400);
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
    
}));

app.get('/drawing', (req,res)=>{
    res.render('drawing', {username, room})
});

app.all('*', (req,res,next)=>{
    next(new ExpressError('Page not found', 404));
});

app.use((err, req, res, next)=>{
    const {statusCode=500}=err;
    if(!err.message) 
        err.message="Something went wrong.";
    res.status(statusCode).render('error', {err});
});

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

    drawQueue.forEach(([...args]) => socket.emit("mouse", ...args));

    socket.on('mouse', (...args) => {
        const user=getCurrentUser(socket.id);
        //socket.broadcast.emit('mouse', data)
        //socket.broadcast.to(user.room).emit('mouse', data);
        drawQueue.push([...args]);
        io.to(user.room).emit("mouse", ...args);
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