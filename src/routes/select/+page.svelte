<svelte:options runes={true} />
<script>
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import Button from "../../shared/components/Button.svelte";
    import { setCookie } from "../../shared/helper/CookieManager"

    let selectGameMode;
    let nicknameInput;

    let gameMode = "";
    let nickname = "";

    const gameModeParam = $page.url.searchParams.get("mode");

    onMount(() => {
        if (gameModeParam != undefined) {
            const gameModes = ["standard", "time_travel", "weekly"];
            const index = gameModes.indexOf(gameModeParam);
            if (index != -1) {
                selectGameMode.selectedIndex = index;
            }
        }
    });

    const startGame = async () => {
        console.log("start")
        gameMode = selectGameMode.value;
        nickname = nicknameInput.value;

        const response = await fetch("http://localhost:3001/api/create_match", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "game_mode": gameMode,
                "nickname": nickname
            })
        });

        if (response.status != 200) {
            alert("Oof! Error: " + response.status);
        }

        const json = await response.json();
        console.log(json)
        
        setCookie("game_session_id", json.game_session_id, 1);
        setCookie("game_mode", gameMode, 1);

        window.location.href = "/game";
    }
</script>
<style>
    .content {
        display: flex;
        justify-content: space-evenly;
        padding: 0px 16px 0px 16px;
    }

    .content > div {
        flex: 1;
        padding: 16px;
    }

    .menu_container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
    }

    #nickname_input {
        outline: none;
    }
</style>
<div class="content">
    <div>
        <h2>Game Modes</h2>
        <h3>Standard</h3>
        <p>5 rounds, 1 minute per round. Guess location of the photo.</p>
        <h3>Time Travel</h3>
        <p>5 rounds, 1 minute per round. Guess location and year the photo was taken.</p>
        <h3>Weekly Challenge</h3>
        <p>1 round, 10 minutes. New photo every week.</p>
    </div>
    <div class="menu_container">
        <h1 class="heading2">Start a round</h1>
        <div>
            <h3>Game mode: </h3>
            <select id="gamemode_input" bind:this={selectGameMode}>
                <option value="standard">Standard</option>
                <option value="time_travel">Time Travel</option>
                <option value="weekly">Weekly Challenge</option>
            </select>
        </div>
        <div>
            <h3>Nickname: </h3>
            <input id="nickname_input" type="text" minlength="3" maxlength="24" bind:this={nicknameInput} />
        </div>
        <div>
            <Button text="START" action={startGame}></Button>
        </div>
    </div>
</div>