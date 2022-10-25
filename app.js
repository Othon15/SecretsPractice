//jshint esversion:6
require("dotenv").config();
const express = require ("express");
const bodyParser = require ("body-parser");
const ejs = require ("ejs");
const mongoose = require ("mongoose");
const session = require("express-session");   //aparaita auta ta 3 gia to passport,to kanoume prwta apo ola egkatastasi
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
//const encrypt = require ("mongoose-encryption"); //aparaitito for using encryption after we installed our npm package -----to // otan ekana to hashin passwords
//const md5 = require ("md5"); to afairoume kai vazoume sti 8esi tou to bcrypt sto level 4 afou exei ginei to install package
//const bcrypt = require ("bcrypt"); // aparaitito gia na enable to bcryot
//const saltRounds = 10; // pososus gurous salt 8eloume                         //to apenergooiisahme gia na valoumee to passport



const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({ extended: true }));


//console.log(process.env.API_KEY);

app.use(session({                          //security level 5 apo to prwto vima pou kanoume,wste na xrisimopoihsoume to package
  secret : "Our little secret.",           //einai ena js object me properties!
  resave : false,
  saveUninitialized : false
}));

app.use(passport.initialize());           //security level 5  we initialize passport package,einai bundled sto passport kai mas kanei to set up wste na use to package
                                          // for authentication
app.use(passport.session());              //  edw leme sto app mas na xrisimopoihsei to passport gia na kanei set up to session package

mongoose.connect("mongodb://localhost:27017/userDB");
//mongoose.set("useCreateIndex", true); DEN XREIAZETAI STO UPDATE VERSION POU TO TREXW EGW 8EWREITAI PWS EINAI APO MONO TOU IDI TRUE

/////////////////////////////////////////MONGOOSE SCHEMA &CONST FOR ENCRYPTUION AND MODEL//////////////////////////////////////////////
const userSchema = new mongoose.Schema ({    //alla3ame to schema mas kai to kaname new mongoose Schema,pleon dn einai ena aplo js object,einai ena object poy
email: String,                               // dimiourgi8ike apo to mongoose schema class
password: String
});

userSchema.plugin(passportLocalMongoose);  //aparaitito gia to security level 5 passportLocalMongooose, xrisimopoiitai gia hash & salt twn kwdikwn kai gia
                                           // na kanoume save tous kwdikous mas sto MongoDB data base mas

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());             //responsible for autheticating requests which they accomplish by implementing an authentication mechanism (see notes!)

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/",function(req, res){
  res.render("home");
});

app.get("/login",function(req, res){
  res.render("login");
});

app.get("/register",function (req, res){
  res.render("register");
});

app.get("/secrets", function (req, res){
  if (req.isAuthenticated()){
    res.render("secrets");
  }else {
    res.redirect("/login");
  }
});

app.get("/logout",function (req, res){
  req.logout(function(err){          //// einai apo to passport read  docs
    if(err){ return next (err); }
  res.redirect("/");
    });
});

app.post("/register", function (req, res){
User.register({username:req.body.username},req.body.password ,function (err, user){   // to .register einai apo to passport-local-mongoose package kai mono e3aitias
  if (err) {                                           // autou mporoume  na apofigoume na ftia3oume neo user kai na kanoume interact me to mongoose apeu8eias
    console.log(err);                                  // afinontas to method na kanei ton middleman
    res.redirect("/register");
  } else {
    passport.authenticate("local")(req, res, function (){
      res.redirect("/secrets");
    });
  }
});
});


app.post("/login", function (req, res){

 const user =  new User ({
   username: req.body.username,
   password: req.body.password
 });

req.login(user, function(err){
  if (err) {
    console.log(err);
  } else {
    passport.authenticate("local")(req, res, function (){      //einai apo to passport read docs
      res.redirect("/secrets");
    });
    }
});
});

app.listen(3000,function(){
  console.log("Server started on port 3000.");
});
