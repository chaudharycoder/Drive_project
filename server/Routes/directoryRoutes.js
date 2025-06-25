import express from "express";
import validateIdMiddleware from "../Middleware/validateIdMiddleware.js";
import { ObjectId } from "mongodb";
import {  rm} from "fs/promises";
  const router = express.Router();
  router.param("parentDirId",validateIdMiddleware);
  router.param("id",validateIdMiddleware);
  router.post("/:parentDirId?", async (req, res,next) => {
    const user=req.user
    const db=req.db;
    const parentDirId=req.params.parentDirId? new ObjectId(req.params.parentDirId) : user.rootDirId;

    const dirname = req.headers.dirname || "New Folder";
    const dircollection= db.collection("directories")
    try {
      const parentDir= await dircollection.findOne({_id:parentDirId})
     if(!parentDir)
     {
      return res.status(404).json({message:"Parent Directory Does not exist!"});
     }
     
     const savedDir =await dircollection.insertOne(
        {
          name: dirname,
          userId:user._id,
          parentDirId:new ObjectId(parentDirId),
        }
      )
   
      res.json({ message: "directories Created!" })
    } catch (err) {
   next(err);
    }
  });
  router.get("/:id?", async (req, res) => {
    const db=req.db;
    const user=req.user;
    const _id=req.params.id? new ObjectId(req.params.id) : user.rootDirId;
    const dircollection=db.collection('directories');
    const directoryData = await dircollection.findOne({_id});

    if(!directoryData)
    {
      return res.status(404).json({error:"Directory not found or you do not have access"})
    }
      if(user._id.toString()!==directoryData.userId.toString())
        {
          
          return res.status(401).json({error:"Not access to this"})
        }  
     
    const files = await db.collection('files').find({parentDirId:_id}).toArray();
    const directories=await dircollection.find({parentDirId:_id}).toArray();

     res.status(200).json({ ...directoryData, directories:directories.map((dir)=>({...dir,id:dir._id})),files:files.map((file)=>({...file,id:file._id}))})



  })
  router.patch("/:id",async(req,res,next)=>
  {
    const {id}=req.params;
    const {newDirName}=req.body;
    const db=req.db;
  
    try{
    const folder=await db.collection('directories').findOne({_id:new ObjectId(id)});
   
    if (folder.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to rename this directories!" });
    }
 await db.collection('directories').updateOne({_id:new ObjectId(id)},{$set:{name:newDirName}});

    res.json({ message: "Renamed folder" });
    }
    catch(err)
    {
      next(err);
    }
  })

  router.delete("/:id",async(req,res,next)=>
  {
    const {id}=req.params;
    const db=req.db;
    const user=req.user;
    const filecollection=db.collection('files');
    const dircollection=db.collection('directories'); 
    const dirObjId=new ObjectId(id);
    const dirdata=await dircollection.findOne({_id:dirObjId,userId:user._id},{projection:{_id:1}});
    if(!dirdata)
    {
      return res.status(404).json({error:"Directory not found!"});
    }
 async function getDirectoryContents(id)
  {
    let files=await filecollection.find({parentDirId:id},{projection:{ext:1}}).toArray();
 let directories=await dircollection.find({parentDirId:id},{projection:{_id:1}}).toArray();
    for(const {_id,name} of directories)
    {
    const {files:childFiles,directories:childDirectories}=await getDirectoryContents(new ObjectId(_id));
    files=[...files,...childFiles];
    directories=[...directories,...childDirectories];
    }
   
    return {files,directories}
  }
  const {files,directories}=await getDirectoryContents(dirObjId);
  for(const {_id,ext} of files)
  {
    await rm(`./storage/${_id.toString()}${ext}`);
  }
  await filecollection.deleteMany({_id:{$in:files.map(({_id})=>(_id))}})
  await dircollection.deleteMany({_id:{$in:[...directories.map(({_id})=>(_id)),dirObjId]}})

  return res.status(200).json({message:"delete successfully"})
 
  })
export default router;


