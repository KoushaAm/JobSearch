const express = require('express');

const fs = require('fs');

const app = express();

const axios = require('axios');

const Jobs = require('./models/jobs');

const User = require('./models/user');
const Job = require('./models/job');

// body parser for the query of signup / login page
const bodyParser = require('body-parser'); 
app.use(bodyParser.urlencoded({ extended: true })); 


let user = new User("username", "password");



let job_results;



// set the view engine to ejs
app.set('view engine', 'ejs');


//index page 
app.get('/', function(req, res) {
    try {
        res.render('pages/signup');
    } catch (error){
        console.log(error);
        res.send("Error while fetching");
    }
    
});


app.get('/index', function(req, res) {
    try {
        res.render('pages/index', {user});
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
        //console.log("job results: ", job_results[0]);

        res.render('pages/results', {job_results, user});

    } catch(error) {
        
        res.status(500).send("Error while fetching");
    }
    
});



app.get('/job/:id', async(req, res) => {

    try {
        const id = req.params.id;
        let job = await getJobById(id);
        let desc = job["description"];
        let desc_converted = formatDescription(desc);

        res.render('pages/job', {job, desc_converted, user});
        
    } catch (error) {  
        console.log(error);
        res.send("Error while fetching");
    }
});


// about page
app.get('/about', function(req, res) {
    fs.readFile('about.txt', 'utf8', (err, data) => {
        try {
            res.render('pages/about', { text: data , user: user});
        } catch (error) {
            console.log(error);
        }
        
      });
});


// DATA BASE
// Initialize Firebase Admin SDK using your service account credentials
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://jobsearchdatabase-b4821-default-rtdb.firebaseio.com"
               
});

// Get a Firestore instance from the admin SDK
const db = admin.database();




app.get("/login", async(req, res) => {
    try {

        res.render('pages/login');

    } catch(error) {
        
        res.status(500).send("Error while fetching");
    }
});

app.post("/login", async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;
        // Retrieve the user data from the database
        const userSnapshot = await db.ref('Users/' + username).once('value');
        const userData = userSnapshot.val();

        if (userData) {

            const storedPassword = userData.password;

            if (password === storedPassword) {
                user = new User(username, password);
                res.render('pages/index', { user: userData });
            } else {
                res.send("Invalid username or password");
            }
            } else {
            // User doesn't exist in the database
            res.send("Invalid username or password");
        }

    } catch (error) {
        console.log(error);
        res.send("error while logging in");
    }
});

app.get('/signup', (req, res) => {
    res.render('pages/signup');
});


app.post("/signup", async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;
    
        console.log("Username:", username);
        console.log("Password:", password);

        const userSnapshot = await db.ref('Users/' + username).once('value');
        const userData = userSnapshot.val();


        if (userData) {

            const storedPassword = userData.password;

            if (password === storedPassword) {
                res.send("User already exists");
            } else {
                
                user = new User(username, password);
                await db.ref('Users/' + username).set({
                    username: username,
                    password: password
                });

                console.log("new user added to database");
                user = new User(username, password);

                res.render('pages/index', {user});
            }
            
        }
  
    } catch (error) {
      console.log(error);
      res.send("error while signing up");
    }
  });


  


// ***************************************** HELPER FUNCTIONS *****************************************

// get job by id FROM THE FETCHED JOB_RESULTS
async function getJobById(id) {
    for (let i = 0; i < job_results.length; i++) {

        if (job_results[i]['job_id'] == id) {
            return job_results[i];
        }
    }
}

// parse text to list of strings 
function formatDescription(desc) {
    try {
      desc = desc.split("•");
      return desc; // a list
    } catch(error) {
      console.log(error);
      return ["description not available"]
    }
}


const port = 8000;
app.listen(port);

console.log("listening to port: http://localhost:"+port);
