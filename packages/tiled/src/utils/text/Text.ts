import { TiledHorizontalAlign } from "./HorizontalAlign";
import { TiledVerticalAlign } from "./VerticalAlign";

/** Text in a Text object */
export interface TiledText {
  /** Whether to use a bold font. Default is false. */
  bold?: boolean;

  /** The text color. Default is black. */
  color?: string;

  /** The font family. Default is `sand-serif` */
  fontfamily?: string;

  /** The horizontal alignment. Default is LEFT. */
  halign?: TiledHorizontalAlign;

  /** Whether to use an italic font. Default is false. */
  italic?: boolean;

  /** Whether to use kerning when placing characters. Default is true. */
  kerning?: boolean;

  /** Pixel size of the font. Default is 16. */
  pixelsize?: number;

  /** Whether to strike out the text. Default is false. */
  strikeout?: boolean;

  /** The text. */
  text: string;

  /** Whether to underline the text. Default is false. */
  underline?: boolean;

  /** Vertical alignment. Default is TOP. */
  valign?: TiledVerticalAlign;

  /** Whether the text is wrapped within the object bounds. Default is false. */
  wrap?: boolean;
}
