import type { ColorTheme } from '../types/ColorTheme';

export const initialZoom = 30;
export const canvasWidth = 1600;
export const canvasHeight = 900;
export const zoomThreshold = 5;
export const STUCK_DELAY = 5000;
export const winnerAreaHeight = 168;
export const YEONSEO_BORDER = '#b99aef';
export const YEONSEO_NEON = '#d7b9ff';
export const YEONSEO_NEON_FILL = '#eadfff';
export const YEONSEO_NEON_HIGHLIGHT = '#fff4fb';
export const YEONSEO_BORDER_COLORS = [
  'rgba(199, 179, 255, .98)',
  'rgba(185, 154, 239, .96)',
  'rgba(242, 181, 207, .94)',
  'rgba(255, 170, 103, .92)',
] as const;
export const UI_FONT_FAMILY = `'Pretendard Variable', Pretendard, 'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif`;

export enum Skills {
  None,
  Impact,
}

export const DefaultEntityColor = {
  box: YEONSEO_NEON_FILL,
  circle: 'yellow',
  polyline: 'white',
} as const;

export const DefaultBloomColor = {
  box: YEONSEO_NEON,
  circle: 'yellow',
  polyline: YEONSEO_NEON,
};

export const Themes: Record<string, ColorTheme> = {
  light: {
    background: '#eee',
    marbleLightness: 50,
    marbleWinningBorder: 'black',
    skillColor: '#69c',
    coolTimeIndicator: '#999',
    entity: {
      box: {
        fill: '#226f92',
        outline: 'black',
        bloom: YEONSEO_NEON,
        bloomRadius: 0,
      },
      circle: {
        fill: 'yellow',
        outline: '#ed7e11',
        bloom: 'yellow',
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
    skillColor: 'white',
    coolTimeIndicator: 'red',
    entity: {
      box: {
        fill: YEONSEO_NEON_FILL,
        outline: YEONSEO_NEON_HIGHLIGHT,
        bloom: YEONSEO_NEON,
        bloomRadius: 12,
      },
      circle: {
        fill: 'yellow',
        outline: 'yellow',
        bloom: 'yellow',
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
