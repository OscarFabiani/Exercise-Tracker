const express = require('express')
const mongoose = require('mongoose')
const app = express()
const bodyParser = require('body-parser')


//CHANGE TO EXPRESS AND TEST
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


process.env.MONGO_URI = 'mongodb+srv://spartan539:popcorn1@cluster0-m1tag.mongodb.net/test?retryWrites=true&w=majority';


mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercise-track', { useNewUrlParser: true } )
//NOTE: Including { useNewUrlParser: true } avoids a deprecation warning


//Serving static assets from public folder
app.use(express.static('public'));

//Serving HTML file to root
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


var userSchema = {
  username: {type: String, required: true},
  count: {type: Number, default: 0},
  log: []
};

var User = mongoose.model('User', userSchema);


app.route('/api/exercise/new-user')
.post(function(req, res) {
  console.log(req.body.username);
  var username = req.body.username;
  new User({username: username})
  .save(function(err,  newUser) {
    if (err) {console.log(err)};
    res.json({username: username});
  });
});


app.route('/api/exercise/users')
.get(function(req, res) {
  User.find(function(err, users) {
    if (err) console.log(err);
    console.log('users:');
    console.log(users);
    res.json(users);
  })
});


//KEEP WORKING ON THIS, MAYBE USE NESTED SCHEMA FOR VALIDATION AND SUCH
app.route('/api/exercise/add')
.post(function(req, res) {
  console.log(req.body);
  var username = req.body.username;
  var desc = req.body.description;
  var dur = req.body.duration;
  var date = req.body.date;
  //MAYBE CHANGE TO FINDONEANDUPDATE()
  User.findOne({username: username}, function(err, user) {
    if (err) console.log(err);
    if (!username) {res.json({error: 'username required'})}
    else if (!user) {res.json({error: 'no such user'})}
    else if (!desc) {res.json({error: 'description required'})}
    else if (!dur) {res.json({error: 'duration required'})}
    else if (isNaN(dur)) {res.json({error: 'duration must be a number'})}
    else {
      user.log.push({
        description: desc,
        duration: dur
      });
      user.count += 1;
      user.save(function(err, updatedUser) {
        if (err) {console.log(err)};
        console.log('updatedUser');
        console.log(updatedUser)
        res.json({
          username: username,
          description: desc,
          duration: dur
        });
      });
    };
  });
});


app.route('/api/exercise/log')
.get(function(req, res) {
  var username = req.query.username;
  console.log(username);
  User.findOne({username: username}, function(err, user) {
    if (err) console.log(err);
    if (!user) {res.json({error: 'no such user'})}
    else {
      res.json(user);
    }
  })
});


// Custom 404 response middleware for all wrong routes
app.use(function(req, res){

  //sets the status of the response to 404
  res.status(404);

  //sends a response indicating 404 
  res.send('Whoops! The page you requested was not found (404).');
});


// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})



const listener = app.listen(3000, () => {
  console.log('App listening on port ' + listener.address().port)
})



//ADD COMMENTS FOR ROUTES
//POSSIBLY CONVERT MANUAL FORM VERIFICATION IN /API/EXERCISE/ADD ROUTE TO NESTED SCHEMA
//POSSIBLY REWORK HTML AND CSS