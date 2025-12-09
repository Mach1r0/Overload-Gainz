import { cn } from "@/lib/utils"

interface BrandLogoProps {
  className?: string
}

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-12 w-12 flex-shrink-0 bg-transparent">
        <img
          src="/capenga.png"
          alt="Overload Gainz Eye Logo"
          className="h-full w-full object-contain"
          style={{ backgroundColor: 'transparent' }}
        />
      </div>
      <svg
        className="h-10 w-auto"
        viewBox="0 0 450 120"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Overload Gainz"
      >
        <defs>
          <style>
            {`
              @import url('https://fonts.googleapis.com/css2?family=Teko:wght@700&display=swap');
            `}
          </style>
        </defs>
        <text
          x="0"
          y="50"
          fontFamily="Teko, Impact, Arial Black, sans-serif"
          fontWeight="700"
          fontSize="76"
          fill="#3B82F6"
          stroke="#1E3A8A"
          strokeWidth="2"
          letterSpacing="2"
          style={{ textTransform: 'uppercase' }}
        >
          OVERLOAD
        </text>
        <text
          x="0"
          y="105"
          fontFamily="Teko, Impact, Arial Black, sans-serif"
          fontWeight="700"
          fontSize="66"
          fill="#06B6D4"
          stroke="#0E7490"
          strokeWidth="2"
          letterSpacing="2"
          style={{ textTransform: 'uppercase' }}
        >
          GAINZ
        </text>
      </svg>
    </div>
  )
}
