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

    const { first_name, last_name, password, profile } = updatedData;

    let updateQuery = 'UPDATE users SET ';
    const updateParams = [];

    if (first_name) {
        updateQuery += 'first_name = ?, ';
        updateParams.push(first_name);
    }

    if (last_name) {
        updateQuery += 'last_name = ?, ';
        updateParams.push(last_name);
    }

    if (password) {
        updateQuery += 'password = ?, ';
        updateParams.push(password);
    }

    if (profile) {
        updateQuery += 'profile = ?, ';
        updateParams.push(profile);
    }

    // ลบเครื่องหมาย , ที่ไม่จำเป็นที่ตำแหน่งสุดท้ายของสตริง
    updateQuery = updateQuery.slice(0, -2);

    // เพิ่มเงื่อนไข WHERE สำหรับ user_id
    updateQuery += ' WHERE user_id = ?';
    updateParams.push(userId);

    conn.query(updateQuery, updateParams, (updateErr, updateResult) => {
        if (updateErr) {
            console.error("Error updating user data:", updateErr);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        // ส่งผลลัพธ์ที่ได้จากการอัปเดตกลับไป
        res.json(updateResult);
    });
});


