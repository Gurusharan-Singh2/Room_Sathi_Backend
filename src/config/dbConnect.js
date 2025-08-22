import mongoose from "mongoose";



const Dbconnect=async()=>{
  try {
    await mongoose.connect(`${process.env.URL}`)
    console.log("Db Connected");
    
    
  } catch (error) {
    console.log(error);
    
    
  }
}

export default Dbconnect
