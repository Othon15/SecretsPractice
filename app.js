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
const GoogleStrategy = require ("passport-google-oauth20").Strategy; // it uses the passport-google-oauth20 package,we use it as a passport strategy
const findOrCreate = require ("mongoose-findorcreate");    //aparaitito gia na doulepsei to function findOrCreate,energopoiei to antistixoi npm package

const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({ extended: true }));


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
password: String,
googleId: String,                            // we added it here so it can match with the googleId in our passport google strategy line 63
secret: String                               // we added secret gia na matcharoume ton user me to secret tou!
});

userSchema.plugin(passportLocalMongoose);  //aparaitito gia to security level 5 passportLocalMongooose, xrisimopoiitai gia hash & salt twn kwdikwn kai gia
                                           // na kanoume save tous kwdikous mas sto MongoDB data base mas

userSchema.plugin(findOrCreate);  //aparaito gia na doulepsei to findOrCreate package pou energopoiei to antistoixo package tou passport

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());             //responsible for autheticating requests which they accomplish by implementing an authentication mechanism (see notes!)

passport.serializeUser(function(user, done){    // me auto to code to serialization tou user 8a ginetai gia ka8e strategy authentication oxi mono gia to local mongoose
  done(null,user.id);
});

passport.deserializeUser(function(id, done){   // me auto to code to deserialization tou user 8a ginetai gia ka8e strategy authentication oxi mono gia to local mongoose
  User.findById(id, function(err, user){
    done(err, user);
  });
});

passport.use(new GoogleStrategy({                      // exei megali simasia oti mpainei edw gt alliws den 8a doulepsei!prosexe pws ta vazeis
    clientID: process.env.CLIENT_ID,                        // baze to after all the setup and before our routes!!!!
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {          //accessToken:allows us to get access to user's data for a longer period of time
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {   //profile:it will contain email.google id and everything we have access to
      return cb(err, user);                                              //we  use the data we get back to either find a user or create them if they don't exist
    });                                                                  //findOrCreate is not a method of mongoDB or a Mongoose.
  }                                                          //the people who documented this package came up with as pseudo codes/fake code  install findOrCreate package
));

app.get("/",function(req, res){
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google",{ scope: ["profile"]})  //we use passport to authenticate our user with the google strategy that we created earlier
);

app.get("/auth/google/secrets",                          //this app request is made by google when they try to redirect the user back to our website
  passport.authenticate("google", { failureRedirect: "/login" }),  //the string has to match what we specified to google previously.
  function(req, res) {
      res.redirect("/secrets");                // Successful authentication, redirect to secrets.
  });


app.get("/login",function(req, res){
  res.render("login");
});

app.get("/register",function (req, res){
  res.render("register");
});

app.get("/secrets", function (req, res){               //svisame to proigoume gt den 8a einai pleon privileged page,mporei na blepei ta secrets opoiosdipote!
  User.find({"secret": {$ne: null}}, function (err, foundUsers){  // we use this model kai entopizoume opoio field me to onoma secret exei value
    if (err){                                           // me to {$ne: null}} simenei pou den einai miden petixenoume ton stoxo mas
      console.log();
    } else {
      if (foundUsers){                                   // ena vroume tous tous pigenoume sto "secrets"
        res.render("secrets", {userWithSecrets: foundUsers}); //vazoume to variable userWithSecrets kai pername san value tous foundUsers wste na tous deixnoume
      }                                                        // sto ejs file kai na fainontai ta secrets me tin xrisi tou forEach loop.
    }
  });
});


app.get("/submit" ,function (req, res){       //an o user einai authenticated mporei na dei to submit page,alliws tous stelnoume sto login gia na sinde8oun!
   if (req.isAuthenticated()){
     res.render("submit");
   } else {
     res.redirect("/login");
   }
});

app.post("/submit",function (req, res){    //mporoume na kanoume submit gt exoume idi etoiamasi to submit form  me to method kai to submit button sto antistoixo ejs file.
  const submittedSecret = req.body.secret; // xrisimopoioume to bodyParser gia na matcharoyme auta ta duo me to "secret" pou einai to name sto form tou submit.ejs
                                           //to passport saves ta user details into the request variable it helps us a lot!
  console.log(req.user.id);

  User.findById(req.user.id, function (err, foundUser){  // edw xrisimopoioume to user model gia na briskoume osous user exoun kanei submit kapoio secret.
    if (err) {
      console.log (err);
    } else {                                            // ean broume foundUser then we are going to set the foundUser.secret = submittedSecret;
      if (foundUser) {
        foundUser.secret = submittedSecret;            // 8a ton kanoume save me to updated secret tou
        foundUser.save(function(){
          res.redirect("/secrets");                   //meta 8a ton kanoume redirect gia na vlepei ta secret tou!
        });
      }
    }
  });
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
