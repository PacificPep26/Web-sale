"use client"

import { useEffect, useRef, useState } from "react"

export function ToyVideo() {
  const ref = useRef<HTMLVideoElement>(null)
  const userPaused = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const video = ref.current
    if (!video) return
    const reduce = matchMedia("(prefers-reduced-motion: reduce)")
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    video.dataset.source = matchMedia("(max-width: 767px)").matches ? "/playpuff/hero-mobile.mp4" : "/playpuff/hero-desktop.mp4"
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || document.hidden) video.pause()
      else if (!userPaused.current && !reduce.matches && !connection?.saveData) {
        if (!video.getAttribute("src")) video.src = video.dataset.source!
        void video.play().catch(() => setPlaying(false))
      }
    }, { threshold: 0.2 })
    observer.observe(video)
    const stop = () => { if (document.hidden || reduce.matches) video.pause() }
    document.addEventListener("visibilitychange", stop)
    reduce.addEventListener("change", stop)
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", stop); reduce.removeEventListener("change", stop) }
  }, [])
  function toggle() {
    const video = ref.current
    if (!video) return
    if (playing) { userPaused.current = true; video.pause() }
    else {
      userPaused.current = false
      if (!video.getAttribute("src")) video.src = video.dataset.source ?? "/playpuff/hero-mobile.mp4"
      void video.play().catch(() => setFailed(true))
    }
  }
  return <div className="pp-video"><video ref={ref} muted loop playsInline preload="none" poster="/playpuff/hero-poster.webp" aria-label="Children playing and collectible displays" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setFailed(true)} />{!failed && <button onClick={toggle} aria-label={playing ? "Pause banner video" : "Play banner video"}>{playing ? "Ⅱ Pause" : "▷ Play"}</button>}</div>
}
