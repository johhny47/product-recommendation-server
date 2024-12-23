const express = require('express');
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 5000;

// Midleware
app.use(cors());
app.use(express.json());
// https://assignment11-5d0f3.web.app


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
const RecommendationCollection = client.db('productDB').collection('recommendation');
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

    
    app.get('/queries', async (req, res) => {
      const search = req.query.search || ""; 
      console.log(search);
    
      let query = {};
      if (search) {
        query = {
          name: {
            $regex: search,
            $options: 'i', 
          },
        };
      }
    
      try {
        const cursor = ProductCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching queries:", error);
        res.status(500).send({ error: "An error occurred while fetching queries." });
      }
    });

    app.get('/queries/:userEmail',async(req,res)=>{
        const email = req.query.userEmail
        const query = { 'User.userEmail': { $eq: email } };
        const cursor =  ProductCollection.find(query);
        const results = await cursor.toArray()
        res.send(results)
      })

      app.post('/recommendation',async(req,res)=>{
        const data = req.body;
        const query={userEmail:data.userEmail,queryid:data.queryid} 
        const alreadyExist = await RecommendationCollection.findOne(query)
        if(alreadyExist)
            return res.status(401).send('you have already recommended')
     
        
    const result = await RecommendationCollection.insertOne(data)
    const filter = {_id: new ObjectId(data.queryid)}
    const update={
    $inc:{recommendationCount:1},
   }
   const UpdaterecommendationCount= await ProductCollection.updateOne(filter,update)
   res.send(result)
      
    })

    app.get('/recomendationforme/:userEmail',async(req,res)=>{
      const email = req.query.userEmail
      const query = { 'userEmail': { $eq: email } };
      const cursor =  RecommendationCollection.find(query);
      const results = await cursor.toArray()
      res.send(results)
    })
    app.get('/myrecommendation/:userEmail',async(req,res)=>{
      const email = req.query.userEmail
      console.log(email)
      const query = {'RecommenderEmail':{ $eq: email } };
      const cursor =  RecommendationCollection.find(query);
      const results = await cursor.toArray()
      res.send(results)
    })
    app.get('/details/:id',async(req,res)=>{
      const id = req.params.id
      const query = { _id: new ObjectId(id)};
      const result = await ProductCollection.findOne(query);
      res.send(result)
    })
    app.get('/queries/update/:id',async(req,res)=>{
      const id = req.params.id
      const query = { _id: new ObjectId(id)};
      const result = await ProductCollection.findOne(query);
      res.send(result)
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