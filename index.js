const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

require("dotenv").config();
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 9000;
const app = express();
// const corsOptions = {
//   origin: ["http://localhost:5173", "http://localhost:5174"],
//   credentials: true,
// };

// app.use(cors(corsOptions));
app.use(
  cors({
    origin: [
      // 'http://localhost:5173',
      "http://localhost:5173",
      "http://localhost:5174",
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
//localhost:5000 and localhost:5173 are treated as same site.  so sameSite value must be strict in development server.  in production sameSite will be none
// in development server secure will false .  in production secure will be true

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
