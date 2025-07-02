import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
	plugins: [vue()],
	server: {
		port: 8543,
		strictPort: true,
		proxy: {
			'/user': 'http://localhost:8533',
			'/dictionary': 'http://localhost:8533',
			'/train': 'http://localhost:8533',
		},
	},
})
