import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    items: [
        {
            uniqueKey: { type: String, required: true }, // Unique key for product with options
            itemId: { type: String, required: true },
            options: { type: Array, default: [] },
            requiredSelections: { type: Object, default: {} }, // Store required options
            quantity: { type: Number, required: true },
        },
    ],
    amount: { type: Number, required: true },
    address: { type: Object, required: true },
    status: { type: String, default: "Food Processing" },
    date: { type: Date, default: Date.now },
    payment: { type: Boolean, default: false },
});

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);
export default orderModel;