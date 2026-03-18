import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const CitizenDashboard = () => {
    const navigate = useNavigate();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [filteredAlerts, setFilteredAlerts] = useState([]);
    const [filters, setFilters] = useState({ type: '', severity: '' });
    const [translations, setTranslations] = useState({});
    const [translatingIds, setTranslatingIds] = useState({});

    // SOS Modal State
    const [isSosModalOpen, setIsSosModalOpen] = useState(false);
    const [sosForm, setSosForm] = useState({
        emergencyType: 'Fire',
        customType: '',
        address: '',
        locationCoordinates: '',
        description: ''
    });
    const [isSubmittingSos, setIsSubmittingSos] = useState(false);
    const [userPhoneNumber, setUserPhoneNumber] = useState('');

    useEffect(() => {
        const role = localStorage.getItem('user_role');
        const token = localStorage.getItem('jwt_token');

        if (!token || role !== 'CITIZEN') {
            alert("⛔ ACCESS DENIED: Citizens Only!");
            navigate('/');
        } else {
            setIsAuthorized(true);
            try {
                const decoded = jwtDecode(token);
                if (decoded.phoneNumber) {
                    setUserPhoneNumber(decoded.phoneNumber);
                }
            } catch (e) {
                console.error("Invalid token format", e);
            }
            fetchAlerts(token);
        }
    }, [navigate]);

    const fetchAlerts = async (token) => {
        try {
            const response = await axios.get('http://localhost:8080/api/disasters?status=BROADCASTED', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAlerts(response.data);
            setFilteredAlerts(response.data);
        } catch (error) {
            console.error('Error fetching alerts', error);
        }
    };

    useEffect(() => {
        let result = alerts;
        if (filters.type) {
            result = result.filter(a => a.type.toLowerCase().includes(filters.type.toLowerCase()));
        }
        if (filters.severity) {
            result = result.filter(a => a.severity.toLowerCase() === filters.severity.toLowerCase());
        }
        setFilteredAlerts(result);
    }, [filters, alerts]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };
    const handleTranslate = async (id, text) => {
        setTranslatingIds(prev => ({ ...prev, [id]: true }));
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data && data[0]) {
                const translated = data[0].map(item => item[0]).join('');
                setTranslations(prev => ({ ...prev, [id]: translated }));
            }
        } catch (error) {
            console.error('Error translating text', error);
            alert('Failed to translate text. Please try again later.');
        } finally {
            setTranslatingIds(prev => ({ ...prev, [id]: false }));
        }
    };

    const handleSosChange = (e) => {
        setSosForm({ ...sosForm, [e.target.name]: e.target.value });
    };

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setSosForm(prev => ({
                        ...prev,
                        locationCoordinates: `${position.coords.latitude}, ${position.coords.longitude}`
                    }));
                },
                (error) => {
                    alert("Location access denied or unavailable.");
                }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    const submitSosReport = async () => {
        try {
            setIsSubmittingSos(true);
            const token = localStorage.getItem('jwt_token');
            const finalType = sosForm.emergencyType === 'Other' ? sosForm.customType : sosForm.emergencyType;

            if (!finalType || !sosForm.locationCoordinates) {
                alert("Please provide the emergency type and your exact coordinates.");
                setIsSubmittingSos(false);
                return;
            }

            const payload = {
                emergencyType: finalType,
                locationCoordinates: sosForm.locationCoordinates,
                address: sosForm.address,
                description: sosForm.description
                // Note: phoneNumber and region are securely handled via backend logic
            };

            await axios.post('http://localhost:8080/api/incidents', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("🚨 SOS SENT SUCCESSFULLY! Responders have been notified.");
            setIsSosModalOpen(false);
            setSosForm({ emergencyType: 'Fire', customType: '', address: '', locationCoordinates: '', description: '' });
        } catch (error) {
            console.error('Error submitting SOS', error);
            alert("Failed to submit SOS. Please try again or call emergency services immediately!");
        } finally {
            setIsSubmittingSos(false);
        }
    };

    if (!isAuthorized) return null;

    return (
        <div style={{ padding: '20px', backgroundColor: '#e6f7ff', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ color: '#0050b3', margin: 0 }}>🏘️ CITIZEN PORTAL</h1>
                <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>LOGOUT</button>
            </div>
            <p style={{ color: '#595959' }}>Stay informed and report incidents.</p>

            <div style={{ border: '2px solid #cf1322', padding: '20px', margin: '20px 0', background: '#fff1f0', borderRadius: '8px', textAlign: 'center' }}>
                <h2 style={{ color: '#cf1322', marginTop: 0 }}>🚨 EMERGENCY ASSISTANCE</h2>
                <p>If you or someone else is in immediate danger, use the SOS button below.</p>
                <button onClick={() => setIsSosModalOpen(true)} style={{ padding: '15px 30px', fontSize: '18px', fontWeight: 'bold', background: '#cf1322', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(207, 19, 34, 0.5)' }}>
                    REQUEST HELP (SOS) 🆘
                </button>
            </div>

            <div style={{ border: '1px solid #d9d9d9', padding: '20px', background: 'white', borderRadius: '8px' }}>
                <h2 style={{ color: '#faad14', margin: '0 0 20px 0' }}>⚠️ Disaster Alerts</h2>

                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <input
                        type="text" name="type" placeholder="Filter by Type (e.g., Flood)"
                        value={filters.type} onChange={handleFilterChange}
                        style={{ padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px', flex: 1, minWidth: '150px' }}
                    />
                    <select name="severity" value={filters.severity} onChange={handleFilterChange} style={{ padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px', flex: 1, minWidth: '150px' }}>
                        <option value="">All Severities</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>

                {filteredAlerts.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                        {filteredAlerts.map(alert => (
                            <div key={alert.id} style={{
                                borderLeft: `5px solid ${alert.severity === 'High' ? 'red' : alert.severity === 'Medium' ? 'orange' : 'green'}`,
                                padding: '15px', background: '#f5f5f5', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                <h4 style={{ margin: '0 0 10px 0', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{alert.type}</span>
                                    <span style={{ fontSize: '0.8em', color: '#888' }}>{new Date(alert.timestamp).toLocaleString()}</span>
                                </h4>
                                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Location:</strong> {alert.location}</p>
                                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Severity:</strong> <span style={{ color: alert.severity === 'High' ? 'red' : alert.severity === 'Medium' ? 'orange' : 'green', fontWeight: 'bold' }}>{alert.severity}</span></p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '5px 0' }}>
                                    <p style={{ margin: 0, fontSize: '14px', flex: 1 }}>{alert.description}</p>
                                    <button
                                        onClick={() => handleTranslate(alert.id, alert.description)}
                                        disabled={translatingIds[alert.id] || translations[alert.id]}
                                        style={{
                                            background: 'none', border: '1px solid #1890ff', color: '#1890ff',
                                            borderRadius: '4px', cursor: (translatingIds[alert.id] || translations[alert.id]) ? 'not-allowed' : 'pointer',
                                            padding: '4px 8px', fontSize: '12px', marginLeft: '10px',
                                            opacity: (translatingIds[alert.id] || translations[alert.id]) ? 0.5 : 1
                                        }}
                                        title="Translate to English"
                                    >
                                        {translatingIds[alert.id] ? '⏳' : '🌐 Translate'}
                                    </button>
                                </div>
                                {translations[alert.id] && (
                                    <div style={{ margin: '10px 0', padding: '10px', background: '#e6f7ff', borderLeft: '3px solid #1890ff', borderRadius: '4px' }}>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#0050b3' }}><strong>Translation:</strong> {translations[alert.id]}</p>
                                    </div>
                                )}
                                <p style={{ margin: '5px 0', fontSize: '12px', color: '#888', textAlign: 'right' }}>Source: {alert.source}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: '#888' }}>No alerts found matching your criteria.</p>
                )}
            </div>
            {isSosModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                        <h2 style={{ color: '#cf1322', marginTop: 0, display: 'flex', justifyContent: 'space-between' }}>
                            <span>🆘 Request Emergency Help</span>
                            <button onClick={() => setIsSosModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✖</button>
                        </h2>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Emergency Type</label>
                            <select name="emergencyType" value={sosForm.emergencyType} onChange={handleSosChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                                <option value="Fire">Fire 🔥</option>
                                <option value="Flood">Flood 🌊</option>
                                <option value="Earthquake">Earthquake 🌍</option>
                                <option value="Trapped">Trapped / Needs Rescue 🏃‍♂️</option>
                                <option value="Structural Collapse">Structural Collapse 🏢</option>
                                <option value="Other">Other (Please Type)</option>
                            </select>
                            {sosForm.emergencyType === 'Other' && (
                                <input type="text" name="customType" placeholder="Describe the emergency type..." value={sosForm.customType} onChange={handleSosChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', marginTop: '10px', boxSizing: 'border-box' }} />
                            )}
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Exact Location</label>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <input type="text" disabled value={sosForm.locationCoordinates} placeholder="GPS Coordinates (Click Get Location)" style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc', background: '#f5f5f5' }} />
                                <button type="button" onClick={handleGetLocation} style={{ padding: '10px 15px', background: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}>📍 Get Location</button>
                            </div>
                            <input type="text" name="address" placeholder="Address / Landmarks (Optional)" value={sosForm.address} onChange={handleSosChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Situation Description</label>
                            <textarea name="description" placeholder="Briefly describe the situation, number of people involved, hazards, etc." value={sosForm.description} onChange={handleSosChange} rows="4" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}></textarea>
                        </div>

                        <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f2f5', borderRadius: '4px' }}>
                            <small style={{ color: '#595959', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                📱 <strong>Phone Number Attached:</strong> {userPhoneNumber || "Fetching..."}
                            </small>
                            <small style={{ color: '#595959', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
                                <i>Your login details and region are automatically transmitted securely to local responders.</i>
                            </small>
                        </div>

                        <button
                            onClick={submitSosReport}
                            disabled={isSubmittingSos}
                            style={{ width: '100%', padding: '15px', fontSize: '18px', fontWeight: 'bold', background: isSubmittingSos ? '#ff7875' : '#cf1322', color: 'white', border: 'none', borderRadius: '8px', cursor: isSubmittingSos ? 'not-allowed' : 'pointer' }}>
                            {isSubmittingSos ? 'SENDING SOS...' : '🚨 SUBMIT SOS ALERT NOW'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CitizenDashboard;