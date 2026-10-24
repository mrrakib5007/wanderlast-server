import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Our Server Base URL: http://localhost:5000

// Regex
const addDestinationDataRegex = {
  destinationName: {
    regex: /^[A-Za-z0-9\s.,'()-]{2,60}$/,
    message: "Enter valid destination name",
  },
  country: {
    regex: /^[A-Za-z\s'-]{2,60}$/,
    message: "Enter valid country name",
  },
  category: {
    regex: /^[A-Za-z\s'-]{2,30}$/,
    message: "Enter valid category",
  },
  price: {
    regex: /^\d{1,6}(\.\d{1,2})?$/,
    message: "Enter valid price",
  },
  duration: {
    regex: /^\d+\sDays?\/\s\d+\sNights?$/,
    message: "Enter valid duration",
  },
  departureDate: {
    regex: /^\d{4}-\d{2}-\d{2}$/,
    message: "Enter valid Departure Date",
  },
  imageUrl: {
    regex: /^https?:\/\/[\w-]+(\.[\w-]+)+[^\s]*$/,
    message: "Enter a valid image URL",
  },
  description: {
    regex: /^[\s\S]{10,1000}$/,
    message: "Enter valid desciption under 1000 letter",
  },
};

let client;
let connectionPromise;

async function getDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is required.");
  }

  if (!connectionPromise) {
    client = new MongoClient(process.env.MONGODB_URI);
    connectionPromise = client.connect().catch((error) => {
      connectionPromise = undefined;
      client = undefined;
      throw error;
    });
  }

  await connectionPromise;
  return client.db("wanderlast_db");
}

export async function connectToMongoDB() {
  await getDatabase();
  console.log("You successfully connected to MongoDB!");
  return client;
}

// Destination APIs
// Get All Destination
app.get("/destination", async (req, res) => {
  try {
    const destinationsCollection = (await getDatabase()).collection(
      "destinations",
    );
    const result = await destinationsCollection.find({}).toArray();
    return res.status(200).send({
      error: false,
      message: `${result.length} Destination data found`,
      data: result,
    });
  } catch (error) {
    console.error("Get destinations error:", error);
    return res.status(500).send({
      error: true,
      message: "Something went wrong!",
    });
  }
});

app.post("/destination", async (req, res) => {
  try {
    const reqBody = req.body;

    if (!reqBody || typeof reqBody !== "object" || Array.isArray(reqBody)) {
      return res.status(400).send({
        error: true,
        message: "Destination data is required!",
      });
    }

    // Verify all required fields
    for (const [field, validator] of Object.entries(addDestinationDataRegex)) {
      const value = reqBody[field];

      // Check required field
      if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
      ) {
        return res.status(400).send({
          error: true,
          message: `${field} is required!`,
        });
      }

      // Check field format
      if (!validator.regex.test(String(value).trim())) {
        return res.status(400).send({
          error: true,
          message: validator.message,
        });
      }
    }

    const destinationsCollection = (await getDatabase()).collection(
      "destinations",
    );
    const result = await destinationsCollection.insertOne(reqBody);
    if (!result.insertedId) {
      return res.status(500).send({
        error: true,
        message: "Failed to add destination. Please try again.",
      });
    }
    
    res.status(201).send({
      error: false,
      message: "Your travel package has been added.",
      data: reqBody,
    });
  } catch (error) {
    console.error("Add destination error:", error);

    return res.status(500).send({
      error: true,
      message: "Something went wrong!",
    });
  }
});

// health check api
app.get("/health", (req, res) => {
  res.status(200).send({ error: false, message: "Server is online" });
});

export default app;

if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`Server is running on PORT: ${PORT}`);
  });
}
