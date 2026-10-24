import 'dotenv/config';
import express from "express";
import { MongoClient } from 'mongodb';

const app = express();
const PORT = process.env.PORT || 5000;


const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");

    // Datebase 
    const db = client.db('wanderlast_db');
    // Collections 
    const usersCollection = db.collection('users');

    return client;
  } catch (err) {
    console.dir(err);
  }
}

connectToMongoDB();


app.get('/', (req, res) => {
    res.send({error: false, message: "Server is online"})
})


app.listen(PORT, () => {
    console.log(`Server is running on PORT: ${PORT}`)
})