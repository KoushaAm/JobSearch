const axios = require('axios');

const dotenv = require('dotenv');

dotenv.config({path: './key.env'});

// load the key
const key = process.env.API_KEY;


async function collectJobs(title, location) {
    try {
        response = await axios.get(`https://serpapi.com/search.json?engine=google_jobs&q=${title}+${location}&api_key=${key}&hl=en`);
        return response.data;
    } catch (error) {
        console.error(error);
    }
}


module.exports = {collectJobs};