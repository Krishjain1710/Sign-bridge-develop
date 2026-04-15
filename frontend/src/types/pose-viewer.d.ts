interface PoseViewerElement extends HTMLElement {
  src?: string;
  autoplay?: boolean | string;
  play(): void;
  pause(): void;
  currentTime: number;
  playbackRate: number;
}

declare namespace JSX {
  interface IntrinsicElements {
    'pose-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string;
      autoplay?: boolean | string;
      'aspect-ratio'?: string;
      style?: React.CSSProperties;
    };
  }
}
