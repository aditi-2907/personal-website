import express from "express";
import pg from "pg";
import passport from "passport";
import {Strategy} from "passport-local";
import session from "express-session";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import 'dotenv/config';

const port=3000;

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
    password: "1234qwer",
    port: 5432
});
db.connect();

app.get("/",(req,res)=>{
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
            //Error with password check
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              //Passed password check
              return cb(null, user);
            } else {
              //Did not pass password check
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
  
passport.serializeUser((user, cb) => {
    cb(null, user);
});
passport.deserializeUser((user, cb) => {
    cb(null, user);
});
app.listen(port,()=>{
    console.log(`server running on port ${port}`);
})