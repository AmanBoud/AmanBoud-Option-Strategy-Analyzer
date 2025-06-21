// import React, { useState } from "react";
// import axios from "axios";
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// function App() {
//   const [formData, setFormData] = useState({ 
//     strike_price: "", 
//     premium: "", 
//     option_type: "call" 
//   });
//   const [chartData, setChartData] = useState([]);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const analyzeStrategy = async () => {
//     const res = await axios.post("http://localhost:5000/analyze", formData);
//     setChartData(res.data.pnl_chart);
//   };

//   return (
//     <div style={{ textAlign: "center", padding: "20px" }}>
//       <h2>Option Strategy Analyzer</h2>
      
//       <input type="number" name="strike_price" placeholder="Strike Price" onChange={handleChange} />
//       <input type="number" name="premium" placeholder="Premium" onChange={handleChange} />
      
//       <select name="option_type" onChange={handleChange}>
//         <option value="call">Call Option</option>
//         <option value="put">Put Option</option>
//       </select>

//       <button onClick={analyzeStrategy} style={{ margin: "10px" }}>Analyze</button>

//       {chartData.length > 0 && (
//         <ResponsiveContainer width="80%" height={400}>
//           <LineChart data={chartData}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="spot" label={{ value: "Spot Price", position: "insideBottom", offset: -10 }} />
//             <YAxis label={{ value: "P&L", angle: -90, position: "insideLeft" }} />
//             <Tooltip />
//             <Line type="monotone" dataKey="pnl" stroke="#8884d8" />
//           </LineChart>
//         </ResponsiveContainer>
//       )}
//     </div>
//   );
// }

// export default App;

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Label
} from "recharts";

export default function App() {
  const [legs, setLegs] = useState([
    { action: "Buy", quantity: 1, strike: "", type: "Call" },
  ]);
  const [submittedLegs, setSubmittedLegs] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [maxProfit, setMaxProfit] = useState(null);
  const [maxLoss, setMaxLoss] = useState(null);
  const [breakEvens, setBreakEvens] = useState([]);

  const handleLegChange = (index, field, value) => {
    const newLegs = [...legs];
    newLegs[index][field] = value;
    setLegs(newLegs);
  };

  const addLeg = () => {
    setLegs([
      ...legs,
      { action: "Buy", quantity: 1, strike: "", type: "Call" },
    ]);
  };

  const removeLeg = (index) => {
    const newLegs = [...legs];
    newLegs.splice(index, 1);
    setLegs(newLegs);
  };

  const loadStrategy = (strategy) => {
    if (strategy === "straddle") {
      const atmStrike = 20000;
      setLegs([
        { action: "Buy", quantity: 1, strike: atmStrike, type: "Call" },
        { action: "Buy", quantity: 1, strike: atmStrike, type: "Put" },
      ]);
    } else if (strategy === "strangle") {
      const atmStrike = 20000;
      setLegs([
        { action: "Buy", quantity: 1, strike: atmStrike - 100, type: "Put" },
        { action: "Buy", quantity: 1, strike: atmStrike + 100, type: "Call" },
      ]);
    } else if (strategy === "ironCondor") {
      const atmStrike = 20000;
      setLegs([
        { action: "Sell", quantity: 1, strike: atmStrike - 100, type: "Put" },
        { action: "Buy", quantity: 1, strike: atmStrike - 200, type: "Put" },
        { action: "Sell", quantity: 1, strike: atmStrike + 100, type: "Call" },
        { action: "Buy", quantity: 1, strike: atmStrike + 200, type: "Call" },
      ]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmittedLegs(legs);
    generateChartData(legs);
  };

  const generateChartData = (legs) => {
    const data = [];
    const minStrike = Math.min(...legs.map(l => l.strike)) - 400;
    const maxStrike = Math.max(...legs.map(l => l.strike)) + 400;
    let localMaxProfit = Number.NEGATIVE_INFINITY;
    let localMaxLoss = Number.POSITIVE_INFINITY;
    const localBreakEvens = [];

    // Generating the data points for the chart
    for (let spot = minStrike; spot <= maxStrike; spot += 20) {
      let totalPnL = 0;

      legs.forEach((leg) => {
        const { action, quantity, strike, type } = leg;
        let payoff = 0;

        if (type === "Call") {
          payoff = Math.max(0, spot - strike);
        } else {
          payoff = Math.max(0, strike - spot);
        }

        payoff = (action === "Buy" ? 1 : -1) * payoff * quantity;

        totalPnL += payoff;
      });

      data.push({ spot, pnl: totalPnL });

      if (totalPnL > localMaxProfit) localMaxProfit = totalPnL;
      if (totalPnL < localMaxLoss) localMaxLoss = totalPnL;
    }

    // Find break-even points (when pnl crosses 0)
    for (let i = 1; i < data.length; i++) {
      if ((data[i - 1].pnl < 0 && data[i].pnl >= 0) || (data[i - 1].pnl > 0 && data[i].pnl <= 0)) {
        localBreakEvens.push(data[i].spot);
      }
    }

    setChartData(data);
    setMaxProfit(localMaxProfit);
    setMaxLoss(localMaxLoss);
    setBreakEvens(localBreakEvens);

    // Debug log to confirm the data is being generated
    console.log('Generated chart data:', data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-300 via-pink-300 to-red-300 p-8">
      <h1 className="text-4xl font-bold text-center text-white mb-10">Options Strategy Analyzer</h1>

      <div className="flex justify-center gap-4 mb-10">
        <button
          onClick={() => loadStrategy("straddle")}
          className="bg-white hover:bg-purple-100 text-purple-700 font-bold py-2 px-4 rounded-full shadow-md transition"
        >
          Load Straddle
        </button>
        <button
          onClick={() => loadStrategy("strangle")}
          className="bg-white hover:bg-pink-100 text-pink-700 font-bold py-2 px-4 rounded-full shadow-md transition"
        >
          Load Strangle
        </button>
        <button
          onClick={() => loadStrategy("ironCondor")}
          className="bg-white hover:bg-red-100 text-red-700 font-bold py-2 px-4 rounded-full shadow-md transition"
        >
          Load Iron Condor
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-2xl max-w-4xl mx-auto space-y-6">
        {legs.map((leg, index) => (
          <div key={index} className="flex gap-4 items-center">
            <select
              value={leg.action}
              onChange={(e) => handleLegChange(index, "action", e.target.value)}
              className="p-2 rounded-lg border-2 border-purple-300"
            >
              <option>Buy</option>
              <option>Sell</option>
            </select>

            <input
              type="number"
              value={leg.quantity}
              onChange={(e) => handleLegChange(index, "quantity", parseInt(e.target.value))}
              placeholder="Quantity"
              className="p-2 rounded-lg border-2 border-purple-300 w-24"
            />

            <input
              type="number"
              value={leg.strike}
              onChange={(e) => handleLegChange(index, "strike", parseInt(e.target.value))}
              placeholder="Strike"
              className="p-2 rounded-lg border-2 border-purple-300 w-32"
            />

            <select
              value={leg.type}
              onChange={(e) => handleLegChange(index, "type", e.target.value)}
              className="p-2 rounded-lg border-2 border-purple-300"
            >
              <option>Call</option>
              <option>Put</option>
            </select>

            <button
              type="button"
              onClick={() => removeLeg(index)}
              className="text-red-500 hover:text-red-700 font-bold"
            >
              ❌
            </button>
          </div>
        ))}

        <div className="flex justify-between">
          <button
            type="button"
            onClick={addLeg}
            className="bg-green-400 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-full transition"
          >
            + Add Leg
          </button>

          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition"
          >
            Analyze
          </button>
        </div>
      </form>

      {submittedLegs && (
        <div className="mt-10 bg-white p-6 rounded-3xl shadow-2xl max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-purple-700 mb-6 text-center">Strategy Details</h2>

          <ul className="space-y-4 mb-10">
            {submittedLegs.map((leg, index) => (
              <li key={index} className="bg-purple-100 p-4 rounded-xl shadow-md">
                {leg.action} {leg.quantity} {leg.type} Option @ Strike {leg.strike}
              </li>
            ))}
          </ul>

          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="spot" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="pnl" stroke="#8884d8" strokeWidth={3} />
                
                {/* Add break-even lines */}
                {breakEvens.map((be, index) => (
                  <ReferenceLine key={index} x={be} stroke="green" strokeDasharray="5 5">
                    <Label value="B.E." position="top" />
                  </ReferenceLine>
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 text-center">
            <h3 className="text-xl font-bold text-gray-700 mb-4">Summary</h3>
            <p className="text-green-600 font-bold">Max Profit: {maxProfit}</p>
            <p className="text-red-600 font-bold">Max Loss: {maxLoss}</p>
            {breakEvens.length > 0 && (
              <p className="text-purple-600 font-bold">
                Break-even Points: {breakEvens.join(", ")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
