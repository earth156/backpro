import express from "express";
import { conn } from "../dbconn";
import bodyParser from 'body-parser';
import { Request, Response, Router } from 'express';
export const router = express.Router();
router.use(bodyParser.json());

router.put("/:userId", (req, res) => {
    const userId = req.params.userId;

    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }

    // เพื่อความสะดวกในการอัปเดตข้อมูล คุณสามารถใช้ req.body เพื่อรับข้อมูลที่ต้องการอัปเดต
    const updatedData = req.body;

    if (!updatedData) {
        return res.status(400).json({ error: "Updated data is required" });
    }

    const { first_name, last_name, password } = updatedData;

    conn.query('UPDATE users SET first_name = ?, last_name = ?, password = ? WHERE user_id = ?', [first_name, last_name, password, userId], (updateErr, updateResult) => {
        if (updateErr) {
            console.error("Error updating user data:", updateErr);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        // ส่งผลลัพธ์ที่ได้จากการอัปเดตกลับไป
        res.json(updateResult);
    });
});

