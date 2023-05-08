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

function formatDescription(description) {
    const BULLET = '•';
    const INDENTATION = '    '; // four spaces
    let formattedDescription = '';
  
    // Split the description string into an array of lines
    let lines = description.split('\n');
  
    // Loop through each line and check if it starts with a bullet point
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (line.trim().startsWith(BULLET)) {
        // Calculate the level of indentation based on the position of the bullet point
        let indentLevel = (line.indexOf(BULLET) / 2) + 1;
        let indentation = INDENTATION.repeat(indentLevel);
  
        // Replace the bullet point with the appropriate indentation
        let formattedLine = line.replace(BULLET, indentation);
  
        // Append the formatted line to the formatted description string
        formattedDescription += formattedLine + '\n';
      } else {
        // Append non-bullet lines to the formatted description string
        formattedDescription += line + '\n';
      }
    }
  
    return formattedDescription;
  }


app.get('/job/:id', async(req, res) => {

    try {
        const id = req.params.id;
        let job = await getJobById(id);
        console.log("description before: ",  job["description"]);
        let desc = job["description"];
        console.log("description after: : ", desc);
        res.render('pages/job', {job, desc});
        
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
