const express = require('express');
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require('dotenv').config()

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 5000;

// Midleware
app.use(cors(
  {
    origin: ['http://localhost:5173','https://assignment11-5d0f3.web.app'],
    credentials:true
  }
));
app.use(express.json());
app.use(cookieParser());
// https://assignment11-5d0f3.web.app






const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zufkq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
// verify token
const verifytoken = (req,res,next)=>{
  const token = req?.cookies?.token;
  console.log('token inside',token);
  if(!token){
    return res.status(401).send({message:'Unauthorized access'})
  }
  jwt.verify(token,process.env.SECRET_KEY,(err,decoded)=>{
    if(err){
      return res.status(403).send({message:'Forbidden access'})
    }
    req.user= decoded;
  })
  next()
}
const ProductCollection = client.db('productDB').collection('product');
const RecommendationCollection = client.db('productDB').collection('recommendation');
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // Send a ping to confirm a successful connection
   
    // const equipmentCollection = client.db('equipmentDB').collection('equipment');
    app.post('/add-queries',verifytoken,async(req,res)=>{
        const data = req.body;
       console.log(data)
       const result = await ProductCollection.insertOne(data)
       res.send(result)
      
    })

    app.post('/jwt',async(req,res)=>{
      const user = req.body
      const token = jwt.sign(user,process.env.SECRET_KEY,{expiresIn:'10h'})
      
      res.cookie('token',token,{
        httpOnly: true,
        secure:process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        
      }).send({success:true})
    
  })

  app.post('/logout',(req,res)=>{
    
    
    res.clearCookie('token',{
      httpOnly: true,
      secure:process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      
    }).send({success:true})
  
})

    
    app.get('/queries',async (req, res) => {
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
          const cursor = ProductCollection.find(query).sort({currentDate: -1 })
          
          const result = await cursor.toArray();
          res.send(result);
        } catch (error) {
          console.error("Error fetching queries:", error);
          res.status(500).send({ error: "An error occurred while fetching queries." });
        }
      });

    app.get('/queries/:userEmail',verifytoken,async(req,res)=>{
      const decodedEmail = req.user?.email
        const email = req.query.userEmail
        if(decodedEmail !== email){
          return res.status(401).send({message:"You are not authorized to access this resource."})}
        const query = { 'User.userEmail': { $eq: email } };
        const cursor =  ProductCollection.find(query).sort({currentDate: -1 });
        const results = await cursor.toArray()
        res.send(results)
      })

      app.post('/recommendation',verifytoken ,async(req,res)=>{
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
   res.send(UpdaterecommendationCount)
      
    })

    app.get('/recomendationforme/:userEmail',verifytoken ,async(req,res)=>{
      const email = req.query.userEmail
      const decodedEmail = req.user?.email
      if(decodedEmail !== email){
        return res.status(401).send({message:"You are not authorized to access this resource."})}
      const query = { 'userEmail': { $eq: email } };
      const cursor =  RecommendationCollection.find(query);
      const results = await cursor.toArray()
      res.send(results)
    })
    app.get('/myrecommendation/:userEmail',verifytoken ,async(req,res)=>{
      const email = req.query.userEmail
     const decodedEmail = req.user?.email
      if(decodedEmail !== email){
        return res.status(401).send({message:"You are not authorized to access this resource."})}
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
    app.get('/seemore/:id',async(req,res)=>{
      const id = req.params.id
      const query = { _id: new ObjectId(id)};
      const result = await ProductCollection.findOne(query);
      res.send(result)
    })
    app.get('/queries/update/:id',verifytoken ,async(req,res)=>{
      const id = req.params.id
      const query = { _id: new ObjectId(id)};
      const result = await ProductCollection.findOne(query);
      res.send(result)
    })
  
    app.put('/queries/:id',verifytoken ,async(req,res)=>{
      const id = req.params.id
      const updateInfo = req.body
      console.log(updateInfo)
      const filter =  { _id: new ObjectId(id)};
      const options = { upsert : true}
      const updateduser ={
        $set:{
          name:updateInfo.name,
          brand:updateInfo.brand,
          productImageURL:updateInfo.productImageURL,
          title:updateInfo.title,
          BoycottingReason:updateInfo.BoycottingReason,
          User:updateInfo.User,
          currentDate:updateInfo.currentDate,
          recommendationCount:updateInfo.recommendationCount
        }
      }
      const result = await  ProductCollection.updateOne(filter,updateduser,options)
      res.send(result)
      })
      app.delete('/queries/:id',verifytoken,async(req,res)=>{
        const id = req.params.id
        const query = { _id: new ObjectId(id)};
        const result = await ProductCollection.deleteOne(query);
        res.send(result)
      })
   
      app.delete('/recommendation/:id', verifytoken, async (req, res) => {
        const id = req.params.id; 
        try {
           
            const recommendation = await RecommendationCollection.findOne({ _id: new ObjectId(id) });
    
            if (!recommendation) {
                return res.status(404).send('Recommendation not found');
            }
    
            const queryid = recommendation.queryid;
    
           
            const deleteResult = await RecommendationCollection.deleteOne({ _id: new ObjectId(id) });
    
            if (deleteResult.deletedCount === 0) {
                return res.status(500).send('Failed to delete recommendation');
            }
    
          
            const filter = { _id: new ObjectId(queryid) };
            const update = { $inc: { recommendationCount: -1 } };
    
            const updateResult = await ProductCollection.updateOne(filter, update);
    
            if (updateResult.modifiedCount === 0) {
                console.warn('Failed to decrement recommendationCount for queryid:', queryid);
            }
    
            res.send({ success: true, message: 'Recommendation deleted and count decremented' });
        } catch (error) {
            console.error('Error deleting recommendation:', error);
            res.status(500).send('Internal server error');
        }
    });

    app.get('/query/home',async(req,res)=>{
     
      const result = await ProductCollection.find().sort({currentDate: -1 }) 
      .limit(6).toArray()

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
    res.send('Hello from server sid')
})


app.listen(port,()=>{
    console.log(`Server is running on port: ${port}`)
})