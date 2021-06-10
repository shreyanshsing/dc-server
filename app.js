const express = require('express');
const app = express();
const cors = require('cors');
const mysql = require('mysql2');
const fileUpload = require('express-fileupload');
const fs = require('fs');
require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use(express.static("resume"))


//database config.

const db = mysql.createConnection({
  user : process.env.DB_USER,
  host : process.env.DB_HOST,
  password : process.env.DB_PASSWORD,
  database : process.env.DB_NAME
})

//create-candidate

app.post('/create-candidate', (req,res) => {
  const fname = req.body.fname;
  const lname = req.body.lname;
  const email = req.body.email;
  const password = req.body.password;
  const id = req.body.id;

  db.query('INSERT INTO candidate_record (id,fname,lname,email,password) VALUES (?,?,?,?,?)',
  [id,fname,lname,email,password],(error,result)=>{
    if(error){
      res.status(400).send(error.sqlMessage);
      return;
    }
    res.send("Entry created successfully");
  }) 
})

//login-candidate

app.post('/login-candidate',(req,res) => {
  const email = req.body.email;
  const password = req.body.password;

  db.query('SELECT * FROM candidate_record WHERE email = (?)',
  [email],(error,result) => {
    console.log(result)
    if(error){
      return res.status(400).send(error.sqlMessage);
    }
    else{
      return result.length === 0 ? res.status(400).send("Email is not registered") :
      result[0].password === password ? res.send(result[0]) : res.status(400).send("Password did not matched");
    }
  })
})

//create-user

app.post('/create-recuiter', (req,res) => {
  const fname = req.body.fname;
  const lname = req.body.lname;
  const email = req.body.email;
  const password = req.body.password;
  const id = req.body.id;

  db.query('INSERT INTO recuiter_record (id,fname,lname,email,password) VALUES (?,?,?,?,?)',
  [id,fname,lname,email,password],(error,result)=>{
    if(error){
      return res.status(400).send(error.sqlMessage);
    }
    return res.send("Entry created successfully");
  }) 
})

//login-recuiter

app.post('/login-recuiter',(req,res) => {
  const email = req.body.email;
  const password = req.body.password;

  db.query('SELECT fname,password FROM recuiter_record WHERE email = (?)',
  [email],(error,result) => {
    if(error){
      return res.status(400).send(error.sqlMessage);
    }
    else{
      return result.length === 0 ? res.status(400).send("Email is not registered") :
      result[0].password === password ? res.send(result[0]) : res.status(400).send("Password did not matched");
    }
  })
})

//post-job

app.post('/post-job',(req,res) => {
  const title = req.body.title;
  const type = req.body.type;
  const postedBy = req.body.postedBy;
  const desg = req.body.desg;
  const desc = req.body.desc;
  const pay = req.body.pay;
  const skills = req.body.skills;
  const company = req.body.company;
  const key = req.body.key;
  const id = req.body.id;
  const date = new Date();
  const today = date.getFullYear()+"-"+date.getMonth()+"-"+date.getDate();

  console.log(req.body)

  db.query('INSERT INTO jobs (id,title,description,skills,status,postedBy,company,pay,desg,type,email,createdOn) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
  [id,title,desc,skills,'OPEN',postedBy,company,pay,desg,type,key,today],(error,result) => {
    if(error){
      console.log(error)
      res.status(400).send(error.sqlMessage);
      return;
    }
    else{
      res.send('job created');
    }
  })
})

//get-jobs by email

app.get('/fetch-jobs/:email',(req,res)=>{
  const email = req.params.email;
  console.log(req.params)
  db.query('SELECT * FROM jobs WHERE email = (?)',
  [email],(error,result) => {
    if(error){
      res.status(400).send(error.sqlMessage);
      return;
    }
    else{
      res.send(result);
      return;
    }
  })
})

// get-active jobs

app.get('/fetch-activejobs', (req,res)=>{
  
  db.query('SELECT * FROM jobs WHERE status = "OPEN"', (error,result) => {
    if(error){
      res.status(400).send(error.sqlMessage);
      return;
    }
    else{
      res.send(result);
      return
    }
  })
})

//apply for job

app.post("/apply-for-job",(req,res)=>{
  const resume = req.body.resume;
  const hire = req.body.hire;
  const mode = req.body.mode;
  const about = req.body.about;
  const c_id = req.body.candidateId;
  const j_id = req.body.jobId;
  const name = req.body.name;

  db.query('INSERT INTO applied_jobs (candidate_id,job_id,name,resume,mode,hire,about) VALUES (?,?,?,?,?,?,?)',
    [c_id,j_id,name,resume,mode,hire,about],(error,result)=>{
      if(error){
        res.status(400).send(error.sqlMessage);
        return;
      }
      else{
        db.query('UPDATE jobs SET applicants = applicants + 1 WHERE id = (?)',[j_id],
        (err,res)=>{
          if(err){
            console.log("can't fetch applicants");
            return;
          }
          console.log(res)
        })
        res.send("entry created.")
      }
    })
})

//upload-resume

app.post('/upload-resume', (req,res)=>{
  const newPath = __dirname + "/resume/";
  const file = req.files.file;
  const filename = file.name;

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

app.get('/fetch-resume-job/:job_id',(req,res)=>{
  const job_id = req.params.job_id;
  db.query('SELECT candidate_id,resume,name FROM applied_jobs WHERE job_id IN (?)',
  [job_id],(error,result)=>{
    if(error){
      console.log(error);
      res.status(400).send(error.sqlMessage);
      return;
    }
    res.send(result);
    })
})

//fetch candidate details by id 

app.get('/fetch-candidate/:id',(req,res)=>{
  const id = req.params.id;

  db.query('SELECT * FROM candidate_record WHERE id = (?)',[id],
  (error,result)=>{
    if(error){
      res.status(400).send(error.sqlMessage);
      return;
    }
    res.send(result);
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
      return res.status(400).send("Unable to get pdf.");
    }
    console.log(data);
    res.send(data);
  })
})


app.listen(process.env.PORT || 8080, ()=>{
  console.log("Server up and running")
})