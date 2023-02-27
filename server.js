const express = require('express');

const fs = require('fs');

const app = express();

const axios = require('axios');

const Jobs = require('./models/jobs');


let job_results; 


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

// wait for form submission
app.get('/search', async(req, res) => {

    const title = req.query.title;
    const location = req.query.location;

    // check to see title and location are recieved
    console.log(title);
    console.log(location);

    let jobs = await Jobs.collectJobs(title, location);
    
    job_results = jobs['jobs_results'];
    console.log(job_results)

   // res.render('pages/index', {job_results});
    
});




// about page
app.get('/about', function(req, res) {
    fs.readFile('about.txt', 'utf8', (err, data) => {
        try {
            res.render('pages/about', { text: data });
        } catch (error) {
            console.log(error);
        }
        
      });
});



  
const port = 8080;
app.listen(port);

console.log("listening to port: http://localhost:"+port);

