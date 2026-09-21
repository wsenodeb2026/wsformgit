```javascript
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));


// ===============================
// MongoDB CONNECTION
// ===============================

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });


// ===============================
// DATABASE AND COLLECTION
// ===============================

const db = mongoose.connection.useDb("wsform");

const collection =
    db.collection("wsdata_dynamic");


// ===============================
// TEST
// ===============================

app.get("/", (req, res) => {

    res.send(
        "Dynamic Excel Backend is running"
    );

});


// ===============================
// UPLOAD EXCEL DATA
// ===============================

app.post("/upload-excel", async (req, res) => {

    try {

        const data = req.body.data;

        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            return res.status(400).json({
                message:
                    "No Excel data received"
            });

        }


        const result =
            await collection.insertMany(data);


        console.log(
            "Records inserted:",
            result.insertedCount
        );


        res.json({

            message:
                "Excel uploaded successfully",

            insertedCount:
                result.insertedCount

        });

    }

    catch (error) {

        console.error(
            "Upload error:",
            error
        );


        res.status(500).json({

            message:
                "Upload failed",

            error:
                error.message

        });

    }

});


// ===============================
// GET ALL DATA
// ===============================

app.get("/data", async (req, res) => {

    try {

        const data =
            await collection
                .find({})
                .sort({ _id: -1 })
                .toArray();


        res.json(data);

    }

    catch (error) {

        console.error(
            "Fetch error:",
            error
        );


        res.status(500).json({

            message:
                "Error fetching data",

            error:
                error.message

        });

    }

});


// ===============================
// UPDATE ONE RECORD
// ===============================

app.put("/data/:id", async (req, res) => {

    try {

        const id =
            req.params.id;


        const updateData =
            req.body;


        // Remove _id so MongoDB
        // does not try to modify it

        delete updateData._id;


        const result =
            await collection.updateOne(

                {
                    _id:
                        new mongoose.Types.ObjectId(id)
                },

                {
                    $set:
                        updateData
                }

            );


        if (
            result.matchedCount === 0
        ) {

            return res.status(404).json({

                message:
                    "Record not found"

            });

        }


        res.json({

            message:
                "Record updated successfully"

        });

    }

    catch (error) {

        console.error(
            "Update error:",
            error
        );


        res.status(500).json({

            message:
                "Update failed",

            error:
                error.message

        });

    }

});


// ===============================
// START SERVER
// ===============================

const PORT =
    process.env.PORT || 3000;


app.listen(PORT, () => {

    console.log(
        `Server running on port ${PORT}`
    );

});
```
