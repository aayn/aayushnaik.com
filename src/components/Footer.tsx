export default function Footer() {
  return (
    <div className="fixed bottom-0 right-0 p-7 pr-12 flex gap-5 z-[2]">
      <a
        href="mailto:aayushnaik17@gmail.com"
        title="Contact"
        className="text-black/25 dark:text-white/30 hover:text-black/70 dark:hover:text-white/80 transition-colors flex items-center"
      >
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
        </svg>
      </a>
      <a
        href="https://linkedin.com/in/aayn"
        target="_blank"
        rel="noopener noreferrer"
        title="LinkedIn"
        className="text-black/25 dark:text-white/30 hover:text-black/70 dark:hover:text-white/80 transition-colors flex items-center"
      >
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      </a>
      <a
        href="https://x.com/aayush_naik"
        target="_blank"
        rel="noopener noreferrer"
        title="X"
        className="text-black/25 dark:text-white/30 hover:text-black/70 dark:hover:text-white/80 transition-colors flex items-center"
      >
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
    </div>
  )
}
