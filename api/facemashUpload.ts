import express from "express";
import { conn } from "../dbconn"; // Assuming you have a db connection file named dbconn.js
import bodyParser from 'body-parser';
import { Request, Response, Router } from 'express';
export const router = express.Router();
router.use(bodyParser.json());

router.post('/upload', (req, res) => {
    const { id, picture } = req.body; // รับข้อมูลภาพและ id จาก Angular
  
    // เช็คว่าข้อมูลภาพไม่ว่างเปล่า
    if (!picture) {
      return res.status(400).json({ error: 'No picture provided' });
    }
  
    // ทำการ insert ข้อมูลภาพและ id ลงในฐานข้อมูล MySQL
    const sql = 'INSERT INTO post (post_id, picture) VALUES (?, ?)';
    conn.query(sql, [id, picture], (err, result) => {
      if (err) {
        console.error('Error inserting picture:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      res.status(201).json({ message: 'Picture uploaded successfully' });
    });
  });
