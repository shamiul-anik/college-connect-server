const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const morgan = require("morgan");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
// app.use(cors());
app.use(express.json());
app.use(morgan("dev"));


const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASSWORD}@cluster0.s278t41.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const userCollection = client.db("collegeConnectDB").collection("users");
    const collegeCollection = client
      .db("collegeConnectDB")
      .collection("colleges");
    const reviewCollection = client
      .db("collegeConnectDB")
      .collection("reviews");

    // Indexing for Search
    const indexKeys = { college_name: 1 }; // Replace field1, field2... with your actual field names
    const indexOptions = { name: "searchedCollegeName" }; // Replace index_name with the desired index name
    const indexResult = await collegeCollection.createIndex(
      indexKeys,
      indexOptions
    );

    // Colleges
    app.get("/colleges", async (req, res) => {
      const limit = parseInt(req.query?.limit);
      // const limit = parseInt(req.query?.limit) || 3;
      // const email = req.query?.email;
      // const sort = req.query?.sort;
      const search = req.query?.search;
      console.log(search);

      let query = {};
      // if (email) {
      //   query = { seller_email: email };
      // }
      if (search) {
        query = {
          college_name: { $regex: search, $options: "i" },
        };
      }
      // console.log(query);
      const result = await collegeCollection
        .find(query)
        .sort({ college_name: "asc" })
        .limit(limit)
        .toArray();
      // console.log(result);
      res.send(result);
    });

    // View Single College
    app.get("/college/:id", async (req, res) => {
      const collegeID = req.params.id;
      const query = { _id: new ObjectId(collegeID) };
      const result = await collegeCollection.findOne(query); // Documentation: https://www.mongodb.com/docs/drivers/node/current/usage-examples/findOne/
      // console.log(result);
      res.send(result);
    });

    // Get Featured Colleges
    app.get("/featured-colleges", async (req, res) => {
      const query = { featured: true };

      const project = {
        college_image: 1,
        college_name: 1,
        admission_date: 1,
        events_details: 1,
        research_history: 1,
        sports_details: 1,
      };

      const result = await collegeCollection
        .find(query)
        .project(project)
        .sort({ admission_date: "desc" })
        .limit(3)
        .toArray();
      // console.log(result);
      res.send(result);
    });

    // Get Reviews
    app.get("/reviews", async (req, res) => {
      // const query = { class_status: "approved" };
      const result = await reviewCollection
        .find()
        .sort({ published_date: "desc" })
        .limit(6)
        .toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get("/", (req, res) => {
  res.send("College Connect is Running!");
});

app.listen(port, () => {
  console.log(`College Connect Server is running on port ${port}`);
});