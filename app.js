if(process.env.NODE_ENV !== "production"){
    require('dotenv').config();
}

const mongoose = require('mongoose');
const catchAsync=require('./utils/catchAsync');
const ExpressError=require('./utils/expressError');
const session=require('express-session');
const flash=require('connect-flash');
const engine=require('ejs-mate');

const express=require('express');
const path=require('path');
const app=express();
const http=require('http');
const server=http.createServer(app);
const io=require('socket.io')(server)

const helmet=require('helmet');

const Whiteboard = require('./models/whiteboard');
const Charades = require('./models/charades');

const {whiteboardSchema, charadesSchema}=require('./schemas.js');

const dbUrl=process.env.DB_URL;

//const dbUrl='mongodb://localhost:27017/drawing';

const MongoStore=require("connect-mongo");

mongoose.connect(dbUrl, {
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    useCreateIndex:true
})
.then(()=>{
    console.log("MONGO connection open");
})
.catch (err=>{
    console.log("Error on MONGO");
    console.log(err);
})

const {userJoin, getCurrentUser, userLeave, getRoomUsers}=require('./utils/users');

const PORT=process.env.PORT || 3000;

let username="USER";
let room="DEFAULT";
let password="PASS";
let message="Invalid room name";
let owner="NULL";
const drawQueue=[];

const secret=process.env.SECRET;

app.engine('ejs', engine);
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/views'));

app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));


const scriptSRC=[
    "https://cdn.jsdelivr.net",
    "https://fonts.gstatic.com",
    "https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.1/dist/umd/popper.min.js",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/js/bootstrap.min.js"
];

const styleSRC=[
    "https://stackpath.bootstrapcdn.com",  
    "https://cdn.jsdelivr.net",
    "https://fonts.googleapis.com",
    "https://fonts.gstatic.com"
];

const fontSRC=["https://fonts.googleapis.com", "https://fonts.gstatic.com"];

app.use(
    helmet.contentSecurityPolicy({
        directives:{
            defaultSrc:[],
            connectSrc:["'self'"],
            scriptSrc:["'self'", "'unsafe-inline'", ...scriptSRC],
            styleSrc:["'self'", "'unsafe-inline'", ...styleSRC],
            workerSrc:["'self'", "blob:"],
            objectSrc:["'self'"],
            imgSrc:["'self'", "blob:", "data:"],
            fontSrc:["'self'", ...fontSRC]
        },
    })
);

const sessionConfig={
    store:MongoStore.create({
        mongoUrl:dbUrl,
        secret:secret,
        touchAfter:24*60*60
    }),
    name:'session',
    secret,
    resave:false,
    saveUninitialized:true,
    cookie:{
        httpOnly:true,
        //secure:true,
        expires:Date.now()+1000*3600*24*7, //expires in a week
        maxAge:1000*3600*24*7
    }
}
app.use(session(sessionConfig));
app.use(flash());

const validateBoardName=(req,res,next)=>{
    const {error} =whiteboardSchema.validate(req.body);
    if(error){
        const msg=error.details.map(el=>el.message).join(',');
        throw new ExpressError(msg,400);
    }
    next();
}

const validateCharadesName=(req,res,next)=>{
    const {error} =charadesSchema.validate(req.body);
    if(error){
        const msg=error.details.map(el=>el.message).join(',');
        throw new ExpressError(msg,400);
    }
    next();
}

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

app.post('/whiteboard-create', validateBoardName, catchAsync(async (req,res,next)=>{
    const newBoard= await Whiteboard.findOne({name : req.body.room.name});
    if(newBoard!=null){
        //self.invalidate('name', 'name already exists');
        //throw new ExpressError("Invalid room name", 400);
        req.flash('error', "Room name is already taken.");
        return res.redirect('create');
    }
    else{
        username=req.body.room.username;
        room=req.body.room.name;
        password=req.body.room.password;
        const newRoom=await new Whiteboard({
            name:room,
            password:password,
        });
        newRoom.save();
        res.redirect('drawing');
    }
    
}));

app.post('/charades-create', validateCharadesName, catchAsync(async (req,res,next)=>{
    console.log(req.body.name)
    const newCharades= await Charades.findOne({name : req.body.room.name});
    console.log(newCharades);
    if(newCharades!=null){
        //self.invalidate('name', 'name already exists');
        //throw new ExpressError("Invalid room name", 400);
        req.flash('error', "Room name is already taken.");
        return res.redirect('create');
    }
    else{
        username=req.body.room.username;
        room=req.body.room.name;
        password=req.body.room.password;
        owner=req.body.room.username;
        const newRoom=await new Charades({
            name:room,
            password:password,
            owner:owner
        });
        console.log(newRoom);
        newRoom.save();
        res.redirect('charades');
    }
}));

app.post('/join-charades', catchAsync(async (req,res,next)=>{
    if(!req.body.room) throw new ExpressError('Invalid room name', 400);
    const findRoom=await Charades.findOne({name:req.body.room});
    if(findRoom){
        if(findRoom.password===req.body.password){
            if(findRoom.owner===req.body.username){
                owner=req.body.username;
            }
            else{
                owner=findRoom.owner;
            }
            username=req.body.username;
            room=req.body.room;
            password=req.body.password;
            
            res.redirect('charades');
        }
        else{
            res.render('join');
        }
    }
    else{
        res.render('join');
    } 
}));

app.post('/join-whiteboard', catchAsync(async (req,res,next)=>{
    if(!req.body.room) throw new ExpressError('Invalid room name', 400);
    const findRoom=await Whiteboard.findOne({name:req.body.room});
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

app.get('/charades', (req,res)=>{
    res.render('charades', {username, room, owner})
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
        drawQueue.push([...args]);
        io.to(user.room).emit("mouse", ...args);
    });

    socket.on('touch', (...args) => {
        const user=getCurrentUser(socket.id);
        drawQueue.push([...args]);
        io.to(user.room).emit("touch", ...args);
    });

    socket.on('drawer', (name)=>{
        const user=getCurrentUser(socket.id);
        io.to(user.room).emit('drawer', name);
    })

    socket.on('roomWords', (...data)=>{
        const user=getCurrentUser(socket.id);
        io.to(user.room).emit("roomWords", ...data);
    })

    socket.on('clear screen', (data) => {
        const user=getCurrentUser(socket.id);
        io.to(user.room).emit("clear screen", data);
    });

    socket.on('correctWord', (data) => {
        const user=getCurrentUser(socket.id);
        io.to(user.room).emit("correctWord", data);
    });

    socket.on('disconnect', () => {
        const user=userLeave(socket.id);
        if(user){
            //send info on users that are in room
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users:getRoomUsers(user.room)
            });
        }
    })
})


server.listen(PORT, ()=>{
    console.log("Server up");
});