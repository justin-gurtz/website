import { z } from 'zod'

const schema = z.object({
  NEXT_PUBLIC_MAPBOX_MAPS_ACCESS_TOKEN: z.string().min(1),
})

const nextPublic = {
  NEXT_PUBLIC_MAPBOX_MAPS_ACCESS_TOKEN:
    process.env.NEXT_PUBLIC_MAPBOX_MAPS_ACCESS_TOKEN,
}

const { NEXT_PUBLIC_MAPBOX_MAPS_ACCESS_TOKEN } = schema.parse(nextPublic)

// eslint-disable-next-line import/prefer-default-export
export { NEXT_PUBLIC_MAPBOX_MAPS_ACCESS_TOKEN }
