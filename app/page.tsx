import Strava from '@/components/strava'

export const revalidate = 3600

const getStravaActivities = async () => {
  const token = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID || '',
      client_secret: process.env.STRAVA_CLIENT_SECRET || '',
      refresh_token: process.env.STRAVA_REFERSH_TOKEN || '',
      grant_type: 'refresh_token',
    }),
  }).then((response) => response.json())

  const accessToken = token.access_token
  if (!accessToken) {
    throw new Error('No Strava access token')
  }

  const runs = await fetch('https://www.strava.com/api/v3/athlete/activities', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }).then((response) => response.json())

  if (runs.errors) {
    runs.errors.forEach(console.error)
    throw new Error('Strava API error')
  }

  return runs.filter((run: { type: string }) => run.type === 'Run')
}

export default async function Page() {
  const stravaActivities = await getStravaActivities()

  return (
    <div className="flex flex-col justify-center min-h-svh p-5 sm:p-10 max-w-screen-sm m-auto gap-20">
      <h1 className="text-3xl font-semibold">Justin Gurtz</h1>
      <Strava activities={stravaActivities} />
    </div>
  )
}
