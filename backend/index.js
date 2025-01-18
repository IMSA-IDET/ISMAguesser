const express = require("express");
const { randomID, checkNickInput, getEpochUTC, randomImage } = require("./helper");
const { default: settings } = require("./config/settings");
const app = express();
const port = 3001;

// Middleware
app.use(express.json());
app.use(express.cookieParser());

// Game data
let activeGames = {
    "standard": {},
    "time_travel": {},
    "weekly": {},
    "shadow": {}
}

app.post("/api/create_match", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const json = res.body;

    if (!Object.keys(activeGames).includes(json.game) || !checkNickInput(json.nickname)) {
        res.end(JSON.stringify({
            "accepted": false
        }));
        return;
    }

    const sessionId = randomID(16);
    const gameData = {
        "start_time": getEpochUTC(),
        "end_time": getEpochUTC() + settings[json.game].time * 1000,
        "nickname": json.nickname,
        "round_iterator": 0,
        "total_rounds": settings[json.game].rounds,
        "history": []
    }
    activeGames[json.game][sessionId] = gameData;

    res.end(JSON.stringify({
        "accepted": true,
        "game_session_id": sessionId
    }));
});

app.get("/api/match_info", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const cookie = req.cookies;

    if (
        (cookie.game_session_id === undefined || cookie.game_mode === undefined) ||
        !Object.keys(activeGames).includes(cookie.game_mode) || 
        activeGames[cookie.game_mode][cookie.game_session_id] === undefined
    ) {
        res.end(JSON.stringify({
            "accepted": false
        }));
        return;
    }

    if (activeGames[cookie.game_mode][cookie.game_session_id].end_time <= getEpochUTC()) {
        delete activeGames[cookie.game_mode][cookie.game_session_id];
        res.end(JSON.stringify({
            "accepted": false
        }));
        return;
    }

    res.end(JSON.stringify({
        "accepted": true,
        "game_data": activeGames[cookie.game_mode][cookie.game_session_id]
    }));
});

app.get("/api/round_image", (req, res) => {
    res.setHeader("Content-Type", "image/png");
    const cookie = req.cookies;

    // Authentication
    if (
        cookie.game_session_id === undefined ||
        cookie.game_mode === undefined ||
        !Object.keys(activeGames).includes(cookie.game_mode) || 
        activeGames[cookie.game_mode][cookie.game_session_id] === undefined ||
        activeGames[cookie.game_mode][cookie.game_session_id].round_iterator == activeGames[cookie.game_mode][cookie.game_session_id].total_rounds
    ) {
        res.status(401).send("");
        return;
    }

    // Random image
    let imageName = "";
    let imageNameFound = false;
    const images = fs.readdirSync(`./images/${gameMode}/`);
    while (!imageNameFound) {
        imageName = images[Math.floor(Math.random() *  images.length)];
        if (!activeGames[cookie.game_mode][cookie.game_session_id].history.includes(imageName)) {
            imageNameFound = true;
        }
    }

    // Shift iterator
    activeGames[cookie.game_mode][cookie.game_session_id].history.push(imageName);
    activeGames[cookie.game_mode][cookie.game_session_id].round_iterator++;

    res.sendFile(`./images/${cookie.game_mode}/${randomImage(cookie.game_mode)}`);
});

// Single round submission
app.post("/api/submit_round", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const cookie = req.cookies;

    // Authentication
    if (
        cookie.game_session_id === undefined ||
        cookie.game_mode === undefined ||
        !Object.keys(activeGames).includes(cookie.game_mode) || 
        activeGames[cookie.game_mode][cookie.game_session_id] === undefined ||
        activeGames[cookie.game_mode][cookie.game_session_id].round_iterator < activeGames[cookie.game_mode][cookie.game_session_id].total_rounds - 1
    ) {
        res.status(401).send("");
        return;
    }

    // Calculating score

    // Adding score to game data

    // Sending back round info
});

// Final, total score submission
app.post("/api/submit_match", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const cookie = req.cookies;

    // Authentication
    if (
        cookie.game_session_id === undefined ||
        cookie.game_mode === undefined ||
        !Object.keys(activeGames).includes(cookie.game_mode) || 
        activeGames[cookie.game_mode][cookie.game_session_id] === undefined ||
        activeGames[cookie.game_mode][cookie.game_session_id].round_iterator < activeGames[cookie.game_mode][cookie.game_session_id].total_rounds - 1
    ) {
        res.status(401).send("");
        return;
    }

    // Calculating score

    // Adding to leaderboard

    // Sending back match info
});

app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});