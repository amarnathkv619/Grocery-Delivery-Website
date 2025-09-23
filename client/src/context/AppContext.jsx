import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import { dummyProducts } from "../assets/assets";
import toast from "react-hot-toast";
import axios from "axios"

axios.defaults.withCredentials=true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

export const AppContext = createContext();

export const AppContextprovider =({children})=>{

    const currency= import.meta.env.VITE_CURRENCY;
    const navigate =useNavigate();
    const [user,setUser]=useState(null)
    const [isSeller,setisSeller]=useState(false)
    const [showUserLogin,setShowUserLogin]=useState(false)
    const [products,setProducts]=useState([])
    const [cartItems,setCartItems]=useState({})
    const [searchQuery,setSearchQuery]=useState({})

    //fetch seller status
    const fetchSeller= async ()=>{
    try {
    const{data} = await axios.get('/api/seller/is-auth')
    if(data.success){
        setisSeller(true)
    }
    else{
        
        setisSeller(false)
    }
} catch (error) {
    setisSeller(false)
    console.log(error.message)
}

    }

//fetch user auth status,userdata and cartitems
const fetchUser= async()=>{
    try {
        const{data} = await axios.get('/api/user/is-auth')
    if(data.success){
        setUser(data.user)
        setCartItems(data.user.cartItems)
    }
    else{
        
        setUser(null)
    }
    } catch (error) {
        console.log(error.message)
    }
}

//fetch all producrs
    const fetchProducts = async ()=>{
        try {
            const { data } = await axios.get('/api/product/list')
            if(data.success){
                setProducts(data.products)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    //add product to cart
    const addToCart=async(itemId)=>{
        let cartData =structuredClone(cartItems)

        if(cartData[itemId]){
            cartData[itemId]+=1;
        }else{
            cartData[itemId]=1;
        }
        setCartItems(cartData);
        toast.success("added to cart")
    }

    //update cart item qty
    const updateCartItem=(itemId,quantity)=>{
        let cartData=structuredClone(cartItems)
        cartData[itemId]=quantity;
        setCartItems(cartData)
        toast.success("cart updated")
    }

    //remove prodct
    const removeFromCart=(itemId)=>{
         let cartData=structuredClone(cartItems)
         
        if(cartData[itemId]){
            cartData[itemId]-=1;
        }
        if(cartData[itemId]==0){
            delete cartData[itemId]
        }
        toast.success("Removed Product From Card")
        setCartItems(cartData)

    }
    //get cart item count
    const getCartCount =()=>{
        let totalCount=0;
        for(const item in cartItems){
            totalCount += cartItems[item];

        }
        return totalCount;
    }

    //get cart total amount

   const getCartAmount = () => {
    let totalAmount = 0;
    for (const itemId in cartItems) {
        const itemInfo = products.find(product => product._id === itemId);
        if (itemInfo && cartItems[itemId] > 0) {
            totalAmount += itemInfo.offerPrice * cartItems[itemId];
        }
    }
    return Math.floor(totalAmount * 100) / 100;
};


    useEffect(()=>{
        fetchUser()
        fetchSeller()
        fetchProducts()
    },[])
//update database cart item
    useEffect(()=>{
    const updateCart = async()=>{
    try {
        const {data}= await axios.post('/api/cart/update',{cartItems})
        if(!data.success){
            toast.error(data.message)
        }
    } catch (error) {
        toast.error(error.message)
    }
}
if(user){
    updateCart()
}
},[cartItems])

    const value={navigate,user,setUser,setisSeller,isSeller,showUserLogin,setShowUserLogin,products,currency,addToCart,updateCartItem,removeFromCart,cartItems,searchQuery,setSearchQuery,getCartAmount,getCartCount,axios,fetchProducts,setCartItems,fetchUser}

    return <AppContext.Provider value={value}>

        {children}
    </AppContext.Provider>
}

export const useAppContext =()=>{
    return useContext(AppContext)
}