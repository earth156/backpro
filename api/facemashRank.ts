import express, { Request, Response } from "express";
import { conn, queryAsync } from  "../dbconn"; // ถ้ามีไฟล์การเชื่อมต่อฐานข้อมูลชื่อ dbconn.js
import bodyParser from 'body-parser';
import mysql from 'mysql'; // Import mysql module
import { ParsedQs } from "qs";
import axios from 'axios';
import cors from 'cors'; // เพิ่มการนำเข้า cors


export const router = express.Router();
router.use(cors()); // เพิ่ม middleware cors ที่ใช้งาน
router.use(bodyParser.json());








