import React, { useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "./App.css"; 

function App() {
  const [formData, setFormData] = useState({ 
    strike_price: "", 
    premium: "", 
    option_type: "call" 
  });
  const [chartData, setChartData] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const analyzeStrategy = async () => {
    try {
      const res = await axios.post("http://localhost:5000/analyze", formData);
      setChartData(res.data.pnl_chart);
    } catch (error) {
      console.error("API Error:", error);
      alert("Failed to connect to the backend. Make sure the server is running!");
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>📊 Option Strategy Analyzer</h1>
      </div>

      <div className="form-container">
        <input type="number" name="strike_price" placeholder="Enter Strike Price" onChange={handleChange} />
        <input type="number" name="premium" placeholder="Enter Premium" onChange={handleChange} />
        
        <select name="option_type" onChange={handleChange}>
          <option value="call">Call Option</option>
          <option value="put">Put Option</option>
        </select>

        <button onClick={analyzeStrategy}>Analyze</button>
      </div>

      {chartData.length > 0 && (
        <div className="chart-container">
          <ResponsiveContainer width="80%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="spot" label={{ value: "Spot Price", position: "insideBottom", offset: -5 }} stroke="white" />
              <YAxis label={{ value: "P&L", angle: -90, position: "insideLeft" }} stroke="white" />
              <Tooltip contentStyle={{ backgroundColor: "#222", borderRadius: "5px", color: "#fff" }} />
              <Line type="monotone" dataKey="pnl" stroke="#4CAF50" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default App;
