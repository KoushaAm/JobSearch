const express = require('express');

const fs = require('fs');

const app = express();

const axios = require('axios');

const dotenv = require('dotenv');
dotenv.config({path: './key.env'});


// load the key
const key = process.env.API_KEY;




// set the view engine to ejs
app.set('view engine', 'ejs');


async function getJobs() {
    try {
        response = await axios.get('https://serpapi.com/search.json?engine=google_jobs&q=accountant+vancouver&api_key=' + key + '&hl=en');
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

//index page 
app.get('/', function(req, res) {
    try {
        res.render('pages/index');
        getJobs();
    } catch (error){
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




  
const port = 8080;
app.listen(port);

console.log("listening to port: http://localhost:"+port);