type CapsyThumbsUpProps = {
  className?: string;
};

export default function CapsyThumbsUp({ className }: CapsyThumbsUpProps) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="20 20 340 330"
      role="img"
      aria-label="Capsy thumbs up"
    >
      <title>Capsy thumbs up</title>
      <ellipse cx="190" cy="328" rx="62" ry="7" fill="#000" opacity="0.12" />
      <path
        d="M170 280 L170 308 M210 280 L210 308"
        stroke="#1D9E75"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <ellipse cx="160" cy="314" rx="19" ry="9" fill="#0F6E56" />
      <ellipse cx="220" cy="314" rx="19" ry="9" fill="#0F6E56" />
      <path
        d="M131 200 Q104 214 120 248"
        stroke="#1D9E75"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="122" cy="252" r="10" fill="#F5F1E8" stroke="#1D9E75" strokeWidth="3" />
      <path
        d="M249 190 Q286 190 290 160"
        stroke="#1D9E75"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <ellipse cx="291" cy="138" rx="9" ry="16" fill="#F5F1E8" stroke="#1D9E75" strokeWidth="3" />
      <circle cx="291" cy="158" r="12" fill="#F5F1E8" stroke="#1D9E75" strokeWidth="3" />
      <rect x="130" y="50" width="120" height="230" rx="60" fill="#F5F1E8" />
      <path d="M130 155 V110 A60 60 0 0 1 250 110 V155 Z" fill="#1D9E75" />
      <rect x="130" y="150" width="120" height="8" fill="#0F6E56" />
      <rect x="146" y="62" width="10" height="60" rx="5" fill="#fff" opacity="0.35" />
      <rect
        x="130"
        y="50"
        width="120"
        height="230"
        rx="60"
        fill="none"
        stroke="#0F6E56"
        strokeWidth="3"
      />
      <rect x="182" y="82" width="16" height="44" rx="4" fill="#fff" />
      <rect x="168" y="96" width="44" height="16" rx="4" fill="#fff" />
      <path
        d="M156 202 Q165 190 174 202 M206 202 Q215 190 224 202"
        stroke="#2B2B2B"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="148" cy="222" rx="10" ry="6" fill="#F4A9A8" />
      <ellipse cx="232" cy="222" rx="10" ry="6" fill="#F4A9A8" />
      <path
        d="M170 216 Q190 248 210 216 Z"
        fill="#E24B4A"
        stroke="#2B2B2B"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="322" cy="70" r="24" fill="#E1F5EE" stroke="#1D9E75" strokeWidth="4" />
      <path
        d="M309 70 L318 80 L335 60"
        stroke="#0F6E56"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
