const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const userSchema = new Schema({
  username: String,
});
const exerciseSchema = new Schema({
  description: String,
  duration: Number,
  date: String,
  userId: String,
});
let User = mongoose.model('User', userSchema);
let Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.route('/api/users').get(function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
}).post(function(req, res) {
  if (!req.body.username) {
    res.json({ error: 'username required' });
    return;
  }
  const user = new User({ username: req.body.username });
  user.save(function(err, data) {
    if (err) {
      res.json({ error: JSON.stringify(err) });
      return;
    }
    res.json({ username: data.username, _id: data._id });
  });
});

app.route('/api/users/:_id/exercises').post(function(req, res) {
  const exercise = new Exercise({
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date ? new Date(req.body.date).getTime() : new Date().getTime(),
    userId: req.params._id,
  });
  exercise.save(function(err, data) {
    if (err) {
      res.json({ error: JSON.stringify(err) });
      return;
    }
    res.json(data);
  });
});

app.route('/api/users/:_id/logs').get(function(req, res) {
  const chain = Exercise.find({ userId: req.params._id });
  if (req.query.from) {
    chain.and({ date: { $gte: new Date(req.query.from).getTime() } });
  }
  if (req.query.to) {
    chain.and({ date: { $lte: new Date(req.query.to).getTime() } });
  }
  if (req.query.limit) {
    chain.limit(req.query.limit);
  }
  chain.exec(function(err, logs) {
    if (err) {
      res.json({ error: JSON.stringify(err) });
      return;
    }
    res.json(logs);
  });
});

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
