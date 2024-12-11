// export default App;
// import React, { useEffect, useState } from "react";
// import { Client } from "@stomp/stompjs";
// import SockJS from "sockjs-client";

// function App() {
//   const [messages, setMessages] = useState([]);
//   const [connected, setConnected] = useState(false);
//   const socketUrl = "http://localhost:8080/ws"; // Replace with your WebSocket URL.

//   useEffect(() => {
//     // Create the STOMP client
//     const stompClient = new Client({
//       webSocketFactory: () => new SockJS(socketUrl),
//       debug: (str) => console.log(str),
//       reconnectDelay: 5000,
//       onConnect: () => {
//         console.log("Connected!");
//         setConnected(true);

//         // Subscribe to a topic
//         stompClient.subscribe("/topic/tickets", (message) => {
//           setMessages((prevMessages) => [...prevMessages, message.body]);
//         });
//       },
//       onDisconnect: () => {
//         console.log("Disconnected!");
//         setConnected(false);
//       },
//       onStompError: (frame) => {
//         console.error("Broker reported error: " + frame.headers["message"]);
//         console.error("Additional details: " + frame.body);
//       },
//     });

//     // Activate the client
//     stompClient.activate();

//     // Cleanup on unmount
//     return () => {
//       stompClient.deactivate();
//     };
//   }, [socketUrl]);

//   return (
//     <div style={{ padding: "20px" }}>
//       <h1>WebSocket Test</h1>
//       <button onClick={startSimulation}>Start Simulation</button>
//       <p>Status: {connected ? "Connected" : "Disconnected"}</p>

//       <div>
//         <h2>Messages</h2>
//         <ul>
//           {messages.map((msg, index) => (
//             <li key={index}>{msg}</li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// }

// export default App;
import React, { useState, useEffect } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const App = () => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  let stompClient;

  const requestBody = {
    "totalTickets": 11,
    "ticketReleaseRate": 2,
    "customerRetreivalRate": 3,
    "maxTicketCapacity": 5,
    "customerCount": 2
  }

  const startSimulation = async () => {
    try {
      // Call the backend API to start the ticketing simulation
      const response = await fetch("http://localhost:8080/ticketPool/startSimulation", {
        method: "POST",
        header: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        console.log("Ticketing system started");
        connectWebSocket();
      } else {
        console.error("Failed to start the ticketing system");
      }
    } catch (error) {
      console.error("Error starting ticketing system:", error);
    }
  };

  const stopSimulation = async () => {
    try {
      // Call the backend API to stop the ticketing simulation
      const response = await fetch("http://localhost:8080/ticketPool/stopSimulation", {
        method: "POST",
      });

      if (response.ok) {
        console.log("Ticketing system stopped");
      } else {
        console.error("Failed to stop the ticketing system");
      }
    } catch (error) {
      console.error("Error stopping ticketing system:", error);
    }
  };

  const connectWebSocket = () => {
    const socket = new SockJS("http://localhost:8080/ws");
    stompClient = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        console.log("Connected to WebSocket");
        setIsConnected(true);

        // Subscribe to the topic
        stompClient.subscribe("/topic/messages", (message) => {
          const messageBody = JSON.parse(message.body);
          setMessages((prevMessages) => [...prevMessages, messageBody]);
        });
      },
      onDisconnect: () => {
        console.log("Disconnected from WebSocket");
        setIsConnected(false);
      },
    });

    stompClient.activate();
    console.log("Connected to websocket...");
  };

  useEffect(() => {
    // Cleanup WebSocket connection when component unmounts
    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, []);

  return (
    <div>
      <h1>Ticketing System</h1>
      <button onClick={startSimulation}>
        {isConnected ? "Restart Simulation" : "Start Simulation"}
      </button>
      <button onClick={stopSimulation}>Stop Simulation</button>
      <div>
        <h2>Messages:</h2>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{JSON.stringify(msg)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;
