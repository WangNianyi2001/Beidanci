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

f() {
	display: flex;
	flex-wrap: nowrap;
	align-items: baseline;
}
.f {
	f();
}

fr() {
	f();
	flex-direction: row;
}
.fr {
	fr();
}

fc() {
	f();
	flex-direction: column;
}
.fc {
	fc();
}

fill() {
	flex: 1;
}
.fill {
	fill();
}

centered() {
	text-align: center;
	align-items: center;
}
.centered {
	centered();
}

stretched() {
	align-items: stretch;
}
.stretched {
	stretched();
}

gapped() {
	gap: 0.5em;
}
.gapped {
	gapped();
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

	background: #eee;
}

#app {
	h1 {
		centered();
	}

	>nav {
		position: relative;
		inline-size: 100%;
		block-size: 6em;

		fr();
		gapped();
		justify-content: center;
	}

	>main {
		inline-size: 75%;
		margin-inline: auto;
	}

	.dict-list {
		fc();
		stretched();
		gapped();

		list-style: none;
		padding-inline-start: 0;

		>li {
			fc();
			gapped();
			stretched();

			border-inline-start: 4pt solid;
			padding-inline-start: 1em;
			padding-block: 0.5em;

			header {
				fr();
				
				h3 {
					margin-block: 0;
					fill();
					text-align: left;
				}
			}
		}
	}
}
</style>

<script lang="ts">
import { UseAppState, InitAppState } from './stores/appState.mjs';

InitAppState();
const app = UseAppState();
</script>