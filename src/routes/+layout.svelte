<svelte:options runes={true} />
<script>
    let { children } = $props();
</script>
<style>
    nav {
        position: fixed;
        display: flex;
        justify-content: space-between;
        width: calc(100% - 16px);
        max-height: 32px;
        background-color: green;
        padding: 8px;
    }

    nav > div {
        display: flex;
        flex-wrap: nowrap;
        justify-content: flex-start;
        align-items: center;
        gap: 32px;
    }

    nav > div > a {
        vertical-align: baseline;
        display: inline-block;
        position: relative;
        margin: 0px;
        padding: 0px;
    }

    #nav_logo {
        width: 100px;
        height: 32px;
        background-color: blue;
    }

    #nav_padding {
        width: 100%;
        height: 48px;
        margin: 0px;
    }

    #profile_link {
        display: inline-block;
    }
</style>

<nav>
    <div id="left">
        <a id="nav_logo" href="/"></a>
        <a href="/select">Play</a>
        <a href="/challenge">Weekly Challenge</a>
        <a href="/leaderboard">Leaderboard</a>
    </div>
    <div id="right">
        <a id="profile_link" href="/profile">Profile</a>
    </div>
</nav>
<div id="nav_padding"></div>

{@render children()}

<footer>
    
</footer>