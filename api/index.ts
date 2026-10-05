// Polyfill DOMMatrix for PDF parsing in serverless runtime
if (typeof (globalThis as any).DOMMatrix === 'undefined') {
  try {
    (globalThis as any).DOMMatrix = require('dommatrix');
  } catch {
    class MockDOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      m11 = 1; m12 = 0; m13 = 0; m14 = 0;
      m21 = 0; m22 = 1; m23 = 0; m24 = 0;
      m31 = 0; m32 = 0; m33 = 1; m34 = 0;
      m41 = 0; m42 = 0; m43 = 0; m44 = 1;
      is2D = true; isIdentity = true;
      constructor(init?: any) {
        if (Array.isArray(init) && init.length >= 6) {
          this.a = init[0]; this.b = init[1]; this.c = init[2];
          this.d = init[3]; this.e = init[4]; this.f = init[5];
        }
      }
      translate() { return this; }
      scale() { return this; }
      multiplySelf() { return this; }
      preMultiplySelf() { return this; }
      invertSelf() { return this; }
      getTransform() { return this; }
    }
    (globalThis as any).DOMMatrix = MockDOMMatrix;
  }
}

import { app, ensureDatabaseReady } from '../server/src/app';

export default function handler(req: any, res: any) {
  try {
    ensureDatabaseReady();
    return (app as any)(req, res);
  } catch (err: any) {
    console.error('Vercel serverless execution error:', err);
    res.status(500).json({
      error: err.message || 'Internal server error in serverless function',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
