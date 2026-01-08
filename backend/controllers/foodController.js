import foodModel from "../models/foodModel.js";
import fs from 'fs'; // Node.js file system module for deleting files

// add food item
const addFood = async (req, res) => {
    let image_filename = "";

    // IMPORTANT: Check if req.file exists before accessing its properties.
    // If no image is uploaded, req.file will be undefined.
    if (req.file) {
        image_filename = req.file.filename;
    }

    const food = new foodModel({
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        image: image_filename, // This will be an empty string if no image was uploaded
        options: JSON.parse(req.body.options || "[]"), // Parse options from request, default to empty array
        requiredOptions: JSON.parse(req.body.requiredOptions || "[]") // Parse required options from request, default to empty array
    });

    try {
        await food.save();
        res.json({ success: true, message: "Food Added" });
    } catch (error) {
        console.error("Error adding food:", error); // Use console.error for errors
        res.json({ success: false, message: "Error adding food" }); // More specific error message
    }
};

// all food list
const listFood = async (req, res) => {
    try {
        const foods = await foodModel.find({});
        res.json({ success: true, data: foods });
    } catch (error) {
        console.error("Error fetching food list:", error);
        res.json({ success: false, message: "Error fetching food list" });
    }
};

// remove food item
const removeFood = async (req, res) => {
    try {
        const food = await foodModel.findById(req.body.id);

        if (!food) {
            return res.json({ success: false, message: "Food item not found" });
        }

        // IMPORTANT: Only try to unlink (delete) the image if 'food.image' has a value
        // This prevents errors if a food item was added without an image.
        if (food.image) {
            fs.unlink(`uploads/${food.image}`, (err) => {
                if (err) {
                    // Log the error but don't prevent the food item from being deleted
                    console.error("Error deleting image file:", err);
                }
            });
        }

        await foodModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Food Removed" });
    } catch (error) {
        console.error("Error removing food:", error);
        res.json({ success: false, message: "Error removing food" });
    }
};

// get food details by ID
const getFoodDetails = async (req, res) => {
    try {
        const food = await foodModel.findById(req.params.id);
        if (!food) {
            return res.json({ success: false, message: "Food item not found" });
        }
        res.json({ success: true, data: food });
    } catch (error) {
        console.error("Error fetching food details:", error);
        res.json({ success: false, message: "Error fetching food details" });
    }
};

const updateFood = async (req, res) => {
    try {
        const foodId = req.params.id;
        const existingFood = await foodModel.findById(foodId);

        if (!existingFood) {
            return res.json({ success: false, message: "Food item not found" });
        }

        const updatedData = {
            name: req.body.name,
            description: req.body.description,
            price: Number(req.body.price), // Ensure price is a number
            category: req.body.category,
            // Parse options and requiredOptions, ensuring they default to empty arrays if not present
            options: JSON.parse(req.body.options || "[]"),
            requiredOptions: JSON.parse(req.body.requiredOptions || "[]")
        };

        // IMPORTANT: Handle image update logic
        if (req.file) { // A new image has been uploaded
            // Delete the old image file if it exists
            if (existingFood.image) {
                fs.unlink(`uploads/${existingFood.image}`, (err) => {
                    if (err) {
                        console.error("Error deleting old image file during update:", err);
                    }
                });
            }
            // Set the new image filename
            updatedData.image = req.file.filename;
        } else { // No new image uploaded, retain the old image filename
            updatedData.image = existingFood.image;
        }

        // Find and update the food item
        // { new: true } returns the updated document
        const updatedFood = await foodModel.findByIdAndUpdate(foodId, updatedData, { new: true });

        res.json({ success: true, message: "Food Updated", data: updatedFood });
    } catch (error) {
        console.error("Error updating food:", error);
        res.json({ success: false, message: "Error updating food" });
    }
};

export { addFood, listFood, removeFood, getFoodDetails, updateFood };