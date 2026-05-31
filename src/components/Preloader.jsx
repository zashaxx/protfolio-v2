import { useEffect, useRef, useState } from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import loaderAnimation from '../assets/abstract-isometric-loader-1.lottie'

export default function Preloader({ onHidden }) {
  const [isExiting, setIsExiting] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const previousOverflowRef = useRef('')
  const onCompleteRef = useRef(null)

  useEffect(() => {
    previousOverflowRef.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflowRef.current
    }
  }, [])

  useEffect(() => {
    if (!isHidden) {
      return undefined
    }

    document.body.style.overflow = previousOverflowRef.current
    onHidden?.()

    return undefined
  }, [isHidden, onHidden])

  const handlePlayerReady = (dotLottie) => {
    if (!dotLottie) {
      return
    }

    onCompleteRef.current = () => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setIsExiting(true)
        })
      })
    }

    dotLottie.addEventListener('complete', onCompleteRef.current)
  }

  const handleExitTransitionEnd = () => {
    if (isExiting) {
      setIsHidden(true)
      document.body.style.overflow = previousOverflowRef.current
    }
  }

  if (isHidden) {
    return null
  }

  return (
    <div className="preloader">
      <div className={`preloader__stage ${isExiting ? 'preloader__stage--exit' : ''}`} onTransitionEnd={handleExitTransitionEnd}>
        <DotLottieReact
          className="preloader__animation"
          src={loaderAnimation}
          autoplay
          loop={false}
          useFrameInterpolation={false}
          dotLottieRefCallback={handlePlayerReady}
        />
      </div>

      <style>{`
        .preloader {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          place-items: center;
          overflow: hidden;
          background: var(--bg-main);
          color: #18181b;
        }

        .preloader__stage {
          display: grid;
          place-items: center;
          width: min(180px, 42vw);
          aspect-ratio: 1;
          opacity: 1;
          transform: scale(1);
          transition: transform 650ms cubic-bezier(0.22, 1, 0.36, 1), opacity 650ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .preloader__stage--exit {
          transform: scale(0.72);
          opacity: 0;
          pointer-events: none;
        }

        .preloader__animation {
          width: 100%;
          height: 100%;
        }

        @media (prefers-color-scheme: dark) {
          .preloader {
            color: #fafafa;
          }
        }
      `}</style>
    </div>
  )
}