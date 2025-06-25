import express from "express";
import path from 'path';
import { createWriteStream} from "fs";
import {  rm} from "fs/promises";

import validateIdMiddleware from "../Middleware/validateIdMiddleware.js";
import { ObjectId } from "mongodb";
import { error } from "console";
const router=express.Router();

router.param("parentDirId",validateIdMiddleware);
router.param("id", validateIdMiddleware);
router.get("/:id", async(req, res) => {
    const {id}=req.params;
   const db=req.db;
   const user=req.user;
   const filecollection=db.collection('files');
    try{
    const file=await filecollection.findOne({_id:new ObjectId(id),userId:user._id});
    const filepath=`${process.cwd()}/storage/${id}${file.ext}`;
    if (req.query.action === "download") {
      // res.set("Content-Disposition", `attachment; filename="${file.name}"`);
      return res.download(filepath,file.name);
    }
//    console.log("HII",`${import.meta.dirname}/storage/${filespath}`)

   return res.sendFile(filepath);
  }catch(err)
  {
   return  res.status(404).json({err:"No file found"});
  }
  });
  
router.post("/:parentDirId?", async(req, res,next) => {
    // console.log(req.par)
    const db=req.db;
    const parentDirId = req.params.parentDirId || req.user.rootDirId;
    const dircollection= db.collection('directories');
    const filecollection= db.collection('files');
    const parentDirData = await dircollection.findOne({_id:new ObjectId(parentDirId),userId:req.user._id});
    // Check if parent directories exists
    if (!parentDirData) {
      return res.status(404).json({ error: "Parent directories not found!" });
    }
    const filename = req.headers.filename || "untitled";
    const ext = path.extname(filename);
    const savedfile=await filecollection.insertOne({
      ext,
      name:filename,
      parentDirId:new ObjectId(parentDirId),
      userId:req.user._id
  })
  const fileid=savedfile.insertedId.toString();
    const fullFileName = `${fileid}${ext}`;;
    const writeStream = createWriteStream(`./storage/${fullFileName}`);
    req.pipe(writeStream);
    req.on("end",() => {
      return res.status(201).json({ message: "File Uploaded" });
    });
    req.on("error",async()=>{
      console.log("error")
     await filecollection.deleteOne({_id:new ObjectId(fileid)})
     return res.status(404).json({ message: "Could not Upload File" });
    })
  });
  // Update
router.patch("/:id", async (req, res,next) => {
    // const filepath = path.join('/',req.params[0]);
    const {id}=req.params;
    const user=req.user;
    const db=req.db;
    const filecollection=db.collection('files');
    const file=await filecollection.findOne({_id:new ObjectId(id),userId:user._id});
if(!file)
{
  return res.status(404).json({error:"File not found!"})
}
  
    const {newFilename} = req.body;

    // await rename(`./storage/${file.name}`, `./storage/${req.body.newFilename}`);
   try{
    await filecollection.updateOne({_id:file._id},{$set:{name:newFilename}})
    return res.status(200).json({ message: "Renamed" });
   }catch(err)
   {
    err.status=500;
    next(err);
   }
    
  });
  
  // Delete
router.delete("/:id", async (req, res,next) => {
    // const filename = path.join('/',req.params[0]);
    const {id}=req.params;
   
    const user=req.user;
    const db=req.db;
    const filecollection=db.collection('files');
const file=await filecollection.findOne({_id:new ObjectId(id),userId:user._id});
if(!file)
  {
    return res.status(404).json({error:"File not found!"})
  }
      try {
      const filePath = `./storage/${id}${file.ext}`;
     await filecollection.deleteOne({_id:file._id});
      await rm(filePath);
      res.json({ message: "File Deleted Successfully" });
    } catch (err) {
      next(err);
    }
  });

  export default router;                             