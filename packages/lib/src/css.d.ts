/**
 * Vite's `?inline` CSS imports, used with useStyles$()/useStylesScoped$().
 * Declared locally so the library does not need vite/client types.
 */
declare module "*.css?inline" {
  const css: string;
  export default css;
}
