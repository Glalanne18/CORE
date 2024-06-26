const sql = require("mssql");

const jobQueries = {
  getJobs: async () => {
    try {
      const result = await sql.query(`
        SELECT 
          JobPostings.*,
          companies.name AS company_name, 
          companies.logo AS company_logo,
          companies.location AS company_location,
          companies.description AS company_description,
          (
            SELECT STRING_AGG(JobTags.tagName, ', ') 
            FROM JobPostingsTags 
            INNER JOIN JobTags ON JobPostingsTags.tagId = JobTags.id
            WHERE JobPostingsTags.jobId = JobPostings.id
          ) AS tags
        FROM JobPostings
        LEFT JOIN companies ON JobPostings.company_id = companies.id
        ORDER BY JobPostings.postedDate DESC
      `);

      const jobs = result.recordset;
      // Cache the result for future requests
      return jobs;
    } catch (err) {
      console.error("Database query error:", err);
      throw err;
    }
  },

  getCompanies: async () => {
    try {
      const result = await sql.query`SELECT TOP 20 * FROM companies`;
      const companies = result.recordset;
      return companies;
    } catch (err) {
      console.error("Database query error:", err);
      throw err;
    }
  },

  getSkills: async () => {
    try {
      const result = await sql.query`SELECT * FROM JobTags`;
      const skills = result.recordset;
      return skills;
    } catch (err) {
      console.error("Database query error:", err);
      throw err;
    }
  },

  findById: async (id) => {
    try {
      const result = await sql.query`
        SELECT 
          JobPostings.*,
          companies.name AS company_name,
          companies.logo AS company_logo,
          companies.location AS company_location,
          companies.description AS company_description,
          (
            SELECT STRING_AGG(JobTags.tagName, ', ') 
            FROM JobPostingsTags 
            INNER JOIN JobTags ON JobPostingsTags.tagId = JobTags.id
            WHERE JobPostingsTags.jobId = JobPostings.id
          ) AS tags
        FROM JobPostings
        LEFT JOIN companies ON JobPostings.company_id = companies.id
        WHERE JobPostings.id = ${id}
      `;
      const job = result.recordset[0];
      return job;
    } catch (err) {
      console.error("Database query error:", err);
      throw err;
    }
  },
  createJobPosting: async (
    title,
    salary = "",
    experienceLevel,
    location,
    postedDate,
    company_id,
    link = "",
    expiration_date = null,
    tags = [],
    description,
    salary_max = null,
    recruiter_id,
    skills = [],
    benefits = [],
    additional_information = ""
  ) => {
    console.log("skills", skills);
    console.log("benefits", benefits);
    console.log("description", description);
    console.log("title", title);
    console.log("salary", salary);
    console.log("experienceLevel", experienceLevel);
    console.log("location", location);
    console.log("postedDate", postedDate);
    console.log("company_id", company_id);
    console.log("link", link);
    console.log("expiration_date", expiration_date);
    console.log("recruiter_id", recruiter_id);
    console.log("additional_information", additional_information);
    console.log("tags", tags);

    if (typeof link !== "string") {
      throw new Error("Link must be a string");
    }
    if (!Array.isArray(skills)) {
      skills = skills.split(",").map((skill) => skill.trim());
    }

    if (!Array.isArray(tags)) {
      tags = tags.split(",").map((tag) => tag.trim());
    }

    const benefitsArray = benefits.split(",").map((benefit) => benefit.trim());

    // Format the benefits array for SQL query
    const formattedBenefits = benefitsArray
      .map((benefit) => `'${benefit.replace(/'/g, "''")}'`)
      .join(",");

    try {
      // Insert the job posting into the JobPostings table
      const result = await sql.query`
      INSERT INTO JobPostings (
        title, salary, experienceLevel, location, postedDate, company_id, link,
        expiration_date, description, salary_max, recruiter_id, additional_information, benefits
      )
      OUTPUT INSERTED.id
      VALUES (
        ${title}, ${salary}, ${experienceLevel}, ${location}, ${postedDate}, ${company_id},
        ${link}, ${expiration_date}, ${description}, ${salary_max}, ${recruiter_id},
        ${additional_information}, ${formattedBenefits}
      )
    `;

      const jobPostingId = result.recordset[0].id;

      if (skills && skills.length > 0) {
        for (const skill of skills) {
          let skillId;
          const skillRecord = await sql.query`
            SELECT id FROM skills WHERE name = ${skill}
          `;
          if (skillRecord.recordset.length > 0) {
            skillId = skillRecord.recordset[0].id;
          } else {
            const newSkill = await sql.query`
              INSERT INTO skills (name)
              OUTPUT INSERTED.id
              VALUES (${skill})
            `;
            skillId = newSkill.recordset[0].id;
          }

          // Associate the skill with the job posting
          await sql.query`
            INSERT INTO job_skills (job_id, skill_id)
            VALUES (${jobPostingId}, ${skillId})
          `;
        }
      }

      if (tags && tags.length > 0) {
        for (const tag of tags) {
          let tagId;
          const tagRecord = await sql.query`
            SELECT id FROM JobTags WHERE tagName = ${tag}
          `;
          if (tagRecord.recordset.length > 0) {
            tagId = tagRecord.recordset[0].id;
          } else {
            const newTag = await sql.query`
              INSERT INTO JobTags (tagName)
              OUTPUT INSERTED.id
              VALUES (${tag})
            `;
            tagId = newTag.recordset[0].id;
          }

          // Associate the tag with the job posting
          await sql.query`
            INSERT INTO JobPostingsTags (jobId, tagId)
            VALUES (${jobPostingId}, ${tagId})
          `;
        }
      }

      return jobPostingId;
    } catch (err) {
      console.error(`Database insert error: ${err} in createJobPosting`);
      throw err; // Rethrow the error for the caller to handle
    }
  },

  getCompanyIdByName: async (name) => {
    try {
      const result = await sql.query`
        SELECT * FROM companies WHERE name = ${name}
      `;

      if (result.recordset.length === 0) {
        return null;
      }

      return result.recordset[0];
    } catch (err) {
      console.error("Database query error:", err);
      throw err;
    }
  },

  createCompany: async (name, logo_url, location, description) => {
    try {
      const result = await sql.query`
        INSERT INTO companies (name, logo, location, description)
        OUTPUT INSERTED.id
        VALUES (${name}, ${logo_url}, ${location}, ${description})
      `;
      const companyId = result.recordset[0].id;
      return companyId;
    } catch (err) {
      console.error(`Database insert error: ${err} in createCompany`);
      throw err;
    }
  },
};

module.exports = jobQueries;
