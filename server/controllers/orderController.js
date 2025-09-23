import mongoose from "mongoose";
import Order from "../models/Order.js"
import Product from "../models/Product.js"
import stripe from "stripe"
import User from "../models/User.js"
// cod    /api/order/cod
export const placeOrderCOD = async (req,res)=>{
    try {
        const userId = req.user.id;
const { items, address } = req.body;
        if(!address|| items.length===0){
            return res.json({success:false,message:'Invalid Data'})
        }
        // calculate amount using Items
        let amount = await items.reduce(async(acc,item)=>{
             const product = await Product.findById(item.product)
             return (await acc) + product.offerPrice * item.quantity
        },0)
        // add tax charge (2%)
        amount +=Math.floor(amount*0.02)
        await Order.create({
            userId,
            items,
            amount,
            address,
            payementType:'COD',
        })
        return res.json({success:true,message:'Order Placed Successfully'})
    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:error.message})
    }
}
//given by gpt
// export const placeOrderCOD = async (req, res) => {
//   try {
//     const { userId, items, address } = req.body;

//     if (!address || items.length === 0) {
//       return res.json({ success: false, message: "Invalid Data" });
//     }

//     // Validate product IDs and calculate amount
//     let amount = 0;

//     for (const item of items) {
//       if (!mongoose.Types.ObjectId.isValid(item.product)) {
//         return res.json({ success: false, message: `Invalid product ID: ${item.product}` });
//       }

//       const product = await Product.findById(item.product);
//       if (!product) {
//         return res.json({ success: false, message: `Product not found: ${item.product}` });
//       }

//       amount += product.offerPrice * item.quantity;
//     }

//     amount += Math.floor(amount * 0.02); // Add tax

//     await Order.create({
//       userId,
//       items,
//       amount,
//       address,
//       payementType: "COD",
//     });

//     return res.json({ success: true, message: "Order Placed Successfully" });
//   } catch (error) {
//     console.log(error.message);
//     res.json({ success: false, message: error.message });
//   }
// };

export const placeOrderStripe = async (req,res)=>{
    try {
        const userId = req.user.id;
const { items, address } = req.body;
        const {origin} = req.headers;

        if(!address|| items.length===0){
            return res.json({success:false,message:'Invalid Data'})
        }
        let productData = [];
        // calculate amount using Items
        let amount = await items.reduce(async(acc,item)=>{
             const product = await Product.findById(item.product);
             productData.push({
                name: product.name,
                price:product.offerPrice,
                quantity:item.quantity,
             });
             return (await acc) + product.offerPrice * item.quantity
        },0)
        // add tax charge (2%)
        amount +=Math.floor(amount*0.02)
        const order = await Order.create({
            userId,
            items,
            amount,
            address,
            payementType:'Online',
        });
        // stripe gateway initialize
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

        // create line items for stripe
        const line_items= productData.map((item)=>{
            return {
                price_data:{
                    currency:"usd",
                    product_data:{
                        name:item.name,
                    },
                    unit_amount: Math.floor(item.price + item.price*0.02) *100
                },
                quantity:item.quantity,
            }
        })
        //create session
        const session = await stripeInstance.checkout.sessions.create({
            line_items,
            mode:"payment",
            success_url:`${origin}/loader?next=my-orders`,
            cancel_url: `${origin}/cart`,
            metadata:{
                orderId: order._id.toString(),
                userId,
            }
        })
        return res.json({success:true,url:session.url})
    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:error.message})
    }
}

//Stripe webhooks to verify payements action :/stripe
//  export const stripeWebhooks = async(request,response) =>{
//     // stripe gateway initialize
//         const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

//         const sig = request.headers["stripe-signature"];
//         let event ;

//         try {
//             event = stripeInstance.webhooks.constructEvent(
//                 request.body,
//                 sig,
//                 process.env.STRIPE_WEBHOOK_SECRET
//             );
//         } catch (error) {
//             response.status(400).send(`webhook Error: ${error.message}`)
//         }
//         //handle the event
//         switch(event.type){
//             case "payment_intent.succeeded":{
//                 const paymentIntent = event.data.object;
//                 const paymentIntentId =paymentIntent.id;

//                 //getting session metadata
//                 const session = await stripeInstance.checkout.sessions.list({
//                     payment_intent:paymentIntentId,
//                 });

//                 const { orderId, userId} = session.data[0].metadata;

//                 //mark payment as paid
//                 await Order.findByIdAndUpdate(orderId, {isPaid:true})
//                 //clear cart data
//                 await UserActivation.findByIdAndUpdate(userId,{cartItems:{}})
//                 break;
//             }
//             case "payment_intent.failed":{
//                 const paymentIntent = event.data.object;
//                 const paymentIntentId =paymentIntent.id;

//                 //getting session metadata
//                 const session = await stripeInstance.checkout.sessions.list({
//                     payment_intent:paymentIntentId,
//                 });

//                 const {userId} = session.data[0].metadata;
//                 await Order.findByIdAndDelete(orderId);
//                 break;

//             }
//             default:
//                 console.error(`Unhandled event type $(event.type)`)

//         }
//         response.json({recieved:true})

//  }

//gemini
// Stripe webhooks to verify payments
// Stripe webhooks to verify payments
export const stripeWebhooks = async (request, response) => {
    const sig = request.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
        // This is the line that is failing. It will be fixed by the correct secret key.
        event = stripe.webhooks.constructEvent(request.body, sig, webhookSecret);

        // All the logic is now safely inside the 'try' block.
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const { orderId, userId } = session.metadata;

            // Find the order and mark it as paid
            const order = await Order.findById(orderId);
            if (order) {
                order.isPaid = true;
                await order.save();
                // Clear the user's cart
                await UserActivation.findByIdAndUpdate(userId, { cartItems: {} });
                console.log(`✅ SUCCESS: Order ${orderId} has been paid.`);
            } else {
                console.log(`⚠️ WARNING: Order ${orderId} not found in database.`);
            }
        }
        
        // Acknowledge the event was received
        response.status(200).json({ received: true });

    } catch (err) {
        // This block will only run if the secret key is wrong.
        console.error(`❌ Webhook signature verification failed!`, err.message);
        return response.status(400).send(`Webhook Error: ${err.message}`);
    }
};
 
//get orders by user id : .api/order/user
export const getUserOrders = async (req,res)=>{
    try {
        const userId= req.user.id;
        const orders = await Order.find({userId, $or:[{payementType:"COD"}, {isPaid: true}]}).populate("items.product address").sort({createdAt:-1})//newely created orders at top
        res.json({success:true,orders})
    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:error.message})
    }
}

//get all orders for seller :api/order/seller
export const getAllOrders = async (req,res)=>{
    try {
       
        const orders = await Order.find({ $or:[{payementType:"COD"}, {isPaid: true}]}).populate("items.product address").sort({createdAt:-1})
        res.json({success:true,orders})
    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:error.message})
    }
}