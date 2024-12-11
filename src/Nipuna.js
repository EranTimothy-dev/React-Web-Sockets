import React, { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';

const WebSocketComponent = () => {
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState([]);
  const [ticketData, setTicketData] = useState({
    totalTicketCount: 0,
    ticketReleaseRate: 0,
    customerRetrievalRate: 0,
    maxTicketCapacity: 0,
    numCustomers: 0,
  });
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [soldTickets, setSoldTickets] = useState(0);
  const [availableTickets, setAvailableTickets] = useState(0);

  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws');
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => console.log(str),
      onConnect: () => {
        console.log('Connected to WebSocket');
        stompClient.subscribe('/topic/messages', (message) => {
          setMessage(message.body);
        });

        stompClient.subscribe('/topic/tickets', (message) => {
          const soldTicketCount = parseInt(message.body, 10); // Parse the sold tickets from the message
          setSoldTickets(soldTicketCount);  // Update sold tickets state

          // Calculate available tickets based on total tickets - sold tickets
          setAvailableTickets(ticketData.totalTicketCount - soldTicketCount);
        });
      },
      onStompError: (error) => {
        console.error('WebSocket Error:', error);
      },
    });

    stompClient.activate();

    // Cleanup on unmount
    return () => {
      stompClient.deactivate();
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTicketData({
      ...ticketData,
      [name]: value,
    });
  };

  const startSimulation = async () => {
    try {
      const response = await axios.post('http://localhost:8080/ticketPool/startSimulation', ticketData);
      console.log(ticketData.totalTicketCount);
      console.log(ticketData.numCustomers);
      console.log(ticketData.maxTicketCapacity);
      console.log(ticketData.customerRetrievalRate);
      console.log(ticketData.ticketReleaseRate)
      setSimulationRunning(true);
      setLogs((prevLogs) => [...prevLogs, 'Simulation Started...']);
    } catch (error) {
      console.error('Error starting simulation:', error);
      setLogs((prevLogs) => [...prevLogs, 'Failed to start simulation']);
    }
  };

  const stopSimulation = async () => {
    try {
      await axios.post('http://localhost:8080/ticketPool/stopSimulation');
      setSimulationRunning(false);
      setLogs((prevLogs) => [...prevLogs, 'Simulation Stopped.']);
    } catch (error) {
      console.error('Error stopping simulation:', error);
      setLogs((prevLogs) => [...prevLogs, 'Failed to stop simulation']);
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Ticketing Simulation</h1>

      {/* Configuration Form */}
      <div className="card mb-4">
        <div className="card-header">
          <h4>Configuration Form</h4>
        </div>
        <div className="card-body">
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="form-group mb-3">
              <label>Total Ticket Count:</label>
              <input
                type="number"
                name="totalTicketCount"
                className="form-control"
                value={ticketData.totalTicketCount}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group mb-3">
              <label>Ticket Release Rate (Seconds):</label>
              <input
                type="number"
                name="ticketReleaseRate"
                className="form-control"
                value={ticketData.ticketReleaseRate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group mb-3">
              <label>Customer Retrieval Rate (Seconds):</label>
              <input
                type="number"
                name="customerRetrievalRate"
                className="form-control"
                value={ticketData.customerRetrievalRate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group mb-3">
              <label>Maximum Ticket Capacity in Ticket Pool:</label>
              <input
                type="number"
                name="maxTicketCapacity"
                className="form-control"
                value={ticketData.maxTicketCapacity}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group mb-3">
              <label>Number of Customers:</label>
              <input
                type="number"
                name="numCustomers"
                className="form-control"
                value={ticketData.numCustomers}
                onChange={handleInputChange}
                required
              />
            </div>
          </form>
        </div>
      </div>

      {/* Tickets Board Section */}
      <div className="card mb-4">
        <div className="card-header">
          <h4>Tickets Board</h4>
        </div>
        <div className="card-body">
          <p><strong>Available Tickets:</strong> 0</p>
          <p><strong>Sold Tickets:</strong> 0</p>
        </div>
      </div>

      {/* Control Panel Section */}
      <div className="card mb-4">
        <div className="card-header">
          <h4>Control Panel</h4>
        </div>
        <div className="card-body">
          <button className="btn btn-success" onClick={startSimulation} disabled={simulationRunning}>
            Start Simulation
          </button>
          <button className="btn btn-danger ml-2" onClick={stopSimulation} disabled={!simulationRunning}>
            Stop Simulation
          </button>
        </div>
      </div>

      {/* System Logs Section */}
      <div className="card mb-4">
        <div className="card-header">
          <h4>System Logs</h4>
        </div>
        <div className="card-body" style={{ maxHeight: '200px', overflowY: 'scroll' }}>
          {logs.length > 0 ? (
            logs.map((log, index) => <p key={index}>{log}</p>) // Display each log message
          ) : (
            <p>No logs yet...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebSocketComponent;