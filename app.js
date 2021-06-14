const express = require('express');
const app = express();
const cors = require('cors');
const mysql = require('mysql2');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const { isRegExp } = require('util');
require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use("/resume", express.static(__dirname + "/resume"));
app.use("/profile", express.static(__dirname + "/profile"));

//database config.

const db = mysql.createConnection({
  user : process.env.DB_USER,
  host : process.env.DB_HOST,
  password : process.env.DB_PASSWORD,
  database : process.env.DB_NAME,
  socketPath: `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`
})

/*const createTcpPool = async config => {
  // Extract host and port from socket address
  const dbSocketAddr = process.env.DB_HOST.split(':');

  // Establish a connection to the database
  return await mysql.createPool({
    user: process.env.DB_USER, // e.g. 'my-db-user'
    password: process.env.DB_PASSWORD, // e.g. 'my-db-password'
    database: process.env.DB_NAME, // e.g. 'my-database'
    host: dbSocketAddr[0], // e.g. '127.0.0.1'
    // ... Specify additional properties here.
    ...config,
  });
};

// [START cloud_sql_mysql_mysql_create_socket]
const createUnixSocketPool = async config => {
  const dbSocketPath = process.env.DB_SOCKET_PATH || '/cloudsql';

  // Establish a connection to the database
  return await mysql.createPool({
    user: process.env.DB_USER, // e.g. 'my-db-user'
    password: process.env.DB_PASS, // e.g. 'my-db-password'
    database: process.env.DB_NAME, // e.g. 'my-database'
    // If connecting via unix domain socket, specify the path
    socketPath: `${dbSocketPath}/${process.env.CLOUD_SQL_CONNECTION_NAME}`,
    // Specify additional properties here.
    ...config,
  });
};
// [END cloud_sql_mysql_mysql_create_socket]

const createPool = async () => {
  const config = {
    connectionLimit: 5,
    connectTimeout: 10000,
    acquireTimeout: 20000,
    waitForConnections: true, 
    queueLimit: 0, 
  };
  if (process.env.DB_HOST) {
    return await createTcpPool(config);
  } else {
    return await createUnixSocketPool(config);
  }
};

let db;
app.use(async (req, res, next) => {
  if (db) {
    return next();
  }
  try {
    pool = await createPool();
    next();
  } catch (err) {
    logger.error(err);
    return next(err);
  }
});*/

app.get('/',async(req,res)=>{
  db.getConnection((error,connection)=>{
    if(error){
      return res.status(400).send(error);
    }
    else{
      return res.send(connection);
    }
  })
})
//create-candidate

app.post('/create-candidate',async (req,res) => {
  const fname = req.body.fname;
  const lname = req.body.lname;
  const email = req.body.email;
  const password = req.body.password;
  const id = req.body.id;

  db = db || await createPool();

  db.query('INSERT INTO candidate_record (id,fname,lname,email,password) VALUES (?,?,?,?,?)',
  [id,fname,lname,email,password],(error,result)=>{
    if(error){
      console.log(error);
      return res.status(400).send(error.sqlMessage);
    }
    return res.status(200).send("Entry created successfully");
  }) 
})

//login-candidate

app.post('/login-candidate',async(req,res) => {
  const email = req.body.email;
  const password = req.body.password;

  db = db || await createPool();
  db.query('SELECT * FROM candidate_record WHERE email = (?)',
  [email],(error,result) => {
    if(error){
      console.log(error)
      return res.status(400).send(error.sqlMessage);
    }
    else{
      return result.length === 0 ? res.status(400).send("Email is not registered") :
      result[0].password === password ? res.status(200).send(result[0]) : res.status(400).send("Password did not matched");
    }
  })
})

//create-user

app.post('/create-recuiter', async(req,res) => {
  const fname = req.body.fname;
  const lname = req.body.lname;
  const email = req.body.email;
  const password = req.body.password;
  const id = req.body.id;

  db = db || await createPool();
  db.query('INSERT INTO recuiter_record (id,fname,lname,email,password) VALUES (?,?,?,?,?)',
  [id,fname,lname,email,password],(error,result)=>{
    if(error){
      console.log(error)
      return res.status(400).send(error.sqlMessage);
    }
    return res.status(200).send("Entry created successfully");
  }) 
})

//login-recuiter

app.post('/login-recuiter',async(req,res) => {
  const email = req.body.email;
  const password = req.body.password;

  db = db || await createPool();
  db.query('SELECT * FROM recuiter_record WHERE email = (?)',
  [email],(error,result) => {
    if(error){
      console.log(error)
      return res.status(400).send(error.sqlMessage);
    }
    else{
      return result.length === 0 ? res.status(400).send("Email is not registered") :
      result[0].password === password ? res.status(200).send(result[0]) : res.status(400).send("Password did not matched");
    }
  })
})

//post-job

app.post('/post-job',async(req,res) => {
  const title = req.body.title;
  const type = req.body.type;
  const postedBy = req.body.postedBy;
  const desg = req.body.desg;
  const desc = req.body.desc;
  const pay = req.body.pay;
  const skills = req.body.skills;
  const company = req.body.company;
  const email = req.body.email;
  const mode = req.body.mode;
  const id = req.body.id;
  const date = new Date();
  const today = date.getFullYear()+"-"+date.getMonth()+"-"+date.getDate();
  const recuiter_id = req.body.recuiter_id;
  var arr = [];
  db = db || await createPool();
  db.query('INSERT INTO jobs (id,title,description,skills,status,postedBy,company,pay,desg,type,email,createdOn,mode,recuiter_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
  [id,title,desc,skills,'OPEN',postedBy,company,JSON.stringify(pay),desg,type,email,today,mode,recuiter_id],(error,result) => {
    if(error){
      console.log(error)
      return res.status(400).send(error.sqlMessage);
    }
    else{
      db.query('SELECT jobs_posted FROM recuiter_record WHERE id = ?',[recuiter_id],
      (e,r)=>{
        if(e){
          console.log(e);
          return res.status(400).send(e.sqlMessage);
        }
        else{
          if(r.length>0 && r[0].jobs_posted && r[0].jobs_posted.length>0){
            arr = jobs_posted;
            arr.push({...req.body,"createdOn":today});
          }
          else{
            arr = [{...req.body,"createdOn":today}];
          }
          db.query('UPDATE recuiter_record SET jobs_posted = ? WHERE id = ?',[JSON.stringify(arr),recuiter_id],
          (err,re)=>{
            if(err){
              console.log(err);
              return res.status(400).send(err.sqlMessage);
            }
            return res.status(200).send('job created'); 
          })
        }
      })
    }
  })
})

//get-jobs by email

app.get('/fetch-jobs/:id',async(req,res)=>{
  const email = req.params.id;
  db = db || await createPool();
  db.query('SELECT * FROM jobs WHERE recuiter_id = (?)',
  [email],(error,result) => {
    if(error){
      console.log(error)
      return res.status(400).send(error.sqlMessage);
    }
    else{
      return res.status(200).send(result);
    }
  })
})

// get-active jobs

app.get('/fetch-activejobs', async(req,res)=>{
  db = db || await createPool();
  db.query('SELECT * FROM jobs WHERE status = "OPEN"', (error,result) => {
    if(error){
      console.log(error)
      return res.status(400).send(error.sqlMessage);
    }
    else{
      return res.status(200).send(result);
    }
  })
})

//apply for job

app.post("/apply-for-job",async(req,res)=>{
  const resume = req.body.resume;
  const hire = req.body.hire;
  const mode = req.body.mode;
  const about = req.body.about;
  const c_id = req.body.candidateId;
  const j_id = req.body.jobId;
  const name = req.body.name;

  db = db || await createPool();

  db.query('SELECT job_id from applied_jobs WHERE candidate_id = ?',[c_id],
  (e,r)=>{
    if(e){
      console.log(e);
      //return res.status(400).send(e.sqlMessage);
    }
    const arr = r.filter(item=> item.job_id === j_id);

    if(arr.length>0){
      return res.status(400).send('Already applied for this job post.');
    }
    else{
      db.query('INSERT INTO applied_jobs (candidate_id,job_id,name,resume,mode,hire,about) VALUES (?,?,?,?,?,?,?)',
      [c_id,j_id,name,resume,mode,hire,about],(error,result)=>{
        if(error){
          console.log(error)
          return res.status(400).send(error.sqlMessage);
        }
        else{
          db.query('UPDATE jobs SET applicants = applicants + 1 WHERE id = (?)',[j_id],
          (err,res)=>{
            if(err){
              console.log(err)
              console.log("can't fetch applicants");
            }
          })
          return res.status(200).send("entry created.")
        }
      })
    }
  })
})

//upload-resume

app.post('/upload-resume', (req,res)=>{
  const newPath = __dirname + "/resume/";
  const file = req.files.file;
  const filename = req.body.name;

  file.mv(`${newPath}${filename}`,err => {
    if(err){
      console.log(err);
      res.status(400).send("File upload failed");
      return;
    }
    console.log(filename)
    res.status(200).send(`${filename}`);
  })
})

//fetch-resume-by-joibId

app.get('/fetch-resume-job/:job_id',async(req,res)=>{
  const job_id = req.params.job_id;
  db = db || await createPool();
  db.query('SELECT candidate_id,resume FROM applied_jobs WHERE job_id IN (?)',
  [job_id],(error,result)=>{
    if(error){
      console.log(error);
      res.status(400).send(error.sqlMessage);
      return;
    }
    res.status(200).send(result);
    })
})

//fetch candidate details by id 

app.get('/fetch-candidate/:id',async(req,res)=>{
  const id = req.params.id;
  db = db || await createPool();
  db.query('SELECT * FROM candidate_record WHERE id = (?)',[id],
  (error,result)=>{
    if(error){
      console.log(error)
      res.status(400).send(error.sqlMessage);
      return;
    }
    res.status(200).send(result);
  })
})

//download service

app.get('/download-resume/:file',(req,res)=>{
  var file = req.params.file;
  var fileLocation = `${__dirname}/resume/${file}`;
  console.log(fileLocation);
  /*res.download(fileLocation,file,(err,result)=>{
    console.log(err)
    console.log(result)
  });*/

  fs.readFile(fileLocation,(err,data)=>{
    if(err){
      console.log(err)
      return res.status(400).send("Unable to get pdf.");
    }
    console.log(data);
    res.status(200).send(data);
  })
})

//update profile pic

app.post('/update-profile-img',(req,res)=>{
  const newPath = __dirname + "/profile/";
  const file = req.files.file;
  const filename = file.name;
  const user = req.body.name;
  const email = req.body.email;

  file.mv(`${newPath}${user}${filename}`,async err => {
    if(err){
      console.log(err);
      res.status(400).send("File upload failed");
      return;
    }
    db = db || await createPool();
    db.query('UPDATE candidate_record SET profile = ? WHERE email = ?',
    [`${user}${filename}`,email],(error,result)=>{
      if(error){
        console.log(error);
        return res.status(400).send(error.sqlMessage);
      }
      return res.status(200).send("Update successful");
    })
  })
})

//get img by email candidate

app.get('/candidate-profile/:email',async (req,res)=>{
  const email = req.params.email;
  db = db || await createPool();
  db.query('SELECT profile FROM candidate_record WHERE email =?',[email],(error,result)=>{
    if(error){
      console.log(error);
      return res.status(400).send(error.sqlMessage);
    }
    var file = result[0].profile;
    var fileLocation = `${__dirname}/profile/${file}`;
    /*res.download(fileLocation,file,(err,result)=>{
      console.log(err)
      console.log(result)
    });*/

    fs.readFile(fileLocation,(err,data)=>{
      if(err){
        console.log(err)
        return res.status(400).send("Unable to get pdf.");
      }
      res.status(200).send(data);
    })
  })
})

//update-condidate-basic

app.put('/update-candidate-basic',async (req,res)=>{
  const id = req.body.id;
  const fname = req.body.fname;
  const lname = req.body.lname;
  const email = req.body.email;
  const mobile = req.body.mobile;
  const linkedIn = req.body.linkedIn;
  const address = JSON.stringify(req.body.address);
  const about = req.body.about;
  const occupation = req.body.occupation;

  db = db || await createPool();
  db.query('UPDATE candidate_record SET fname=?, lname=?, email=?, mobile=?, linkedIn=?, about=?, occupation=?, address=? WHERE id=?',[fname,lname,email,mobile,linkedIn,about,occupation,address,id],
  (error,result)=>{
    if(error){
      console.log(error);
      throw error;
      return;
    }
    return res.status(200).send("Updated successfully");
  })
})

//add-education-candidate

app.post('/add-education',async (req,res)=>{
  const data = req.body;
  var arr = [];
  db = db || await createPool();
  db.query('SELECT education FROM candidate_record WHERE id = ?',[data.candidate_id],
  (error,result)=>{
    if(error){
      console.log(error);
      return res.status(400).send(error.sqlMessage);
    }
    if(result[0].education && result[0].education.length>0){
      arr = result[0].education;
      arr.push(data);
    }
    else{
      arr = [data];
    }
    db.query("UPDATE candidate_record SET education = ? WHERE id = ?",[JSON.stringify(arr),data.candidate_id],
    (e,r)=>{
      if(e){
        console.log(e);
        return res.status(400).send(e.sqlMessage);
      }
      return res.status(200).send('added education');
    })
  })
})

//update education 

app.put('/update-education',async (req,res)=>{
  const edu_id = req.body.id;
  const candidate_id = req.body.candidate_id;

  db = db || await createPool();
  db.query('SELECT education FROM candidate_record WHERE id = ?',[candidate_id],
  (error,result)=>{
    if(error){
      console.log(error);
      return res.status(400).send(error.sqlMessage);
    }
    var data = result[0].education;
    data = data.filter(e => e.id !== edu_id);
    data.push(req.body);
    db.query('UPDATE candidate_record SET education = ? WHERE id = ?',[JSON.stringify(data),candidate_id],
    (err,r)=>{
      if(err){
        console.log(err);
        return res.status(400).send(err.sqlMessage);
      }
      return res.status(200).send("Update Successful");
    })
  })
})

//delete from education

app.put('/delete-education/:c_id/:edu_id',async (req,res)=>{
  const candidate_id = req.params.c_id;
  const id = req.params.edu_id;

  db = db || await createPool();
  db.query('SELECT education FROM candidate_record WHERE id = ?',[candidate_id],
  (error,result)=>{
    if(error){
      console.log(error);
      return res.status(400).send(error.sqlMessage);
    }
    var data = result[0].education;
    data = data.filter(e => e.id !== id);
    db.query('UPDATE candidate_record SET education = ? WHERE id = ?',[JSON.stringify(data),candidate_id],
    (err,r)=>{
      if(err){
        console.log(err);
        return res.status(400).send(err.sqlMessage);
      }
      return res.status(200).send("Deletion Successful");
    })
  })
})

//add-experience-candidate

app.post('/add-experience',async (req,res)=>{
  const data = req.body;
  var arr = [];
  db = db || await createPool();
  db.query('SELECT experience FROM candidate_record WHERE id = ?',[data.candidate_id],
  (error,result)=>{
    if(error){
      console.log(error);
      return res.status(400).send(error.sqlMessage);
    }
    if(result[0].experience && result[0].experience.length>0){
      arr = result[0].experience;
      arr.push(data);
    }
    else{
      arr = [data];
    }
    db.query("UPDATE candidate_record SET experience = ? WHERE id = ?",[JSON.stringify(arr),data.candidate_id],
    (e,r)=>{
      if(e){
        console.log(e);
        return res.status(400).send(e.sqlMessage);
      }
      return res.status(200).send('added education');
    })
  })
})

//update experience 

app.put('/update-experience',async (req,res)=>{
  const edu_id = req.body.id;
  const candidate_id = req.body.candidate_id;

  db = db || await createPool();
  db.query('SELECT experience FROM candidate_record WHERE id = ?',[candidate_id],
  (error,result)=>{
    if(error){
      console.log(error);
      return res.status(400).send(error.sqlMessage);
    }
    var data = result[0].experience;
    data = data.filter(e => e.id !== edu_id);
    data.push(req.body);
    db.query('UPDATE candidate_record SET experience = ? WHERE id = ?',[JSON.stringify(data),candidate_id],
    (err,r)=>{
      if(err){
        console.log(err);
        return res.status(400).send(err.sqlMessage);
      }
      return res.status(200).send("Update Successful");
    })
  })
})

//delete from exp

app.put('/delete-experience/:c_id/:edu_id',async (req,res)=>{
  const candidate_id = req.params.c_id;
  const id = req.params.edu_id;

  db = db || await createPool();
  db.query('SELECT experience FROM candidate_record WHERE id = ?',[candidate_id],
  (error,result)=>{
    if(error){
      console.log(error);
      return res.status(400).send(error.sqlMessage);
    }
    var data = result[0].experience;
    data = data.filter(e => e.id !== id);
    db.query('UPDATE candidate_record SET experience = ? WHERE id = ?',[JSON.stringify(data),candidate_id],
    (err,r)=>{
      if(err){
        console.log(err);
        return res.status(400).send(err.sqlMessage);
      }
      return res.status(200).send("Deletion Successful");
    })
  })
})

//add-experience-candidate

app.post('/add-certi',async (req,res)=>{
  const data = req.body;
  var arr = [];
  db = db || await createPool();
  db.query('SELECT certifications FROM candidate_record WHERE id = ?',[data.candidate_id],
  (error,result)=>{
    if(error){
      console.log(error);
      return res.status(400).send(error.sqlMessage);
    }
    if(result[0].certifications && result[0].certifications.length>0){
      arr = result[0].certifications;
      arr.push(data);
    }
    else{
      arr = [data];
    }
    db.query("UPDATE candidate_record SET certifications = ? WHERE id = ?",[JSON.stringify(arr),data.candidate_id],
    (e,r)=>{
      if(e){
        console.log(e);
        return res.status(400).send(e.sqlMessage);
      }
      return res.status(200).send('added education');
    })
  })
})

//update experience 

app.put('/update-certi',async (req,res)=>{
  const edu_id = req.body.id;
  const candidate_id = req.body.candidate_id;

  db = db || await createPool();
  db.query('SELECT certifications FROM candidate_record WHERE id = ?',[candidate_id],
  (error,result)=>{
    if(error){
      console.log(error);
      return res.status(400).send(error.sqlMessage);
    }
    var data = result[0].certifications;
    data = data.filter(e => e.id !== edu_id);
    data.push(req.body);
    db.query('UPDATE candidate_record SET certifications = ? WHERE id = ?',[JSON.stringify(data),candidate_id],
    (err,r)=>{
      if(err){
        console.log(err);
        return res.status(400).send(err.sqlMessage);
      }
      return res.status(200).send("Update Successful");
    })
  })
})

//delete from certi

app.put('/delete-certi/:c_id/:edu_id',async (req,res)=>{
  const candidate_id = req.params.c_id;
  const id = req.params.edu_id;

  db = db || await createPool();
  db.query('SELECT certifications FROM candidate_record WHERE id = ?',[candidate_id],
  (error,result)=>{
    if(error){
      console.log(error);
      return res.status(400).send(error.sqlMessage);
    }
    var data = result[0].certifications;
    data = data.filter(e => e.id !== id);
    db.query('UPDATE candidate_record SET certifications = ? WHERE id = ?',[JSON.stringify(data),candidate_id],
    (err,r)=>{
      if(err){
        console.log(err);
        return res.status(400).send(err.sqlMessage);
      }
      return res.status(200).send("Deletion Successful");
    })
  })
})

//add-experience-candidate

app.post('/add-project',async (req,res)=>{
  const data = req.body;
  var arr = [];
  db = db || await createPool();
  db.query('SELECT projects FROM candidate_record WHERE id = ?',[data.candidate_id],
  (error,result)=>{
    if(error){
      console.log(error);
      return res.status(400).send(error.sqlMessage);
    }
    if(result[0].projects && result[0].projects.length>0){
      arr = result[0].projects;
      arr.push(data);
    }
    else{
      arr = [data];
    }
    db.query("UPDATE candidate_record SET projects = ? WHERE id = ?",[JSON.stringify(arr),data.candidate_id],
    (e,r)=>{
      if(e){
        console.log(e);
        return res.status(400).send(e.sqlMessage);
      }
      return res.status(200).send('added education');
    })
  })
})

//update projects 

app.put('/update-project',async (req,res)=>{
  const edu_id = req.body.id;
  const candidate_id = req.body.candidate_id;

  db = db || await createPool();
  db.query('SELECT projects FROM candidate_record WHERE id = ?',[candidate_id],
  (error,result)=>{
    if(error){
      console.log(error);
      return res.status(400).send(error.sqlMessage);
    }
    var data = result[0].projects;
    data = data.filter(e => e.id !== edu_id);
    data.push(req.body);
    db.query('UPDATE candidate_record SET projects = ? WHERE id = ?',[JSON.stringify(data),candidate_id],
    (err,r)=>{
      if(err){
        console.log(err);
        return res.status(400).send(err.sqlMessage);
      }
      return res.status(200).send("Update Successful");
    })
  })
})

//delete from projects

app.put('/delete-project/:c_id/:edu_id',async (req,res)=>{
  const candidate_id = req.params.c_id;
  const id = req.params.edu_id;

  db = db || await createPool();
  db.query('SELECT projects FROM candidate_record WHERE id = ?',[candidate_id],
  (error,result)=>{
    if(error){
      console.log(error);
      return res.status(400).send(error.sqlMessage);
    }
    var data = result[0].projects;
    data = data.filter(e => e.id !== id);
    db.query('UPDATE candidate_record SET projects = ? WHERE id = ?',[JSON.stringify(data),candidate_id],
    (err,r)=>{
      if(err){
        console.log(err);
        return res.status(400).send(err.sqlMessage);
      }
      return res.status(200).send("Deletion Successful");
    })
  })
})

//add-skills-candidate

app.post('/add-skills',async (req,res)=>{
  const data = req.body;
  var arr = data.skills;
  db = db || await createPool();
  db.query('SELECT skills FROM candidate_record WHERE id = ?',[data.candidate_id],
  (error,result)=>{
    if(error){
      console.log(error);
      return res.status(400).send(error.sqlMessage);
    }
    db.query("UPDATE candidate_record SET skills = ? WHERE id = ?",[JSON.stringify(arr),data.candidate_id],
    (e,r)=>{
      if(e){
        console.log(e);
        return res.status(400).send(e.sqlMessage);
      }
      return res.status(200).send('added education');
    })
  })
})

//save_jobs-per-candidate

app.post('/save-job/:job_id',async (req,res)=>{
  const job_id = req.params.job_id;
  const candidate_id = req.body.candidate_id;
  var data = req.body;
  var arr= [];
  var obj = {}
  db = db || await createPool();

  db.query('SELECT candidate_id FROM applied_jobs WHERE job_id = "-b9vc2"',[job_id],
  (error,result)=>{
    if(error){
      console.log(error);
    }
    if(result.length>0){
      const temp = result.filter(item=>item.candidate_id === candidate_id);
      if(temp.length>0){
        obj = {...data, 'applied' : true}
      }
      else{
        obj = {...data, 'applied' : false}
      }
    }
  })

  db.query('SELECT saved_jobs FROM candidate_record WHERE id = ?',[candidate_id],
  (error,result)=>{
    if(error){
      console.log(error);
      return res.status(400).send(error.sqlMessage);
    }
    if(result[0].saved_jobs && result[0].saved_jobs.length>0){
      arr = result[0].saved_jobs;
      const temp = arr.filter(item=> item.data.id === job_id);
      if(temp.length>0){
        return res.status(400).send("This job is already saved!");
      }
      else{
        arr.push(obj);
        db.query('UPDATE candidate_record SET saved_jobs = ? WHERE id = ?',[JSON.stringify(arr),candidate_id],
        (err,r)=>{
          if(err){
            return res.status(400).send(err.sqlMessage);
          }
          return res.status(200).send("Job saved");
        })
      }
    }
    else{
      arr = [obj];
      db.query('UPDATE candidate_record SET saved_jobs = ? WHERE id = ?',[JSON.stringify(arr),candidate_id],
        (err,r)=>{
          if(err){
            return res.status(400).send(err.sqlMessage);
          }
          return res.status(200).send("Job saved");
        })
    }
  })
})

//get-saved-jobs

app.get('/fetch-saved-jobs/:id', async(req,res)=>{
  const candidate_id = req.params.id;
  db = db || await createPool(); 
  db.query('SELECT saved_jobs FROM candidate_record WHERE id = ?',[candidate_id],
  (error,result)=>{
    if(error){
      console.log(error);
      return res.status(400).send(error.sqlMessage);
    }
    return res.status(200).send(result[0].saved_jobs);
  })
})

app.listen(process.env.PORT || 8080, ()=>{
  console.log(process.env.PORT)
})