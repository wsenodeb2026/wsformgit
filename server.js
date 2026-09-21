const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const crypto = require("crypto");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.static("public"));


// ========================================
// MONGODB CONNECTION
// ========================================

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.error(
            "MongoDB connection error:",
            error
        );
    });


// ========================================
// DATABASE / COLLECTION
// ========================================

const db =
    mongoose.connection.useDb("wsform");

const collection =
    db.collection("enodebdata");


// ========================================
// TEST
// ========================================

app.get("/", (req, res) => {

    res.send(
        "Dynamic Excel Backend is running"
    );

});


// ========================================
// UPLOAD EXCEL
// ========================================

app.post("/upload-excel", async (req, res) => {

    try {

        const data =
            req.body.data;


        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            return res.status(400).json({

                message:
                    "No Excel data received"

            });

        }


        // Create unique batch ID
        const batchId =
            crypto.randomUUID();


        // Get column names from Excel
        const columns =
            Object.keys(data[0]);


        // Add batch information
        const records =
            data.map(row => ({

                ...row,

                batchId:
                    batchId,

                excelColumns:
                    columns

            }));


        // Insert records
        const result =
            await collection.insertMany(
                records
            );


        console.log(
            "Batch:",
            batchId
        );


        console.log(
            "Columns:",
            columns
        );


        console.log(
            "Records inserted:",
            result.insertedCount
        );


        res.json({

            message:
                "Excel uploaded successfully",

            batchId:
                batchId,

            columns:
                columns,

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


// ========================================
// GET LATEST BATCH
// ========================================
app.get("/data", async (req, res) => {
    try {

        const data = await collection
            .find({})
            .sort({ _id: 1 })
            .toArray();

        if (data.length === 0) {
            return res.json({
                batchId: null,
                columns: [],
                data: []
            });
        }

        // Automatically collect all column names
        // from the MongoDB records
        const columnSet = new Set();

        data.forEach(record => {

            Object.keys(record).forEach(key => {

                if (
                    key !== "_id" &&
                    key !== "batchId" &&
                    key !== "excelColumns"
                ) {
                    columnSet.add(key);
                }

            });

        });

        const columns = Array.from(columnSet);

        res.json({
            batchId: null,
            columns: columns,
            data: data
        });

    } catch (error) {

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


       


      



// ========================================
// UPDATE RECORD
// ========================================

app.put(
    "/data/:id",
    async (req, res) => {

        try {

            const id =
                req.params.id;


            const updateData =
                req.body;


            // Never allow _id to be changed
            delete updateData._id;


            // Never allow batch information
            // to be changed during editing
            delete updateData.batchId;

            delete updateData.excelColumns;


            const result =
                await collection.updateOne(

                    {
                        _id:
                            new mongoose.Types
                                .ObjectId(id)
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

    }
);


// ========================================
// START SERVER
// ========================================

const PORT =
    process.env.PORT || 3000;


app.listen(
    PORT,
    () => {

        console.log(
            `Server running on port ${PORT}`
        );

    }
);
