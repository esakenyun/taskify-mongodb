require("dotenv").config();
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const favicon = require("serve-favicon");
const mongoose = require("mongoose");
const router = require("./router/user");
const path = require("path");
const flash = require("connect-flash");
const passport = require("passport");

const app = express();
const PORT = 4000;

// Passport config
require("./config/passport")(passport);

//DB Config
const db = require("./config/keys").MongoURI;

//Connect to MongoDB
mongoose.connect(db);

//Settings View and Access Public
app.use(expressLayouts);
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(favicon(path.join(__dirname, "public", "favicon", "logo.ico")));
// BodyParser
app.use(express.urlencoded({ extended: false }));

//Express Session
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect Flash
app.use(flash());

// Global Vars
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

//Route
app.use(router);

app.use((req, res, next) => {
  res.render("error.ejs");
});

app.use((err, req, res, next) => {
  if (res.headersSend) {
    next("Already Header Send. There was a problem.");
  } else {
    if (err.message) {
      res.status(500).send(err.message);
    } else {
      res.send("There was wrong!");
    }
  }
});

module.exports = app;
