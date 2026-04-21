import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/'

  // Identify if this is a PKCE invite link
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (next === '/') {
          // Si el usuario viene de una invitación, queremos llevarlo a poner contraseña
          // Idealmente podemos chequear si no tiene password o mandarlo por defecto
          next = '/update-password'
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If there is no code, it might be an Implicit flow with #access_token
  // Browsers will keep the #hash across redirects, so we send them to update-password
  // and the Supabase Client SDK there will pick up the token and log them in
  if (next === '/') next = '/update-password'
  return NextResponse.redirect(`${origin}${next}`)
}
