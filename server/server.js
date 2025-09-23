import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import connectDB from './configs/db.js';
import 'dotenv/config.js';
import userRouter from './routes/userRoute.js';
import sellerRouter from './routes/sellerRoute.js';
import connectCloudinary from './configs/cloudinary.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import addressRouter from './routes/addressRoute.js';
import orderRouter from './routes/orderRoute.js';
import { stripeWebhooks } from './controllers/orderController.js'; 
const app = express();
const port = process.env.PORT || 4000;

// --- Webhook Route ---
// This MUST be the very first route definition and come BEFORE express.json()
app.post('/api/order/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhooks);


app.use(express.json());
app.use(cookieParser());

// --- CORS Configuration ---
const allowedOrigins = ['http://localhost:5173', 'https://grocery-delivery-website-beta.vercel.app'];
app.use(cors({ origin: allowedOrigins, credentials: true }));


app.get('/', (req, res) => res.send("Api is working"));
app.use('/api/user', userRouter);
app.use('/api/seller', sellerRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/address', addressRouter);
app.use('/api/order', orderRouter);


const startServer = async () => {
    try {
        await connectDB();
        await connectCloudinary();
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
    }
};

startServer();