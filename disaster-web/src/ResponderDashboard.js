import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResponderDashboard = () => {
    const navigate = useNavigate();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [tasks, setTasks] = useState([]);
    
    // UI State
    const [activeTab, setActiveTab] = useState('assigned_queue');
    const [selectedTaskId, setSelectedTaskId] = useState('');
    const [finalMissionStatus, setFinalMissionStatus] = useState('SECURED');
    const [evacuationCount, setEvacuationCount] = useState(0);
    const [actionTaken, setActionTaken] = useState('');
    const [evidenceFile, setEvidenceFile] = useState(null);

    const fetchTasks = async () => {
        try {
            const token = localStorage.getItem('jwt_token');
            const response = await axios.get('http://localhost:8080/api/incidents/my-tasks', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(response.data);
        } catch (error) {
            console.error('Error fetching tasks', error);
        }
    };

    useEffect(() => {
        const role = localStorage.getItem('user_role');
        const token = localStorage.getItem('jwt_token');

        if (!token || role !== 'RESPONDER') {
            alert("⚠️ ACCESS DENIED: Authorized Responders Only!");
            navigate('/'); // Kick out
        } else {
            setIsAuthorized(true); // Unlock the page
            fetchTasks();
            // Fetch tasks every 10 seconds for pseudo real-time updates
            const interval = setInterval(fetchTasks, 10000);
            return () => clearInterval(interval);
        }
    }, [navigate]);

    const handleAcknowledge = async (id) => {
        try {
            const token = localStorage.getItem('jwt_token');
            await axios.put(`http://localhost:8080/api/incidents/${id}/acknowledge`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTasks(); // Refresh list to get accurate timestamp
        } catch (error) {
            console.error('Error acknowledging task', error);
            alert("Failed to acknowledge task.");
        }
    };

    const handleResolve = async (id) => {
        // Automatically switch to the report tab and pre-select
        setSelectedTaskId(id);
        setActiveTab('incident_report');
    };

    const submitReport = async (e) => {
        e.preventDefault();
        if (!selectedTaskId) {
            alert("Please select an assigned incident.");
            return;
        }

        const token = localStorage.getItem('jwt_token');
        const formData = new FormData();
        formData.append('finalMissionStatus', finalMissionStatus);
        formData.append('evacuationCount', evacuationCount);
        formData.append('actionTaken', actionTaken);
        if (evidenceFile) {
            formData.append('evidence', evidenceFile);
        }

        try {
            await axios.post(`http://localhost:8080/api/incidents/${selectedTaskId}/report`, formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert("Report submitted successfully. Situation resolved!");
            // Reset form
            setSelectedTaskId('');
            setFinalMissionStatus('SECURED');
            setEvacuationCount(0);
            setActionTaken('');
            setEvidenceFile(null);
            
            fetchTasks();
            setActiveTab('assigned_queue');
        } catch (error) {
            console.error('Error submitting report', error);
            alert("Failed to submit report.");
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    // If not authorized yet, show NOTHING
    if (!isAuthorized) {
        return null;
    }

    return (
        <div style={{ padding: '20px', backgroundColor: '#e6ffe6', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ color: '#006600', margin: 0 }}>🚑 RESPONDER FIELD UNIT</h1>
                <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#006600', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>LOGOUT</button>
            </div>
            <p style={{ color: '#595959' }}>Manage your emergency assignations efficiently. Acknowledge tasks immediately.</p>

            <div style={{ padding: '20px', margin: '20px 0', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', borderBottom: '2px solid #ddd', marginBottom: '20px' }}>
                    <button 
                        onClick={() => setActiveTab('assigned_queue')}
                        style={{ 
                            padding: '10px 20px', cursor: 'pointer', background: 'none', border: 'none', 
                            borderBottom: activeTab === 'assigned_queue' ? '3px solid #006600' : 'none',
                            color: activeTab === 'assigned_queue' ? '#006600' : '#555',
                            fontWeight: activeTab === 'assigned_queue' ? 'bold' : 'normal',
                            fontSize: '16px', transition: 'all 0.3s'
                        }}>
                        Assigned Queue
                    </button>
                    <button 
                        onClick={() => setActiveTab('incident_report')}
                        style={{ 
                            padding: '10px 20px', cursor: 'pointer', background: 'none', border: 'none', 
                            borderBottom: activeTab === 'incident_report' ? '3px solid #006600' : 'none',
                            color: activeTab === 'incident_report' ? '#006600' : '#555',
                            fontWeight: activeTab === 'incident_report' ? 'bold' : 'normal',
                            fontSize: '16px', transition: 'all 0.3s'
                        }}>
                        Incident Report
                    </button>
                </div>

                {activeTab === 'assigned_queue' && (
                    <>
                        <h2 style={{ color: '#006600', margin: '0 0 20px 0' }}>📋 Assigned Incidents Queue</h2>

                {tasks.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {tasks.map(task => (
                            <div key={task.id} style={{
                                borderLeft: `5px solid ${task.status === 'ASSIGNED' ? '#cf1322' : task.status === 'ACKNOWLEDGED' ? '#faad14' : '#52c41a'}`,
                                padding: '15px', background: '#fafafa', borderRadius: '4px', border: '1px solid #d9d9d9'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: '0 0 5px 0', color: task.status === 'ASSIGNED' ? '#cf1322' : '#333' }}>
                                            {task.emergencyType} - {task.status}
                                        </h3>
                                        <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Status:</strong> {task.status}</p>
                                        <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Location (GPS):</strong> <a href={`https://maps.google.com/?q=${task.locationCoordinates}`} target="_blank" rel="noreferrer" style={{ color: '#1890ff' }}>{task.locationCoordinates}</a></p>
                                        <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Address:</strong> {task.address || 'N/A'}</p>
                                        <p style={{ margin: '5px 0', fontSize: '14px', background: '#fff1f0', padding: '10px', borderRadius: '4px', borderLeft: '2px solid #cf1322' }}>
                                            <strong>Situation Details:</strong> {task.description}
                                        </p>
                                        <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Citizen Phone:</strong> <a href={`tel:${task.phoneNumber}`} style={{ fontWeight: 'bold', color: '#006600' }}>{task.phoneNumber}</a></p>

                                        <div style={{ marginTop: '15px', display: 'flex', gap: '20px', fontSize: '12px', color: '#888' }}>
                                            <span><strong>Reported:</strong> {new Date(task.reportedAt).toLocaleString()}</span>
                                            {task.acknowledgedAt && <span><strong>Acknowledged:</strong> {new Date(task.acknowledgedAt).toLocaleString()}</span>}
                                            {task.resolvedAt && <span><strong>Resolved:</strong> {new Date(task.resolvedAt).toLocaleString()}</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '150px' }}>
                                        {task.status === 'ASSIGNED' && (
                                            <button
                                                onClick={() => handleAcknowledge(task.id)}
                                                style={{ padding: '10px 15px', background: '#faad14', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                ACKNOWLEDGE TASK
                                            </button>
                                        )}
                                        {task.status === 'ACKNOWLEDGED' && (
                                            <button
                                                onClick={() => handleResolve(task.id)}
                                                style={{ padding: '10px 15px', background: '#52c41a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                MARK AS RESOLVED
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                        <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>Your queue is empty. Great job!</p>
                    )}
                    </>
                )}

                {activeTab === 'incident_report' && (
                    <>
                        <h2 style={{ color: '#1890ff', margin: '0 0 20px 0' }}>📝 File Post-Mission Report</h2>
                        <form onSubmit={submitReport} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '600px' }}>
                            <label>
                                <strong>Select Task:</strong>
                                <select 
                                    value={selectedTaskId} 
                                    onChange={(e) => setSelectedTaskId(e.target.value)}
                                    style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                                    required
                                >
                                    <option value="">-- Choose an active assignment --</option>
                                    {tasks.filter(t => t.status === 'ACKNOWLEDGED' || t.status === 'ASSIGNED').map(t => (
                                        <option key={t.id} value={t.id}>{t.emergencyType} at {t.region} (ID: {t.id})</option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                <strong>Final Mission Status:</strong>
                                <select 
                                    value={finalMissionStatus} 
                                    onChange={(e) => setFinalMissionStatus(e.target.value)}
                                    style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                                >
                                    <option value="SECURED">SECURED</option>
                                    <option value="REQUIRES BACKUP">REQUIRES BACKUP</option>
                                    <option value="FALSE ALARM">FALSE ALARM</option>
                                </select>
                            </label>

                            <label>
                                <strong>Evacuation Count:</strong>
                                <input 
                                    type="number" 
                                    min="0"
                                    value={evacuationCount} 
                                    onChange={(e) => setEvacuationCount(e.target.value)}
                                    style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            </label>

                            <label>
                                <strong>Action Taken:</strong>
                                <textarea 
                                    rows="4" 
                                    value={actionTaken} 
                                    onChange={(e) => setActionTaken(e.target.value)}
                                    placeholder="Describe the overall mission execution and context..."
                                    style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            </label>

                            <label>
                                <strong>Photographic Evidence:</strong>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => setEvidenceFile(e.target.files[0])}
                                    style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                                />
                            </label>

                            <button 
                                type="submit" 
                                style={{ padding: '12px', background: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                                📤 SUBMIT REPORT & RESOLVE
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default ResponderDashboard;