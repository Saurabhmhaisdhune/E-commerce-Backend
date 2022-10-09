import { MongoClient } from "mongodb";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_KEY);

dotenv.config();

const app = express();
const PORT = process.env.PORT;

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

//Payment Gateway

app.get("/payment", function (request, response) {
  response.send("payment");
});

app.post("/payment/post",async (req, res) => {

  const {product, token}=req.body;
  console.log("product", product);
  console.log("PRICE",product.price);
  const idempotencyKey = uuid()

 stripe.customers.create({
    email:token.email,
    source: token.id
  }).then(customer=>{
    return stripe.charges.create({
      amount:product.price*100,
      currency:'usd',
      customer:customer.id,
      receipt_email:token.email,
      description:'purchase of product',
      shipping:{
        name:token.card.name,
        address:{
          country:token.card.address_country
        }
      }
    },{idempotencyKey})
  }).then(result=>res.status(200).json(result))
  .catch(err=>console.log(err))
})

//Welcome message

app.get("/", function (request, response) {
  response.send("hello this a home page of web shopping");
});

//To see all data available

app.get("/data", async function (request, response) {
  const data = await client
    .db("webshop")
    .collection("product")
    .find({})
    .toArray();
  response.send(data);
});

//Cart data

app.get("/data/carts", async function (request, response) {
  const data = await client
    .db("webshop")
    .collection("carts")
    .find({})
    .toArray();
  response.send(data);
});

app.post("/data/carts/post", async function (request, response) {
  const data = request.body;
  const result = await client.db("webshop").collection("carts").insertOne(data);
  response.send(result);
});

app.delete("/data/carts/delete/:id", async function (request, response) {
  const { id } = request.params;
  console.log(request.params, id);

  const result = await client
    .db("webshop")
    .collection("carts")
    .deleteOne({ id: id });

  result.deletedCount > 0
    ? response.send({ msg: "Item successfully deleted" })
    : response.status(401).send({ msg: "Item not found" });
});

//Television

app.get("/data/television", async function (request, response) {
  const data = await client
    .db("webshop")
    .collection("product")
    .find({ category: "Television" })
    .toArray();
  response.send(data);
});

//Mobile Phone

app.get("/data/mobile", async function (request, response) {
  const data = await client
    .db("webshop")
    .collection("product")
    .find({ category: "Mobile Phone" })
    .toArray();
  response.send(data);
});

//Bike

app.get("/data/bike", async function (request, response) {
  const data = await client
    .db("webshop")
    .collection("product")
    .find({ category: "Bike" })
    .toArray();
  response.send(data);
});

//Clothe

app.get("/data/clothe", async function (request, response) {
  const data = await client
    .db("webshop")
    .collection("product")
    .find({ category: "Clothe" })
    .toArray();
  response.send(data);
});

//Furniture

app.get("/data/furniture", async function (request, response) {
  const data = await client
    .db("webshop")
    .collection("product")
    .find({ category: "Furniture" })
    .toArray();
  response.send(data);
});

//Laptop

app.get("/data/laptop", async function (request, response) {
  const data = await client
    .db("webshop")
    .collection("product")
    .find({ category: "Laptop" })
    .toArray();
  response.send(data);
});

//Music

app.get("/data/music", async function (request, response) {
  const data = await client
    .db("webshop")
    .collection("product")
    .find({ category: "Music" })
    .toArray();
  response.send(data);
});

//Sport

app.get("/data/sport", async function (request, response) {
  const data = await client
    .db("webshop")
    .collection("product")
    .find({ category: "Sport" })
    .toArray();
  response.send(data);
});

//To insert data

app.post("/data/insert", async function (request, response) {
  const data = request.body;
  const result = await client
    .db("webshop")
    .collection("product")
    .insertOne(data);
  response.send(result);
});

// To check the list of all user register so far

app.get("/users/registers", async function (request, response) {
  const data = await client
    .db("webshop")
    .collection("userinfo")
    .find({})
    .toArray();
  response.send(data);
});

// For Registration of new user

app.post("/users/register", async function (request, response) {
  const { usernames, passwords } = request.body;
  const userFromdb = await client
    .db("webshop")
    .collection("userinfo")
    .findOne({ usernames: usernames });
  console.log(userFromdb);
  if (userFromdb) {
    response.status(400).send({ msg: "USER ALREADY EXISTS" });
  } else if (passwords.length < 8) {
    response.status(402).send({ msg: "Password must be longer" });
  } else {
    const hashedPassword = await genHashedPassword(passwords);
    console.log(passwords, hashedPassword);
    const result = await client
      .db("webshop")
      .collection("userinfo")
      .insertOne({ usernames: usernames, passwords: hashedPassword });
    response.send(result);
  }
});

// Login for exisiting user

app.post("/users/login", async function (request, response) {
  const { usernames, passwords } = request.body;
  const userFromdb = await client
    .db("webshop")
    .collection("userinfo")
    .findOne({ usernames: usernames });
  console.log(userFromdb);

  if (!userFromdb) {
    response.status(401).send({ msg: "Invalid Credentials" });
  } else {
    const storePassword = userFromdb.passwords;
    const isPasswordMatch = await bcrypt.compare(passwords, storePassword);
    console.log(isPasswordMatch);

    if (isPasswordMatch) {
      const token = jwt.sign({ id: userFromdb._id }, process.env.SECRET_KEY);
      response.send({ msg: "login successful", token: token });
    } else {
      response.status(401).send({ msg: "Invalid Credentials" });
    }
  }
});

app.listen(PORT, () => console.log(`APP is running ${PORT}`));
async function genHashedPassword(passwords) {
  const NO_OF_ROUNDS = 10;
  const salt = await bcrypt.genSalt(NO_OF_ROUNDS);
  const hashedPassword = await bcrypt.hash(passwords, salt);
  return hashedPassword;
}
