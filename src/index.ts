import './localization';
import options from './options';
import { retireServiceWorker } from './retireServiceWorker';
import { Roulette } from './roulette';

retireServiceWorker();

const roulette = new Roulette();

(window as any).roulette = roulette;
(window as any).options = options;
