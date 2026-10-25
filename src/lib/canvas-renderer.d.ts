import type { ShareModel } from './share';
export function render(model: ShareModel, makeCanvas?: () => HTMLCanvasElement): HTMLCanvasElement;
export function wrapText(context: CanvasRenderingContext2D, value: string, width: number): string[];
