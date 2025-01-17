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

app.post("/api/create_lobby", (req, res) => {
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
        "round_iterator": 1,
        "total_rounds": settings[json.game].rounds
    }
    activeGames[json.game][sessionId] = gameData;

    res.end(JSON.stringify({
        "accepted": true,
        "game_session_id": sessionId
    }));
});

app.get("/api/lobby_info", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const cookie = req.cookies;

    if (
        (cookie.game_session_id === undefined || cookie.game_mode === undefined) ||
        !Object.keys(activeGames).includes(cookie.game_mode) || 
        activeGames[cookie.game_mode][cookie.session_id] === undefined
    ) {
        res.end(JSON.stringify({
            "accepted": false
        }));
        return;
    }

    if (activeGames[cookie.game_mode][cookie.session_id].end_time <= getEpochUTC()) {
        delete activeGames[cookie.game_mode][cookie.session_id];
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

app.get("/api/lobby_image", (req, res) => {
    res.setHeader("Content-Type", "");
    const cookie = req.cookies;

    if (
        (cookie.game_session_id === undefined || cookie.game_mode === undefined) ||
        !Object.keys(activeGames).includes(cookie.game_mode) || 
        activeGames[cookie.game_mode][cookie.session_id] === undefined
    ) {
        // error out
        return;
    }

    let imageName = "";
    const images = fs.readdirSync(`./images/${gameMode}/`);
    // WIP
    // while () {
    //     imageName = images[Math.floor(Math.random() *  images.length)];
    // }

    res.sendFile(`./images/${cookie.game_mode}/${randomImage(cookie.game_mode)}`);
});

app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});