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
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.error(
            "MongoDB connection error:",
            error
        );
    });


// ========================================
// DATABASE
// ========================================

const db =
    mongoose.connection.useDb("wsform");

const collection =
    db.collection("enodebdata");


// ========================================
// HOME
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

        const fileName =
            req.body.fileName ||
            "Unknown Excel File";

        const batchId =
            crypto.randomUUID();

        const uploadTime =
            new Date();

        const columns =
            Object.keys(data[0]);

        const records =
            data.map(function (row) {

                return {

                    ...row,

                    batchId:
                        batchId,

                    fileName:
                        fileName,

                    uploadTime:
                        uploadTime,

                    excelColumns:
                        columns

                };

            });

        const result =
            await collection.insertMany(
                records
            );

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
            "Records:",
            result.insertedCount
        );

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
// GET EXCEL LIST
// ========================================

app.get("/batches", async (req, res) => {

    try {

        const batches =
            await collection.aggregate([

                {
                    $match: {

                        batchId: {
                            $exists: true,
                            $ne: null
                        }

                    }

                },

                {
                    $sort: {

                        uploadTime: -1

                    }

                },

                {
                    $group: {

                        _id:
                            "$batchId",

                        fileName: {

                            $first:
                                "$fileName"

                        },

                        uploadTime: {

                            $first:
                                "$uploadTime"

                        },

                        recordCount: {

                            $sum:
                                1

                        }

                    }

                },

                {
                    $sort: {

                        uploadTime: -1

                    }

                }

            ]).toArray();


        res.json(
            batches
        );

    }
    catch (error) {

        console.error(
            "Batches error:",
            error
        );

        res.status(500).json({

            message:
                "Unable to load Excel list",

            error:
                error.message

        });

    }

});


// ========================================
// GET SELECTED EXCEL DATA
// ========================================

app.get("/data", async (req, res) => {

    try {

        const batchId =
            req.query.batch;

        if (!batchId) {

            return res.status(400).json({

                message:
                    "Batch ID is required"

            });

        }

        const data =
            await collection
                .find({
                    batchId:
                        batchId
                })
                .sort({
                    _id:
                        1
                })
                .toArray();


        if (
            data.length === 0
        ) {

            return res.json({

                batchId:
                    batchId,

                fileName:
                    null,

                uploadTime:
                    null,

                columns:
                    [],

                data:
                    []

            });

        }


        const columns =
            data[0].excelColumns || [];


        const fileName =
            data[0].fileName || "";


        const uploadTime =
            data[0].uploadTime || null;


        res.json({

            batchId:
                batchId,

            fileName:
                fileName,

            uploadTime:
                uploadTime,

            columns:
                columns,

            data:
                data

        });

    }
    catch (error) {

        console.error(
            "Data error:",
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

app.put("/data/:id", async (req, res) => {

    try {

        const id =
            req.params.id;

        const updateData =
            req.body;

        delete updateData._id;
        delete updateData.batchId;
        delete updateData.excelColumns;
        delete updateData.fileName;
        delete updateData.uploadTime;


        const result =
            await collection.updateOne(

                {
                    _id:
                        new mongoose.Types.ObjectId(
                            id
                        )
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


// ========================================
// START SERVER
// ========================================

const PORT =
    process.env.PORT || 3000;

app.listen(
    PORT,
    () => {

        console.log(
            "Server running on port " +
            PORT
        );

    }
);
```
