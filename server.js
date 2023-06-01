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
async function getJobById(id, results) {

    // get the saved jobs in data base
    const userSnapshot = await db.ref('Users/' + user.username).once('value');
    const userData = userSnapshot.val();
    // get the jobs
    const jobs = userData.jobs;
    if (jobs)  {
        const jobArray = Object.values(jobs);
        console.log("job array: ", jobArray);
        // join the job results with the saved jobs
        if (results != undefined) {
            results = results.concat(jobArray);
            console.log("job results: ", job_results);
        } else [
            results = jobArray
        ]
    }




    for (let i = 0; i < results.length; i++) {

        if (results[i]['job_id'] == id) {
            console.log(results[i]['title']);
            return results[i];
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
    // console.log("description: ", desc);

    // check if the desc is already processed into a list
    if (typeof desc == "string") {
        try {
            desc = desc.split("•");
            return desc; // a list
          } catch(error) {
            console.log(error);
            return ["description not available"]
          }
    } else {
        return desc; 
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
        // if job title contains "/" replace it with "-"
        // for some reason parsing the titles containing "/" in database  generates problem while fetching
        if (job['title'].includes("/")) {
            job['title'] = job['title'].replace("/", " ");
        }

        // job['job_id'] = job['job_id'].substring(job['job_id'].length - 10);
        job_object = new Job(job['title'], job['company_name'], job['location'], job['via'], formatDescription(job['description']),
         job['job_highlights'], job['related_links'], thumbnail, job['extensions'], job['detected_extensions'], job['job_id'])
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
        
        job_results = jobs['jobs_results']; 
        // console.log(" ")
        for (let i = 0; i < job_results.length; i++) {
            job_results[i]['job_id'] = job_results[i]['job_id'].substring(40, 100);
        }
        

        // for(let x= 0; x < job_results.length; x++) {
        //     console.log(job_results[x]['job_id']);
        // }
        //console.log("job results: ", job_results[5]);

        res.render('pages/results', {job_results, user, title, location});

    } catch(error) {
        
        res.status(500).send("Error while fetching");
    }
    
});



app.get('/job/:id', async(req, res) => {
    try {
        const id = req.params.id;
        console.log("id: ", id)
        let job = await getJobById(id, job_results);
        console.log("job: ", job['title']);        
        let desc = job["description"];
        let desc_converted = formatDescription(desc);
        job_object = await parseJobtoObject(job);
        //await console.log("job object: ", job_object);
        job_thread.push(job_object);
        // console.log("job thread: ", job_thread);

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
const job = require('./models/job');

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
            // console.log("stored location: ", storedLocation);

            const storedProfession = userData.profession;
            // console.log("stored profession: ", storedProfession);

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
    
        // console.log("Username:", username);
        // console.log("Password:", password);

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

            // console.log("new user added to database");
        

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
    const title = req.body.title; 
    const company_name = req.body.company_name; 
    const location = req.body.location; 

    // Get the job object from the job thread
    const newJob = lookUpInJobThread(title, company_name, location); 
    // Reference to the current user in the database
    const userRef = db.ref('Users/' + user.username); 

    // Fetch the user's current list of saved jobs
    const userSnapshot = await userRef.once('value');
    const userData = userSnapshot.val();

    // If the user exists in the database
    if (userData) {
      const jobsListRef = userRef.child('jobs'); // Reference to the jobs list of the user
      
      const jobRef = jobsListRef.child(newJob.job_id); // Reference to the specific job in the jobs list

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

      await jobRef.set(jobData);

      res.sendStatus(200); 
    } else {
      res.sendStatus(404); 
    }
  } catch (error) {
    console.error('Error saving job:', error);
    // Send an internal server error response
    res.sendStatus(500); 
  }
});


app.post('/myAccount', async (req, res) => {

    try {

        // get the saved jobs in data base
        const userSnapshot = await db.ref('Users/' + user.username).once('value');
        const userData = userSnapshot.val();
        // get the jobs
        const jobs = userData.jobs;
        if (jobs)  {
            const jobArray = Object.values(jobs);
            
            res.render('pages/myAccount', {user, jobArray});
        } else {
            const jobArray = [];
            res.render('pages/myAccount', {user, jobArray});
        }
        

    } catch (error) {
        console.log(error);
        res.send("error while fetching");
    }
});

app.post('/delete-job', async (req, res) => {
    try {
        const jobId = req.body.jobId;
        // console.log("to delete job: ", jobId);
        const userRef = db.ref('Users/' + user.username); 
        const jobsListRef = userRef.child('jobs'); 
        const jobRef = jobsListRef.child(jobId); 

        // Remove the job from the database
        await jobRef.remove();
        // sucess
        res.sendStatus(200); 
    } catch (error) {
        console.error('Error deleting job:', error);
        res.sendStatus(500); 
    }
});
  





const port = 8000;
app.listen(port);

console.log("listening to port: http://localhost:"+port);
