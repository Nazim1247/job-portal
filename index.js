require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middle ware
app.use(cors());
app.use(express.json());

// DB_USER = job-hunter
// DB_PASS = Wdr2xo514fgyoHGi


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9njqe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // job related apis
    const jobCollection = client.db('jonPortal').collection('jobs');
    const jobApplicationCollection = client.db('jobPortal').collection('job_application');

    app.post('/jobs',async(req,res)=>{
        const newJob = req.body;
        const result = await jobCollection.insertOne(newJob);
        res.send(result);
    })

    app.get('/jobs', async (req,res)=>{
        const email = req.query.email;
        let query = {};
        if(email){
            query = {hr_email: email}
        }
        const cursor = jobCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get('/jobs/:id', async(req,res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await jobCollection.findOne(query);
        res.send(result);
    })

    // job application apis
    // get all data, some data, many data, [0, 1, many]
    app.get('/job-application', async(req, res)=>{
        const email = req.query.email;
        const query = {applicant_email: email};
        const result = await jobApplicationCollection.find(query).toArray();
        // fokira way to aggregate data
        for(const application of result){
            console.log(application.job_id)
            const query1 = {_id: new ObjectId(application.job_id)}
            const job = await jobCollection.findOne(query1)
            if(job){
                application.title = job.title;
                application.location = job.location;
                application.company = job.company;
                application.company_logo = job.company_logo;
            }
        }

        res.send(result);
    })

    app.get('/job-applications/jobs/:jbo_id', async(req,res)=>{
        const jobId = req.params.jbo_id;
        const query = {job_id: jobId};
        const result = await jobApplicationCollection.find(query).toArray();
        res.send(result);
    })

    app.post('/job-application', async(req,res)=>{
        const application = req.body;
        const result = await jobApplicationCollection.insertOne(application);

        // not it best way
        const id = application.job_id;
        const query = {_id: new ObjectId(id)};
        const job = await jobCollection.findOne(query);
        let newCount = 0;
        if(job.applicationCount){
            newCount = job.applicationCount +1;
        }else{
            newCount = 1;
        }
        // update job info
        const filter = {_id: new ObjectId(id)};
        const updateDoc = {
            $set: {
                applicationCount: newCount
            }
        }
        const updateResult = await jobCollection.updateOne(filter,updateDoc) 
        res.send(result);
    })

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send('job is falling form the sky')
})

app.listen(port, ()=>{
console.log(`job is waiting at: ${port}`);
})