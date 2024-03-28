import express from "express";
import { conn } from "../dbconn";
import bodyParser from 'body-parser';
import { Request, Response, Router } from 'express';
export const router = express.Router();
router.use(bodyParser.json());

router.get("/", (req, res) => {
    conn.query('SELECT * FROM users', (err, result, fields) => {
        if (err) {
            console.error("Error fetching users:", err);
            res.status(500).json({ error: "Internal Server Error" });
        } else {
            res.json(result);
        }
    });
});
