const STAGGER_DELAYS = ['0.1s', '0.25s', '0.4s', '0.55s', '0.65s']

function FadeIn({ children, index }: { children: React.ReactNode; index: number }) {
  return (
    <div
      className="opacity-0 translate-y-4"
      style={{
        animation: 'enter 0.9s ease forwards',
        animationDelay: STAGGER_DELAYS[index],
      }}
    >
      {children}
    </div>
  )
}

export default function Content() {
  return (
    <div className="relative z-[2] px-[60px] py-[60px] max-w-[640px] lg:max-w-[740px] 2xl:max-w-[900px]">
      <FadeIn index={0}>
        <div className="font-['Space_Grotesk'] text-[13px] lg:text-[15px] 2xl:text-[18px] tracking-[3px] uppercase font-light mb-12 text-black/60 dark:text-white/80">
          Aayush Naik
        </div>
      </FadeIn>

      <FadeIn index={1}>
        <h1 className="text-[42px] lg:text-[48px] 2xl:text-[59px] font-light -tracking-[1px] leading-[1.2] mb-2 text-black dark:text-white">
          Precision in tech.
        </h1>
      </FadeIn>

      <FadeIn index={2}>
        <div className="font-[Georgia,'Times_New_Roman',serif] italic text-2xl lg:text-[28px] 2xl:text-[34px] mb-8 leading-[1.4] text-black/55 dark:text-white/70">
          Depth in ideas.
        </div>
      </FadeIn>

      <FadeIn index={3}>
        <div className="w-10 lg:w-12 2xl:w-14 h-px bg-black/15 dark:bg-white/15 mb-7" />
      </FadeIn>

      <FadeIn index={4}>
        <p className="font-extralight text-[15px] lg:text-[17px] 2xl:text-[21px] leading-[1.9] text-black/60 dark:text-white/75">
          Engineer, founder, thinker. I'm building{' '}
          <a href="https://hypercubic.ai" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-black dark:hover:text-white transition-colors">
            Hypercubic
          </a>
          , an AI platform for autonomously modernizing mainframes. I write{' '}
          <a href="https://www.anticynical.com/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-black dark:hover:text-white transition-colors">
            Anticynical
          </a>
          , where I'm developing a psychological and philosophical operating system for a rapidly changing world.
        </p>
      </FadeIn>

    </div>
  )
}
