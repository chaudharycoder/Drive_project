import express from "express";
import cors from 'cors';
import directoryRoutes from './Routes/directoryRoutes.js';
import fileRoutes from './Routes/fileRoutes.js';
import userRoutes from './Routes/userRoutes.js';
import checkAuth  from "./Middleware/authmiddleware.js";
import cookieParser from "cookie-parser";
import { connectDB } from "./db.js";

try{
  const db=await connectDB();
  console.log("Database Name:",db.databaseName);
  const app = express();



app.use(cookieParser())
app.use(express.json());
app.use(cors(
  {
    origin:'http://localhost:5173',
    credentials:true,
  }
));
app.use((req,res,next)=>{
  req.db=db;
  next();
})
app.use('/directory',checkAuth,directoryRoutes);
app.use('/file',checkAuth,fileRoutes);
app.use('/user',userRoutes)

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: "Something went wrong!" });
});

app.listen(4000, () => {
  console.log(`Server Started`);
});
}
catch(error)
{
  console.log("Could not connect to database!")
  console.log(error)
}

// Enabling CORS
// app.use((req, res, next) => {
//   res.set({
//     "Access-Control-Allow-Origin": "*",
//     "Access-Control-Allow-Methods": "*",
//     "Access-Control-Allow-Headers": "*",
//   });
//   next();
// });

// Create

// app.get("/directory", async (req, res) => {
//   const filesList = await readdir("./storage");
//   const obj=[];
//   for(const item of filesList)
//   {
//     const stats=await stat(`./storage/${item}`);
//     if(stats.isDirectory())
//     {
//       obj.push(
//         {
//           name:item,
//           isdir:true
//         }
//       )
//     }
//     else{
//       obj.push(
//         {
//           name:item,
//           isdir:false
//         }
//       )
//     }
//   }

  
//   console.log(filesList)
//   res.json(obj);
// });

// Read





