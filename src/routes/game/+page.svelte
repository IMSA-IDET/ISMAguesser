<svelte:options runes={true} />
<script>
    import { onMount } from 'svelte';
    import Button from "../../shared/components/Button.svelte";
    import panzoom from 'panzoom'
    import { getCookie } from '../../shared/helper/CookieManager';

    const MAP_LENGTH = $state(256);

    let withTimeInput = $state(false);
    let imageLink = $state("");
    let timeVisual = $state("00:00");

    let gameData = undefined;
    let round = $state(1);
    let maxRound = $state(1);
    let timeLeft = 59 * 61 // 59:59
    let score = $state(0);
    let totalScore = $state(0);
    let roundEnded = true;
    let matchEnded = false;
    let roundScoreMenu = $state(false);
    let matchScoreMenu = $state(false);

    let resultMap;
    let resultMapCtx;

    let mapPanzoom;
    let mapPin;
    let pinLocation = [0, 0];
    let zoomLevel = 1.0;

    const updatePinZoom = () => {
        mapPin.style.transform = `matrix(${1.0 / zoomLevel}, 0, 0, ${1.0 / zoomLevel}, ${pinLocation[0] - 32}, ${pinLocation[1] - 32}) translate(calc(0% + 0px), calc(-50% + 0px))`;
    }

    const touchHandler = (e) => {
        if (e.target.id == "map_background") {
            pinLocation = [e.layerX, e.layerY];
            updatePinZoom();
        }
        return true;
    }

    let instance
    function initPanzoom(node) {
        instance = panzoom(node, {
            bounds: true,
            onClick: touchHandler
        });
    }

    onMount(() => {
        let styleObserver = new MutationObserver((mutations) => {
            zoomLevel = mapPanzoom.style.transform.substring(7).split(",")[0];
            updatePinZoom();
        });
        styleObserver.observe(mapPanzoom, { attributes : true, attributeFilter : ['style'] });

        fetch("http://localhost:3001/api/match_info", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "game_session_id": getCookie("game_session_id"),
                "game_mode": getCookie("game_mode")
            })
        }).then(response => {
            if (response.status != 200) {
                errorHandle(response.status);
            }
            return response.json();
        }).then(json => {
            gameData = json.game_data;
            maxRound = gameData.total_rounds;
            startRound();
        });
    });

    let mapImage;
    const onCanvasLoad = () => {
        mapImage = new Image();
        mapImage.src = "/images/main_f1.png";
        mapImage.onload = drawResultMap;
    }

    const drawResultMap = () => {
        resultMapCtx = resultMap.getContext("2d");
        resultMapCtx.drawImage(mapImage, 0, 0, mapImage.width, mapImage.height);

        
    }
    
    setInterval(() => {
        if (gameData == undefined) {
            return;
        }

        timeLeft = (gameData.end_time - new Date().getTime()) / 1000;
        if (timeLeft <= 1) {
            endRound();
        }

        if (roundEnded) {
            timeVisual = "00:00";
            return;
        }
        const leadingZero = (num) => String(num).padStart(2, '0');
        timeVisual = `${leadingZero(Math.floor(timeLeft / 60))}:${leadingZero(Math.floor(timeLeft) % 60)}`;
    }, 1000);

    const updateImage = () => {
        fetch("http://localhost:3001/api/round_image", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "game_session_id": getCookie("game_session_id"),
                "game_mode": getCookie("game_mode")
            })
        }).then(response => {
            if (response.status != 200) {
                errorHandle(response.status);
            }
            return response.blob();
        }).then(data => {
            imageLink = URL.createObjectURL(data);
        });
    }

    const startRound = () => {
        roundScoreMenu = false;
        if (!roundEnded || matchEnded) {
            return;
        }
        
        if (round == maxRound) {
            fetch("http://localhost:3001/api/submit_match", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "game_session_id": getCookie("game_session_id"),
                    "game_mode": getCookie("game_mode")
                })
            }).then(response => {
                if (response.status != 200) {
                    errorHandle(response.status);
                }
                return response.json();
            }).then(json => {
                gameData = json.game_data;
                endMatch();
            });
            return;
        }

        score = 0;

        fetch("http://localhost:3001/api/start_round", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "game_session_id": getCookie("game_session_id"),
                "game_mode": getCookie("game_mode")
            })
        }).then(response => {
            if (response.status != 200) {
                errorHandle(response.status);
            }
            return response.json();
        }).then(json => {
            gameData = json.game_data;
            roundEnded = false;
            if (round < maxRound) {
                round = gameData.round_iterator + 1;
                updateImage();
            }
            updateImage();
        });
    }

    const endRound = () => {
        if (roundEnded) {
            return;
        }

        roundEnded = true;
        submitRound();
    }

    const endMatch = () => {
        matchEnded = true;
        alert("Match finished, score: " +  totalScore);
    }

    const submitRound = () => {
        if (roundEnded || matchEnded) {
            return;
        }

        fetch("http://localhost:3001/api/submit_round", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "game_session_id": getCookie("game_session_id"),
                "game_mode": getCookie("game_mode"),
                "location": {
                    "x": pinLocation[0],
                    "y": pinLocation[1]
                }
            })
        }).then(response => {
            if (response.status != 200) {
                errorHandle(response.status);
            }
            return response.json();
        }).then(json => {
            gameData = json.game_data;
            score = json.round_score;
            totalScore = gameData.score
            roundEnded = true;

            roundScoreMenu = true;
        });
    }

    const errorHandle = (errorStatus) => {
        alert("Oof! Error: " + errorStatus);
    }
</script>
<style>
    .game_view {
        display: flex;
        position: fixed;
        width: 100%;
        height: 100%;
        justify-content: space-between;
    }

    .game_view > div {
        
    }

    .image_container {
        display: flex;
        flex: 1;
        justify-content: center;
        align-items: center;
        padding: 64px;
        height: calc(100% - 128px - 48px);
    }

    .image_container > div {
        width: calc(100% - 64px);
        height: calc(100% - 64px);
        background-color: aqua;
        padding: 16px;
        display: flex;
    }

    #image {
        max-width: 100%;
        max-height: 100%;
        background-size: cover;
        margin: auto;
    }

    .controls_container {
        padding: 16px;
        background-color: yellow;
        width: 400px;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        gap: 64px;
    }

    .info_container {
        display: flex;
        justify-content: space-evenly;
        width: 100%;
    }

    .info_stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px;
    }

    .info_stat > .label {
        font-size: 16px;
        font-weight: 400;
    }

    .info_stat > .value {
        font-size: 32px;
        font-weight: 900;
    }

    .map_container {
        width: 100%;
        height: 300px;
        background-color: beige;
        overflow: hidden;
    }

    .map_container > div {
        position: relative;
    }

    #map_background {
        width: 300px;
        height: 300px;
        background: url("/images/main_f1.png");
        background-size: cover;
    }

    #map_pin {
        position: absolute;
        width: 64px;
        height: 64px;
        background: url("/icons/pin.png");
        background-size: cover;
    }

    .score_menu_bg {
        position: fixed;
        width: 100%;
        height: 100%;
        background-color: black;
        opacity: 0.5;
    }

    .score_menu {
        position: fixed;
        width: 500px;
        height: 70%;
        background-color: white;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-evenly;
    }

    #resultMap {
        width: 400px;
        height: 400px;
        background-color: green;
    }
</style>
<div class="game_view">
    <div class="image_container">
        <div>
            <img id="image" src="{imageLink}" />
        </div>
    </div>
    <div class="controls_container">
        <div class="info_container">
            <div class="info_stat">
                <div class="round label">Round</div>
                <div id="round_value" class="round value">{round}/{maxRound}</div>
            </div>
            <div class="info_stat">
                <div class="label">Time</div>
                <div id="time_value" class="value">{timeVisual}</div>
            </div>
            <div class="info_stat">
                <div class="label">Score</div>
                <div id="score_value" class="value">{score}</div>
            </div>
        </div>
        <div class="map_container">
            <div id="map_panzoom" use:initPanzoom bind:this={mapPanzoom}>
                <div id="map_pin" bind:this={mapPin}></div>
                <div id="map_background" style="width: {MAP_LENGTH}px; height: {MAP_LENGTH}px"></div>
            </div>
        </div>
        {#if withTimeInput}
            <div class="year_container">
                <input id="year_input" type="range" min="1960" max="2025" value="1992">
            </div>
        {/if}
        <Button text="Submit" action={submitRound} />
    </div>
</div>
{#if roundScoreMenu}
    <div class="score_menu_bg"></div>
    <div class="score_menu">
        <div>
            Result
        </div>
        <div>
            Round score: {score}
        </div>
        <div>
            <canvas id="resultMap" bind:this={resultMap} use:onCanvasLoad width=4354 height=4354 />
        </div>
        <div>
            <Button text="Continue" action={startRound} />
        </div>
    </div>
{/if}
{#if matchScoreMenu}
    <div class="score_menu_bg"></div>
    <div class="score_menu">
        <div>
            Match Result
        </div>
        <div>
            Total score: {totalScore}
        </div>
        <div>
            <Button text="Continue" action={startRound} />
        </div>
    </div>
{/if}