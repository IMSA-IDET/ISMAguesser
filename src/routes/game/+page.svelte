<svelte:options runes={true} />
<script>
    import { onMount } from 'svelte';
    import Button from "../../shared/components/Button.svelte";
    import panzoom from 'panzoom'

    let withTimeInput = $state(true);

    let mapPanzoom;
    let mapPin;

    let pinLocation = [0, 0];
    let zoomLevel = 1.0;

    const updatePinZoom = () => {
        mapPin.style.transform = `matrix(${1.0 / zoomLevel}, 0, 0, ${1.0 / zoomLevel}, ${pinLocation[0] - 32}, ${pinLocation[1] - 32}) translate(calc(0% + 0px), calc(-50% + 0px))`;
    }

    onMount(() => {
        let styleObserver = new MutationObserver((mutations) => {
            zoomLevel = mapPanzoom.style.transform.substring(7).split(",")[0];
            updatePinZoom();
        });
        styleObserver.observe(mapPanzoom, { attributes : true, attributeFilter : ['style'] });
    });

    const touchHandler = (e) => {
        // console.log(e.layerX, e.layerY)
        // console.log(e.target.id)
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
    }

    #image {
        background-color: green;
        width: 100%;
        height: 100%;
    }

    .controls_container {
        padding: 16px;
        background-color: yellow;
        width: 400px;
    }

    .info_container {
        display: flex;
        justify-content: space-evenly;
    }

    .info_stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        background-color: red;
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

    #map {
        position: absolute;
        width: 300px;
        height: 300px;
        /* background: url("/images/map.png");
        background-size: cover; */
    }

    #map_background {
        width: 300px;
        height: 300px;
        background: url("/images/map.png");
        background-size: cover;
    }

    #map_pin {
        position: absolute;
        width: 64px;
        height: 64px;
        background: url("/icons/pin.png");
        background-size: cover;
    }
</style>
<div class="game_view">
    <div class="image_container">
        <div><div id="image"></div></div>
    </div>
    <div class="controls_container">
        <div class="info_container">
            <div class="info_stat">
                <div class="round label">Round</div>
                <div id="round_value" class="round value">1/5</div>
            </div>
            <div class="info_stat">
                <div class="label">Time</div>
                <div id="time_value" class="value">5:00</div>
            </div>
            <div class="info_stat">
                <div class="label">Score</div>
                <div id="score_value" class="value">4000</div>
            </div>
        </div>
        <div class="map_container">
            <div id="map_panzoom" use:initPanzoom bind:this={mapPanzoom}>
                <div id="map_pin" bind:this={mapPin}></div>
                <div id="map_background"></div>
            </div>
        </div>
        {#if withTimeInput}
            <div class="year_container">
                <input id="year_input" type="range" min="1960" max="2025" value="1992">
            </div>
        {/if}
        <Button text="Submit" />
    </div>
</div>