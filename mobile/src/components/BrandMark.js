import React from "react";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

export default function BrandMark({ size = 24 }) {
  return (
    <Svg height={size} viewBox="0 0 64 64" width={size}>
      <Defs>
        <LinearGradient id="bg" x1="8%" x2="100%" y1="8%" y2="100%">
          <Stop offset="0%" stopColor="#1c1b19" />
          <Stop offset="100%" stopColor="#3b3224" />
        </LinearGradient>
        <LinearGradient id="gold" x1="0%" x2="0%" y1="0%" y2="100%">
          <Stop offset="0%" stopColor="#f6e7bc" />
          <Stop offset="100%" stopColor="#d3a341" />
        </LinearGradient>
      </Defs>

      <Rect fill="url(#bg)" height="56" rx="15" width="56" x="4" y="4" />
      <Rect
        fill="none"
        height="54.5"
        rx="14.25"
        stroke="#7e6130"
        strokeOpacity="0.65"
        width="54.5"
        x="4.75"
        y="4.75"
      />

      <Path
        d="M18 46V18h9l11 15V18h8v28h-9L26 31v15h-8z"
        fill="url(#gold)"
      />
      <Circle cx="48" cy="16" fill="#f7de95" r="2.8" />
    </Svg>
  );
}
