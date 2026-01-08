import React, { useState } from 'react';
import './Add.css';
import { assets } from '../../assets/assets';
import axios from "axios";
import { toast } from 'react-toastify';

const Add = ({ url }) => {
  const [image, setImage] = useState(false); // Can be false (no image) or a File object
  const [data, setData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Döner Spezialitäten",
  });
  const [options, setOptions] = useState([{ name: "", price: 0 }]);
  const [requiredOptions, setRequiredOptions] = useState([{ name: "", choices: [""] }]);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  // Regular options logic
  const addOption = () => {
    setOptions([...options, { name: "", price: 0 }]);
  };

  const updateOption = (index, field, value) => {
    const updatedOptions = [...options];
    updatedOptions[index][field] = value;
    setOptions(updatedOptions);
  };

  const removeOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  // Required options logic
  const addRequiredOption = () => {
    setRequiredOptions([...requiredOptions, { name: "", choices: [""] }]);
  };

  const updateRequiredOption = (index, field, value) => {
    const updatedRequiredOptions = [...requiredOptions];
    updatedRequiredOptions[index][field] = value;
    setRequiredOptions(updatedRequiredOptions);
  };

  const updateRequiredChoice = (optionIndex, choiceIndex, value) => {
    const updatedRequiredOptions = [...requiredOptions];
    updatedRequiredOptions[optionIndex].choices[choiceIndex] = value;
    setRequiredOptions(updatedRequiredOptions);
  };

  const addRequiredChoice = (optionIndex) => {
    const updatedRequiredOptions = [...requiredOptions];
    updatedRequiredOptions[optionIndex].choices.push(""); // Add a new empty choice
    setRequiredOptions(updatedRequiredOptions);
  };

  const removeRequiredChoice = (optionIndex, choiceIndex) => {
    const updatedRequiredOptions = [...requiredOptions];
    updatedRequiredOptions[optionIndex].choices = updatedRequiredOptions[optionIndex].choices.filter(
      (_, i) => i !== choiceIndex
    );
    setRequiredOptions(updatedRequiredOptions);
  };

  const removeRequiredOption = (index) => {
    setRequiredOptions(requiredOptions.filter((_, i) => i !== index));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("price", Number(data.price));
    formData.append("category", data.category);

    // --- CHANGE STARTS HERE ---
    // Only append the image if one is selected (i.e., 'image' is not false)
    if (image) {
      formData.append("image", image);
    }
    // --- CHANGE ENDS HERE ---
    
    formData.append("options", JSON.stringify(options)); // Send options as JSON string
    formData.append("requiredOptions", JSON.stringify(requiredOptions)); // Send required options as JSON string

    try {
      const response = await axios.post(`${url}/api/food/add`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Crucial for sending files
        },
      });
      if (response.data.success) {
        setData({
          name: "",
          description: "",
          price: "",
          category: "Döner Spezialitäten",
        });
        setImage(false); // Reset image state
        setOptions([{ name: "", price: 0 }]); // Reset options
        setRequiredOptions([{ name: "", choices: [""] }]); // Reset required options
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product.");
    }
  };

  return (
    <div className="add">
      <form className="flex-col" onSubmit={onSubmitHandler}>
        <div className="add-img-upload flex-col">
          <p>Upload Image</p>
          <label htmlFor="image">
            <img src={image ? URL.createObjectURL(image) : assets.upload_area} alt="" />
          </label>
          {/* --- CHANGE STARTS HERE --- */}
          {/* Removed the 'required' attribute */}
          <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden />
          {/* --- CHANGE ENDS HERE --- */}
        </div>
        <div className="add-product-name flex-col">
          <p>Product Name</p>
          <input onChange={onChangeHandler} value={data.name} type="text" name="name" placeholder="Type here" required />
        </div>
        <div className="add-product-description flex-col">
          <p>Product description</p>
          <textarea
            onChange={onChangeHandler}
            value={data.description}
            name="description"
            rows="6"
            placeholder="Write Content here"
            required
          ></textarea>
        </div>
        <div className="add-category-price">
          <div className="add-category flex-col">
            <p>Product category</p>
            <select onChange={onChangeHandler} name="category">
              <option value="Döner Spezialitäten">Döner Spezialitäten</option>
              <option value="Lahmacun">Lahmacun</option>
              <option value="Vegane Spezialitäten">Vegane Spezialitäten</option>
              <option value="Andere Spezialitäten">Andere Spezialitäten</option>
              <option value="Kindermenü">Kindermenü</option>
              <option value="Snacks-Saucen">Snacks-Saucen</option>
              <option value="Getränke">Getränke</option>
            </select>
          </div>
          <div className="add-price flex-col">
            <p>Product price</p>
            <input onChange={onChangeHandler} value={data.price} type="Number" name="price" placeholder="$20" required />
          </div>
        </div>
        <div className="product-options">
          <h3>Product Options</h3>
          {options.map((option, index) => (
            <div key={index} className="option">
              <input
                type="text"
                placeholder="Option Name"
                value={option.name}
                onChange={(e) => updateOption(index, "name", e.target.value)}
              />
              <input
                type="number"
                placeholder="Option Price"
                value={option.price}
                onChange={(e) => updateOption(index, "price", e.target.value)}
              />
              <button type="button" onClick={() => removeOption(index)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addOption}>
            Add Option
          </button>
        </div>
        <div className="product-required-options">
          <h3>Required Options</h3>
          {requiredOptions.map((option, index) => (
            <div key={index} className="required-option">
              <input
                type="text"
                placeholder="Option Name"
                value={option.name}
                onChange={(e) => updateRequiredOption(index, "name", e.target.value)}
              />
              {option.choices.map((choice, choiceIndex) => (
                <div key={choiceIndex} className="required-choice">
                  <input
                    type="text"
                    placeholder="Choice"
                    value={choice}
                    onChange={(e) => updateRequiredChoice(index, choiceIndex, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeRequiredChoice(index, choiceIndex)}
                  >
                    Remove Choice
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addRequiredChoice(index)}>
                Add Choice
              </button>
              <button type="button" onClick={() => removeRequiredOption(index)}>
                Remove Option
              </button>
            </div>
          ))}
          <button type="button" onClick={addRequiredOption}>
            Add Required Option
          </button>
        </div>
        <button type="submit" className="add-btn">
          ADD
        </button>
      </form>
    </div>
  );
};

export default Add;