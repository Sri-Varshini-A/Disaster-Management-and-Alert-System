import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const INDIAN_STATES = [
    "Andaman & Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
    "Chandigarh", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", 
    "Jammu & Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", 
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", 
    "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const Register = () => {
    // 1. STATE: We default to 'CITIZEN' but allow changing it
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        phoneNumber: '',
        region: '',
    });
    const [role, setRole] = useState('CITIZEN'); // Separate state for the buttons

    const navigate = useNavigate();

    // Handle text inputs
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle Form Submit
    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            // Combine form data with the selected role
            const payload = { ...formData, role: role };

            await axios.post('http://localhost:8080/api/auth/register', payload);

            alert("Registration Successful! Please Login.");
            navigate('/');

        } catch (err) {
            console.error(err);
            alert("Registration Failed! Try a different email.");
        }
    };

    // STYLES: Matching your Dark/Green Theme
    const styles = {
        container: {
            backgroundColor: '#ffffff',
            color: '#000',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px'
        },
        formBox: {
            width: '100%',
            maxWidth: '400px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
        },
        input: {
            backgroundColor: '#ffffff',
            border: '1px solid #3d4d3d',
            color: '#000',
            padding: '12px',
            borderRadius: '8px',
            outline: 'none',
            fontSize: '16px'
        },
        roleContainer: {
            display: 'flex',
            justifyContent: 'space-between',
            gap: '10px',
            marginTop: '10px'
        },
        roleButton: (isSelected) => ({
            flex: 1,
            padding: '10px',
            backgroundColor: isSelected ? '#1890ff' : 'transparent', // Blue if selected
            color: isSelected ? '#fff' : '#000',
            border: isSelected ? 'none' : '1px solid #555',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: '0.3s'
        }),
        registerBtn: {
            backgroundColor: '#1890ff',
            color: '#fff',
            padding: '14px',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: '10px'
        },
        link: {
            color: '#000',
            textAlign: 'center',
            fontSize: '14px',
            cursor: 'pointer',
            marginTop: '15px'
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={{ marginBottom: '20px' }}>Create Account</h2>

            <form onSubmit={handleRegister} style={styles.formBox}>
                {/* Inputs */}
                <input
                    name="fullName"
                    placeholder="Name"
                    onChange={handleChange}
                    style={styles.input}
                    required
                />
                <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    onChange={handleChange}
                    style={styles.input}
                    required
                />
                <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    onChange={handleChange}
                    style={styles.input}
                    required
                />
                <input
                    name="phoneNumber"
                    placeholder="Phone Number"
                    onChange={handleChange}
                    style={styles.input}
                    required
                />
                <select
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    style={styles.input}
                    required
                >
                    <option value="" disabled>Select Location (State)</option>
                    {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                    ))}
                </select>

                {/* --- ROLE SELECTION BUTTONS --- */}
                <div style={styles.roleContainer}>
                    {['ADMIN', 'RESPONDER', 'CITIZEN'].map((r) => (
                        <button
                            key={r}
                            type="button" // Important: preventing form submit
                            onClick={() => setRole(r)}
                            style={styles.roleButton(role === r)}
                        >
                            {r.charAt(0) + r.slice(1).toLowerCase()} {/* Capitalize first letter */}
                        </button>
                    ))}
                </div>

                {/* Submit Button */}
                <button type="submit" style={styles.registerBtn}>
                    Register
                </button>
            </form>

            <p style={styles.link} onClick={() => navigate('/')}>
                Already have an account? <span style={{ color: '#1890ff', cursor: 'pointer', fontWeight: 'bold' }}>Login</span>
            </p>
        </div>
    );
};

export default Register;