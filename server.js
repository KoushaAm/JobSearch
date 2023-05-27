const express = require('express');
const fs = require('fs');
const app = express();
const axios = require('axios');

// external methods/classes
const Jobs = require('./models/jobs');
const User = require('./models/user');
const Job = require('./models/job');


// body parser for the query of signup / login page
const bodyParser = require('body-parser'); 
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json());

// default username password for testing
let user;

// universal job_results for search
let job_results;

let job_object;

// job thread for saving jobs 
let job_thread = [];

// ***************************************** HELPER FUNCTIONS *****************************************


// get job by id FROM THE FETCHED JOB_RESULTS
async function getJobById(id) {
    for (let i = 0; i < job_results.length; i++) {

        if (job_results[i]['job_id'] == id) {
            return job_results[i];
        }
    }
}

// look up in job thread
function lookUpInJobThread(title, company_name, location) {
    for (let i = 0; i < job_thread.length; i++) {
        if (job_thread[i].title == title && job_thread[i].company_name == company_name && job_thread[i].location == location) {
            return job_thread[i];
        }
    }
    return null;
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


// constructor(title, company_name, location, via, description, job_highlights,
// related_links, thumbnail, extensions, detected_extensions, job_id) 
function parseJobtoObject(job) {
    try {

        // if thumbnail is not available, use a default one
        if (job['thumbnail'] == undefined) {
            thumbnail = "https://www.google.com/imgres?imgurl=https%3A%2F%2Fstatic.thenounproject.com%2Fpng%2F5015922-200.png&tbnid=zaqvSuzXdFz7aM&vet=12ahUKEwiZ1ZeX6JP_AhVkMDQIHd0lC0MQMygPegUIARD8AQ..i&imgrefurl=https%3A%2F%2Fthenounproject.com%2Ficon%2Fjob-5015922%2F&docid=NjTANQ3sNNjONM&w=200&h=200&q=job%20icon%20png&ved=2ahUKEwiZ1ZeX6JP_AhVkMDQIHd0lC0MQMygPegUIARD8AQ";
        } else {
            thumbnail = job['thumbnail'];
        }

        job_object = new Job(job['title'], job['company_name'], job['location'], job['via'], formatDescription(job['description']),
         job['job_highlights'], job['related_links'], thumbnail, job['extensions'], job['detected_extensions'], "123")
        return job_object;

    } catch(error) {
        console.log(error);
        return null;
    }
}

// ***************************************** END OF HELPER FUNCTIONS *****************************************




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

        if (title == undefined) {
            title = user.profession;
        }
        if (location == undefined) {
            console.log(location);
            location = user.location;
        }

        let jobs = await Jobs.collectJobs(title, location);
        
        job_results = jobs['jobs_results']; // job['related_links'][0]['link]
        //console.log("job results: ", job_results[5]);

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
        job_object = await parseJobtoObject(job);
        //await console.log("job object: ", job_object);
        job_thread.push(job_object);

        res.render('pages/job', {job, desc_converted, user, job_object});
        
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
            const storedLocation = userData.location;
            console.log("stored location: ", storedLocation);

            const storedProfession = userData.profession;
            console.log("stored profession: ", storedProfession);

            if (password === storedPassword) {
                user = new User(username, password, storedProfession, storedLocation);
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
        const profession = req.body.profession;
        const location = req.body.location;
        
        if (profession == undefined) {  
            profession = "";
        }

        if (location == undefined) {
            location = "";
        }
    
        console.log("Username:", username);
        console.log("Password:", password);

        const userSnapshot = await db.ref('Users/' + username).once('value');
        const userData = userSnapshot.val();

        if (userData) {
            res.send("Username already exists");
        } else {

            user = new User(username, password, profession, location);

            await db.ref('Users/' + username).set({
                username: username,
                password: password,
                location: location,
                profession: profession,
                jobs: []
            });

            console.log("new user added to database");
        

            res.render('pages/index', {user});
        }
                
  
    } catch (error) {
      console.log(error);
      res.send("error while signing up");
    }
  });

app.post('/logout', (req, res) => {
    user = null; 
    res.render('pages/login');
});


app.post('/savejob', async (req, res) => {
  try {
    const title = req.body.title; // Get the job title from the request body
    const company_name = req.body.company_name; // Get the company name from the request body
    const location = req.body.location; // Get the location from the request body

    const newJob = lookUpInJobThread(title, company_name, location); // Get the job object from the job thread
    const userRef = db.ref('Users/' + user.username); // Reference to the current user in the database

    // Fetch the user's current list of saved jobs
    const userSnapshot = await userRef.once('value');
    const userData = userSnapshot.val();

    // If the user exists in the database
    if (userData) {
      const jobsListRef = userRef.child('jobs'); // Reference to the jobs list of the user
      const jobRef = jobsListRef.child(title); // Reference to the specific job in the jobs list

      // Create a new job object with the desired properties
      const jobData = {
        title: newJob.title,
        company_name: newJob.company_name,
        location: newJob.location,
        via: newJob.via,
        description: newJob.description,
        job_highlights: newJob.job_highlights,
        related_links: newJob.related_links,
        thumbnail: newJob.thumbnail,
        extensions: newJob.extensions,
        detected_extensions: newJob.detected_extensions,
        job_id: newJob.job_id

      };

      // Set the new job reference with the title as the key to the jobs list
      await jobRef.set(jobData);

      res.sendStatus(200); // Send a success response
    } else {
      res.sendStatus(404); // Send a not found response if the user doesn't exist in the database
    }
  } catch (error) {
    console.error('Error saving job:', error);
    res.sendStatus(500); // Send an internal server error response
  }
});


app.post('/myAccount', async (req, res) => {

    try {

        // get the saved jobs in data base
        const userSnapshot = await db.ref('Users/' + user.username).once('value');
        const userData = userSnapshot.val();
        // get the jobs
        const jobs = userData.jobs;
        //console.log("jobs: ", jobs);
        console.log(typeof(jobs));
        

        res.render('pages/myAccount', {user, jobs});

    } catch (error) {
        console.log(error);
        res.send("error while fetching");
    }
});
  

  




const port = 8000;
app.listen(port);

console.log("listening to port: http://localhost:"+port);
