import jwt from 'jsonwebtoken';

// api/seller/login

export const sellerLogin = async(req,res)=>{
    try {
        const {email, password} =req.body;
    if(password === process.env.SELLER_PASSWORD && email === process.env.SELLER_EMAIL){
        const token = jwt.sign({email},process.env.JWT_SECRET,{expiresIn:'7d'});
// Set token as a cookie 
        res.cookie('sellerToken',token,{
            httpOnly:true, //JavaScript on the frontend cannot access this cookie (protects against XSS)
            secure:process.env.NODE_ENV === 'production',
            sameSite:process.env.NODE_ENV === 'production' ? 'none': 'strict',//csrf protection
            maxAge: 7*24*60*60*1000,
        });
        return res.json({ success: true,message:'Logged In'})
    }else{
        return res.json({success:false, message:'invalid credentials'})
    }
    } catch (error) {
        console.log(error.message)
        return res.json({success:false, message:error.message})
    }
}

//seller auth :/api/seller/is-auth
export const isSellerAuth = async (req, res) => {
    try {
        const token = req.cookies.sellerToken;

        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Optional: check decoded.email matches expected seller
        if (decoded.email !== process.env.SELLER_EMAIL) {
            return res.status(403).json({ success: false, message: 'Invalid seller' });
        }

        return res.json({ success: true });
    } catch (error) {
        console.log(error.message);
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};


//api/user/logout
export const sellerLogout = async (req,res)=>{
    try {
        res.clearCookie('sellerToken',{
            httpOnly:true,
            secure: process.env.NODE_ENV === 'production',
             sameSite:process.env.NODE_ENV === 'production' ? 'none': 'strict',//csrf protection
        })
        return res.json({success:true,message:'Logged Out'})
    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:error.message})
    }
}
