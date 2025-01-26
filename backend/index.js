import express from 'express';
import bodyParser from 'body-parser';
import cors from "cors";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { randomID, checkNickInput, getEpochUTC } from "./helper.js";
import settings from "./config/settings.js";
import locations from "./config/locations.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = 3001;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Game data
let activeGames = {
    "standard": {},
    "time_travel": {}
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
        "end_time": getEpochUTC() + settings[json.game_mode].time * 1000,
        "nickname": json.nickname,
        "round_iterator": 0,
        "total_rounds": settings[json.game_mode].rounds,
        "history": [],
        "score": 0,
        "round_started": false
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

    res.end(JSON.stringify({
        "game_data": activeGames[gameMode][sessionId]
    }));
});

app.post("/api/start_round", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const json = req.body;
    const sessionId = json.game_session_id;
    const gameMode = json.game_mode;

    // Authentication
    if (
        (sessionId === undefined || gameMode === undefined) ||
        !Object.keys(activeGames).includes(gameMode) || 
        activeGames[gameMode][sessionId] === undefined ||
        activeGames[gameMode][sessionId].round_iterator == activeGames[gameMode][sessionId].total_rounds
    ) {
        res.status(400).send("");
        return;
    }

    if (!activeGames[gameMode][sessionId].round_started) {
        activeGames[gameMode][sessionId].round_started = true;

        // Reset timer
        activeGames[gameMode][sessionId].end_time = getEpochUTC() + settings[json.game_mode].time * 1000;
    }
    
    res.end(JSON.stringify({
        "game_data": activeGames[gameMode][sessionId]
    }));
});

app.post("/api/round_image", (req, res) => {
    res.setHeader("Content-Type", "image/png");
    const json = req.body;
    const sessionId = json.game_session_id;
    const gameMode = json.game_mode;

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

    // Check if image was already selected
    if (activeGames[gameMode][sessionId].history.length == activeGames[gameMode][sessionId].round_iterator + 1) {
        res.sendFile(`${__dirname}/images/${gameMode}/${activeGames[gameMode][sessionId].history.at(-1)}`);
        return;
    }

    // Select new random image
    let imageName = "";
    let imageNameFound = false;
    const images = fs.readdirSync(`${__dirname}/images/${gameMode}/`);
    while (!imageNameFound) {
        imageName = images[Math.floor(Math.random() *  images.length)];
        if (!activeGames[gameMode][sessionId].history.includes(imageName)) {
            imageNameFound = true;
            activeGames[gameMode][sessionId].history.push(imageName);
        }
    }
    res.sendFile(`${__dirname}/images/${gameMode}/${imageName}`);
});

// Single round submission
app.post("/api/submit_round", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const json = req.body;
    const sessionId = json.game_session_id;
    const gameMode = json.game_mode;

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

    // Timeout but allow extra time for submission
    if (activeGames[gameMode][sessionId].end_time + settings.general.time_to_submit <= getEpochUTC()) {
        delete activeGames[gameMode][sessionId];
        res.status(403).send("");
        return;
    }

    // Calculating score:
    // If place is correct, `place_score` points are added
    // Then, any distance to the correct point is added based on `distance_score`
    const imageName = activeGames[gameMode][sessionId].history.at(-1);
    const locationGuess = json.location;
    const locationAnswer = locations[gameMode][imageName].location;
    const distance = Math.sqrt((locationGuess.x - locationAnswer.x) * (locationGuess.x - locationAnswer.x) + (locationGuess.y - locationAnswer.y) * (locationGuess.y - locationAnswer.y));
    const placeScore = true ? settings.general.place_score : 0;
    const score = Math.floor(placeScore + settings.general.distance_score * Math.max(0, (settings.general.max_distance - distance) / settings.general.max_distance));

    activeGames[gameMode][sessionId].score += score;
    activeGames[gameMode][sessionId].round_iterator++;
    activeGames[gameMode][sessionId].round_started = false;

    // Sending back round info
    res.end(JSON.stringify({
        "round_score": score,
        "answer_location": locationAnswer,
        "answer_place": "main",
        "game_data": activeGames[gameMode][sessionId]
    }));
});

// Final, total score submission
app.post("/api/submit_match", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const json = req.body;
    const sessionId = json.game_session_id;
    const gameMode = json.game_mode;

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

    // Adding to leaderboard


    // Sending back match info
    res.end(JSON.stringify({
        "game_data": activeGames[gameMode][sessionId]
    }));

    // Remove match
    delete activeGames[gameMode][sessionId];
});

app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});