//jshint esversion:6
require("dotenv").config();
const express = require ("express");
const bodyParser = require ("body-parser");
const ejs = require ("ejs");
const mongoose = require ("mongoose");
//const encrypt = require ("mongoose-encryption"); //aparaitito for using encryption after we installed our npm package -----to // otan ekana to hashin passwords
//const md5 = require ("md5"); to afairoume kai vazoume sti 8esi tou to bcrypt sto level 4 afou exei ginei to install package
const bcrypt = require ("bcrypt"); // aparaitito gia na enable to bcryot
const saltRounds = 10; // pososus gurous salt 8eloume



const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({ extended: true }));


//console.log(process.env.API_KEY);

mongoose.connect("mongodb://localhost:27017/userDB");

/////////////////////////////////////////MONGOOSE SCHEMA &CONST FOR ENCRYPTUION AND MODEL//////////////////////////////////////////////
const userSchema = new mongoose.Schema ({    //alla3ame to schema mas kai to kaname new mongoose Schema,pleon dn einai ena aplo js object,einai ena object poy
email: String,                               // dimiourgi8ike apo to mongoose schema class
password: String
});

  //const secret = "Thisisourlittlesecret." ;  //EINAI STO .ENV FILE FOR SAFETY REASONS

                                                // xrisimopoioume to convenience method,we define a const pou ousiastika einai ena long string kai sti sinexeia
                                              // to xrisimopoioume gia na kanoume encrypt to database mas!



//to // otan ekana to hasing passwords
//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]}); //simantniko na ftia3oume to plugin sto userschema mas prin kataskeuasoume
                                               // to model mas because pername to user schema mas as a parameter sto mongoose model mas
                                               //to plugins einai extra bits of packaged code that you can add sto mongoose schemas gia na kaneis extend to functionality
                                               // i na tous dwseis parapano powers esentialy.

const User = new mongoose.model("User",userSchema);


app.get("/",function(req, res){
  res.render("home");
});

app.get("/login",function(req, res){
  res.render("login");
});

app.get("/register",function (req, res){
  res.render("register");
});


app.post("/register",function (req,res){

  bcrypt.hash(req.body.password, saltRounds, function( err,hash) { // balame mesa edw to bcryt.has wste to salting na ginetai kata thn egrafi tou user stin arxi tis diadikasias
    const newUser = new User ({
      email:req.body.username,      //// to bodyParser edw apeu8unetai sto name="username" sto input type sto register.ejs
      password: hash   //// to bodyParser edw apeu8unetai sto name ="password" sto input type sto register.ejs // evala to md5() sto hashin passwords
    });                                 //// so that i could turn it into an irreversible hash.
                                        // edw antikatastisame to md5(req.body.password) me to hash pou dimiourgeitai stin arxi toy register!
    newUser.save(function(err){   ////  kanoume save ton neo user pou dimiourgisame apo panw,an exei error consolaroume to error na to dior8wsoume
      if (err){                   ////  an ola einai ok mas metaferei me to res.render sto  secrets.ejs file
        console.log(err);
      } else {
        res.render("secrets")
      }
    });
  });
  });


//   const newUser = new User ({
//     email:req.body.username,      //// to bodyParser edw apeu8unetai sto name="username" sto input type sto register.ejs
//     password:md5(req.body.password)   //// to bodyParser edw apeu8unetai sto name ="password" sto input type sto register.ejs // evala to md5() sto hashin passwords
//   });                                 //// so that i could turn it into an irreversible hash.
//
//   newUser.save(function(err){   ////  kanoume save ton neo user pou dimiourgisame apo panw,an exei error consolaroume to error na to dior8wsoume
//     if (err){                   ////  an ola einai ok mas metaferei me to res.render sto  secrets.ejs file
//       console.log(err);
//     } else {
//       res.render("secrets")
//     }
//   });                          //////metaferame apo panw mesa sto bcrypt.hash wste o neos user mas na dimioirgeitai mono meta apo to salting tou kwdikoy toy
// });


app.post("/login",function(req, res){     //here we check in our database  if we have a user with the credetials they put in.
  const username = req.body.username;     // credentials
  const password = req.body.password;    //bgazoume to md5 gia na valoume tobcrypt
  //const password = md5(req.body.password);     // credentials    those are the two things that we have to check to find out if the user is in our database so he can login
                                              // we put md5() and the hash here should match the hash of the code that the user registeredw!!!!
  User.findOne({email:username},function (err,foundUser){  //the email should be  matching with our username, the username comes from the user who is trying to log in
    if (err){                                              //the email field is the one in our database that got the saved data
      console.log(err);
    } else {
      if (foundUser) {                                    // ean uparxei enas user me auto to mail ,CHECHAROUME AN:
    bcrypt.compare(password, foundUser.password, function (err, result){    // edw to valame ws result gia na mi mperdeutei o kwdikas mas me to res pou exxoume pio panw
        if(result === true){
        res.render("secrets");
      }

    });
        //if (foundUser.password === password){             // o kwdikos pou exei matcharei me ton kwdiko pou o user evale sto login page
        //to apenergopoihsa gia na  to bcrypt
        //  res.render("secrets");    //                to metefera mesa sto bcrypt.compare
      }
    }
  });
});






















app.listen(3000,function(){
  console.log("Server started on port 3000.");
});
