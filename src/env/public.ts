import { z } from 'zod'

const schema = z.object({
  NEXT_PUBLIC_PRESHARED_KEY: z.string().min(1),
  NEXT_PUBLIC_MAPBOX_MAPS_ACCESS_TOKEN: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
})

const nextPublic = {
  NEXT_PUBLIC_PRESHARED_KEY: process.env.NEXT_PUBLIC_PRESHARED_KEY,
  NEXT_PUBLIC_MAPBOX_MAPS_ACCESS_TOKEN:
    process.env.NEXT_PUBLIC_MAPBOX_MAPS_ACCESS_TOKEN,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
}

const {
  NEXT_PUBLIC_PRESHARED_KEY,
  NEXT_PUBLIC_MAPBOX_MAPS_ACCESS_TOKEN,
  NEXT_PUBLIC_SUPABASE_URL,
} = schema.parse(nextPublic)

export {
  NEXT_PUBLIC_PRESHARED_KEY,
  NEXT_PUBLIC_MAPBOX_MAPS_ACCESS_TOKEN,
  NEXT_PUBLIC_SUPABASE_URL,
}
