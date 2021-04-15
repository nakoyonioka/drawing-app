const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const charadesSchema=new Schema({
    name: {
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    owner :{
        type:String,
        required:true
    }
});

const Charades=mongoose.model('Charades', charadesSchema);

module.exports=Charades;