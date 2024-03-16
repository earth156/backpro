// import express from "express";
// import multer from "multer";
// import path from "path";
// export const router = express.Router();

// //router = ตัวจัดการเส้นทาง
// router.get("/", (req, res) => {
//   res.send("Get in upload.ts");
// });

// // class FileMiddleware {
// //   filename = "";
// //   public readonly diskLoader = multer({
// //     storage: multer.diskStorage({
// //       //destination = folder to be seved ใช้เชฟไฟล์
// //       destination: (_req, _file, cb) => {
// //         cb(null, path.join(__dirname, "../uploads"));
// //       },
// //       //เราจะสร้างชื่อไฟล์ที่ไม่ซ้ำ 
// //       filename: (req, file, cb) => {
// //         const uniqueSuffix =
// //           Date.now() + "-" + Math.round(Math.random() * 10000);
// //         this.filename = uniqueSuffix + "." + file.originalname.split(".").pop();
// //         cb(null, this.filename);
// //       },
// //     }),
// //     limits: {
// //       fileSize: 67108864, // 64 MByte
// //     },
// //   });
// // }
// // //อับโหลด
// // const fileUpload = new FileMiddleware();
// // router.post("/", fileUpload.diskLoader.single("File"),(req, res )=>{
// //   res.status(200).json({
// //     filename : '/upload/'+fileUpload.filename
// //   });
// // })

// import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// // แนบไฟล์ไปยัง Cloud Storage
// const storageRef = ref(storage, 'path/to/file.jpg');
// const uploadTask = uploadBytesResumable(storageRef, file);

// // ดึง URL ของไฟล์ที่อัปโหลด
// const url = await getDownloadURL(storageRef);


// class FileMiddleware {
//   filename = "";
//   public readonly diskLoader = multer({
//     storage: multer.diskStorage({
//      storage : multer.memoryStorage()
//     }),
//     limits: {
//       fileSize: 67108864, // 64 MByte
//     },
//   });
// }
// //อับโหลด
// const fileUpload = new FileMiddleware();
// router.post("/", fileUpload.diskLoader.single("File"),(req, res )=>{
//   //upload to filebase storage
//   const  filename =   Math.round(Math.random() * 10000)+ ".png";
//   const storageRef = ref(Storage, "/image/" + filename);
//   const metaData = {contentType : req.file!.mimetype};
//   const snapshot = await uploadBytesResumable(storageRef, req.file!.buffer , metaData);

//   const url = await getDownloadURL(snapshot.ref)
//   res.status(200).json({
//     filename : '/upload/'+fileUpload.filename
//   });
// })