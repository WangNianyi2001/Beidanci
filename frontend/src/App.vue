<template>
	<router-view></router-view>
</template>

<style lang="stylus">
* {
	box-sizing: border-box;
}

:root {
	width: 100%;
	height: 100%;

	font-family: 'Bahnschrift', 'Helvetica', 'Arial', 'Source Han Sans SC', sans-serif;
	background: #222528;
}

body {
	margin: 0;
	width: 100%;
	height: 100%;
}

.fc, .fr {
	display: flex;
	flex-wrap: nowrap;
	align-items: baseline;

	&.fr { flex-direction: row; }
	&.fc { flex-direction: column; }

	.fill { flex: 1; }
}

.centered {
	text-align: center;
	align-items: center;
}

.stretched {
	align-items: stretch;
}

.gapped {
	gap: 0.5em;
}

p {
	margin-block: 0;
}

button, select, input {
	font-size: 1em;
	margin-inline: 0.5em;
	margin-block: 0.3em;
	padding-inline: 1em;
	padding-block: 0.5em;

	background: #f8f8f8;
	border: 1.5pt solid currentColor;
	border-radius: 2em;

	cursor: pointer;

	transition-duration: 0.1s;
	transition-property: transform, box-shadow;

	&:disabled {
		cursor: not-allowed !important;
	}

	&:hover:not(:disabled) {
		transform: translateY(-1pt);
		box-shadow: 0pt 1pt currentColor;
	}
}

button {
	text-align: center;
}

input:not([type]), input[type="text"] {
	cursor: text;
}

label {
	&::after {
		content: "：";
	}
}

#app {
	position: relative;
	block-size: 100%;
	inline-size: max(60%, 600px);
	max-inline-size: 100%;
	margin-inline: auto;
	overflow-inline: hidden;
	overflow-block: auto;

	display: flex;
	flex-direction: column;
	align-items: center;

	background: #eee;
}

#app {
	>h1 {
	}

	>nav {
		position: relative;
		inline-size: 100%;
		block-size: 6em;

		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: baseline;
		gap: 0.5em;
		justify-content: center;
	}

	>main {
		width: 75%;
	}
}
</style>

<script lang="ts">
import { UseAppState, InitAppState } from './stores/appState.mjs';

InitAppState();
const app = UseAppState();
</script>