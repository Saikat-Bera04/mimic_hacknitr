import axios from 'axios';

export  async function signupUser (email:string,username:string, password:string){
    try{
        const res=await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/signup`,{
            email,
            username,
            password
        
        });
        return res.data;
    } catch (error) {
        console.log("Signup failed here ", error)
        throw error;
    }
}
export  async function signinUser(email:string, password:string){
  try{
    const res=await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/signin`,{
      email,
      password
    });
    return res.data;
  }
  catch(error){
    console.log("Signin failed ", error)
    throw error;
  }
}
export default {signinUser}