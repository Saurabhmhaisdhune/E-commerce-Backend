import { MongoClient } from "mongodb";
import express from "express";
import dotenv from "dotenv";
import cors from 'cors';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express()
const PORT=process.env.PORT;

// const MONGO_URL = "mongodb://127.0.0.1";

const MONGO_URL= process.env.MONGO_URL;

async function createConnection() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  console.log("Mongo is connected ✌😊");
  return client;
}

const client = await createConnection();

app.use(cors());
app.use(express.json());

app.get('/', function (request, response) {
  response.send("hello this a home page of web shopping")
});

app.get('/data', async function(request,response){
  const data= await client.db("webshop").collection('product').find({}).toArray();
  response.send(data)
});

//Television

app.get('/data/television', async function(request,response){
  const data= await client.db("webshop").collection('product').find({category:television}).toArray();
  response.send(data)
})

//To insert data

app.post('/data/insert', async function (request, response) {
  const data = request.body;
  const result=await client.db("webshop").collection("product").insertOne(data);
 response.send(result);
});

// To check the list of all user register so far

app.get('/users/registers', async function (request, response) {
  const data = await client.db("webshop").collection("userinfo").find({}).toArray();
 response.send(data)
});

// For Registeration of new user

app.post('/users/register', async function (request, response) {
  const {usernames, passwords} = request.body; 
  const userFromdb=await client
  .db("webshop")
  .collection("userinfo")
  .findOne({usernames:usernames});
  console.log(userFromdb);
  if(userFromdb){
    response.status(400).send({msg:'USER ALREADY EXISTS'})
  }
  else if(passwords.length<8){
    response.status(402).send({msg:"Password must be longer"});
  }
  else{
    const hashedPassword=await genHashedPassword(passwords);
    console.log(passwords, hashedPassword);
    const result=await client.db("webshop").collection("userinfo").insertOne({usernames:usernames, passwords:hashedPassword});
    response.send(result);
  }
 });

 // Login for exisiting user

app.post('/users/login', async function (request, response) {
  const {usernames, passwords} = request.body; 
  const userFromdb=await client
  .db("webshop")
  .collection("userinfo")
  .findOne({usernames:usernames});
  console.log(userFromdb);

  if(!userFromdb){
    response.status(401).send({msg:'Invalid Credentials'});
  }else{
    const storePassword=userFromdb.passwords;
    const isPasswordMatch= await bcrypt.compare(passwords,storePassword);
    console.log(isPasswordMatch);
    
    if(isPasswordMatch){
      const token=jwt.sign({id:userFromdb._id},process.env.SECRET_KEY);
      response.send({msg:"login successful",token:token});
    }else{
      response.status(401).send({msg:"Invalid Credentials"});
    }
  }
 });

app.listen(PORT,()=>console.log(`APP is running ${PORT}`))
async function genHashedPassword(passwords){
  const NO_OF_ROUNDS=10;
  const salt = await bcrypt.genSalt(NO_OF_ROUNDS);
  const hashedPassword = await bcrypt.hash(passwords,salt);
  return hashedPassword
}