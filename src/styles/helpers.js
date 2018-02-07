// @flow

import Color from 'color'

export const rgba = (c: string, a: number) =>
  Color(c)
    .alpha(a)
    .rgb()
    .toString()

export const fontFace = ({
  name,
  file,
  style,
  weight,
}: {
  name: string,
  file: string,
  style: string,
  weight: number,
}) => `
  @font-face {
    font-family: "${name}";
    src: url("/fonts/${file}.woff2") format("woff2");
    font-style: ${style};
    font-weight: ${weight};
  }
`
