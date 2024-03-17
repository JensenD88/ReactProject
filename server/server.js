import express, { json } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import session from "express-session";
import redis from "redis";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";

const app = express();
const client = redis.createClient();
const port = 3500;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use(express.static("public"));
app.use(express());
app.use(session({
	secret: 'im Darren IN India',
	resave: false,
	saveUninitialized: true,
  }))
app.use(passport.initialize());
app.use(passport.session());
app.use(cors());
app.use((req, res, next) => {
    const { username } = req.session;
    if (username) {
       
        client.expire('cachedUsername', 3600, username); 
    }
    next();
});


mongoose.connect("mongodb://localhost:27017/UserList");

 const userList = new mongoose.Schema({
 	username: String,
 	Password: String,
	Address: String,
 })

 const bookdata = new mongoose.Schema({
	name: String,
	author: String,
	price: Number,
	quantity: Number,

 })

 const cartLedger = new mongoose.Schema({
	userName: String,
	product_id: String,
	product_name: String,
	product_price: Number,
	product_quantity: Number,
 },{timestamps: true})

userList.plugin(passportLocalMongoose);

const User = new mongoose.model("users", userList);
const book = new mongoose.model("bookData", bookdata);
const Cart = new mongoose.model("cart", cartLedger);


passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/api",(req,res)=>{
  res.status(200).send('server working on port 3500');
})

app.post("/api/login", (req, res) => {

	global.UserVariable  = req.body.username;
	
	

	const user = new User({
		username: req.body.username,
		password: req.body.password
	})
	//const Data = JSON.stringify(user.username);
	
	User.findOne({ username: user.username }).then((doc) =>{
	if(doc == null){console.log(doc)
	res.json({'message': "No User Found"})}
	});

	
	req.login(user, function (err) {
		if (err) {
			console.log("login error:", err);
		} else {

			passport.authenticate("local")(req, res, function () {
				User.findOne({ username: user.username }).then((doc) =>{
					if(user.username === 'Admin'){
						console.log("sucessfully logged the Admin in")
				 		console.log(doc);
				 		res.json({'message' : 'adminAcess',
				 		'username': user.username
				 	});
					 }else if(doc == null){
					  	console.log(doc)
					    res.json({'message': "No User Found"})
					}else{
						console.log("sucessfully logged in")
						 	console.log(doc);
						 	res.json({'message' : 'sucess',
						 	           'username': user.username
						              });	
					}

				})
				
			})
		}
	})}
	
)

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

app.get("/DisplayBook", (req,res)=>{
	book.find().then(bk => { //naming convention changes
		const bookName = bk.map(bk => bk.name);
		const bkname = JSON.stringify(bookName);
		console.log("The no of books sent are: " + bookName.length);
		res.json(bookName); // Assuming you want to respond with an array of book names
	}).catch(err => {
		console.error(err);
		res.status(500).json({ error: 'Internal Server Error' });
	});
})

app.get("/usernames", (req,res)=>{
	User.find().then(user => { //naming convention changes

			const Uname = user.map(user => user.username);
			const UnameString = JSON.stringify(Uname);
			console.log("The no of users sent are: " + Uname.length);
			res.json(Uname); // Assuming you want to respond with an array of book names

	}).catch(err => {
		console.error(err);
		res.status(500).json({ error: 'Internal Server Error' });
	});
})


app.get("/BookData", (req,res) => {
	book.find().then(bk =>{ //naming 
		const Bdata = JSON.stringify(bk);
		console.log(Bdata);
		res.json(bk)
	}).catch(errerr => {
		console.error(err);
		res.status(500).json({ error: 'Internal Server Error' });
	});
})

app.post("/api/cart", (req, res) =>{
	const uName = req.body.userName;
	const UserName = uName.slice(2,-1);
	const index = req.body.cartData.length;
	// req.session.name = UserName;

	for(let i = 0; i < index; i++){

	book.findOneAndUpdate({name : req.body.cartData[i].name}, { quantity: req.body.cartData[i].quantity - req.body.number[i] }).then((res)=>{
		
		if(res.quantity <= 0 ){
			console.log("There is no stock for the product : " + res.name)
		}else(
			console.log("the book was updated")
		)
	})

	 const newCart = new Cart({
	 	userName: UserName ,
	 	product_id: req.body.cartData[i]._id,
	 	product_name: req.body.cartData[i].name,
	 	product_price: req.body.cartData[i].price,
	 	product_quantity: req.body.number[i],
	 })
     newCart.save();
	 
	
	
	}
	res.json(   {'message' : 'sucess',
			    'username': UserName,
				 });
})

app.post('/payment', (req, res) => {
    console.log(req.body.username);
    Cart.find({userName:req.body.username}).then((res)=>{
		// res.forEach(element => {
		// 	console.log(element.product_name, element.product_price, element.product_quantity)
		// });
	const mappedArray = res.map(({product_name,product_price,product_quantity }) => {
		return {product_name,product_price,product_quantity}
	})
	console.log(mappedArray);
	})
    res.sendStatus(200); 
});
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