import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'

function Sellerlogin() {
    const {isSeller, setisSeller, navigate, axios}= useAppContext()

    const[email, setEmail]=useState("")
    const[password, setPassword]=useState("")

    const onsSubmitHandler= async(event)=>{
       try {
        event.preventDefault();
        const {data} = await axios.post('/api/seller/login',{email,password})
        console.log("Login Response:", data); 
        if(data.success){
            setisSeller(true)
            navigate('/seller')
        }else{
            toast.error(data.message)
        }
       } catch (error) {
        toast.error(error.message)
       }
        
    }

    useEffect(()=>{
        if(isSeller){
            navigate("/seller")
        }
    },[isSeller])

  return !isSeller && (
    <form onSubmit={onsSubmitHandler} className='min-h-screen felx items-center text-sm text-gray-600'>

        <div className='flex flex-col gap-4 m-auto items-start p-8 py-12 w-80 sm:w-88 rounded-lg shadow-xl border border-gray-200 '>
            <p className='text-2xl font-medium m-auto'><span className='text-primary'>Seller</span>Login</p>
            <div className='w-full'>
                <p>Email</p>
                <input onChange={(e)=>setEmail(e.target.value)}  value={email}type="email" placeholder='Enter your email' className='border border-gray-200 rounded w-full p-2 mt-1 outline-primary' required />
            </div>
            <div className='w-full'>
                <p>Password</p>
                <input onChange={(e)=>setPassword(e.target.value)}  value={password}type="password" placeholder='Enter your password' 
                className='border border-gray-200 rounded w-full p-2 mt-1 outline-primary' required/>
            </div>
            <button className='bg-primary text-white w-full p-2 rounded-md cursor-pointer'>Login</button>
        </div>

    </form>
    
  )
}

export default Sellerlogin