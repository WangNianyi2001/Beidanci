import { ref, watch } from 'vue';

export const currentUser = ref(localStorage.getItem('beidanci-user') || '');
export const allUsers = ref([]);

// 自动写入 localStorage
watch(currentUser, (val) => {
	if (val) localStorage.setItem('beidanci-user', val);
});