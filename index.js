import express from "express";
import pg from "pg";
import passport from "passport";
import {Strategy} from "passport-local";
import session from "express-session";
import bcrypt, { compareSync } from "bcrypt";
import bodyParser from "body-parser";
import 'dotenv/config';

const port=3000;
var count=-1;
var score=0;

var questions= [
  {q: "What was Aditi's age when she met Aayush?", o1: "19", o2:"18", o3:"17", o4:"16"},
  {q: "When was our first trip?", o1: "2023", o2:"2022", o3:"2021", o4:"2020"},
  {q: "When is Aditi's mom's birthday?", o1: "6 Dec", o2:"29 July", o3:"14 Jan", o4:"15 Feb"},
  {q: "Song we had sex on?", o1: "Tere bina", o2:"All I Want", o3:"Zara Zara", o4:"Thousand years"},
  {q: "Aditi's favourite Chocolate?", o1: "Silk Bubbli", o2:"Silk Mousse", o3:"Kitkat", o4:"Silk Ganache"},
  {q: "Aditi likes Aayush most in?", o1: "black kurta", o2:"black shirt", o3:"shirtless", o4:"pathani"},
  {q: "What Aditi enjoys the most?", o1: "Visiting new cafes", o2:"travelling", o3:"Concert", o4:"watching Movies"},
  {q: "Our song?", o1: "Tere Hawale", o2:"Ve Haniya", o3:"Tere bina", o4:"Uska hi banana"},
  // {q: "", o1: "", o2:"", o3:"", o4:""},
  // {q: "", o1: "", o2:"", o3:"", o4:""}
]

var size=questions.length;

const app=express();
app.use(express.static("public"));

app.use(bodyParser.urlencoded({extended:true}));

console.log(process.env.secret);
app.use(
    session({
      secret: process.env.secret,
      resave: false,
      saveUninitialized: true,
    })
);

app.use(passport.initialize());
app.use(passport.session());

const db= new pg.Client({
    user: "postgres",
    host: "localhost",  
    database: "Aayush",
    password: "Aditi123*",
    port: 5432 
});
db.connect();

app.get("/",(req,res)=>{
  score=0;
  count=-1;
    if(req.isAuthenticated()){
        res.render("index.ejs", {name: req.user.name});
    }
    else res.render("index.ejs");
})

app.get("/login",(req,res)=>{
    res.render("login.ejs");
})

app.get("/register",(req,res)=>{
    res.render("register.ejs");
})

app.post("/register", async (req,res)=>{
    const name=req.body.name;
    const password=req.body.password;

    console.log(name);
    console.log(password);

    try{ 
        const result = await db.query("SELECT * FROM users WHERE name = $1", [name,]);
        if(result.rows.length>0){
            res.send("Email already exists");           
        }
        else{
            console.log(2);
            bcrypt.hash(password,10, async (err,hash)=>{
                if(err){
                    console.log(err);
                    res.redirect("/");
                }
                else{
                    await db.query("Insert into users (name,password) values ($1,$2)", [name,hash]);
                    res.redirect("/login");
                }
            })
        }
    }
    catch(err){
        console.log(err);
        res.redirect("/");
    }

})
app.post("/login", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/login",
  })
);
passport.use(
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE name = $1 ", [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              return cb(null, user);
            } else {
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found");
      }
    } catch (err) {
      console.log(err);
    }
  })
);

app.get("/quiz",(req,res)=>{
  count++;
  if(count==size){
    res.redirect("/last");
  }
  else{
    res.render("quiz.ejs",{count:count, questions:questions});
  }
})

app.get("/last",(req,res)=>{
  res.render("last-page.ejs",{score:score});
})
  
app.post("/check",async (req,res)=>{
  const selected=req.body.selectedOption;
  const result = await db.query("SELECT * FROM answers WHERE id= $1", [count,]);
  if(result.rows.length>0){
    if(selected == result.rows[0].ans){
      score++;
      res.render("result.ejs", {isCorrect:1});
    }
    else{
      res.render("result.ejs", {isCorrect:0});
    }
  }
})

passport.serializeUser((user, cb) => {
    cb(null, user);
});
passport.deserializeUser((user, cb) => {
    cb(null, user);
});
app.listen(port,()=>{
    console.log(`server running on port ${port}`);
})