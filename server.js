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
        const data = [];
        res.render('pages/index', {data});
    } catch (error){
        console.log(error);
        res.send("Error while fetching");
    }
    
});

// wait for form submission
app.get('/search', async(req, res) => {

    try {
        const title = req.query.title;
        const location = req.query.location;

        let jobs = await Jobs.collectJobs(title, location);
        
        
        job_results = jobs['jobs_results'];

        // console.log(job_results);

        res.render('pages/results', {job_results});

    } catch(error) {
        res.status(500).send("Error while fetching");
    }
    
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
