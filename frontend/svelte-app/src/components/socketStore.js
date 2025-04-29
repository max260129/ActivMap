import { writable } from 'svelte/store';

export const currentThread = writable(null); // {id, report_id, messages[]} 