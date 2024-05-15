const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

require("dotenv").config();
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 9000;
const app = express();

// app.use(cors(corsOptions));
app.use(
  cors({
    origin: [
      // 'http://localhost:5173',
      "http://localhost:5173",
      "http://localhost:5174",
      "https://volunify-hub.web.app",
      "https://volunify-hub.firebaseapp.com/",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.shu503b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log('token in the middleware', token);
  // no token available
  return;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

async function run() {
  try {
    const volunifyCollection = client.db("volunify").collection("post");

    const volunifyRequested = client.db("volunify").collection("requested");

    // jwt token start

    //creating Token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("user for token", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);

      res.cookie("token", token, cookieOptions).send({ success: true });
    });

    //clearing Token
    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logging out", user);
      res
        .clearCookie("token", { ...cookieOptions, maxAge: 0 })
        .send({ success: true });
    });

    // jwt token end

    app.get("/allPost", async (req, res) => {
      const result = await volunifyCollection
        .find()
        .sort({ date: 1 })
        .toArray();
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

      // if (req.user.email !== req.query.email) {
      //   return res.status(403).send({ message: "forbidden access" });
      // }
      // let query = {};
      // if (req.query?.email) {
      //   query = { userEmail: req.query.email };
      // }
      // const result = await volunifyCollection.find(query).toArray();
      // res.send(result);
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
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const UpdatePage = req.body;
      const request = {
        $set: {
          userName: UpdatePage.userName,
          userEmail: UpdatePage.userEmail,
          PostTitle: UpdatePage.PostTitle,
          Category: UpdatePage.Category,
          Location: UpdatePage.Location,
          date: UpdatePage.date,
          No_of_volunteers_needed: UpdatePage.No_of_volunteers_needed,
          Thumbnail: UpdatePage.Thumbnail,
          description: UpdatePage.description,
        },
      };
      const result = await volunifyCollection.updateOne(
        filter,
        request,
        options
      );
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

 
app.patch("/updateVolunteerCount/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };

  try {
    // Fetch the current document to get the string value
    const currentDoc = await volunifyCollection.findOne(filter);
    if (!currentDoc) {
      return res
        .status(404)
        .send({ success: false, message: "Post not found" });
    }

    // Convert the string value to an integer
    const currentVolunteersNeeded = parseInt(
      currentDoc.No_of_volunteers_needed,
      10
    );
    if (isNaN(currentVolunteersNeeded)) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid number format" });
    }

    // Decrement the value
    const newVolunteersNeeded = currentVolunteersNeeded - 1;

    // Update the document with the new value converted back to a string
    const updateDoc = {
      $set: { No_of_volunteers_needed: newVolunteersNeeded.toString() },
    };

    const result = await volunifyCollection.updateOne(filter, updateDoc);
    if (result.modifiedCount === 1) {
      res.send({ success: true });
    } else {
      res
        .status(400)
        .send({
          success: false,
          message: "Failed to update the volunteer count",
        });
    }
  } catch (error) {
    res.status(500).send({ success: false, message: "Server error" });
  }
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
