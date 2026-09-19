const VectorIcon = ({
  className = 'w-8 h-8',
  color = 'currentColor',
  accent = 'currentColor',
}) => {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Main Vector shape */}
      <path
        d="M32 4L58 52H6L32 4Z"
        fill={color}
      />

      {/* Accent / inner Vector */}
      <path
        d="M32 17L45 43H19L32 17Z"
        fill={accent}
      />

      {/* Optional center detail */}
      <circle
        cx="32"
        cy="34"
        r="5"
        fill={color}
      />
    </svg>
  );
};

export default VectorIcon;