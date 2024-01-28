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

 const bookdata = new mongoose.Schema({
	name: String,
	author: String,
	price: Number,
	quantity: Number,

 })

userList.plugin(passportLocalMongoose);

const User = new mongoose.model("users", userList);
const book = new mongoose.model("bookData", bookdata);


passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/api",(req,res)=>{
  res.status(200).send('server working on port 3500');
})

app.post("/api/login", (req, res) => {
	const user = new User({
		username: req.body.username,
		password: req.body.password
	})
	//const Data = JSON.stringify(user.username);
	req.login(user, function (err) {
		if (err) {
			console.log("login error", err);
		} else {
			passport.authenticate("local", { failureRedirect: '/login' })(req, res, function () {
				if(user.username === 'Admin'){
					User.findOne({ username: user.username }).then((doc) => {
						console.log("sucessfully logged the Admin in")
						console.log(doc);
						res.json({'message' : 'adminAcess',
						'username': user.username
					});
					})	
				}else{
				User.findOne({ username: user.username }).then((doc) => {
					console.log("sucessfully logged in")
					console.log(doc);
					res.json({'message' : 'sucess',
					'username': user.username
				});
				})	
				}
				
			})
		}
	})
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
        res.json({'message' : 'sucess',
				  'username': newUser.username
				 });
    });
  }
});
})

//RESTfull APi for book data manupilation

app.post("/books", function(req,res){

	const newbook = new book ({
	      name: req.body.name,
	      author: req.body.author,
	      price: req.body.price,
	      quantity: req.body.quantity,
	  })

	console.log(newbook)
	  
	newbook.save();

	  
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}.`);
  });