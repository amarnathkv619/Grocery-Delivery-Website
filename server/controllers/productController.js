import {v2 as cloudinary} from "cloudinary"
import Product from "../models/Product.js"
//api/product/add
export const addProduct = async (req,res)=>{
    try {
        let productData = JSON.parse(req.body.productData)//	Parses product details from frontend
        const images = req.files//Gets uploaded image files

        let imagesUrl = await Promise.all(//Waits for all uploads to complete
            images.map(async(item)=>{
                let result= await cloudinary.uploader.upload(item.path,{resource_type:'image'});//Uploads each image to Cloudinary
                return result.secure_url
            })
        )
        await Product.create({...productData, image: imagesUrl})//	Saves product in MongoDB
//Using the spread operator allows to take all key-value pairs from productData and spread them into a new object, and then add or override any additional fields like image
        res.json({success:true, message:"Product added"})
    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:error.message})
    }
        
}


//api/product/list
export const productList = async (req,res)=>{
    try {
        const products = await Product.find({})
        res.json({success:true,products})
    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:error.message})
        
    }
}

//get single product api/product/id
export const productById = async (req,res)=>{
    try {
        const {id} = req.body
        const product= await Product.findById(id)
        res.json({success:true, product})
    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:error.message})
    }
}

//Change Product in Stock  /api/product/stock
export const changeStock =async(req,res)=>{
    try {
        const {id, inStock} = req.body
        await Product.findByIdAndUpdate(id,{inStock})
        res.json({success:true,message:'Stock Updated'})
    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:error.message})
    }
}