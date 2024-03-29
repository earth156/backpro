import express from "express";
import { conn } from "../dbconn"; // Assuming you have a db connection file named dbconn.js
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


router.post('/', (req, res) => {
  const { id, picture } = req.body; // รับข้อมูลภาพ, id จาก Angular
  const time = new Date(); // เวลาปัจจุบัน

  // เช็คว่าข้อมูลภาพไม่ว่างเปล่า
  if (!picture) {
    return res.status(400).json({ error: 'No picture provided' });
  }

  // เช็คว่า user_id มีรูปภาพอยู่แล้ว 5 รูปหรือไม่
  const countSql = 'SELECT COUNT(*) AS picture_count FROM post WHERE user_id = ?';
  conn.query(countSql, [id], (countErr, countResult) => {
    if (countErr) {
      console.error('Error counting pictures:', countErr);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    
    const pictureCount = countResult[0].picture_count;
    
    // ถ้ามีรูปภาพมากกว่าหรือเท่ากับ 5 รูป
    if (pictureCount >= 5) {
      return res.status(400).json({ error: 'User already has 5 pictures' });
    }

    // ทำการ insert ข้อมูลภาพ, id, เวลา และคะแนน ลงในฐานข้อมูล MySQL
    const sql = 'INSERT INTO post (user_id, picture, time, score, newRank) VALUES (?, ?, ?, 1200, 0)';
    conn.query(sql, [id, picture, time], (err, result) => {
      if (err) {
        console.error('Error inserting picture:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      res.status(201).json({ message: 'Picture uploaded successfully' });
    });
  });
});

router.delete('/:postId', (req, res) => {
  const postId = req.params.postId;

  if (!postId) {
    return res.status(400).json({ error: 'Post ID is required' });
  }

  // ทำการลบภาพโดยอ้างอิงจาก post_id
  conn.query('DELETE FROM post WHERE post_id = ?', [postId], (err, result) => {
    if (err) {
      console.error('Error deleting post:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.status(200).json({ message: 'Post deleted successfully' });
  });
});


