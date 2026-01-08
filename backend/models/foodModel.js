import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String },
    image: { type: String },
    options: [
        {
            name: { type: String },
            price: { type: Number, default: 0 },
        },
    ],
    requiredOptions: [
        {
            name: { type: String, required: true },
            choices: [{ type: String, required: true }],
        },
    ],
});

const foodModel = mongoose.models.food || mongoose.model("food", foodSchema);
export default foodModel;