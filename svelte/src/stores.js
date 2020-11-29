import { writable, readable } from 'svelte/store';

export const user = writable();

export const projects = writable([]);

export const bands = writable([]);
