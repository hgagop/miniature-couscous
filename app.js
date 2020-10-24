// Express
const express = require('express'),
app           = express();

// Body-Parser
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

// Mongoose
const mongoose = require('mongoose');
mongoose.connect('database', {
  useNewUrlParser: true,
  useCreateIndex: true
})
.then(() => console.log('Connected to DB!'))
.catch(error => console.log(error.message));

// EJS
app.set('view engine', 'ejs');

// Method-Override
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// Express-Sanitizer
const expressSanitizer = require('express-sanitizer');
app.use(expressSanitizer());

// Express
app.use(express.static('public'));

// Mongoose Schema
const wineSchema = new mongoose.Schema({
    name: String,
    location: String,
    quantity: Number,
    type: String,
    rating: {type: String, default: '0/0'},
    uploaded: {type: Date, default: Date.now}
});
const Wine = mongoose.model('Wine', wineSchema);

// Auth Setup
// Passport
const passport        = require("passport"),
User                  = require("./models/user"),
LocalStrategy         = require("passport-local"),
passportLocalMongoose = require("passport-local-mongoose")

app.use(require("express-session")({
    secret: "Inventory app",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ROUTES

app.get('/', function(req, res) {
    res.redirect('/login');
});

app.get('/login', function(req, res) {
    res.render('login');
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/inventory',
    failureRedirect: '/'
}), function(req, res) {});

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/'); 
 });

app.get('/inventory', isLoggedIn, function(req, res) {
    Wine.find({}, function(err, allWines) {
        if(err) {
            res.redirect('/')
        } else {
            res.render('index', {wines: allWines});
        }
    });
});

app.get('/inventory/results', isLoggedIn, function(req, res) {
    Wine.find({$or: [{name: {$regex: req.query.name}}, {type: {$regex: req.query.name}}, {location: {$regex: req.query.name}}]}, function(err, foundWines) {
        if(err) {
            res.redirect('/');
        } else {
            res.render('results', {foundWines: foundWines});
        }
    });
});

app.get('/inventory/add', isLoggedIn, function(req, res) {
    res.render('add');
});

app.post('/inventory', isLoggedIn, function(req, res) {
    req.body.wine.body = req.sanitize(req.body.wine.body);
    Wine.create(req.body.wine, function(err, newWine) {
        if(err) {
            res.redirect('/inventory/add');
        } else {
            res.redirect('/inventory');
        }
    });
});

app.delete('/inventory/:id', isLoggedIn, function(req, res) {
    Wine.findByIdAndRemove(req.params.id, function(err) {
        if(err) {
            res.redirect('/inventory');
        } else {
            res.redirect('/inventory');
        }
    });
});

app.get('/inventory/:id/edit', isLoggedIn, function(req, res) {
    Wine.findById(req.params.id, function(err, foundWine) {
        if(err) {
            res.redirect('/');
        } else {
            res.render('edit', {wine: foundWine});
        }
    });
});

app.put('/inventory/:id', isLoggedIn, function(req, res) {
    req.body.wine.body = req.sanitize(req.body.wine.body);
    Wine.findByIdAndUpdate(req.params.id, req.body.wine, function(err, updatedWine) {
        if(err) {
            res.redirect('/');
        } else {
            res.redirect('/inventory/' + req.params.id);
        }
    });
});

app.get('/inventory/:id', isLoggedIn, function(req, res) {
    Wine.findById(req.params.id, function(err, foundWine) {
        if(err) {
            res.redirect('/');
        } else {
            res.render('show', {Wine: foundWine});
        }
    });
});

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()){
        return next();
    } res.redirect('login');
}


app.listen(process.env.PORT || 3000, function() {
    console.log('Connected to db')
});