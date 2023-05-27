class user {
    constructor(username, password, profession, location) {
        this.username = username;
        this.password = password;
        this.location = location; 
        this.profession = profession;
        this.jobs = [];
    }
}

module.exports = user;