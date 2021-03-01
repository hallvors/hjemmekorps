<script>
    export let message = '';
    export let textAlign = 'center';
</script>
<div class="hint {textAlign}">
    <i class="fas fa-info-circle"></i>
    {message}
</div>

<style>
i {
    font-size: 1.5em;
    float: left;
    padding-right: 0.5em;
}
.center {
    text-align: center;
}
.hint {
    background-color: #f9f99b;
    padding: 1.5em;
    margin-top: 1.5em;
    margin-bottom: 1.5em;
    border: var(--border);
    box-shadow: var(--shadow);
}
</style>