const express = require('express');
const axios = require('axios');
const { evaluate } = require('mathjs');

const app = express();
const PORT = process.env.PORT || 3000;
// const apikeyTemerature = "jQk3vlIGFWA1yj0zWXhaT7zbUCDrdfLN";
const apikeyTemerature = "sh03VOpTmic8xhjkfMFGplGnQQDkLtVc";
const apikeyStock = "2e6cb55838msh557572d5de2606fp1ab2c1jsn1807912e8482";

// Middleware to parse JSON requests
app.use(express.json());

const fetchAirportTemperature = async ( queryAirportTemp ) => {
    console.log('fetch temparature' + queryAirportTemp);
    const  airportCode = queryAirportTemp;
    try {
        const response = await axios.get(`https://www.airport-data.com//api/ap_info.json?iata=${airportCode}`);
        const location = response.data.location;
        const city = await axios.get(`http://dataservice.accuweather.com/locations/v1/cities/search?apikey=${apikeyTemerature}&q=${location}`);
        console.log(city);
        if (city.data.length > 0) {
            const iataCode = city.data[0].Key;
            const response = await axios.get(`http://dataservice.accuweather.com/forecasts/v1/daily/1day/${iataCode}?apikey=${apikeyTemerature}`);
            return response.data;
        }
    } catch (error) {
        return error;
    }
}


const fetchStockPrice = async ( stockSymbol ) => {
    try {
        const response = await axios.get(`https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-summary?region=US&lang=en&symbol=${stockSymbol}`, {
            headers: {
                "X-RapidAPI-Key": apikeyStock,
                "X-RapidAPI-Host": 'apidojo-yahoo-finance-v1.p.rapidapi.com'
            }
        });;
        return response.data.price;
    } catch (error) {
        console.log( error );
        return null;
    }
}

app.get('/query', async (req, res) => {

    const { queryAirportTemp, queryStockPrice, queryEval } = req.query;

    // Initialize variables to store results
    let airportTempResult = null;
    let stockPriceResult = null;
    let evalResult = null;
    
    if (!queryAirportTemp && !queryStockPrice && !queryEval) {
        return res.status(400).send('Undefined Value');
    }

    if (queryAirportTemp) {
        try {
            const temperature = await fetchAirportTemperature(queryAirportTemp);
            console.log(temperature);
            if (temperature !== null || temperature != undefined )  {
                airportTempResult = temperature.DailyForecasts;
            } else {
                return res.status(404).send('Temperature data not found for the specified airport.');
            }
        } catch(error) {
            return res.status(404).send('Temperature data not found for the specified airport.');
        }
    }
    
    if (queryStockPrice) {
        console.log("query queryStockPrice");
        try {
            stockPriceResult = await fetchStockPrice(queryStockPrice);
        } catch (error) {
            return res.status(404).send('Stock price data not found for the specified stock symbol.');
        }
    }
    
    if (queryEval) {
        // console.log("query evalution", queryEval );
        var modifiedString = queryEval.replace(/\s+/g, '+');
        console.log(modifiedString);
        const decodedExpression = decodeURIComponent(modifiedString);
        if (!decodedExpression) {
            return res.status(400).json({ error: 'Expression is required' });
        }

        try {
            evalResult = evaluate(decodedExpression);
            console.log(evalResult);
        } catch (error) {
            return res.status(400).json({ error: 'Invalid expression' });
        }
    }


    // Prepare response object
    const response = {
        queryAirportTemp: airportTempResult,
        queryStockPrice: stockPriceResult,
        queryEval: evalResult
    };

    res.json(response);
});


app.get('/', (req, res) => {
    res.json("hello world");
})

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
