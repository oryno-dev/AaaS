declare module 'inkscaper' {
  export class Inkscape {
    constructor(args: string[]);
    runSync(): { status: number };
  }
}
