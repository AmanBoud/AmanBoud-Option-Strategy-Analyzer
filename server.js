const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(bodyParser.json());

app.post("/analyze", (req, res) => {
    const { strike_price, premium, option_type } = req.body;

    if (!strike_price || !premium || !option_type) {
        return res.status(400).json({ error: "Invalid input data" });
    }

    const strike = parseFloat(strike_price);
    const prem = parseFloat(premium);
    const spot_prices = Array.from({ length: 21 }, (_, i) => strike - 10 + i); 

    let pnl_chart = spot_prices.map(spot => {
        let pnl = option_type === "call"
            ? Math.max(spot - strike, 0) - prem
            : Math.max(strike - spot, 0) - prem;
        return { spot, pnl };
    });

    res.json({ pnl_chart });
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
