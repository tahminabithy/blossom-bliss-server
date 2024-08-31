require('dotenv').config();
const express = require('express');
const app  = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 3002;

// MIDDLE WARE 
app.use(express.json());
app.use(cors());

// mongodb ------------
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0wvo3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();
      const database = "blossomBlissDb"
      const servicesCollection = client.db(database).collection("services")
      const userCollection = client.db(database).collection("users")
      const bookingCollection = client.db(database).collection("bookings");
      const reviewCollection = client.db(database).collection('reviews')


      // jwt token 
       app.post('/jwt', async(req,res)=>{
        const data = req.body;
        const token = jwt.sign({data:data},process.env.JWT_SECRET,{expiresIn:'1h'});
        res.send({token:token});
       })
       // verify token 
       const verifyToken = async(req,res,next)=>{
        console.log(!req.headers.authorization);
        if(!req.headers.authorization){
          return res.status(401).send({message:"unauthorized access"})
        }
        const token = req.headers.authorization.split(' ')[1] ;
        jwt.verify(token, process.env.JWT_SECRET,(err,decoded)=>{
          if(err){
           return res.status(401).send({message:"unauthorized access"})
          }
          req.decoded= decoded
          next();
        })
       }
      // user related api
        // ---------------------user-------------------
      app.post('/user', async (req,res)=>{
        const user = req.body;
        const query = {email: user.email};
        const existingUser = await userCollection.findOne(query)
        console.log(existingUser);
        
        if(existingUser){
            return res.send({ message: 'user already exists', insertedId: null })
        }    
        const result = await userCollection.insertOne(user);
        res.send(result);
     })
     app.get('/user' , async(req,res)=>{
        const query = req.query;
        const result = await userCollection.find(query).toArray();
        res.send(result);
      })
      app.get('/user/:email',async(req,res)=>{
        const email = req.params.email;
        const query = {email: email};
        const result = await userCollection.findOne(query);
        res.send(result);
      })
      app.patch('/user/admin/:email',async(req,res)=>{
       const email = req.params.email;
       const filter = {email : email};
       const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);

        
      })
    //  ---------------------- services --------------------
      app.post('/services',verifyToken, async(req,res)=>{
      const newService = req.body;
      const result = await servicesCollection.insertOne(newService);
      res.send(result);
      })
      app.get('/services',async(req,res)=>{
        const query = req.query;
        const result = await servicesCollection.find(query).toArray();
        res.send(result)
      })
     app.get('/service/:id', async(req,res)=>{
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await servicesCollection.findOne(query);   
        res.send(result)
     })
    //  ---------------------- bookings --------------------
    app.post('/bookings', async (req,res)=>{
        const booking = req.body ;
        console.log("booking value ",booking);
        
        const result = await bookingCollection.insertOne(booking);
        res.send(result)
    })
    app.get('/bookings', async(req,res)=>{
        const query = req.query;
        const result = await bookingCollection.find(query).toArray();
        res.send(result)
    })
    app.get('/bookingLists/:email',async(req,res)=>{
      const email = req.params.email
      const query = {email : email};
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    })
    app.patch('/booking/:id',async(req,res)=>{
      const id = req.params.id  
      const filter = {_id: new ObjectId(id)}
      const updatedStatus = req.body.status
      const updatedDoc = {
        $set:{
             status:updatedStatus,
            }
       }
      const result = await bookingCollection.updateOne(filter,updatedDoc)
      res.send(result)
      }
    )
    app.delete('/booking/:id',async(req,res)=>{
      const id = req.params.id 
      const query = {_id: new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query);
      res.send(result)
    })
    // ---------------------- reviews --------------------
    app.post('/reviews', async(req,res)=>{
        const review = req.body;
        console.log(review);
        const result = await reviewCollection.insertOne(review);
        console.log(result);     
        res.send(result);
    })
    app.get('/reviews',async(req,res)=>{
      const query = req.query;
      const result = await reviewCollection.find(query).toArray();
      res.send(result);
    })
      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      // Ensures that the client will close when you finish/error
    //   await client.close();
    }
  }
  run().catch(console.dir);


// start server 
app.get('/',(req,res)=>{
    res.send('Hello from db its working')
})
app.listen(port, ()=>{
    console.log(`server is running on port ${port}`)
})

// blossom_bliss_parlour_DB

// 3x8v5eypxy1axrT5