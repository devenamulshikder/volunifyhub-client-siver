const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 9000;
const app = express();
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
};

app.use(cors(corsOptions));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.shu503b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const volunifyCollection = client.db("volunify").collection("post");

    const volunifyRequested = client.db("volunify").collection("requested");

    app.get("/allPost", async (req, res) => {
      const result = await volunifyCollection.find().toArray();
      res.send(result);
    });

    app.get("/volunteerNeedDetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunifyCollection.findOne(query);
      res.send(result);
    });

    app.get("/VolunteerNeedPostDetailsPage/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunifyCollection.findOne(query);
      res.send(result);
    });

    // get the specific user added post
    app.get("/manageMyPost/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await volunifyCollection.find(query).toArray();
      res.send(result);
    });

    // get requested data for folunifyRequested collection
    app.get("/requestedVolunteer/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await volunifyRequested.find(query).toArray();
      res.send(result);
    });

    // cancel requested user
    app.delete("/requestedVolunteer/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunifyRequested.deleteOne(query);
      res.send(result);
    });

    app.get("/updatePage/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunifyCollection.findOne(query);
      res.send(result);
    });

    // update
    app.put("/updatePage/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      // return console.log(id, data);
      const updateDoc = {
        $set: {
          data,
        },
      };
      const query = { _id: new ObjectId(id) };
      const result = await volunifyCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // delete

    app.delete("/updatePage/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunifyCollection.deleteOne(query);
      res.send(result);
    });

    // post2
    app.post("/volunteerRequested", async (req, res) => {
      const requestedVolunteer = req.body;
      const result = await volunifyRequested.insertOne(requestedVolunteer);
      res.send(result);
    });

    // post1
    app.post("/volunteerPost", async (req, res) => {
      const newVolunteer = req.body;
      const result = await volunifyCollection.insertOne(newVolunteer);
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello From Volunify Hub.......");
});

app.listen(port, () => {
  console.log(`Server running on this port ${port}`);
});
