/// <reference types="vite/client" />
// src/declarations.d.ts
declare module '*.docx' {
  const content: string;
  export default content;
}