import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // Send login request to Spring Boot
            const response = await axios.post('http://localhost:8080/api/auth/login', {
                email: email,
                password: password
            });

            // Extract Token and Role
            const { token, role } = response.data;

            // Save to Local Storage
            localStorage.setItem('jwt_token', token);
            localStorage.setItem('user_role', role);

            // Redirect based on Role
            if (role === 'ADMIN') {
                navigate('/admin');
            } 
            else if (role === 'RESPONDER'){
                navigate('/responder');
            }
            else{
                navigate('/citizen');
            }

        } catch (err) {
            console.error(err);
            setError('Login Failed! Check email/password.');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
            <div style={{ padding: '30px', border: '1px solid #ccc', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                <h2>Disaster Management Login</h2>
                <form onSubmit={handleLogin}>
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        style={{ display: 'block', margin: '10px 0', padding: '10px', width: '250px' }}
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        style={{ display: 'block', margin: '10px 0', padding: '10px', width: '250px' }}
                    />
                    <button type="submit" style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
                        LOGIN
                    </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '15px' }}>
                    New User? <span onClick={() => navigate('/register')} style={{ color: 'blue', fontSize:'14px', cursor: 'pointer', fontWeight: 'bold' }}>Register Here</span>
                </p>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>
        </div>
    );
};

export default Login;