import React, { useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import { Routes, Route } from 'react-router-dom';
import Add from './pages/Add/Add';
import List from './pages/List/List';
import Orders from './pages/Orders/Orders';
import Login from './pages/Login/Login'; // Import your new Login component
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
    // State to manage login status
    const [isLoggedIn, setIsLoggedIn] = useState(false); // Initially not logged in

    const url = "http://31.97.180.184:4000"; // Your API URL (even if not used for login, it's passed to other components)

    return (
        <div>
            <ToastContainer/>
            {/* Conditional rendering based on isLoggedIn state */}
            {isLoggedIn ? (
                <>
                    <Navbar />
                    <hr />
                    <div className="app-content">
                        <Sidebar/>
                        <Routes>
                            {/* Pass url prop as before */}
                            <Route path="/add" element={<Add url={url}/>}/>
                            <Route path="/list" element={<List url={url}/>}/>
                            <Route path="/orders" element={<Orders url={url}/>}/>
                            {/* Optional: Redirect to a default page if logged in */}
                            <Route path="*" element={<Add url={url}/>}/>
                        </Routes>
                    </div>
                </>
            ) : (
                // Render the Login component if not logged in
                <Login setIsLoggedIn={setIsLoggedIn} />
            )}
        </div>
    );
}

export default App;