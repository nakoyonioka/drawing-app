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
const dbUrl=process.env.DB_URL || 'mongodb://localhost:27017/drawing';
//const dbUrl='mongodb://localhost:27017/drawing';

const MongoStore=require("connect-mongo")(session);


mongoose.connect(dbUrl, {
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    useCreateIndex:true,
    useFindAndModify:false
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

const secret=process.env.SECRET || "thisshouldbeabettersecret!"

app.engine('ejs', engine);
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/views'));

app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));


const scriptSRC=[
    "https://cdn.jsdelivr.net",
    "https://fonts.gstatic.com"
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
            scriptSrc:["'unsafe-inline'", "'self'", ...scriptSRC],
            styleSrc:["'self'", "'unsafe-inline'", ...styleSRC],
            workerSrc:["'self'", "blob:"],
            objectSrc:[],
            imgSrc:["'self'", "blob:", "data:"],
            fontSrc:["'self'", ...fontSRC]
        },
    })
);

const store=new MongoStore({
    url: dbUrl,
    secret,
    touchAfter:24*60*60
});

store.on('error', function(err){
    console.log("session store error", e);
})

const sessionConfig={
    store,
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
app.use(helmet());

const validateBoardName=(req,res,next)=>{
    const {error} =whiteboardSchema.validate(req.body);
    if(error){
        const msg=error.details.map(el=>el.message).join(',');
        throw new ExpressError(msg,400);
    }
}

const validateCharadesName=(req,res,next)=>{
    const {error} =charadesSchema.validate(req.body);
    if(error){
        const msg=error.details.map(el=>el.message).join(',');
        throw new ExpressError(msg,400);
    }
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
    const newCharades= await Charades.findOne({name : req.body.room.name});
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
        drawQueue.push([...args]);
        io.to(user.room).emit("mouse", ...args);
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
    console.log("Server up");
});