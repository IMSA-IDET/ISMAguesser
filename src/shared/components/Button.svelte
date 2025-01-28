<script>
    let props = $props();
</script>
<style>
    button {
        padding: 16px;
        font-size: 20px;
        font-weight: 800;
        border-width: 1px;
        border-color: green;
        border-style: solid;
        border-radius: 8px;
        background: green;
        color: white;
        transition: 100ms;
        position: relative;
        cursor: pointer;
    }

    button:hover {
        background: transparent;
        color: green;
    }
</style>
<div>
    <button onclick={props.action}>{props.text}</button>
</div>