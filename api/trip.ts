import express, { query } from "express";
import { conn } from "../dbconn";
import { TripPostRequest } from '../model/trip.post.req';
import mysql from 'mysql';
import {  queryAsync } from "../dbconn";


export const router = express.Router();

router.get("/", (req, res) => {
    if (req.query.id) {
        const id = req.query.id;
        const name = req.query.name;
        res.send(`Get in trip.ts Query id: ${id} ${name}`);
    } else {
        const sql = "SELECT * FROM trip";
        conn.query(sql, (err, result) => {
            if (err) {
                res.status(400).json(err);
            } else {
                res.json(result);
            }
        });
    }
});

router.get("/:id", (req, res) => {
    const id = req.params.id;
    //  bad 
    // const sql = "SELECT * FROM trip Where idx = "+ id;

    //good
    const sql = "SELECT * FROM trip Where idx = ?"
    conn.query(sql, [id], (err,result)=>{
        if(err){
            res.json(err);
        }else{
            res.json(result)
        }
    })
    res.send(`Get in trip.ts id: ${id}`);
});

router.post("/", (req, res) => {
    let trip: TripPostRequest = req.body;
    let sql =
      "INSERT INTO `trip`(`name`, `country`, `destinationid`, `coverimage`, `detail`, `price`, `duration`) VALUES (?,?,?,?,?,?,?)";
    sql = mysql.format(sql, [
      trip.name,
      trip.country,
      trip.destinationid,
      trip.coverimage,
      trip.detail,
      trip.price,
      trip.duration,
    ]);
    conn.query(sql, (err, result)=>{
        if(err){
            res.status(500).json({ error: err.message });
        } else {
            res.status(201).json({ affected_rows: result.affectedRows, last_id: result.insertId });
        }
    });
});


router.delete("/:id", (req, res) => {
    let id = +req.params.id;
    conn.query("delete from trip where idx = ?", [id], (err, result) => {
       if (err) throw err;
       res
         .status(200)
         .json({ affected_row: result.affectedRows });
    });
  });


//   router.put("/:id", (req, res) => {
//     let id = +req.params.id;
//     let trip: TripPostRequest = req.body;
//     let sql = "UPDATE `trip` SET `name` = ?, `country` = ?, `destinationid` = ?, `coverimage` = ?, `detail` = ?, `price` = ?, `duration` = ? WHERE `id` = ?";
//     sql = mysql.format(sql, [
//         trip.name,
//         trip.country,
//         trip.destinationid,
//         trip.coverimage,
//         trip.detail,
//         trip.price,
//         trip.duration,
//         id
//     ]);
//     conn.query(sql, (err, result) => {
//         if (err) throw err;
//         res
//           .status(201)
//           .json({ affected_row: result.affectedRows });
//       });
// });


//PUT /Trip/xxx + some flieds
router.put("/:id", async (req, res) => {
    let id = +req.params.id;
    let trip: TripPostRequest = req.body;
  
    let sql = mysql.format("select * from trip where idx = ?", [id]);
    sql = mysql.format(sql,[id]);
    const result = await queryAsync(sql);
    const jsonStr = JSON.stringify(result);
    const jsonObj = JSON.parse(jsonStr);
    const tripOriginal : TripPostRequest = jsonObj[0];

    //merge data
    const updateTrip = {...tripOriginal,...trip};

    sql = "update  `trip` set `name`=?, `country`=?, `destinationid`=?, `coverimage`=?, `detail`=?, `price`=?, `duration`=? where `idx`=?";
  sql = mysql.format(sql, [
    updateTrip.name,
    updateTrip.country,
    updateTrip.destinationid,
    updateTrip.coverimage,
    updateTrip.detail,
    updateTrip.price,
    updateTrip.duration,
    id,
  ]);
  conn.query(sql, (err, result) => {
    if (err) throw err;
    res.status(201).json({ affected_row: result.affectedRows });
  });
    res.status(200).json(JSON.stringify(result));
});












router.get("/searh/fields", (req,res)=>{
    const id = req.query.id;
    const name = req.query.name;
    const sql = "select * from trip where (idx IS NULL OR idx = ?) OR (name IS NULL OR name like ?)"
    //ถ้า ใช้ like ต้องมี % 
    conn.query(sql, [id, "%"+name+"%"] ,(err,result)=>{
        if(err){
            res.json(err);
        }else{
            res.json(result)
        }
    } )
});

router.post("/searh/price", (req,res)=>{
    const price = req.query.price;
    const id = req.query.id;
    const name = req.query.name;
    const sql = "select * from trip where (idx IS NULL OR idx = ?) OR (name IS NULL OR name like ?) OR (price IS NULL OR price <=10000)"
    conn.query(sql, [id, "%"+name+"%", price] ,(err,result)=>{
        if(err){
            res.json(err);
        }else{
            res.json(result)
        }
    } )
});
