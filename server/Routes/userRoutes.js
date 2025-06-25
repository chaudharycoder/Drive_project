import express from "express";
import checkAuth  from "../Middleware/authmiddleware.js";
import { ObjectId } from "mongodb";
const router=express.Router();

router.post('/register',async(req,res,next)=>{

const {name,email,password}=req.body;
const db=req.db;
const founduser=await db.collection('users').findOne({email:email});
if(founduser)
{
    return res.status(409).json({
        error: "User already exists",
        message: "A user with this email address already exists. Please try logging in or use a different email."
      })
}
try{
  const rootDirId=new ObjectId();
  const userId=new ObjectId()
const dircollection=await db.collection('directories');
await dircollection.insertOne(
  {
    _id:rootDirId,
    name:"root-"+email.split("@")[0],
    parentDirId:null,
    userId,
  }
);
await db.collection('users').insertOne({
   _id:userId,
    name,
    email,
    password,
    rootDirId,
});

res.json({message:"user created "});
}catch(err)
{
    next(err);
}
})
//login ke liye post route use karna ke convention hai kyuki we are creating seession id etc or we send a formdata to check where this user exist
router.post('/login',async(req,res)=>{
  const {email,password}=req.body;
  const db=req.db;
  const founduser= await db.collection('users').findOne({email:email,password:password});
 
  if (!founduser) {
    return res.status(401).json({ error: "Invalid credential" });
  }
  const uoid=founduser._id.toString();

  res.cookie('uid', uoid, {
    httpOnly: true,
    maxAge: 60 * 1000 * 60 * 24 * 7
  })
 return res.status(200).json({ message: "Logged in" });
 
})
router.get('/', checkAuth, (req, res) => {
  res.status(200).json({
    name: req.user.name,
    email: req.user.email,
  })
})
router.post('/logout', (req, res) => {
  res.clearCookie('uid')
  res.status(204).end()
})
export default router;