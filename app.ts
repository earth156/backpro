// import express from "express";
// import { router as index } from "./api/index";
// import { router as trip } from "./api/trip";
// import bodyParser from "body-parser";
// import { router as facemash } from "./api/facemash";
// // import {router as upload} from "./api/upload";
// import cors from "cors";
// export const app = express();

// //*ใครก็สามารถเรียกได้
// app.use(
//     cors({
//       origin: "*",
//     })
//   );
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// // app.use(bodyParser.text());
// // app.use("/", index);
// // app.use("/trip", trip);
// app.use("/facemash", facemash);
// app.use("/facemash/vote", vote);
// // app.use("/upload",upload);
// // app.use("/uploads", express.static("uploads"));

import express from "express";
import cors from "cors";
import path from "path";
import multer from "multer";
import { router as index } from "./api/index";
import { router as facemash } from "./api/facemash";
import { router as ranking } from "./api/facemashRank";
// import { router as uploadPost } from "./api/facemash-upload";
import { router as vote } from "./api/facemashVote";
// import { router as profile } from "./api/facemash-profile";

export const app = express();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/", index);
app.use("/facemash", facemash);
app.use("/facemash/vote", vote);
app.use("/facemash/ranking", ranking);
// app.use("/facemash/profile", profile);
// app.use("/facemash/upload", uploadPost);