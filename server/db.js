import { MongoClient, ObjectId } from "mongodb";

const client=new MongoClient("mongodb://127.0.0.1:27017/storageApp")

export async function  connectDB()
{
    await client.connect();
    const db=client.db();
    console.log("Database connected");
    return db;
}

//when ctrl+c kar ke app close karte hai

process.on('SIGINT',async()=>
{
    await client.close();
    console.log("Client Disconnected!")
    process.exit(0);
})

 