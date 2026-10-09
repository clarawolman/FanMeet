export default function IconoLastfm({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#D51007" />
      <text
        x="12"
        y="15.5"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="9.5"
        fontWeight="700"
        fill="#fff"
      >
        fm
      </text>
    </svg>
  );
}
