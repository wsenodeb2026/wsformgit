```javascript
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const crypto = require("crypto");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.use(express.static(__dirname));


// ========================================
// MONGODB CONNECTION
// ========================================

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {

        console.log(
            "MongoDB connected successfully"
        );

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
// HOME PAGE
// ========================================

app.get("/", (req, res) => {

    res.sendFile(
        __dirname + "/index1.html"
    );

});


// ========================================
// UPLOAD EXCEL
// ========================================

app.post("/upload-excel", async (req, res) => {

    try {

        const data =
            req.body.data;


        // Check Excel data

        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            return res.status(400).json({

                message:
                    "No Excel data received"

            });

        }


        // Excel file name

        const fileName =
            req.body.fileName ||
            "Unknown Excel File";


        // Create unique batch ID

        const batchId =
            crypto.randomUUID();


        // Upload time

        const uploadTime =
            new Date();


        // Get Excel column names

        const columns =
            Object.keys(data[0]);


        // Add batch information
        // to every record

        const records =
            data.map(row => ({

                ...row,

                batchId:
                    batchId,

                fileName:
                    fileName,

                uploadTime:
                    uploadTime,

                excelColumns:
                    columns

            }));


        // Insert records into MongoDB

        const result =
            await collection.insertMany(
                records
            );


        // Console information

        console.log(
            "Excel uploaded successfully"
        );

        console.log(
            "Batch ID:",
            batchId
        );

        console.log(
            "File Name:",
            fileName
        );

        console.log(
            "Upload Time:",
            uploadTime
        );

        console.log(
            "Columns:",
            columns
        );

        console.log(
            "Records inserted:",
            result.insertedCount
        );


        // Send response

        res.json({

            message:
                "Excel uploaded successfully",

            batchId:
                batchId,

            fileName:
                fileName,

            uploadTime:
                uploadTime,

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
// GET ALL UPLOADED EXCEL FILES
// ========================================

app.get("/batches", async (req, res) => {

    try {

        const batches =
            await collection.aggregate([

                {
                    $match: {

                        batchId: {

                            $exists:
                                true,

                            $ne:
                                null

                        }

                    }

                },

                {
                    $sort: {

                        uploadTime:
                            -1

                    }

                },

                {
                    $group: {

                        _id:
                            "$batchId",

                        fileName: {

                            $first:
```
