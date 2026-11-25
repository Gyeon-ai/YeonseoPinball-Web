import type { ColorTheme } from '../types/ColorTheme';

export const initialZoom = 30;
export const canvasWidth = 1600;
export const canvasHeight = 900;
export const zoomThreshold = 5;
export const STUCK_DELAY = 5000;
// 로즈 모브 패널의 밝은 테두리색을 경기장 네온과 미니맵에도 공통 적용한다.
export const YEONSEO_HAIR = '#f0c9db';
export const YEONSEO_PINK = '#f6ddeb';
export const YEONSEO_NEON = '#f0c9db';
export const YEONSEO_BORDER = YEONSEO_HAIR;
export const YEONSEO_NEON_FILL = YEONSEO_NEON;
export const YEONSEO_NEON_HIGHLIGHT = YEONSEO_NEON;
export const YEONSEO_BORDER_COLORS = [YEONSEO_HAIR, YEONSEO_HAIR] as const;
export const UI_FONT_FAMILY = `'Pretendard Variable', Pretendard, 'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif`;
// 오락실 도트 테마의 캔버스용 색과 글꼴(패널 쪽 값은 assets/style.scss의 :root)
export const DOT_LINE = '#d9bfee';
export const DOT_INK = '#2a1c3a';
export const DOT_TEXT_SOFT = '#f3d6f4';
export const DOT_ACCENT = '#f4a9c4';
export const DOT_RED = '#e2574c';
export const NAME_FONT_FAMILY = `'Noto Sans KR', sans-serif`;
export const DOT_FONT_FAMILY = `'Galmuri11', 'Noto Sans KR', sans-serif`;
export const NUMBER_FONT_FAMILY = `'Press Start 2P', 'Galmuri11', monospace`;
export const WINNER_NAME_FONT_FAMILY = `'Do Hyeon', 'Noto Sans KR', sans-serif`;

export enum Skills {
  None,
  Impact,
}

export const Themes: Record<string, ColorTheme> = {
  light: {
    background: '#eee',
    marbleLightness: 50,
    marbleWinningBorder: 'black',
    skillColor: YEONSEO_PINK,
    coolTimeIndicator: YEONSEO_PINK,
    entity: {
      box: {
        fill: '#226f92',
        outline: 'black',
        bloom: YEONSEO_NEON,
        bloomRadius: 0,
      },
      circle: {
        fill: YEONSEO_HAIR,
        outline: YEONSEO_HAIR,
        bloom: YEONSEO_NEON,
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
    skillColor: YEONSEO_PINK,
    coolTimeIndicator: YEONSEO_PINK,
    entity: {
      box: {
        fill: YEONSEO_NEON_FILL,
        outline: YEONSEO_NEON_HIGHLIGHT,
        bloom: YEONSEO_NEON,
        bloomRadius: 15,
      },
      circle: {
        fill: YEONSEO_HAIR,
        outline: YEONSEO_HAIR,
        bloom: YEONSEO_NEON,
        bloomRadius: 15,
      },
      polyline: {
        fill: YEONSEO_NEON_HIGHLIGHT,
        outline: YEONSEO_NEON_HIGHLIGHT,
        bloom: YEONSEO_NEON,
        bloomRadius: 15,
      },
    },
    rankStroke: '',
    minimapBackground: '#000000',
    minimapViewport: YEONSEO_BORDER,
    winnerBackground: 'rgba(42, 28, 58, 0.9)',
    winnerOutline: '',
    winnerText: 'white',
  },
};
