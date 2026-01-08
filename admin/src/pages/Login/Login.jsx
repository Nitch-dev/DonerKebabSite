import React, { useState } from 'react';
import { toast } from 'react-toastify'; // Make sure you have toast imported
import './Login.css'; // Create this for basic styling

const Login = ({ setIsLoggedIn }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
        e.preventDefault(); // Prevent default form submission

        // Hardcoded credentials for client-side login
        if (username === 'admin' && password === 'donerkinggermany') {
            setIsLoggedIn(true); // Set login status to true
            toast.success('Logged in successfully!');
        } else {
            toast.error('Invalid username or password.');
        }
    };

    return (
        <div className='login-page'>
            <form onSubmit={handleLogin} className='login-container'>
                <h2>Admin Login</h2>
                <div className="login-input-fields">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;