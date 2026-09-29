import { writable } from 'svelte/store';
export const fourColorDeck = writable(false);

export const theme = writable<'dark' | 'blue'>('dark');
