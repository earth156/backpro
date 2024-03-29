// import express from "express";
// import { conn } from "../dbconn"; // Assuming you have a db connection file named dbconn.js
// import bodyParser from 'body-parser';
// import { Request, Response, Router } from 'express';
// export const router = express.Router();
// router.use(bodyParser.json());

// router.get("/", (req, res) => {
//     const userId = req.params.userId; // เก็บค่า userId จาก req.params เพื่อใช้ใน SQL query
//     conn.query('SELECT users.*, post.* FROM users LEFT JOIN post ON users.user_id = post.user_id WHERE post.user_id = ?', [userId], (err, result, fields) => {
//         if (err) {
//             console.error("Error fetching users and their post:", err);
//             res.status(500).json({ error: "Internal Server Error" });
//         } else {
//             res.json(result);
//         }
//     });
// });


import express from "express";
import { conn } from "../dbconn";
import bodyParser from 'body-parser';
import { Request, Response, Router } from 'express';

export const router = express.Router();
router.use(bodyParser.json());

router.get("/:userId", (req, res) => {
    const userId = req.params.userId;
    
    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    // Check if the user has a profile picture
    const checkPictureSql = 'SELECT COUNT(*) AS picture_count FROM post WHERE user_id = ?';
    conn.query(checkPictureSql, [userId], (checkErr, checkResult) => {
        if (checkErr) {
            console.error("Error checking profile picture:", checkErr);
            return res.status(500).json({ error: "Internal Server Error" });
        }

        const pictureCount = checkResult[0].picture_count;

        if (pictureCount > 0) {
            // If the user has a profile picture, retrieve user's posts with pictures
            conn.query('SELECT post.*, users.first_name, users.last_name, users.profile FROM post JOIN users ON post.user_id = users.user_id WHERE post.user_id = ?', [userId], (err, result, fields) => {
                if (err) {
                    console.error("Error fetching user's post:", err);
                    return res.status(500).json({ error: "Internal Server Error" });
                }

                if (result.length === 0) {
                    return res.status(404).json({ error: "User not found or has no post" });
                }

                res.json(result);
            });
        } else {
            // If the user does not have a profile picture, retrieve user's profile information
            conn.query('SELECT first_name, last_name, profile FROM users WHERE user_id = ?', [userId], (profileErr, profileResult, profileFields) => {
                if (profileErr) {
                    console.error("Error fetching user's profile:", profileErr);
                    return res.status(500).json({ error: "Internal Server Error" });
                }

                if (profileResult.length === 0) {
                    return res.status(404).json({ error: "User not found" });
                }

                res.json(profileResult);
            });
        }
    });
});








// router.get("/", (req, res) => {
//     conn.query('SELECT * FROM post', (err, result, fields) => {
//         if (err) {
//             console.error("Error fetching post:", err);
//             res.status(500).json({ error: "Internal Server Error" });
//         } else {
//             res.json(result);
//         }
//     });
// });
