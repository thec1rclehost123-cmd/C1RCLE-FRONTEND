export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: false }) ?? canvas.getContext('experimental-webgl', { preserveDrawingBuffer: false });
    return Boolean(gl);
  } catch {
    return false;
  }
}

export function getWebGLContext(canvas: HTMLCanvasElement, options?: WebGLContextAttributes): WebGLRenderingContext | null {
  if (typeof window === 'undefined') return null;

  try {
    const gl = canvas.getContext('webgl', options) ?? canvas.getContext('experimental-webgl', options);
    return gl as WebGLRenderingContext | null;
  } catch {
    return null;
  }
}

export function getWebGL2Context(canvas: HTMLCanvasElement, options?: WebGLContextAttributes): WebGL2RenderingContext | null {
  if (typeof window === 'undefined') return null;

  try {
    return canvas.getContext('webgl2', options);
  } catch {
    return null;
  }
}

export function getBestWebGLContext(canvas: HTMLCanvasElement, options?: WebGLContextAttributes): WebGLRenderingContext | WebGL2RenderingContext | null {
  return getWebGL2Context(canvas, options) ?? getWebGLContext(canvas, options);
}