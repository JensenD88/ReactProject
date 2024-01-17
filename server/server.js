import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";

const app = express();
const port = 3500;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use(express.static("public"));
app.use(express());
app.use(session({
	secret: 'im Darren IN India',
	resave: false,
	saveUninitialized: false,
  }))
app.use(passport.initialize());
app.use(passport.session());
app.use(cors());

mongoose.connect("mongodb://localhost:27017/UserList");

 const userList = new mongoose.Schema({
 	username: String,
 	Password: String,
 })

userList.plugin(passportLocalMongoose);

const User = new mongoose.model("users", userList);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/api",(req,res)=>{
  res.status(200).send('server working on port 3500');
})

app.post("/api/register", (req,res)=>{
 console.log(req.body.password)
//  res.json({"message ": "Form submitted"});
 const newUser = new User ({
  username : req.body.username,
  password : req.body.password,
})
// const Data = JSON.stringify(newUser.username);
User.register(newUser, req.body.password , function(err){
  if(err){
    console.log(err);
  }else{
    console.log("console: no errors in registering");
    passport.authenticate("local")(req, res, function(){     
        console.log("registered and saved in Mongodb");
        res.json('sucess');
    });
  }
});
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}.`);
  });