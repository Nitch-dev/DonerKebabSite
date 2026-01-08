import React, { useState, useEffect } from 'react';
import './List.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const List = ({ url }) => {
  const [list, setList] = useState([]);
  const [editProduct, setEditProduct] = useState(null); // Product being edited
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    options: [],
    requiredOptions: [], // Add required options state
    image: null, // Add image to formData state
  });
  const [imagePreview, setImagePreview] = useState(''); // State for image preview

  useEffect(() => {
    fetchList();
  }, []);

  const fetchList = async () => {
    const response = await axios.get(`${url}/api/food/list`);
    if (response.data.success) {
      setList(response.data.data);
    } else {
      toast.error('Error');
    }
  };

  const removeFood = async (foodId) => {
    const response = await axios.post(`${url}/api/food/remove`, { id: foodId });
    if (response.data.success) {
      toast.success(response.data.message);
      fetchList();
    } else {
      toast.error('Error');
    }
  };

  const handleEditClick = (product) => {
    setEditProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category,
      options: product.options || [],
      requiredOptions: product.requiredOptions || [{ name: '', choices: [''] }],
      image: null, // Reset image input when opening edit
    });
    setImagePreview(product.image ? `${url}/images/${product.image}` : ''); // Set initial image preview
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file)); // Create preview URL
    }
  };

  const handleOptionChange = (index, field, value) => {
    const updatedOptions = [...formData.options];
    updatedOptions[index][field] = value;
    setFormData((prev) => ({ ...prev, options: updatedOptions }));
  };

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, { name: '', price: 0 }],
    }));
  };

  const removeOption = (index) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    const updatedFormData = new FormData();
    updatedFormData.append("name", formData.name);
    updatedFormData.append("price", formData.price);
    updatedFormData.append("description", formData.description);
    updatedFormData.append("category", formData.category);
    updatedFormData.append("options", JSON.stringify(formData.options));
    updatedFormData.append("requiredOptions", JSON.stringify(formData.requiredOptions));

    // Append new image if selected
    if (formData.image) {
      updatedFormData.append("image", formData.image);
    }

    try {
      const response = await axios.put(`${url}/api/food/update/${editProduct._id}`, updatedFormData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Important for sending files
        },
      });
      if (response.data.success) {
        toast.success("Product updated successfully");
        setEditProduct(null);
        setImagePreview(''); // Clear image preview after saving
        fetchList(); // Refresh the list after saving
      } else {
        toast.error("Error updating product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product.");
    }
  };

  const handleRequiredOptionChange = (index, field, value) => {
    const updatedRequiredOptions = [...formData.requiredOptions];
    updatedRequiredOptions[index][field] = value;
    setFormData({ ...formData, requiredOptions: updatedRequiredOptions });
  };

  const addRequiredOption = () => {
    setFormData({
      ...formData,
      requiredOptions: [...formData.requiredOptions, { name: '', choices: [''] }],
    });
  };

  const removeRequiredOption = (index) => {
    setFormData({
      ...formData,
      requiredOptions: formData.requiredOptions.filter((_, i) => i !== index),
    });
  };

  const handleRequiredChoiceChange = (optionIndex, choiceIndex, value) => {
    const updatedRequiredOptions = [...formData.requiredOptions];
    updatedRequiredOptions[optionIndex].choices[choiceIndex] = value;
    setFormData({ ...formData, requiredOptions: updatedRequiredOptions });
  };

  const addRequiredChoice = (optionIndex) => {
    const updatedRequiredOptions = [...formData.requiredOptions];
    updatedRequiredOptions[optionIndex].choices.push("");
    setFormData({ ...formData, requiredOptions: updatedRequiredOptions });
  };

  const removeRequiredChoice = (optionIndex, choiceIndex) => {
    const updatedRequiredOptions = [...formData.requiredOptions];
    updatedRequiredOptions[optionIndex].choices = updatedRequiredOptions[optionIndex].choices.filter(
      (_, i) => i !== choiceIndex
    );
    setFormData({ ...formData, requiredOptions: updatedRequiredOptions });
  };

  return (
    <div className='list add flex-col'>
      <p>All Foods List</p>
      <div className="list-table">
        <div className="list-table-format title">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Options</b>
          <b>Action</b>
        </div>
        {list.map((item, index) => {
          return (
            <div key={index} className='list-table-format'>
              <img src={`${url}/images/` + item.image} alt="" />
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p>€{item.price}</p>
              <p>
                {item.options?.length > 0
                  ? item.options.map((option, i) => (
                    <span key={i}>
                      {option.name} (+€{option.price}){i < item.options.length - 1 ? ', ' : ''}
                    </span>
                  ))
                  : 'No Options'}
              </p>
              <p onClick={() => removeFood(item._id)} className='cursor'>X</p>
              <button onClick={() => handleEditClick(item)}>Edit</button>
            </div>
          );
        })}
      </div>

      {editProduct && (
        <div className="edit-modal">
          <div className="edit-modal-content">
            <h3>Edit Product</h3>
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Product Preview" style={{ maxWidth: '100px', maxHeight: '100px' }} />
              </div>
            )}
            <input
              type="file"
              name="image"
              onChange={handleImageChange}
            />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Product Name"
            />
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="Price"
            />
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Description"
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Döner Spezialitäten">Döner Spezialitäten</option>
              <option value="Lahmacun">Lahmacun</option>
              <option value="Vegane Spezialitäten">Vegane Spezialitäten</option>
              <option value="Andere Spezialitäten">Andere Spezialitäten</option>
              <option value="Kindermenü">Kindermenü</option>
              <option value="Snacks-Saucen">Snacks-Saucen</option>
              <option value="Getränke">Getränke</option>
            </select>

            <h4>Options</h4>
            {formData.options.map((option, index) => (
              <div key={index} className="option-item">
                <input
                  type="text"
                  value={option.name}
                  onChange={(e) =>
                    handleOptionChange(index, 'name', e.target.value)
                  }
                  placeholder="Option Name"
                />
                <input
                  type="number"
                  value={option.price}
                  onChange={(e) =>
                    handleOptionChange(index, 'price', e.target.value)
                  }
                  placeholder="Option Price"
                />
                <button onClick={() => removeOption(index)}>Remove</button>
              </div>
            ))}
            <button onClick={addOption}>Add Option</button>
            <h4>Required Options</h4>
            {formData.requiredOptions.map((option, index) => (
              <div key={index} className="required-option">
                <input
                  type="text"
                  placeholder="Option Name"
                  value={option.name}
                  onChange={(e) => handleRequiredOptionChange(index, "name", e.target.value)}
                />
                {option.choices.map((choice, choiceIndex) => (
                  <div key={choiceIndex} className="required-choice">
                    <input
                      type="text"
                      placeholder="Choice"
                      value={choice}
                      onChange={(e) => handleRequiredChoiceChange(index, choiceIndex, e.target.value)}
                    />
                    <button type="button" onClick={() => removeRequiredChoice(index, choiceIndex)}>Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => addRequiredChoice(index)}>Add Choice</button>
                <button type="button" onClick={() => removeRequiredOption(index)}>Remove Option</button>
              </div>
            ))}
            <button type="button" onClick={addRequiredOption}>Add Required Option</button>
            <div className="edit-modal-actions">
              <button onClick={handleSave}>Save</button>
              <button onClick={() => {
                setEditProduct(null);
                setImagePreview(''); // Clear image preview on cancel
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default List;