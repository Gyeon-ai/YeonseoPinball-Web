import './localization';
import options from './options';
import { retireServiceWorker } from './retireServiceWorker';
import { Roulette } from './roulette';
import { registerPinballTools } from './webmcp';

retireServiceWorker();

const roulette = new Roulette();

(window as any).roulette = roulette;
(window as any).options = options;

registerPinballTools();
