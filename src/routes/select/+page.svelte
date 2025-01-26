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
        
        setCookie("game_session_id", json.game_session_id, 1);
        setCookie("game_mode", gameMode, 1);

        window.location.href = "/game";
    }
</script>
<style>
    .content {
        display: flex;
    }

    .menu_container {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
</style>
<div class="content">
    <div class="menu_container">
        <div>
            <select id="gamemode_input" bind:this={selectGameMode}>
                <option value="standard">Standard</option>
                <option value="time_travel">Time Travel</option>
                <option value="weekly">Weekly Challenge</option>
            </select>
        </div>
        <div>
            <input id="nickname_input" type="text" minlength="3" maxlength="24" bind:this={nicknameInput} />
        </div>
        <div>
            <Button text="Start" action={startGame}></Button>
        </div>
    </div>
    <div>

    </div>
</div>