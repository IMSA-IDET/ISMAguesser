const express = require("express");
const { randomID, checkNickInput, getEpochUTC } = require("./helper");
const { default: settings } = require("./config/settings");
const { default: locations } = require("./config/locations");
const app = express();
const port = 3001;

// Middleware
app.use(express.json());
app.use(express.cookieParser());

// Game data
let activeGames = {
    "standard": {},
    "time_travel": {},
    "shadow": {}
}

// Separate data for weekly challenge games
let activeWeeklyGames = {

}

app.post("/api/create_match", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const json = res.body;

    if (!Object.keys(activeGames).includes(json.game_mode) || !checkNickInput(json.nickname)) {
        res.status(400).send("");
        return;
    }

    const sessionId = randomID(16);
    const gameData = {
        "start_time": getEpochUTC(),
        "end_time": getEpochUTC() + settings[json.game].time * 1000,
        "nickname": json.nickname,
        "round_iterator": 0,
        "total_rounds": settings[json.game].rounds,
        "history": [],
        "score": 0
    }
    activeGames[json.game][sessionId] = gameData;

    res.end(JSON.stringify({
        "game_session_id": sessionId
    }));
});

app.get("/api/match_info", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const cookie = req.cookies;

    // Authentication
    if (
        (cookie.game_session_id === undefined || cookie.game_mode === undefined) ||
        !Object.keys(activeGames).includes(cookie.game_mode) || 
        activeGames[cookie.game_mode][cookie.game_session_id] === undefined
    ) {
        res.status(400).send("");
        return;
    }

    // Timeout
    if (activeGames[cookie.game_mode][cookie.game_session_id].end_time <= getEpochUTC()) {
        delete activeGames[cookie.game_mode][cookie.game_session_id];
        res.status(403).send("");
        return;
    }

    res.end(JSON.stringify({
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
        res.status(400).send("");
        return;
    }

    // Timeout
    if (activeGames[cookie.game_mode][cookie.game_session_id].end_time <= getEpochUTC()) {
        delete activeGames[cookie.game_mode][cookie.game_session_id];
        res.status(403).send("");
        return;
    }

    // Check if image was already selected
    if (activeGames[cookie.game_mode][cookie.game_session_id].history.length == activeGames[cookie.game_mode][cookie.game_session_id].round_iterator + 1) {
        res.sendFile(`./images/${cookie.game_mode}/${activeGames[cookie.game_mode][cookie.game_session_id].history.at(-1)}`);
        return;
    }

    // Select new random image
    let imageName = "";
    let imageNameFound = false;
    const images = fs.readdirSync(`./images/${gameMode}/`);
    while (!imageNameFound) {
        imageName = images[Math.floor(Math.random() *  images.length)];
        if (!activeGames[cookie.game_mode][cookie.game_session_id].history.includes(imageName)) {
            imageNameFound = true;
            activeGames[cookie.game_mode][cookie.game_session_id].history.push(imageName);
        }
    }
    res.sendFile(`./images/${cookie.game_mode}/${imageName}`);
});

// Single round submission
app.post("/api/submit_round", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const json = res.body;
    const cookie = req.cookies;

    // Authentication
    if (
        cookie.game_session_id === undefined ||
        cookie.game_mode === undefined ||
        !Object.keys(activeGames).includes(cookie.game_mode) || 
        activeGames[cookie.game_mode][cookie.game_session_id] === undefined ||
        activeGames[cookie.game_mode][cookie.game_session_id].round_iterator == activeGames[cookie.game_mode][cookie.game_session_id].total_rounds
    ) {
        res.status(400).send("");
        return;
    }

    // Timeout
    if (activeGames[cookie.game_mode][cookie.game_session_id].end_time <= getEpochUTC()) {
        delete activeGames[cookie.game_mode][cookie.game_session_id];
        res.status(403).send("");
        return;
    }

    // Calculating score
    const imageName = activeGames[cookie.game_mode][cookie.game_session_id];
    const locationGuess = json.location;
    const locationAnswer = locations[cookie.game_mode][imageName].location;
    const distance = Math.sqrt((locationGuess.x - locationAnswer.x) * (locationGuess.x - locationAnswer.x) + (locationGuess.y - locationAnswer.y) * (locationGuess.y - locationAnswer.y));
    const score = Math.floor(settings.general.round_score * Math.max(0, (settings.general.max_distance - distance) / settings.general.max_distance));

    // Adding score to game data
    activeGames[cookie.game_mode][cookie.game_session_id].score += score;

    // Shift iterator
    activeGames[cookie.game_mode][cookie.game_session_id].round_iterator++;

    // Sending back round info
    res.end(JSON.stringify({
        "score": score
    }));
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
        res.status(400).send("");
        return;
    }

    // Timeout but allow extra time for submission
    if (activeGames[cookie.game_mode][cookie.game_session_id].end_time + settings.general.time_to_submit <= getEpochUTC()) {
        delete activeGames[cookie.game_mode][cookie.game_session_id];
        res.status(403).send("");
        return;
    }

    // Adding to leaderboard

    // Sending back match info
    res.end(JSON.stringify({
        "game_data": activeGames[cookie.game_mode][cookie.game_session_id]
    }));
});

app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});