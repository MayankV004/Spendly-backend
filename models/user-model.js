import mongoose from 'mongoose';
import bcrypt from "bcrypt";
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true , "Please tell your name!"],
        minlength:[3, "Name must be atleast 3 character long"],
        trim:true
    },
    username:{
        type:String,
        required:[true , "please make a username"],
        trim:true,
        minlength:3
    },
    email:{
        type:String,
        required:[true , "Email is required!"],
        unique:true,
        trim:true
    },
    password:{
        type:String,
        required:true,
        minlength:[6 , "Password must be atleast 6 character long!"]
    }, 
    avatar:{
        type:String,
        default:""
    },
    isEmailVerified:{
        type:Boolean,
        default:false
    },
    verificationToken:String,
    verificationTokenExpires: Date,
    resetPasswordToken:String,
    resetPasswordTokenExpires: Date,
    refreshToken:[{
        token:String,
        createdAt:{
            type:Date ,
            default:Date.now
        },
        expiresAt:Date
    }],
    lastLogin:Date,


},{timestamps:true})

// Hash Password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

//Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("user",userSchema);
export default User;