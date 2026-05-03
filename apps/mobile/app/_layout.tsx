import { Slot, useRouter, useSegments } from 'expo-router'
import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/clerk-expo'
import { useEffect } from 'react'
import { LogBox } from 'react-native'
import { tokenCache } from '@/utils/cache'

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
if (!clerkPublishableKey) {
  console.error('Clerk publishable key is not defined')
}
LogBox.ignoreAllLogs()

function InitialLayout() {
  const { isSignedIn, isLoaded } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return

    const firstSegment = segments[0]

    const inAuthFlow = ['home', 'profile'].includes(firstSegment)
    const inSignIn = firstSegment === 'sign-in'

    if (isSignedIn && firstSegment === 'sign-in') {
      router.replace('/home')
    }

    if (!isSignedIn && inAuthFlow) {
      router.replace('/')
    }
  }, [isLoaded, isSignedIn, segments])

  return <Slot />
}


export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <InitialLayout />
      </ClerkLoaded>
    </ClerkProvider>
  )
}
