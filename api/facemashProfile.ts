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
