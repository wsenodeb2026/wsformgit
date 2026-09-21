
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ===============================
// MongoDB Connection
// ===============================

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });


// ===============================
// MongoDB Database and Collection
// ===============================

const db = mongoose.connection.useDb("wsform");

const dynamicCollection = db.collection("enodebdata");


// ===============================
// Home / Test
// ===============================

app.get("/", (req, res) => {
    res.send("Dynamic Excel Backend is running");
});


// ===============================
// Upload Excel Data
// ===============================

app.post("/upload-excel", async (req, res) => {

    try {

        const data = req.body.data;

        if (!data || !Array.isArray(data) || data.length === 0) {
            return res.status(400).json({
                message: "No Excel data received"
            });
        }

        // Insert all Excel rows
        const result = await dynamicCollection.insertMany(data);

        res.json({
            message: "Excel data uploaded successfully",
            insertedCount: result.insertedCount
        });

    } catch (error) {

        console.error("Upload error:", error);

        res.status(500).json({
            message: "Error uploading Excel data",
            error: error.message
        });

    }

});


// ===============================
// Get All Data
// ===============================

app.get("/data", async (req, res) => {

    try {

        const data = await dynamicCollection
            .find({})
            .sort({ _id: -1 })
            .toArray();

        res.json(data);

    } catch (error) {

        console.error("Data fetch error:", error);

        res.status(500).json({
            message: "Error fetching data",
            error: error.message
        });

    }

});


// ===============================
// Server
// ===============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

});

