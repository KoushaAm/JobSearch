const express = require('express');

const app = express();


// set the view engine to ejs
app.set('view engine', 'ejs');


//index page 
app.get('/', function(req, res) {
    try {
        res.render('pages/index');
    } catch (error){
        console.log(error);
        res.send("Error while fetching");
    }
    
});

// about page
app.get('/about', function(req, res) {
    res.render('pages/about');
});
  
app.listen(8080);

console.log("listening to port: http://localhost:"+"8080");