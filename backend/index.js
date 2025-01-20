import express from 'express';
import bodyParser from 'body-parser';
import cors from "cors";

import { randomID, checkNickInput, getEpochUTC } from "./helper.js";
import settings from "./config/settings.js";
import locations from "./config/locations.js";
const app = express();
const port = 3001;

// Middleware
app.use(bodyParser.json());
app.use(cors());

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
    const json = req.body;

    if (!Object.keys(activeGames).includes(json.game_mode) || !checkNickInput(json.nickname)) {
        res.status(400).send("");
        return;
    }

    const sessionId = randomID(16);
    const gameData = {
        "start_time": getEpochUTC(),
        "end_time": getEpochUTC() + settings[json.game_mode].time * 1000,
        "nickname": json.nickname,
        "round_iterator": 0,
        "total_rounds": settings[json.game_mode].rounds,
        "history": [],
        "score": 0
    }
    activeGames[json.game_mode][sessionId] = gameData;

    res.end(JSON.stringify({
        "game_session_id": sessionId
    }));
});

app.post("/api/match_info", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const json = req.body;
    const sessionId = json.game_session_id;
    const gameMode = json.game_mode;

    // Authentication
    if (
        (sessionId === undefined || gameMode === undefined) ||
        !Object.keys(activeGames).includes(gameMode) || 
        activeGames[gameMode][sessionId] === undefined
    ) {
        res.status(400).send("");
        return;
    }

    // Timeout
    if (activeGames[gameMode][sessionId].end_time <= getEpochUTC()) {
        delete activeGames[gameMode][sessionId];
        res.status(403).send("");
        return;
    }

    res.end(JSON.stringify({
        "game_data": activeGames[gameMode][sessionId]
    }));
});

app.get("/api/round_image", (req, res) => {
    res.setHeader("Content-Type", "image/png");
    const json = req.body;
    const sessionId = json.game_session_id;
    const gameMode = json.game_Mode;

    // Authentication
    if (
        sessionId === undefined ||
        gameMode === undefined ||
        !Object.keys(activeGames).includes(gameMode) || 
        activeGames[gameMode][sessionId] === undefined ||
        activeGames[gameMode][sessionId].round_iterator == activeGames[gameMode][sessionId].total_rounds
    ) {
        res.status(400).send("");
        return;
    }

    // Timeout
    if (activeGames[gameMode][sessionId].end_time <= getEpochUTC()) {
        delete activeGames[gameMode][sessionId];
        res.status(403).send("");
        return;
    }

    // Check if image was already selected
    if (activeGames[gameMode][sessionId].history.length == activeGames[gameMode][sessionId].round_iterator + 1) {
        res.sendFile(`./images/${gameMode}/${activeGames[gameMode][sessionId].history.at(-1)}`);
        return;
    }

    // Select new random image
    let imageName = "";
    let imageNameFound = false;
    const images = fs.readdirSync(`./images/${gameMode}/`);
    while (!imageNameFound) {
        imageName = images[Math.floor(Math.random() *  images.length)];
        if (!activeGames[gameMode][sessionId].history.includes(imageName)) {
            imageNameFound = true;
            activeGames[gameMode][sessionId].history.push(imageName);
        }
    }
    res.sendFile(`./images/${gameMode}/${imageName}`);
});

// Single round submission
app.post("/api/submit_round", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const json = res.body;
    const sessionId = json.game_session_id;
    const gameMode = json.game_Mode;

    // Authentication
    if (
        sessionId === undefined ||
        gameMode === undefined ||
        !Object.keys(activeGames).includes(gameMode) || 
        activeGames[gameMode][sessionId] === undefined ||
        activeGames[gameMode][sessionId].round_iterator == activeGames[gameMode][sessionId].total_rounds
    ) {
        res.status(400).send("");
        return;
    }

    // Timeout
    if (activeGames[gameMode][sessionId].end_time <= getEpochUTC()) {
        delete activeGames[gameMode][sessionId];
        res.status(403).send("");
        return;
    }

    // Calculating score
    const imageName = activeGames[gameMode][sessionId];
    const locationGuess = json.location;
    const locationAnswer = locations[gameMode][imageName].location;
    const distance = Math.sqrt((locationGuess.x - locationAnswer.x) * (locationGuess.x - locationAnswer.x) + (locationGuess.y - locationAnswer.y) * (locationGuess.y - locationAnswer.y));
    const score = Math.floor(settings.general.round_score * Math.max(0, (settings.general.max_distance - distance) / settings.general.max_distance));

    // Adding score to game data
    activeGames[gameMode][sessionId].score += score;

    // Shift iterator
    activeGames[gameMode][sessionId].round_iterator++;

    // Sending back round info
    res.end(JSON.stringify({
        "score": score
    }));
});

// Final, total score submission
app.post("/api/submit_match", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const json = res.body;
    const sessionId = json.game_session_id;
    const gameMode = json.game_Mode;

    // Authentication
    if (
        sessionId === undefined ||
        gameMode === undefined ||
        !Object.keys(activeGames).includes(gameMode) || 
        activeGames[gameMode][sessionId] === undefined ||
        activeGames[gameMode][sessionId].round_iterator < activeGames[gameMode][sessionId].total_rounds - 1
    ) {
        res.status(400).send("");
        return;
    }

    // Timeout but allow extra time for submission
    if (activeGames[gameMode][sessionId].end_time + settings.general.time_to_submit <= getEpochUTC()) {
        delete activeGames[gameMode][sessionId];
        res.status(403).send("");
        return;
    }

    // Adding to leaderboard

    // Sending back match info
    res.end(JSON.stringify({
        "game_data": activeGames[gameMode][sessionId]
    }));
});

app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});