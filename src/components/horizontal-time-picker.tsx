'use client'

import { cn } from '@/lib/utils'
import useEmblaCarousel from 'embla-carousel-react'
import { useCallback, useEffect, useState } from 'react'

interface HorizontalTimePickerProps {
  onValueChange?: (value: number) => void
  defaultValue?: number
  className?: string
}

export function HorizontalTimePicker({
  onValueChange,
  defaultValue = 10,
  className
}: HorizontalTimePickerProps) {
  const [selectedValue, setSelectedValue] = useState(defaultValue)
  const [scrollDirection, setScrollDirection] = useState<'left' | 'right' | null>(null)
  const [lastScrollProgress, setLastScrollProgress] = useState(0)
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    containScroll: false,
    dragFree: true,
    loop: false,
    skipSnaps: true,
    duration: 25, // Fast animation for buttons and snapping
  })

  // Create array of seconds from 1 to 60
  const seconds = Array.from({ length: 60 }, (_, i) => {
    return i + 1
  })


  // Function to find nearest multiple of 10 considering direction
  const findNearestMultipleOf10 = (value: number, direction?: 'left' | 'right' | null): number => {
    const lower = Math.floor(value / 10) * 10
    const upper = Math.ceil(value / 10) * 10

    // If value is less than 10, return 10
    if (value < 10) return 10

    // If value is greater than 60, return 60
    if (value > 60) return 60

    // Consider scroll direction
    if (direction === 'right') {
      // When scrolling right (forward) choose next multiple of 10
      return upper
    } else if (direction === 'left') {
      // When scrolling left (backward) choose previous multiple of 10
      return lower
    }

    // If direction is unknown, choose nearest
    return (value - lower) < (upper - value) ? lower : upper
  }


  // Functions for button scrolling
  const scrollLeft = useCallback(() => {
    if (!emblaApi) return

    const currentIndex = Math.round(emblaApi.scrollProgress() * (seconds.length - 1))
    const targetIndex = Math.max(0, currentIndex - 10)
    // Smooth scroll animation (false = with animation)
    emblaApi.scrollTo(targetIndex, false)
  }, [emblaApi, seconds])

  const scrollRight = useCallback(() => {
    if (!emblaApi) return

    const currentIndex = Math.round(emblaApi.scrollProgress() * (seconds.length - 1))
    const targetIndex = Math.min(seconds.length - 1, currentIndex + 10)
    // Smooth scroll animation (false = with animation)
    emblaApi.scrollTo(targetIndex, false)
  }, [emblaApi, seconds])

  // Determine button states
  const canScrollLeft = selectedValue > 10
  const canScrollRight = selectedValue < 60

  // Memoized handlers to prevent unnecessary re-renders
  const handleScroll = useCallback(() => {
    if (!emblaApi) return

    const scrollProgress = emblaApi.scrollProgress()
    const totalSlides = seconds.length
    const currentIndex = Math.round(scrollProgress * (totalSlides - 1))

    // Determine scroll direction
    setLastScrollProgress(prevProgress => {
      if (scrollProgress > prevProgress) {
        setScrollDirection('right')
      } else if (scrollProgress < prevProgress) {
        setScrollDirection('left')
      }
      return scrollProgress
    })

    if (currentIndex >= 0 && currentIndex < seconds.length) {
      const value = seconds[currentIndex]
      setSelectedValue(value)
      onValueChange?.(value)
    }
  }, [emblaApi, seconds, onValueChange])

  const handlePointerUp = useCallback(() => {
    if (!emblaApi) return

    setTimeout(() => {
      // Use current state values instead of closure values
      setSelectedValue(currentValue => {
        setScrollDirection(currentDirection => {
          const nearestMultiple = findNearestMultipleOf10(currentValue, currentDirection)

          // Always snap to nearest multiple of 10
          const targetIndex = seconds.indexOf(nearestMultiple)
          if (targetIndex !== -1) {
            // Use smooth snapping animation
            emblaApi.scrollTo(targetIndex, false)
          }

          // Reset direction after snapping
          return null
        })
        return currentValue
      })
    }, 150)
  }, [emblaApi, seconds])

  // Initialization
  useEffect(() => {
    if (!emblaApi) return

    handleScroll()
    emblaApi.on('scroll', handleScroll)
    emblaApi.on('reInit', handleScroll)
    emblaApi.on('pointerUp', handlePointerUp)

    return () => {
      emblaApi.off('scroll', handleScroll)
      emblaApi.off('reInit', handleScroll)
      emblaApi.off('pointerUp', handlePointerUp)
    }
  }, [emblaApi, handleScroll, handlePointerUp])

  // Set initial value
  useEffect(() => {
    if (!emblaApi) return

    // Scroll to 10th element (index 9)
    emblaApi.scrollTo(9)
  }, [emblaApi])

  return (
    <div className={cn("w-full", className)}>
      {/* Main carousel */}
      <div className="relative">
        {/* Fixed center frame */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-blue-500/50 bg-blue-500/50"
          style={{
            width: '3rem',
            height: '4rem',
          }}
        />

        {/* Carousel */}
        <div className="overflow-hidden" ref={emblaRef} style={{ perspective: '1000px' }}>
          <div
            className="flex"
            style={{
              paddingLeft: 'calc(50% - 1.5rem)',
              paddingRight: 'calc(50% - 1.5rem)',
              transformStyle: 'preserve-3d'
            }}
          >
            {seconds.map((second, index) => {
              const isMultipleOf10 = second % 10 === 0
              const isSelected = selectedValue === second

              // Calculate distance from center for convex effect
              const centerIndex = Math.round((emblaApi?.scrollProgress() || 0) * (seconds.length - 1))
              const distanceFromCenter = Math.abs(index - centerIndex)

              // Scale and opacity based on distance from center
              const scale = Math.max(0.7, 1 - (distanceFromCenter * 0.1))
              const opacity = Math.max(0.3, 1 - (distanceFromCenter * 0.2))
              const translateZ = isSelected ? 20 : Math.max(0, 20 - (distanceFromCenter * 5))

              return (
                <div
                  key={second}
                  className={cn(
                    "flex-shrink-0 w-12 h-16 flex items-center justify-center text-sm font-medium transition-all duration-300 ease-out text-gray-500",
                    "transform-gpu", // Use GPU for better performance
                    isSelected ? "text-blue-600 font-bold text-lg" :
                      
                    isMultipleOf10 && "font-semibold" 
                  )}
                  style={{
                    transform: `scale(${scale}) translateZ(${translateZ}px)`,
                    opacity: opacity,
                    filter: isSelected
                      ? ''
                      : `drop-shadow(0 ${4 - distanceFromCenter}px ${8 - distanceFromCenter * 2}px rgba(0, 0, 0, 0.1))`,
                    zIndex: isSelected ? 10 : Math.max(1, 10 - distanceFromCenter),
                    perspective: '1000px',
                  }}
                  aria-selected={isSelected}
                  role="option"
                >
                  <div
                    className={cn(
                      "w-full h-full flex items-center justify-center rounded-lg transition-all duration-300 bg-gradient-to-b from-gray-50 to-gray-100",
                      isMultipleOf10 && !isSelected && "bg-blue-100"
                        
                    )}
                    style={{
                      transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {'|'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Display selected value */}
      <div className="mt-4 text-center">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 animate-flash">
          {selectedValue}
        </div>
      </div>

      {/* Scroll buttons */}
      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-full border transition-all duration-200",
            canScrollLeft
              ? "bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border-gray-300 dark:border-gray-600 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
              : "bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700 shadow-sm cursor-not-allowed opacity-50"
          )}
          aria-label="Scroll left by 10"
        >
          <svg
            className="w-6 h-6 text-gray-600 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          ±10
        </div>

        <button
          onClick={scrollRight}
          disabled={!canScrollRight}
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-full border transition-all duration-200",
            canScrollRight
              ? "bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border-gray-300 dark:border-gray-600 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
              : "bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700 shadow-sm cursor-not-allowed opacity-50"
          )}
          aria-label="Scroll right by 10"
        >
          <svg
            className="w-6 h-6 text-gray-600 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>


    </div>
  )
}
