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

        const allPostsScores = await queryAsync('SELECT post_id, score FROM post', []);

        for (const postScore of allPostsScores) {
            const initialEloRating = postScore.score;

            // ในฟังก์ชัน vote
            const currentTime = new Date(); // สร้างวัตถุ Date ที่มีค่าเป็นเวลาปัจจุบัน
            await queryAsync('INSERT INTO vote (post_id, newRating, oldRating, time) VALUES (?, ?, ?, ?)', [
                postScore.post_id,
                postScore.score,
                initialEloRating,
                currentTime, // ใช้ค่าเวลาปัจจุบันในการ insert
            ]);

        }

        // 7. อัปเดตอันดับของโพสต์ในตาราง "votes"
        const allPostsOrdered = allPostsScores.sort((a, b) => b.score - a.score);
        for (let i = 0; i < allPostsOrdered.length; i++) {
            const postId = allPostsOrdered[i].post_id;
            const rank = i + 1;

            await queryAsync('UPDATE vote SET newRank = ? WHERE post_id = ?', [rank, postId]);
        }

        await queryAsync('UPDATE vote SET oldRating = ? WHERE post_id = ?', [ oldRatingWinner, winnerPostId]);
        await queryAsync('UPDATE vote SET oldRating = ? WHERE post_id = ?', [oldRatingLoser, loserPostId]);

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