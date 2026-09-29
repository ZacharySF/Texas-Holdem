import { mount } from 'svelte';
import App from './App.svelte';
import './design-tokens.css';
import './styles.css';
import './night.css';
mount(App, { target: document.getElementById('root')! });
