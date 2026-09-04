function initializeTimepiece(timepiece: HTMLElement): void {
  const balance = timepiece.querySelector("[data-timepiece-balance]")
  const driver = timepiece.querySelector("[data-timepiece-driver]")

  if (!(balance instanceof SVGElement) || !(driver instanceof SVGElement)) {
    return
  }

  const wheelFrames: Keyframe[] = Array.from({ length: 12 }, (_, second) => [
    { offset: second / 12, transform: `rotate(${second * 30}deg)` },
    {
      offset: (second + 0.4) / 12,
      transform: `rotate(${second * 30}deg)`,
      easing: "cubic-bezier(0.2, 0, 0.3, 1)",
    },
    { offset: (second + 0.55) / 12, transform: `rotate(${(second + 1) * 30}deg)` },
  ]).flat()
  wheelFrames.push({ offset: 1, transform: "rotate(360deg)" })

  const animations = [
    balance.animate(
      [
        { offset: 0, transform: "rotate(-40deg)", easing: "ease-in-out" },
        { offset: 0.5, transform: "rotate(40deg)", easing: "ease-in-out" },
        { offset: 1, transform: "rotate(-40deg)" },
      ],
      { duration: 2000, iterations: Infinity },
    ),
    driver.animate(wheelFrames, { duration: 12_000, iterations: Infinity }),
  ]

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)")
  let visible = false

  function updateMotion(): void {
    const running = visible && !document.hidden && !reducedMotion.matches
    timepiece.dataset.running = String(running)

    // Both parts share the same one-second beat, including after returning to the tab.
    const elapsed = reducedMotion.matches ? 0 : Date.now() % 12_000
    for (const animation of animations) {
      animation.pause()
      animation.currentTime = elapsed
      if (running) {
        animation.play()
      }
    }
  }

  const observer = new IntersectionObserver(function observeTimepiece(entries) {
    visible = entries.some(entry => entry.isIntersecting)
    updateMotion()
  })

  observer.observe(timepiece)
  document.addEventListener("visibilitychange", updateMotion)
  reducedMotion.addEventListener("change", updateMotion)
  updateMotion()
}

const timepiece = document.querySelector("#home-timepiece")

if (timepiece instanceof HTMLElement) {
  initializeTimepiece(timepiece)
}
