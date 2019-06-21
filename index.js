const express = require('express')
const mongoose = require('mongoose')
const app = express()


app.use(express.urlencoded({extended: false}))
//app.use(express.json()) //This app doesn't seem to need this

//CHANGE PASSWORD
process.env.MONGO_URI = 'mongodb+srv://spartan539:password1@cluster0-m1tag.mongodb.net/test?retryWrites=true&w=majority';


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

  //variable for entered username
  var username = req.body.username;

  //checks if username was not entered
  if (!username) { res.json({ error: 'username required' }) }

  //checks if username is more than 20 characters
  else if (username.length > 20) { res.json({ error: 'username too long' }) }

  else {
    //checks if there is a document in the db collection with a matching username
    User.findOne({username: username}, function(err, foundUser) {
      if (err) { console.log(err) };

      //responds with an error if there is already a user document with the entered username
      if (foundUser) { res.json({ error: 'username taken' }) }
      else {

        //creates a new User document with entered username
        new User({ username: username })

        //saves new User document
        .save(function(err,  newUser) {
          if (err) {console.log(err)};
          console.log('new user created:');
          console.log(newUser);

          //json response
          res.json({username: username});
        });
      }
    })
  }
});


app.route('/api/exercise/users')
.get(function(req, res) {

  //gets an array of all User documents in the db collection
  User.find(function(err, users) {
    if (err) console.log(err);
    console.log('users:');
    console.log(users);

    //responds with json of all User documents
    res.json(users);
  })
});


app.route('/api/exercise/add')
.post(function(req, res) {

  //variables for form entries
  var username = req.body.username;
  var desc = req.body.description;
  var dur = req.body.duration;
  //var date = req.body.date; //not yet used

  //checks if there is document in the db collection with a matching username
  User.findOne({username: username}, function(err, user) {
    if (err) console.log(err);

    //checks if username was entered
    if (!username) {res.json({error: 'username required'})}
    //checks if no matching User document was found
    else if (!user) {res.json({error: 'no such user'})}
    //checks if description was entered
    else if (!desc) {res.json({error: 'description required'})}
    //checks if duration was entered
    else if (!dur) {res.json({error: 'duration required'})}
    //checks if duration is a number
    else if (isNaN(dur)) {res.json({error: 'duration must be a number'})}
    else {

      //pushes new object to user.log
      user.log.push({
        description: desc,
        duration: dur
      });

      //increments user.count
      user.count += 1;

      //saves user after changes
      user.save(function(err, updatedUser) {
        if (err) {console.log(err)};
        console.log('updatedUser');
        console.log(updatedUser)

        //responds with user and exercise JSON info
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

  //variable for username
  var username = req.query.username;
  console.log(username);

  //checks if there is document in the db collection with a matching username
  User.findOne({username: username}, function(err, user) {
    if (err) console.log(err);

    //checks if no matching User document was found
    if (!user) {res.json({error: 'no such user'})}
    else {

      //responds with User document JSON info
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


//EXPLORE THIS: HOW DOES IT WORK
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



//POSSIBLY CONVERT MANUAL FORM VERIFICATION IN /API/EXERCISE/ADD ROUTE TO NESTED SCHEMA
//POSSIBLY CONVERT OTHER MANUAL FORM VERIFICATIONS USING SCHEMA PROPERTY OPTIONS (MAX LENGTH, UNIQUE, ETC.)
//POSSIBLY REFINE JSON RESPONSES (USERS TO ONLY INCLUDE USERNAMES, ETC.)
//POSSIBLY ADD DATE FUNCTIONALITY
//POSSIBLY REWORK HTML AND CSS
