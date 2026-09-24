import type { ColorTheme } from '../types/ColorTheme';

export const initialZoom = 30;
export const canvasWidth = 1600;
export const canvasHeight = 900;
export const zoomThreshold = 5;
export const STUCK_DELAY = 5000;
export const winnerAreaHeight = 168;
export const YEONSEO_PURPLE = '#cbb9ec';
export const YEONSEO_BORDER = YEONSEO_PURPLE;
export const YEONSEO_NEON = YEONSEO_PURPLE;
export const YEONSEO_NEON_FILL = YEONSEO_PURPLE;
export const YEONSEO_NEON_HIGHLIGHT = YEONSEO_PURPLE;
export const YEONSEO_BORDER_COLORS = [
  YEONSEO_PURPLE,
  YEONSEO_PURPLE,
] as const;
export const UI_FONT_FAMILY = `'Pretendard Variable', Pretendard, 'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif`;

export enum Skills {
  None,
  Impact,
}

export const DefaultEntityColor = {
  box: YEONSEO_NEON_FILL,
  circle: YEONSEO_PURPLE,
  polyline: YEONSEO_PURPLE,
} as const;

export const DefaultBloomColor = {
  box: YEONSEO_NEON,
  circle: YEONSEO_NEON,
  polyline: YEONSEO_NEON,
};

export const Themes: Record<string, ColorTheme> = {
  light: {
    background: '#eee',
    marbleLightness: 50,
    marbleWinningBorder: 'black',
    skillColor: YEONSEO_PURPLE,
    coolTimeIndicator: YEONSEO_PURPLE,
    entity: {
      box: {
        fill: '#226f92',
        outline: 'black',
        bloom: YEONSEO_NEON,
        bloomRadius: 0,
      },
      circle: {
        fill: YEONSEO_PURPLE,
        outline: YEONSEO_PURPLE,
        bloom: YEONSEO_PURPLE,
        bloomRadius: 0,
      },
      polyline: {
        fill: 'white',
        outline: 'black',
        bloom: YEONSEO_NEON,
        bloomRadius: 0,
      },
    },
    rankStroke: 'black',
    minimapBackground: '#fefefe',
    minimapViewport: '#6699cc',

    winnerBackground: 'rgba(255, 255, 255, 0.5)',
    winnerOutline: 'black',
    winnerText: '#cccccc',
  },
  dark: {
    background: '#000000',
    marbleLightness: 75,
    marbleWinningBorder: 'white',
    skillColor: YEONSEO_PURPLE,
    coolTimeIndicator: YEONSEO_PURPLE,
    entity: {
      box: {
        fill: YEONSEO_NEON_FILL,
        outline: YEONSEO_NEON_HIGHLIGHT,
        bloom: YEONSEO_NEON,
        bloomRadius: 12,
      },
      circle: {
        fill: YEONSEO_PURPLE,
        outline: YEONSEO_PURPLE,
        bloom: YEONSEO_PURPLE,
        bloomRadius: 15,
      },
      polyline: {
        fill: YEONSEO_NEON_HIGHLIGHT,
        outline: YEONSEO_NEON_HIGHLIGHT,
        bloom: YEONSEO_NEON,
        bloomRadius: 12,
      },
    },
    rankStroke: '',
    minimapBackground: '#000000',
    minimapViewport: YEONSEO_BORDER,
    winnerBackground: 'rgba(0, 0, 0, 0.72)',
    winnerOutline: '',
    winnerText: 'white',
  },
};

