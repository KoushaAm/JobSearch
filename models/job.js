class Job {
    constructor(title, company_name, location, via, description, job_highlights, related_links, thumbnail, extensions, detected_extensions, job_id) {
      this.title = title;
      this.company_name = company_name;
      this.location = location;
      this.via = via;
      this.description = description;
      this.job_highlights = job_highlights;
      this.related_links = related_links;
      this.thumbnail = thumbnail;
      this.extensions = extensions;
      this.detected_extensions = detected_extensions;
      this.job_id = job_id;
    }
  }
  
module.exports = Job;