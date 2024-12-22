const express = require('express');
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 5000;

// Midleware
app.use(cors());
app.use(express.json());



// console.log(process.env.DB_USER)
// console.log(process.env.DB_PASS)



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zufkq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const ProductCollection = client.db('productDB').collection('product');
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // Send a ping to confirm a successful connection
   
    // const equipmentCollection = client.db('equipmentDB').collection('equipment');
    app.post('/add-queries',async(req,res)=>{
        const data = req.body;
       console.log(data)
       const result = await ProductCollection.insertOne(data)
       res.send(result)
      
    })

    app.get('/queries',async(req,res)=>{
        const cursor = ProductCollection.find();
        const result = await cursor.toArray()
        res.send(result)

    })

    app.get('/queries/:userEmail',async(req,res)=>{
        const email = req.query.userEmail
        const query = { 'User.userEmail': { $eq: email } };
        const cursor =  ProductCollection.find(query);
        const results = await cursor.toArray()
        res.send(results)
      })

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('Hello from server')
})


app.listen(port,()=>{
    console.log(`Server is running on port: ${port}`)
})