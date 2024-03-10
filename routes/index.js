var express = require('express');
var router = express.Router();
var userModel = require('./users');
var postModel = require('./post')
var passport = require('passport');
var localStrategy = require('passport-local');
const upload = require('./multer');

passport.use(new localStrategy(userModel.authenticate()));

router.get('/', function(req, res, next) {
  res.render('index', {nav: false, error: req.flash("error")});
});
router.get('/registor', function(req, res, next) {
  res.render('registor', {nav:false});
});
router.get('/profile', isLoggedIn, async function(req, res, next) {
  const user = await userModel
  .findOne({username: req.session.passport.user})
   .populate("posts");
  res.render("profile", {user,nav: true});
});

router.get('/add', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  res.render("add", {user,nav:false});
});

router.get('/show/posts', isLoggedIn, async function(req, res, next) {
  const user = await userModel
  .findOne({username: req.session.passport.user})
  .populate("posts");
  
  res.render("show", {user,nav:true});
});
router.get('/feed', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  const posts = await postModel.find().populate('user');
  
  
  res.render("feed", {user,posts,nav:true});
});


router.post('/createpost', isLoggedIn, upload.single("postimage"), async function(req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const post = await postModel.create({
      user: user._id,
      title: req.body.title,
      description: req.body.description,
      image: req.file.filename
    });
    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
  } catch (error) {
    // Handle error appropriately
    next(error);
  }
});

 
router.post('/fileupload', isLoggedIn, upload.single("image"), async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  user.profileImage = req.file.filename;
  await user.save();
  res.redirect('/profile');

});
router.post('/registor', function(req, res, next) {
  const user = new userModel({
    username: req.body.username,
    email:req.body.email,
    contact:req.body.contact,
  })
  userModel.register(user, req.body.password)
  .then(function(registorData){
    passport.authenticate("local")( req,res, function(){
      res.redirect('/profile');
    })
  })
});
router.post('/login',passport.authenticate("local", {
  failureRedirect: "/",
  successRedirect:"/profile",
  failureFlash: true,
   
}), function(req, res, next) {
});

router.get("logout", function(req,res,next){
   
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });
router.get('/logout', (req, res,next) => {

  req.logOut(function(err){
    if(err){
      return next(err);
    }
    res.redirect('/');
  })
    // req.session.destroy((err) => {
    //   if (err) {
    //     console.error('Error destroying session:', err);
    //     return res.status(500).send('Internal Server Error');
    //   }
    //   console.log("User succesfully logout")
    //   res.redirect('/');
    // });
  });

function isLoggedIn(req,res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/");
}


module.exports = router;
