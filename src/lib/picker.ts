import type { Client, SavedItem } from './types';

/**
 * Tiny bridge so modal picker screens can hand a selection back to the screen
 * that opened them, without serialising objects through route params.
 */
let clientHandler: ((c: Client) => void) | null = null;
let itemHandler: ((i: Omit<SavedItem, 'id'>) => void) | null = null;

export function onClientPicked(fn: (c: Client) => void) {
  clientHandler = fn;
}
export function emitClient(c: Client) {
  clientHandler?.(c);
}
export function onItemPicked(fn: (i: Omit<SavedItem, 'id'>) => void) {
  itemHandler = fn;
}
export function emitItem(i: Omit<SavedItem, 'id'>) {
  itemHandler?.(i);
}
