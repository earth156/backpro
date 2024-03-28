import express from "express";
import { conn } from "../dbconn"; // Assuming you have a db connection file named dbconn.js
import bodyParser from 'body-parser';
import { Request, Response, Router } from 'express';
export const router = express.Router();

router.use(bodyParser.json());

//แสดงข้อมูล User ทั้งหมด
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

// ล็อคอิน
router.post("/signin", (req, res) => {
    let user_email = req.body.email;
    let user_password = req.body.password;
    conn.query('SELECT * FROM users WHERE email = ? AND password = ?', [user_email, user_password], (err, result, fields) => {
        if (err) {
            console.error("Error during sign-in:", err);
            res.status(500).json({ error: "Internal Server Error" });
        } else {
            res.json(result);
        }
    });
  });
  
  router.post('/signup', (req, res) => {
    const { first_name, last_name, email, password } = req.body;
  
    // Set default value for type_user
    const user_type = 'user';
  
    conn.query('INSERT INTO users (first_name, last_name, email, password, user_type) VALUES (?, ?, ?, ?, ?)',
      [first_name, last_name, email, password, user_type],
      (err, result) => {
        if (err) {
          console.error('Error during user signup:', err);
          res.status(500).json({ error: 'Internal Server Error' });
        } else {
          console.log('User successfully signed up:', result);
          res.json({ message: 'User signed up successfully' });
        }
      }
    );
  });

  router.get("/ViewImg", (req, res) => {
    conn.query('SELECT * FROM post', (err, result, fields) => {
        if (err) {
            console.error("Error fetching users:", err);
            res.status(500).json({ error: "Internal Server Error" });
        } else {
            res.json(result);
        }
    });
});
  
// router.post('/vote', (req, res) => {
//   const {  postId, userId } = req.body;
//   const score = 1; // กำหนดคะแนนเริ่มต้นเป็น 1
//   const time = new Date(); // ดึงเวลาปัจจุบัน
  
//   // กำหนดการค้นหาคะแนนรวมของโพสต์ที่ถูกโหวต
//   const query = 'INSERT INTO vote ( post_id,user_id score, time) VALUES (?, ?, ?,?) ON DUPLICATE KEY UPDATE total_score = total_score + VALUES(score)';
  
//   conn.query(query,
//     [postId,userId ,  score, time],
//     (err, result) => {
//       if (err) {
//         console.error('Error during voting:', err);
//         res.status(500).json({ error: 'Internal Server Error' });
//       } else {
//         console.log('Vote successfully recorded:', result);
//         res.json({ message: 'Vote recorded successfully' });
//       }
//     }
//   );
// });



// ส่วนแสดงข้อมูลการโหวตของ 2 คน
// router.get("/", (req, res) => {
//     // ดึงข้อมูลจากฐานข้อมูล โพสต์ และผู้ใช้
//     conn.query('SELECT * FROM post INNER JOIN users ON post.user_id = users.user_id;', (err, result, fields) => {
//         if (err) {
//             res.json(err);
//         } else {
//             const randomIndexes: number[] = [];

//             // เลือกสุ่ม 2 รูปจากผลลัพธ์ที่ได้
//             while (randomIndexes.length < 2) {
//                 const randomIndex = Math.floor(Math.random() * result.length);

//                 const previousIndex = randomIndexes[randomIndexes.length - 1];
//                 const selectedUserId = result[randomIndex].user_id;
//                 const previousUserId = previousIndex !== undefined ? result[previousIndex].user_id : undefined;

//                 // ตรวจสอบว่ารูปที่เลือกมีคนเดียวกันหรือไม่
//                 if (previousUserId !== selectedUserId) {
//                     randomIndexes.push(randomIndex);
//                 }
//             }

//             // นำรูปที่ได้มาแสดงผล
//             const randomImages = randomIndexes.map((index) => result[index]);
//             res.json(randomImages);
//         }
//     });
// });

// router.post('/', async (req: Request, res: Response) => {
//     try {
//         // Extract winnerPostId and loserPostId from request body
//         const { winnerPostId, loserPostId } = req.body;

//         // Fetch post data from the database based on winnerPostId and loserPostId
//         const [selectedWinner] = await queryAsync('SELECT * FROM post WHERE post_id = ?', [winnerPostId]);
//         const [selectedLoser] = await queryAsync('SELECT * FROM post WHERE post_id = ?', [loserPostId]);

//         // Check if both post exist
//         if (!selectedWinner || !selectedLoser) {
//             return res.status(404).json({ error: 'Winner or loser post not found' });
//         }

//         // Assume opponentEloRating is retrieved from the database or some other source
//         const opponentEloRating = 1200; // You need to replace this with your logic

//         // Calculate updated Elo ratings for the winner
//         const { updatedEloRatingWinner, oldRatingWinner } = calculateUpdatedEloRating(
//             selectedWinner.eloRating || 1200,
//             opponentEloRating,
//             true
//         );

//         // Calculate updated Elo ratings for the loser
//         const { updatedEloRatingLoser, oldRatingLoser } = calculateUpdatedEloRating(
//             selectedLoser.eloRating || 1200,
//             opponentEloRating,
//             false
//         );

//         // Update database with new Elo ratings for the winner
//         await queryAsync('UPDATE post SET eloRating = ? WHERE post_id = ?', [
//             updatedEloRatingWinner,
//             winnerPostId
//         ]);

//         // Update database with new Elo ratings for the loser
//         await queryAsync('UPDATE post SET eloRating = ? WHERE post_id = ?', [
//             updatedEloRatingLoser,
//             loserPostId
//         ]);

//         // Fetch updated winner post data
//         const [updatedWinner] = await queryAsync('SELECT * FROM post WHERE post_id = ?', [winnerPostId]);

//         // Fetch updated loser post data
//         const [updatedLoser] = await queryAsync('SELECT * FROM post WHERE post_id = ?', [loserPostId]);

//         // Return response with old-rating and new-rating
//         res.json({
//             message: 'Vote successfully recorded',
//             updatedWinner,
//             updatedEloRatingWinner: { oldRating: oldRatingWinner, newRating: updatedEloRatingWinner },
//             updatedLoser,
//             updatedEloRatingLoser: { oldRating: oldRatingLoser, newRating: updatedEloRatingLoser }
//         });
//     } catch (error) {
//         console.error('Error processing vote:', error);
//         res.status(500).json({ error: 'Error processing vote' });
//     }
// });


// // Utility function to execute SQL queries asynchronously
// async function queryAsync(query: string, params: any[]): Promise<any[]> {
//     return new Promise((resolve, reject) => {
//         conn.query(query, params, (err, result) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve(result);
//             }
//         });
//     });
// }

// function calculateUpdatedEloRating(initialEloRating: number, opponentEloRating: number, isWinner: boolean): { updatedEloRatingWinner: number, oldRatingWinner: number, updatedEloRatingLoser: number, oldRatingLoser: number } {
//     const K = 32;
//     const Ea = 1 / (1 + Math.pow(10, (opponentEloRating - initialEloRating) / 400));
//     const Eb = 1 / (1 + Math.pow(10, (initialEloRating - opponentEloRating) / 400));

//     // Calculate updated Elo ratings
//     const updatedEloRatingWinner = isWinner ? initialEloRating + K * (1 - Ea) : initialEloRating + K * (0 - Eb);

//     // For the loser, subtract the score
//     const updatedEloRatingLoser = isWinner ? opponentEloRating + K * (0 - Ea) : opponentEloRating + K * (1 - Eb);

//     return {
//         updatedEloRatingWinner,
//         oldRatingWinner: initialEloRating,
//         updatedEloRatingLoser,
//         oldRatingLoser: opponentEloRating
//     };
// }

// // router.get("/top-post", (req, res) => {
// //     conn.query('SELECT * FROM post ORDER BY score DESC', (err, result, fields) => {
// //         if (err) {
// //             console.error("Error fetching post:", err);
// //             res.status(500).json({ error: "Internal Server Error" });
// //         } else {
// //             res.json(result);
// //         }
// //     });
// // });


router.get("/top-post", (req, res) => {
    conn.query('SELECT * FROM post ORDER BY score DESC LIMIT 10', (err, result, fields) => {
        if (err) {
            console.error("Error fetching top post:", err);
            res.status(500).json({ error: "Internal Server Error" });
        } else {
            res.json(result);
        }
    });
});

