<svelte:options runes={true} />
<script>
    import Button from "../../shared/components/Button.svelte";
    import { setCookie } from "../../shared/helper/CookieManager"

    let selectGamemode;
    let isTimedCheckbox;
    let nicknameInput;

    let gameMode = "";
    let isTimed = true;
    let nickname = "";

    const startGame = async () => {
        gameMode = selectGamemode.value;
        isTimed = isTimedCheckbox.value;
        nickname = nicknameInput.value;

        const response = await fetch("/api/create_lobby", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "game": gameMode,
                "isTimed": isTimed,
                "nickname": nickname
            })
        });

        const json = await response.json();

        if (json.accepted !== true) {
            alert("request rejected");
        }
        
        setCookie("game_session_id", json.game_session_id, 1);
        setCookie("game_mode", gameMode, 1);
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
            <select id="gamemode_input" bind:this={selectGamemode}>
                <option value="standard">Standard</option>
                <option value="time_travel">Time Travel</option>
                <option value="weekly">Weekly Challenge</option>
                <option value="shadow">Shadow</option>
            </select>
        </div>
        <div>
            <input id="timed_checkbox" type="checkbox" checked bind:this={isTimedCheckbox} />
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