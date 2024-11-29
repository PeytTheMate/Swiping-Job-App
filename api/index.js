const createServer = require("http").createServer;
const url = require("url");
const axios = require("axios");
const chalk = require("chalk");
const config = require("./config");


const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",  
    "Access-Control-Allow-Methods": "GET"
};

const decodeParams = searchParams => Array
    .from(searchParams.keys())
    .reduce((acc, key) => ({ ...acc, [key]: searchParams.get(key)}), {});

const server = createServer((req, res) => {
    const requestURL = url.parse(req.url, true);

    // Handle preflight CORS request
    if (req.method === 'OPTIONS') {
        res.writeHead(204, headers);
        res.end();
        return;
    }

    if (req.method === "GET") {
        const decodedParams = decodeParams(new URLSearchParams(requestURL.search));
        const { search, location, country = "us" } = decodedParams;

        if (!config.APP_ID || !config.API_KEY) {
            console.log(chalk.red("Missing API credentials"));
            res.writeHead(500, headers);
            res.end(JSON.stringify({ error: "API credentials not configured" }));
            return;
        }

        const targetURL = `${config.BASE_URL}/${country.toLowerCase()}/${config.BASE_PARAMS}&app_id=${config.APP_ID}&app_key=${config.API_KEY}&what=${encodeURIComponent(search)}&where=${encodeURIComponent(location)}`;

        console.log(chalk.green(`Proxy GET request to: ${targetURL}`));
        
        axios.get(targetURL)
            .then(response => {
                res.writeHead(200, headers);
                res.end(JSON.stringify(response.data));
            })
            .catch(error => {
                console.log(chalk.red("API Error:", error.response?.data || error.message));
                res.writeHead(error.response?.status || 500, headers);
                res.end(JSON.stringify({
                    error: error.response?.data || "Internal server error"
                }));
            });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(chalk.green(`Server is listening on port ${PORT}`));
});