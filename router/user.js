const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const { ensureAuthenticated } = require("../config/auth");

//User Model
const User = require("../models/user");

//Task model
const Task = require("../models/task");

router.get("/", (req, res) => {
  res.render("home", { pageTitle: "Taskify" });
});

router.get("/signup", (req, res) => {
  res.render("signup", { pageTitle: "Taskify | Sign Up" });
});

router.get("/login", (req, res) => {
  res.render("login", { pageTitle: "Taskify | Login" });
});

router.get("/dashboard", ensureAuthenticated, async (req, res) => {
  try {
    const userTasks = await Task.find({ userId: req.user._id });

    res.render("dashboard", {
      pageTitle: "Taskify | Dashboard",
      user: req.user,
      tasks: userTasks,
    });
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    req.flash("error", "Failed to fetch tasks");
    res.redirect("/dashboard");
  }
});

router.get("/addtask", ensureAuthenticated, (req, res) => {
  res.render("addtask", { pageTitle: "Taskify | Add Task" });
});

router.get("/edit-task", ensureAuthenticated, async (req, res) => {
  const taskId = req.query.taskId;

  try {
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).render("error", { message: "Task not found" });
    }

    res.render("edittask", { task, pageTitle: "Taskify | Edit Task" });
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
});

//Register Handle
router.post("/signup", (req, res) => {
  const { name, email, password } = req.body;
  let errors = [];

  //check required fields
  if (!name || !email || !password) {
    errors.push({ msg: "Please fill in all fields" });
  }

  //Check pass length
  if (password.length < 8) {
    errors.push({ msg: "Password should be at least 8 characters" });
  }

  if (errors.length > 0) {
    res.render("signup", {
      pageTitle: "Taskify | Sign Up",
      errors,
      name,
      email,
      password,
    });
  } else {
    //Validation passed
    User.findOne({ email: email }).then((user) => {
      if (user) {
        //User Exists
        errors.push({ msg: "Email is Already registered" });
        res.render("signup", {
          pageTitle: "Taskify | Sign Up",
          errors,
          name,
          email,
          password,
        });
      } else {
        const newUser = new User({
          name,
          email,
          password,
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            // Set password to hashed
            newUser.password = hash;

            // Save user
            newUser
              .save()
              .then((user) => {
                req.flash("success_msg", "You are now register !");
                res.redirect("/login");
              })
              .catch((err) => console.log(err));
          });
        });
      }
    });
  }
});

//Create Task
router.post("/addtask", ensureAuthenticated, async (req, res) => {
  try {
    const { name, description, priority, category, status, date, note } = req.body;

    const userId = req.user._id;

    const newTask = new Task({ userId, name, description, priority, category, status, date, note });

    await newTask.save();

    req.flash("success_msg", "Task added successfully");
    res.redirect("/dashboard");
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to add task");
    res.redirect("/addtask");
  }
});

//Update Task
router.post("/edit-task", async (req, res) => {
  try {
    const { name, description, priority, category, status, date, note } = req.body;
    const taskId = req.body.taskId;

    const updatedTask = await Task.findByIdAndUpdate(taskId, { name, description, priority, category, status, date, note }, { new: true });

    if (!updatedTask) {
      return res.status(404).render("error", { message: "Task not found" });
    }

    req.flash("success_msg", "Task updated successfully");
    res.redirect("/dashboard");
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to update task");
    res.redirect("/dashboard");
  }
});

// Delete Task
router.get("/delete-task/:taskId", ensureAuthenticated, async (req, res) => {
  try {
    const taskId = req.params.taskId;

    const result = await Task.findByIdAndDelete(taskId);

    if (result) {
      req.flash("success_msg", "Task deleted successfully");
    } else {
      req.flash("error", "Task not found");
    }

    res.redirect("/dashboard");
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to delete task");
    res.redirect("/dashboard");
  }
});

//Login Handle
router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true,
  })(req, res, next);
});

//Logout Handle
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
    }
    req.flash("success_msg", "You are logged out!");
    res.redirect("/login");
  });
});

module.exports = router;
