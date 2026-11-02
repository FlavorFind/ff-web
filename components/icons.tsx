export function SvgSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <symbol id="bowl" viewBox="0 0 32 32">
          <path
            d="M4 15h24a12 12 0 0 1-24 0z M11 9c-1.5-2 1.5-3 0-5 M16 9c-1.5-2 1.5-3 0-5 M21 9c-1.5-2 1.5-3 0-5"
            fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
          />
        </symbol>
        <symbol id="logo" viewBox="0 0 64 64">
          <g fill="none" stroke="#D1AE5F" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 38C8 37 6 25 14 23c0-9 13-13 18-7 5-6 18-2 18 7 7 3 6 13-2 15" />
            <path d="M17 38v16h20" />
            <circle cx="35" cy="34" r="9" />
            <path d="M42 41l9 9" />
          </g>
        </symbol>
      </defs>
    </svg>
  );
}

export function Bowl() {
  return (
    <svg aria-hidden="true">
      <use href="#bowl" />
    </svg>
  );
}
