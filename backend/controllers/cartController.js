import userModel from "../models/userModel.js";

// Add items to user cart
const addToCart = async (req, res) => {
    try {
        const { userId, itemId, options = [], quantity = 1 } = req.body;

        // Create a unique key for the product based on its ID and options
        const optionsKey = options.sort().join(",");
        const uniqueKey = `${itemId}-${optionsKey}`;

        let userData = await userModel.findById(userId);
        let cartData = userData.cartData || {};

        if (!cartData[uniqueKey]) {
            cartData[uniqueKey] = { quantity: 0, options };
        }

        cartData[uniqueKey].quantity += quantity;

        await userModel.findByIdAndUpdate(userId, { cartData });
        res.json({ success: true, message: "Added To Cart" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

// Remove items from user cart
const removeFromCart = async (req, res) => {
    try {
        const { userId, uniqueKey } = req.body;

        let userData = await userModel.findById(userId);
        let cartData = userData.cartData || {};

        if (cartData[uniqueKey]) {
            if (cartData[uniqueKey].quantity > 1) {
                cartData[uniqueKey].quantity -= 1;
            } else {
                delete cartData[uniqueKey];
            }
        }

        await userModel.findByIdAndUpdate(userId, { cartData });
        res.json({ success: true, message: "Removed From Cart" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

// Fetch user cart data
const getCart = async (req, res) => {
    try {
        const { userId } = req.body;

        let userData = await userModel.findById(userId);
        let cartData = userData.cartData || {};

        res.json({ success: true, cartData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

export { addToCart, removeFromCart, getCart };