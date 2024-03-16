import express from "express";
import { conn } from "../dbconn"; // Assuming you have a db connection file named dbconn.js
import bodyParser from 'body-parser';
import { Request, Response, Router } from 'express';
export const router = express.Router();

router.use(bodyParser.json());