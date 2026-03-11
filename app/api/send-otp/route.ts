import { NextRequest, NextResponse } from 'next/server'

// Uses Resend (https://resend.com) — free tier: 100 emails/day
// Set RESEND_API_KEY in your environment variables

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'mujAnon <noreply@mujanon.in>'

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json()

    if (!email || !otp) {
      return NextResponse.json({ error: 'Missing email or otp' }, { status: 400 })
    }

    // Validate MUJ email server-side too
    if (!email.toLowerCase().endsWith('@muj.manipal.edu')) {
      return NextResponse.json({ error: 'Invalid email domain' }, { status: 400 })
    }

    if (!RESEND_API_KEY) {
      // Dev fallback: log to console so devs can test without email setup
      console.log(`[DEV] OTP for ${email}: ${otp}`)
      return NextResponse.json({ success: true, dev: true })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: `Your mujAnon verification code: ${otp}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 32px;">💬</span>
              <h1 style="color: #18181b; font-size: 22px; margin: 8px 0 4px;">mujAnon Verification</h1>
              <p style="color: #71717a; font-size: 14px; margin: 0;">Your MUJ email verification code</p>
            </div>

            <div style="background: #f9f9fb; border: 1px solid #e4e4e7; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <p style="color: #71717a; font-size: 13px; margin: 0 0 12px;">Enter this code in the app:</p>
              <div style="font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #f59e0b; font-family: monospace;">${otp}</div>
              <p style="color: #a1a1aa; font-size: 12px; margin: 12px 0 0;">Expires in 10 minutes</p>
            </div>

            <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend error:', err)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('send-otp error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
