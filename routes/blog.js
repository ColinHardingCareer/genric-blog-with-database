var express = require('express');
const session = require('express-session');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

    // Display the (static) landing page.
    res.redirect('./landing.html');
});

// Respond to a user login by storing the user's name
// and redirecting to the list of bloggers.
router.post('/login', function(req, res, next) {

    // Retrieve the username entered in the login form.
    // Redirect to login page if the username is missing or invalid (empty).
    let username = req.body.username;
    if (!username) {
	res.redirect('./');
	return;
    }

    // Add username to session
    req.session.username = username;

    // If username is new, add it to the blog data structure with
    // an empty list of entries. This might involve creating the
    // blog data structure.
    let app = req.app;
    let blog = app.locals.blog;
    if (!blog) {
	blog = new Map();
	app.locals.blog = blog;
    }
    if (!blog.has(username)) {
	blog.set(username, []);
    }

    // Display the list of usernames
    res.redirect('./list');

});



router.get('/list', function(req, res, next) {
const db = req.app.get('db');
    db.all(`SELECT DISTINCT blogger FROM entries WHERE blogger != '${req.session.username}' `,
	   (err, rows) => {
	       if (err) {
		   console.log(err);
		   next();
	       }
	       else {
		   //res.render('blog/page.ejs', {rows: rows, blogger: req.query.user, username: req.session.username});
           res.render('blog/usernames', {username: req.session.username,rows: rows});
	       }
	   }
	  );
    });
// Respond to user selecting a blogger with the appropriate blog page.

router.get('/logout', function(req, res, next) {

    // If the user was previously logged in, log them
    // out by removing the username from session.
    if (req.session.username) {
	delete req.session.username;
    }

    // Send them to the home page
    res.redirect('./');
});



/* POST to store an entry in the database. */
router.post('/new_entry', function(req, res, next) {
    const db = req.app.get('db')
    db.run("INSERT INTO entries VALUES (?,?,?)",
	   [ req.session.username,
		   req.body.entry,
	     Math.floor(Date.now()/1000) // Unix time in seconds
	   ], 
	   (err) => {
	       if (err) {
		   console.log(err)
		   next()
	       }
	       else {
		   res.redirect(`./page?user=${encodeURIComponent(req.session.username)}`)
	       }
	   }
	  ); 
});

router.get('/page', function(req, res, next) {
    const db = req.app.get('db')
    db.all(`SELECT * FROM entries WHERE blogger = '${req.query.user}' ORDER BY timestamp DESC`,
	   (err, rows) => {
	       if (err) {
		   console.log(err)
		   next()
	       }
	       else {
		   res.render('blog/page.ejs', {rows: rows, blogger: req.query.user, username: req.session.username})
	       }
	   }
	  );
});


module.exports = router;
