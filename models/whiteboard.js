const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const whiteboardSchema=new Schema({
    name: {
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
});

const Whiteboard=mongoose.model('Whiteboard', whiteboardSchema);

module.exports=Whiteboard;