declare namespace JSX {
  interface IntrinsicElements {
    'fsw-sign': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      sign: string;
      style?: React.CSSProperties & { direction?: string };
    };
  }
}
