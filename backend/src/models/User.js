import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
{
    username:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        minlength:3,
        maxlength:30
    },

    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true
    },

    password:{
        type:String,
        select:false
    },

    googleId:{
        type:String,
        unique:true,
        sparse:true
    },

    profilePicture:String,

    authProvider:{
        type:String,
        enum:["local","google"],
        default:"local"
    }

},
{timestamps:true}
);

userSchema.pre(
"save",
async function(next){

if(
!this.isModified("password")
|| !this.password
){
return next();
}

this.password=
await bcrypt.hash(
this.password,
SALT_ROUNDS
);

next();

}
);

userSchema.methods.matchPassword=
async function(password){

return bcrypt.compare(
password,
this.password
);

};

export default mongoose.model(
"User",
userSchema
);