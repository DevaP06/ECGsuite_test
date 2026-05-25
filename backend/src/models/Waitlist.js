import mongoose from "mongoose";

const waitlistSchema =
new mongoose.Schema({

email:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true,
    match:[
        /^\S+@\S+\.\S+$/,
        "Invalid email"
    ]
},

name:{
    type:String,
    required:true,
    trim:true
},

userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    default:null
},

status:{
    type:String,
    enum:[
        "pending",
        "invited",
        "rejected"
    ],
    default:"pending",
    index:true
},

invitedAt:{
    type:Date,
    default:null
}

},
{
timestamps:true
});

export default mongoose.model(
"Waitlist",
waitlistSchema
);