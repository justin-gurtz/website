'use client'

import { cn } from '@/utils/tailwind'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

const Carousel = ({ image }: { image: string }) => {
  const [renderedFirstImage, setRenderedFirstImage] = useState(false)
  const [imageData, setImageData] = useState<{ src: string; error?: unknown }>()

  useEffect(() => {
    const loadImage = async () => {
      try {
        const response = await fetch(image)
        const blob = await response.blob()

        setImageData({ src: URL.createObjectURL(blob) })
      } catch (error) {
        setImageData({ src: image, error })
      }
    }

    loadImage()
  }, [image])

  useEffect(() => {
    return () => {
      if (imageData?.src && !imageData.error) {
        URL.revokeObjectURL(imageData.src)
      }
    }
  }, [imageData])

  return (
    <div className={cn('size-full', renderedFirstImage && 'bg-black')}>
      <AnimatePresence>
        {imageData && (
          <motion.img
            key={imageData.src}
            src={imageData.src}
            alt="Artwork"
            className="absolute top-0 left-0 size-full object-cover"
            initial={renderedFirstImage ? { x: '100%' } : { opacity: 0 }}
            animate={renderedFirstImage ? { x: 0 } : { opacity: 1 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            onAnimationComplete={() => setRenderedFirstImage(true)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Carousel
