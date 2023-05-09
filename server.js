const express = require('express');

const fs = require('fs');

const app = express();

const axios = require('axios');

const Jobs = require('./models/jobs');



let job_results;


async function getJobById(id) {
    for (let i = 0; i < job_results.length; i++) {

        if (job_results[i]['job_id'] == id) {
            return job_results[i];
        }
    }
}

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
        
        job_results = jobs['jobs_results']; // job['related_links'][0]['link]
        console.log("job results: ", job_results[0]);

        res.render('pages/results', {job_results});

    } catch(error) {
        
        res.status(500).send("Error while fetching");
    }
    
});

// parse text to list of strings 
function formatDescription(desc) {
    try {
      desc = desc.split("•");
      return desc; // a list
    } catch(error) {
      console.log(error);
    }
  }

app.get('/job/:id', async(req, res) => {

    try {
        const id = req.params.id;
        let job = await getJobById(id);
        let desc = job["description"];
        let desc_converted = formatDescription(desc);

        res.render('pages/job', {job, desc_converted});
        
    } catch (error) {
        console.log(error);
        res.send("Error while fetching");
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



  
const port = 8000;
app.listen(port);

console.log("listening to port: http://localhost:"+port);
