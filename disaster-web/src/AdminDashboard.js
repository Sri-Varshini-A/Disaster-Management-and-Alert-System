import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Create custom icons for Red (Pending/Active) and Green (Resolved)
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [pendingAlerts, setPendingAlerts] = useState([]);
    const [translations, setTranslations] = useState({});
    const [translatingIds, setTranslatingIds] = useState({});
    const [activeTab, setActiveTab] = useState('help_requests');
    const [helpRequests, setHelpRequests] = useState([]);
    const [availableResponders, setAvailableResponders] = useState({});
    const [selectedResponders, setSelectedResponders] = useState({});

    useEffect(() => {
        const role = localStorage.getItem('user_role');
        const token = localStorage.getItem('jwt_token');

        if (!token || role !== 'ADMIN') {
            alert("⛔ ACCESS DENIED: Admins Only!");
            navigate('/');
        } else {
            setIsAuthorized(true);
            fetchPendingAlerts(token);
            fetchHelpRequests(token);
        }
    }, [navigate]);

    const fetchPendingAlerts = async (token) => {
        try {
            const response = await axios.get('http://localhost:8080/api/disasters?status=PENDING', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingAlerts(response.data);
        } catch (error) {
            console.error('Error fetching pending alerts', error);
        }
    };

    const fetchHelpRequests = async (token) => {
        try {
            const response = await axios.get('http://localhost:8080/api/incidents/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHelpRequests(response.data);
        } catch (error) {
            console.error('Error fetching help requests', error);
        }
    };

    const handleVerify = async (id, statusToUpdate) => {
        const token = localStorage.getItem('jwt_token');
        try {
            await axios.put(`http://localhost:8080/api/disasters/${id}/verify?status=${statusToUpdate}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Refresh list
            fetchPendingAlerts(token);
            alert(`Alert ${statusToUpdate === 'BROADCASTED' ? 'Broadcasted' : 'Rejected'} successfully!`);
        } catch (error) {
            console.error('Error updating alert', error);
            alert('Failed to update alert');
        }
    };

    const fetchAvailableResponders = async (region, incidentId) => {
        const token = localStorage.getItem('jwt_token');
        try {
            const response = await axios.get(`http://localhost:8080/api/incidents/available-responders?region=${encodeURIComponent(region)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAvailableResponders(prev => ({ ...prev, [incidentId]: response.data }));
        } catch (error) {
            console.error('Error fetching available responders', error);
            alert('Failed to fetch available responders');
        }
    };

    const handleAssign = async (incidentId) => {
        const responderId = selectedResponders[incidentId];
        if (!responderId) {
            alert('Please select a responder first.');
            return;
        }

        const token = localStorage.getItem('jwt_token');
        try {
            await axios.put(`http://localhost:8080/api/incidents/${incidentId}/assign?responderId=${responderId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Task assigned successfully!');
            fetchHelpRequests(token);
            // Clear selection
            setSelectedResponders(prev => {
                const next = { ...prev };
                delete next[incidentId];
                return next;
            });
        } catch (error) {
            console.error('Error assigning incident', error);
            alert('Failed to assign incident');
        }
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

    if (!isAuthorized) return null;

    return (
        <div style={{ padding: '20px', backgroundColor: '#fff1f0', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ color: '#cf1322', margin: 0 }}>🛡️ ADMIN COMMAND CENTER</h1>
                <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#cf1322', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>LOGOUT</button>
            </div>
            <p style={{ color: '#595959' }}>Welcome, Commander. Verify and manage disaster alerts here.</p>

            <div style={{ padding: '20px', margin: '20px 0', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', borderBottom: '2px solid #ddd', marginBottom: '20px' }}>
                    <button 
                        onClick={() => setActiveTab('help_requests')}
                        style={{ 
                            padding: '10px 20px', 
                            cursor: 'pointer', 
                            background: 'none', 
                            border: 'none', 
                            borderBottom: activeTab === 'help_requests' ? '3px solid #cf1322' : 'none',
                            color: activeTab === 'help_requests' ? '#cf1322' : '#555',
                            fontWeight: activeTab === 'help_requests' ? 'bold' : 'normal',
                            fontSize: '16px',
                            transition: 'all 0.3s'
                        }}>
                        Help requests
                    </button>
                    <button 
                        onClick={() => setActiveTab('alerts')}
                        style={{ 
                            padding: '10px 20px', 
                            cursor: 'pointer', 
                            background: 'none', 
                            border: 'none', 
                            borderBottom: activeTab === 'alerts' ? '3px solid #cf1322' : 'none',
                            color: activeTab === 'alerts' ? '#cf1322' : '#555',
                            fontWeight: activeTab === 'alerts' ? 'bold' : 'normal',
                            fontSize: '16px',
                            transition: 'all 0.3s'
                        }}>
                        Alerts
                    </button>
                    <button 
                        onClick={() => setActiveTab('task_assignment')}
                        style={{ 
                            padding: '10px 20px', 
                            cursor: 'pointer', 
                            background: 'none', 
                            border: 'none', 
                            borderBottom: activeTab === 'task_assignment' ? '3px solid #cf1322' : 'none',
                            color: activeTab === 'task_assignment' ? '#cf1322' : '#555',
                            fontWeight: activeTab === 'task_assignment' ? 'bold' : 'normal',
                            fontSize: '16px',
                            transition: 'all 0.3s'
                        }}>
                        Task Assignment
                    </button>
                    <button 
                        onClick={() => setActiveTab('active_operations')}
                        style={{ 
                            padding: '10px 20px', 
                            cursor: 'pointer', 
                            background: 'none', 
                            border: 'none', 
                            borderBottom: activeTab === 'active_operations' ? '3px solid #cf1322' : 'none',
                            color: activeTab === 'active_operations' ? '#cf1322' : '#555',
                            fontWeight: activeTab === 'active_operations' ? 'bold' : 'normal',
                            fontSize: '16px',
                            transition: 'all 0.3s'
                        }}>
                        Active Rescue Operations
                    </button>
                    <button 
                        onClick={() => setActiveTab('reports')}
                        style={{ 
                            padding: '10px 20px', 
                            cursor: 'pointer', 
                            background: 'none', 
                            border: 'none', 
                            borderBottom: activeTab === 'reports' ? '3px solid #cf1322' : 'none',
                            color: activeTab === 'reports' ? '#cf1322' : '#555',
                            fontWeight: activeTab === 'reports' ? 'bold' : 'normal',
                            fontSize: '16px',
                            transition: 'all 0.3s'
                        }}>
                        Reports
                    </button>
                </div>

                {activeTab === 'alerts' && (
                    <>
                        <h2 style={{ color: '#faad14', margin: '0 0 20px 0' }}>⏳ Pending Alerts Awaiting Verification</h2>

                        {pendingAlerts.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {pendingAlerts.map(alert => (
                            <div key={alert.id} style={{
                                border: '1px solid #d9d9d9', borderLeft: '5px solid #faad14',
                                padding: '15px', background: '#fafafa', borderRadius: '4px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 10px 0' }}>{alert.type} ({alert.severity} Severity)</h4>
                                        <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Location:</strong> {alert.location}</p>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '5px 0' }}>
                                            <p style={{ margin: 0, fontSize: '14px', flex: 1 }}><strong>Details:</strong> {alert.description}</p>
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

                                        <p style={{ margin: '5px 0', fontSize: '12px', color: '#888' }}>
                                            Source: {alert.source} | Time: {new Date(alert.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => handleVerify(alert.id, 'BROADCASTED')}
                                            style={{ padding: '8px 15px', background: '#52c41a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                            ✓ BROADCAST
                                        </button>
                                        <button
                                            onClick={() => handleVerify(alert.id, 'REJECTED')}
                                            style={{ padding: '8px 15px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                            ✗ REJECT
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                            <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No pending alerts at the moment. All clear.</p>
                        )}
                    </>
                )}

                {activeTab === 'help_requests' && (
                    <>
                        <h2 style={{ color: '#cf1322', margin: '0 0 20px 0' }}>🆘 Citizen Help Requests (SOS)</h2>
                        
                        {helpRequests.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {helpRequests.map(req => (
                                    <div key={req.id} style={{
                                        border: '1px solid #d9d9d9', borderLeft: '5px solid #cf1322',
                                        padding: '15px', background: '#fafafa', borderRadius: '4px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 10px 0', color: '#cf1322', fontSize: '18px' }}>{req.emergencyType}</h4>
                                                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Citizen Name:</strong> {req.citizen?.fullName} ({req.citizen?.email})</p>
                                                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Phone Number:</strong> {req.phoneNumber}</p>
                                                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Location:</strong> {req.locationCoordinates} {req.address && `(${req.address})`}</p>
                                                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Description:</strong> {req.description}</p>
                                                <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#888' }}>
                                                    <strong>Status:</strong> <span style={{ color: req.status === 'PENDING' ? '#faad14' : (req.status === 'RESOLVED' ? '#52c41a' : '#1890ff'), fontWeight: 'bold' }}>{req.status}</span> | <strong>Reported At:</strong> {new Date(req.reportedAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No citizen help requests found.</p>
                        )}
                    </>
                )}

                {activeTab === 'task_assignment' && (
                    <>
                        <h2 style={{ color: '#1890ff', margin: '0 0 20px 0' }}>📋 Assign Pending Tasks</h2>
                        
                        {helpRequests.filter(req => req.status === 'PENDING').length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {helpRequests.filter(req => req.status === 'PENDING').map(req => (
                                    <div key={req.id} style={{
                                        border: '1px solid #d9d9d9', borderLeft: '5px solid #1890ff',
                                        padding: '15px', background: '#fafafa', borderRadius: '4px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ margin: '0 0 10px 0', color: '#1890ff', fontSize: '18px' }}>{req.emergencyType}</h4>
                                                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Region:</strong> {req.region}</p>
                                                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Citizen Name:</strong> {req.citizen?.fullName} ({req.citizen?.email})</p>
                                                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Location:</strong> {req.locationCoordinates} {req.address && `(${req.address})`}</p>
                                                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Description:</strong> {req.description}</p>
                                                <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#888' }}>
                                                    <strong>Reported At:</strong> {new Date(req.reportedAt).toLocaleString()}
                                                </p>
                                            </div>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '250px' }}>
                                                {!availableResponders[req.id] ? (
                                                    <button 
                                                        onClick={() => fetchAvailableResponders(req.region, req.id)}
                                                        style={{ padding: '8px 15px', background: '#faad14', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                        🔍 Find Responders in {req.region}
                                                    </button>
                                                ) : (
                                                    <>
                                                        <select 
                                                            value={selectedResponders[req.id] || ''}
                                                            onChange={(e) => setSelectedResponders(prev => ({ ...prev, [req.id]: e.target.value }))}
                                                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                                                        >
                                                            <option value="">Select a Responder</option>
                                                            {availableResponders[req.id].map(responder => (
                                                                <option key={responder.id} value={responder.id}>
                                                                    {responder.fullName} ({responder.phoneNumber})
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {availableResponders[req.id].length === 0 && (
                                                            <span style={{ color: '#cf1322', fontSize: '12px' }}>No responders available in this region.</span>
                                                        )}
                                                        <button 
                                                            onClick={() => handleAssign(req.id)}
                                                            disabled={!selectedResponders[req.id]}
                                                            style={{ 
                                                                padding: '8px 15px', 
                                                                background: selectedResponders[req.id] ? '#52c41a' : '#d9d9d9', 
                                                                color: 'white', border: 'none', borderRadius: '4px', 
                                                                cursor: selectedResponders[req.id] ? 'pointer' : 'not-allowed', 
                                                                fontWeight: 'bold' 
                                                            }}>
                                                            ✓ ASSIGN TASK
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No pending tasks require assignment.</p>
                        )}
                    </>
                )}

                {activeTab === 'active_operations' && (
                    <>
                        <h2 style={{ color: '#52c41a', margin: '0 0 20px 0' }}>🗺️ Map of Active Rescue Operations</h2>
                        
                        <div style={{ height: '600px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #d9d9d9' }}>
                            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
                                />
                                {helpRequests.map(req => {
                                    if (!req.locationCoordinates) return null;
                                    const coords = req.locationCoordinates.split(',').map(c => parseFloat(c.trim()));
                                    if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) return null;

                                    const isResolved = req.status === 'RESOLVED';
                                    const iconToUse = isResolved ? greenIcon : redIcon;

                                    return (
                                        <Marker key={req.id} position={coords} icon={iconToUse}>
                                            <Popup>
                                                <strong>{req.emergencyType}</strong><br/>
                                                <span style={{ color: isResolved ? '#52c41a' : '#cf1322', fontWeight: 'bold' }}>
                                                    Status: {req.status}
                                                </span><br/>
                                                Citizen: {req.citizen?.fullName}<br/>
                                                Region: {req.region}
                                            </Popup>
                                        </Marker>
                                    );
                                })}
                            </MapContainer>
                        </div>
                    </>
                )}

                {activeTab === 'reports' && (
                    <>
                        <h2 style={{ color: '#0050b3', margin: '0 0 20px 0' }}>📂 Post-Mission Responder Reports</h2>
                        
                        {helpRequests.filter(req => req.status === 'RESOLVED').length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
                                {helpRequests.filter(req => req.status === 'RESOLVED').sort((a,b) => new Date(b.resolvedAt) - new Date(a.resolvedAt)).map(req => (
                                    <div key={req.id} style={{
                                        border: '1px solid #d9d9d9', borderTop: '5px solid #0050b3',
                                        padding: '20px', background: 'white', borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
                                            <h3 style={{ margin: 0, color: '#0050b3' }}>{req.emergencyType}</h3>
                                            <span style={{ 
                                                background: req.finalMissionStatus === 'SECURED' ? '#e6ffe6' : req.finalMissionStatus === 'FALSE ALARM' ? '#e6f7ff' : '#fff1f0', 
                                                color: req.finalMissionStatus === 'SECURED' ? '#389e0d' : req.finalMissionStatus === 'FALSE ALARM' ? '#096dd9' : '#cf1322', 
                                                padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', border: '1px solid'
                                            }}>
                                                {req.finalMissionStatus || 'N/A'}
                                            </span>
                                        </div>
                                        
                                        <p style={{ margin: '5px 0', fontSize: '13px' }}><strong>Region:</strong> {req.region}</p>
                                        <p style={{ margin: '5px 0', fontSize: '13px' }}><strong>Citizen:</strong> {req.citizen?.fullName}</p>
                                        <p style={{ margin: '5px 0', fontSize: '13px' }}><strong>Responder:</strong> <span style={{color: '#fa8c16', fontWeight: 'bold'}}>{req.responder?.fullName}</span></p>
                                        
                                        <div style={{ margin: '15px 0', background: '#f5f5f5', padding: '15px', borderRadius: '6px' }}>
                                            <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}><strong>Action Taken:</strong></p>
                                            <p style={{ margin: 0, fontSize: '13px', whiteSpace: 'pre-wrap', color: '#555' }}>{req.actionTaken || 'No action summary provided.'}</p>
                                        </div>
                                        
                                        <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Evacuation Count:</strong> {req.evacuationCount || 0}</p>
                                        
                                        {req.photographicEvidencePath && (
                                            <div style={{ marginTop: '15px' }}>
                                                <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}>Photographic Evidence:</p>
                                                <img 
                                                    src={`http://localhost:8080${req.photographicEvidencePath}`} 
                                                    alt="Mission Evidence" 
                                                    style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }}
                                                />
                                            </div>
                                        )}
                                        
                                        <p style={{ margin: '15px 0 0 0', fontSize: '11px', color: '#888', textAlign: 'right', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                            <strong>Submitted At:</strong> {new Date(req.resolvedAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#888', textAlign: 'center', padding: '40px', background: '#fafafa', borderRadius: '8px', border: '1px dashed #ccc' }}>No reports have been filed by responders yet.</p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;