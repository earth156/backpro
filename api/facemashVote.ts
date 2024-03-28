import express from "express";
import { conn } from "../dbconn"; // Assuming you have a db connection file named dbconn.js
import bodyParser from 'body-parser';
import { Request, Response, Router } from 'express';
export const router = express.Router();


router.use(bodyParser.json());

router.get("/", (req, res) => {
    conn.query('SELECT * FROM post INNER JOIN users ON post.user_id = users.user_id;', (err, result, fields) => {
        if (err) {
            res.json(err);
        } else {
            const randomIndexes: number[] = [];

            while (randomIndexes.length < 2) {
                const randomIndex = Math.floor(Math.random() * result.length);

                const previousIndex = randomIndexes[randomIndexes.length - 1];
                const selectedUserId = result[randomIndex].user_id;
                const previousUserId = previousIndex !== undefined ? result[previousIndex].user_id : undefined;

                if (previousUserId !== selectedUserId) {
                    randomIndexes.push(randomIndex);
                }
            }

            const randomImages = randomIndexes.map((index) => result[index]);
            res.json(randomImages);
        }
    });
});


router.post('/', async (req: Request, res: Response) => {
    try {
        const { winnerPostId, loserPostId } = req.body;

        // 2. ตรวจสอบโพสต์ผู้ชนะและผู้แพ้:
        const [selectedWinner] = await queryAsync('SELECT * FROM post WHERE post_id = ?', [winnerPostId]);
        const [selectedLoser] = await queryAsync('SELECT * FROM post WHERE post_id = ?', [loserPostId]);

        if (!selectedWinner || !selectedLoser) {
            return res.status(404).json({ error: 'Winner or loser post not found' });
        }

        // 3. คำนวณ Elo Rating:
        const opponentEloRatingWinner = selectedWinner.score;
        const opponentEloRatingLoser = selectedLoser.score;

        const { updatedEloRating: updatedEloRatingWinner, oldRating: oldRatingWinner } = calculateUpdatedEloRating(
            selectedWinner.score,
            opponentEloRatingWinner,
            true
        );

        const { updatedEloRating: updatedEloRatingLoser, oldRating: oldRatingLoser } = calculateUpdatedEloRating(
            selectedLoser.score,
            opponentEloRatingLoser,
            false
        );

        // 4. อัปเดต Elo Rating และคะแนนในฐานข้อมูล:
        await queryAsync('UPDATE post SET score = ? WHERE post_id = ?', [updatedEloRatingWinner, winnerPostId]);
        await queryAsync('UPDATE post SET score = ? WHERE post_id = ?', [updatedEloRatingLoser, loserPostId]);
        
        // 5. ดึงข้อมูลโพสต์ที่อัปเดต:
        const [updatedWinner] = await queryAsync('SELECT * FROM post WHERE post_id = ?', [winnerPostId]);
        const [updatedLoser] = await queryAsync('SELECT * FROM post WHERE post_id = ?', [loserPostId]);

            // 6. ดึงข้อมูลคะแนนโพสต์ทั้งหมด:
            const allpostScores = await queryAsync('SELECT post_id, score FROM post', []);

// อัปเดตหรือสร้างโหวตใหม่
for (const postcore of allpostScores) {
    const initialEloRating = postcore.score;
    const currentTime = new Date();

    // เก็บค่าของคะแนนในโพสต์เป็นคะแนนใหม่ของโหวต
    let updatedEloRating = initialEloRating; // ค่าเริ่มต้นให้เป็นคะแนนเดิมของโพสต์
    if (postcore.post_id === winnerPostId) {
        updatedEloRating = updatedEloRatingWinner; // ใช้คะแนนที่อัปเดตของโพสต์ผู้ชนะ
    } else if (postcore.post_id === loserPostId) {
        updatedEloRating = updatedEloRatingLoser; // ใช้คะแนนที่อัปเดตของโพสต์ผู้แพ้
    }

    // เมื่อโพสต์ตรงกับโพสต์ผู้ชนะหรือผู้แพ้ ให้ทำการอัปเดตหรือสร้างโหวตใหม่
    if (postcore.post_id === winnerPostId || postcore.post_id === loserPostId) {
        await queryAsync('INSERT INTO vote (post_id, newRating, oldRating, time) VALUES (?, ?, ?, ?)', [
            postcore.post_id,
            updatedEloRating,
            initialEloRating,
            currentTime,
        ]);

        // อัปเดตคะแนนใน vote เฉพาะรายการที่เกี่ยวข้องกับโพสต์ที่โหวต
        await queryAsync('UPDATE vote SET newRating = ? WHERE post_id = ?', [updatedEloRating, postcore.post_id]);
    }
}

            // 7. อัปเดตอันดับของโพสต์ในตาราง "vote"
        // เลือกข้อมูลคะแนนจากตาราง "post"
        const allpostScoresCopy = await queryAsync('SELECT post_id, score FROM post', []);

        // คัดลอกข้อมูลคะแนนไปยังตัวแปรใหม่เพื่อไม่ให้มีการเปลี่ยนแปลงค่าตั้งต้น
        const allpostScoress = [...allpostScoresCopy];

        // เรียงลำดับโพสต์ตามคะแนนจากมากไปน้อย
        allpostScores.sort((a, b) => b.score - a.score);

        // กำหนดอันดับให้แต่ละโพสต์ในตาราง "vote" โดยใช้คะแนนจากตาราง "post"
        for (let i = 0; i < allpostScoress.length; i++) {
            const postId = allpostScoress[i].post_id;
            const rank = i + 1;

            // อัปเดตอันดับในตาราง "vote"
            await queryAsync('UPDATE vote SET newRank = ? WHERE post_id = ?', [rank, postId]);
        }



        // อัปเดต oldRating ในตาราง "vote" สำหรับโพสต์ผู้ชนะและโพสต์ผู้แพ้
        await queryAsync('UPDATE vote SET oldRating = ? WHERE post_id = ?', [oldRatingWinner, winnerPostId]);
        await queryAsync('UPDATE vote SET oldRating = ? WHERE post_id = ?', [oldRatingLoser, loserPostId]);

        // ส่งข้อมูลตอบกลับหลังจากการประมวลผลโหวต
        res.json({
            message: 'Vote successfully recorded',
            updatedWinner,
            updatedEloRatingWinner: { oldRating: oldRatingWinner, newRating: updatedEloRatingWinner },
            updatedLoser,
            updatedEloRatingLoser: { oldRating: oldRatingLoser, newRating: updatedEloRatingLoser },
        });
            } catch (error) {
                console.error('Error processing vote:', error);
                res.status(500).json({ error: 'Error processing vote' });
            }
        });


// ฟังก์ชันทำ query ในฐานข้อมูล แบบ Promise:
async function queryAsync(query: string, params: any[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
        conn.query(query, params, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

function calculateUpdatedEloRating(initialEloRating: number, opponentEloRating: number, isWinner: boolean): { updatedEloRating: number, oldRating: number } {
    const K = 32;
    const Ea = 1 / (1 + Math.pow(10, (opponentEloRating - initialEloRating) / 400));
    const Eb = 1 / (1 + Math.pow(10, (initialEloRating - opponentEloRating) / 400));

    // เก็บค่าเดิมของ Elo rating
    const oldRating = initialEloRating;

    // คำนวณ Elo rating ใหม่
    const updatedEloRating = isWinner ? initialEloRating + K * (1 - Ea) : initialEloRating + K * (0 - Eb);

    return {
        updatedEloRating,
        oldRating,
    };
}

// router.get("/", (req, res) => {
//   conn.query(
//     "SELECT * FROM post INNER JOIN users ON post.user_id = users.user_id;",
//     (err, result, fields) => {
//       if (err) {
//         res.json(err);
//       } else {
//         const randomIndexes: number[] = [];

//         while (randomIndexes.length < 2) {
//           const randomIndex = Math.floor(Math.random() * result.length);

//           const previousIndex = randomIndexes[randomIndexes.length - 1];
//           const selectedUserId = result[randomIndex].user_id;
//           const previousUserId =
//             previousIndex !== undefined
//               ? result[previousIndex].user_id
//               : undefined;

//           if (previousUserId !== selectedUserId) {
//             randomIndexes.push(randomIndex);
//           }
//         }

//         const randomImages = randomIndexes.map((index) => result[index]);
//         res.json(randomImages);
//       }
//     }
//   );
// });
// router.post("/", async (req: Request, res: Response) => {
//   try {
//     const { winnerPostId, loserPostId } = req.body;

//     const startDate = new Date();
//     startDate.setHours(0, 0, 0, 0);
//     startDate.setDate(startDate.getDate() + 1); // เพิ่มวันที่ 1 ให้กับวันเริ่มต้น
    
//     const endDate = new Date();
//     endDate.setHours(23, 59, 59, 999);
//     endDate.setDate(endDate.getDate() + 1); // เพิ่มวันที่ 1 ให้กับวันสิ้นสุด
    
//     const formattedStartDate = startDate.toISOString();
//     const formattedEndDate = endDate.toISOString();
    

//     const existingvote = await queryAsync(
//         "SELECT * FROM vote WHERE time >= ? AND time <= ?",
//         [formattedStartDate, formattedEndDate]
//       );      
//   console.log("Vote Start Date: ", formattedStartDate, "Vote End Date: ", formattedEndDate);
  


//   if (existingvote.length === 0) {
//     const allpost = await queryAsync(
//       "SELECT post_id, score, newRank FROM post",
//       []
//     );
//     console.log(" existingvote: ",  existingvote); 

//     for (const post of allpost) {
//       const { post_id, score, newRank } = post;
//       // เปลี่ยนคำสั่ง SQL เพื่อใช้ CURRENT_TIMESTAMP() ตรงๆ และไม่ใช้ CURRENT_DATE()
//       await queryAsync(
//         "INSERT INTO vote (post_id, newRating, oldRating, newRank, time) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP())",
//         [post_id, score, score, newRank]
//       );
//     }

//   }
//   else {
//     // ถ้ามี vote ในวันนั้นแล้ว
//     const newpost = await queryAsync(
//       "SELECT post_id FROM post WHERE NOT EXISTS (SELECT * FROM vote WHERE vote.post_id = post.post_id AND DATE(vote.time) >= ? AND DATE(vote.time) <= ?)",
//       [formattedStartDate, formattedEndDate]
//     );
    
//     for (const newPost of newpost) {
//       // เพิ่มเฉพาะ post_id ที่มาใหม่ในวันนั้น
//       const existingVote = await queryAsync(
//         "SELECT * FROM vote WHERE post_id = ? AND DATE(time) >= ? AND DATE(time) <= ?",
//         [newPost.post_id, formattedStartDate, formattedEndDate]
//       );

//       if (existingVote.length === 0) {
//         await queryAsync(
//           "INSERT INTO vote (post_id, newRating, oldRating, newRank, time) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP())",
//           [newPost.post_id, 1200, 1200, 0] // สามารถกำหนดค่าใดๆ ที่ต้องการสำหรับ newRating, oldRating, และ newRank ได้ตามความเหมาะสม
//         );
//       }
//     }
// }

    

//     // 2. ตรวจสอบโพสต์ผู้ชนะและผู้แพ้:
//     const [selectedWinner] = await queryAsync(
//       "SELECT * FROM post WHERE post_id = ?",
//       [winnerPostId]
//     );
//     const [selectedLoser] = await queryAsync(
//       "SELECT * FROM post WHERE post_id = ?",
//       [loserPostId]
//     );

//     if (!selectedWinner || !selectedLoser) {
//       return res.status(404).json({ error: "Winner or loser post not found" });
//     }

//     // 3. คำนวณ Elo Rating:
//     const opponentEloRatingWinner = selectedWinner.score;
//     const opponentEloRatingLoser = selectedLoser.score;

//     const {
//       updatedEloRating: updatedEloRatingWinner,
//       oldRating: oldRatingWinner,
//     } = calculateUpdatedEloRating(
//       selectedWinner.score,
//       opponentEloRatingLoser,
//       true
//     );

//     const {
//       updatedEloRating: updatedEloRatingLoser,
//       oldRating: oldRatingLoser,
//     } = calculateUpdatedEloRating(
//       selectedLoser.score,
//       opponentEloRatingWinner,
//       false // ต้องแน่ใจว่า isWinner ถูกตั้งค่าเป็น false เมื่อเรียกใช้สำหรับผู้แพ้
//     );

//         // 4. อัปเดต Elo Rating และคะแนนในฐานข้อมูล:
//         console.log(
//             `Before update - Post-id: ${winnerPostId}, Winner: ${selectedWinner.score}, Loser: ${selectedLoser.score}`
//         );
        
//         await queryAsync("UPDATE post SET score = ? WHERE post_id = ?", [
//             updatedEloRatingWinner,
//             winnerPostId,
//         ]);
//         await queryAsync("UPDATE post SET score = ? WHERE post_id = ?", [
//             updatedEloRatingLoser,
//             loserPostId,
//         ]);
        
//         console.log(
//             `After update - Post-id: ${loserPostId}, Winner: ${updatedEloRatingWinner}, Loser: ${updatedEloRatingLoser}`
//         );
  

//     // 5. ดึงข้อมูลโพสต์ที่อัปเดต:
//     const [updatedWinner] = await queryAsync(
//       "SELECT * FROM post WHERE post_id = ?",
//       [winnerPostId]
//     );
//     const [updatedLoser] = await queryAsync(
//       "SELECT * FROM post WHERE post_id = ?",
//       [loserPostId]
//     );

//     // Update data for loser
//     await queryAsync(
//       "UPDATE vote SET newRating = ?, oldRating = ?, time = CURRENT_TIMESTAMP() WHERE post_id = ? AND DATE(time) = CURRENT_DATE()",
//       [updatedEloRatingLoser, oldRatingLoser, loserPostId]
//     );

//     // Update data for winner
//     await queryAsync(
//       "UPDATE vote SET newRating = ?, oldRating = ?, time = CURRENT_TIMESTAMP() WHERE post_id = ? AND DATE(time) = CURRENT_DATE()",
//       [updatedEloRatingWinner, oldRatingWinner, winnerPostId]
//     );

// // 6. อัปเดตอันดับของโพสต์ในตาราง "vote" และ "post"
// const allpostScores = await queryAsync(
//   "SELECT post_id, score FROM post",
//   []
// );

// // เรียงลำดับโพสต์ตามคะแนนจากมากไปน้อย
// const allpostOrdered = allpostScores.sort((a, b) => b.score - a.score);

// // อัปเดตแรงค์สำหรับทุกโพสต์ในวันปัจจุบัน
// for (let i = 0; i < allpostOrdered.length; i++) {
//   const postId = allpostOrdered[i].post_id;
//   const rank = i + 1;

//   // อัปเดตแรงค์ในตาราง "vote"
//   await queryAsync(
//     "UPDATE vote SET newRank = ? WHERE post_id = ? AND DATE(time) = CURRENT_DATE()",
//     [rank, postId]
//   );
// }
// // ดึง rank จากตาราง "vote"
// const voteRank = await queryAsync(
//   "SELECT post_id, newRank, newRating FROM vote WHERE DATE(time) = CURRENT_DATE()",[]
// );

// // อัปเดตแรงค์ในตาราง "post" โดยใช้ข้อมูลจากตาราง "vote"
// for (const vote of voteRank) {
//   const postId = vote.post_id;
//   const rank = vote.newRank;
//   const score = vote.newRating;
//   // อัปเดตแรงค์ในตาราง "post"
//   await queryAsync(
//     "UPDATE post SET newRank = ?, score = ?  WHERE post_id = ?",
//     [rank, score, postId]
//   );
// }



//     // Update old ratings in the vote table for the winner and loser with the current date
//     await queryAsync(
//       "UPDATE vote SET oldRating = ? WHERE post_id = ? AND DATE(time) = CURRENT_DATE()",
//       [oldRatingWinner, winnerPostId]
//     );
//     await queryAsync(
//       "UPDATE vote SET oldRating = ? WHERE post_id = ? AND DATE(time) = CURRENT_DATE()",
//       [oldRatingLoser, loserPostId]
//     );

//     res.json({
//       message: "Vote successfully recorded",
//       updatedWinner,
//       updatedEloRatingWinner: {
//         oldRating: oldRatingWinner,
//         newRating: updatedEloRatingWinner,
//       },
//       updatedLoser,
//       updatedEloRatingLoser: {
//         oldRating: oldRatingLoser,
//         newRating: updatedEloRatingLoser,
//       },
//     });
//   } catch (error) {
//     console.error("Error processing vote:", error);
//     res.status(500).json({ error: "Error processing vote" });
//   }
// });

// // ฟังก์ชันทำ query ในฐานข้อมูล แบบ Promise:
// async function queryAsync(query: string, params: any[]): Promise<any[]> {
//   return new Promise((resolve, reject) => {
//     conn.query(query, params, (err, result) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(result);
//       }
//     });
//   });
// }

// function calculateUpdatedEloRating(
//   initialEloRating: number,
//   opponentEloRating: number,
//   isWinner: boolean
// ): { updatedEloRating: number; oldRating: number } {
//   const K = 32;
//   const Ea = 1 / (1 + Math.exp(-(opponentEloRating - initialEloRating) / 400));
//   const Eb = 1 / (1 + Math.exp(-(initialEloRating - opponentEloRating) / 400));

//   console.log("Ea: ", Ea);
//   console.log("Eb: ", Eb);

//   // เก็บค่าเดิมของ Elo rating
//   const oldRating = initialEloRating;

//   // คำนวณ Elo rating ใหม่
//   const updatedEloRating = isWinner
//     ? initialEloRating + K * (1 - Ea)
//     : initialEloRating - K * Eb;

//   return {
//     updatedEloRating,
//     oldRating,
//   };
// }

// function calculateNewRating(score: any) {
//   throw new Error("Function not implemented.");
// }