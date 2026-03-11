import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Resend's shared sandbox domain — works out of the box, no domain verification needed.
// Limitation: can only deliver to the email address on your Resend account in sandbox mode.
// For production sending to all MUJ students, verify your own domain at resend.com/domains.
const FROM_EMAIL = 'onboarding@resend.dev'

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json()

    if (!email || !otp) {
      return NextResponse.json({ error: 'Missing email or otp' }, { status: 400 })
    }

    // Server-side MUJ domain check
    if (!email.toLowerCase().endsWith('@muj.manipal.edu')) {
      return NextResponse.json({ error: 'Invalid email domain' }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      // Dev fallback — log to console so you can test without email
      console.log(`[DEV] OTP for ${email}: ${otp}`)
      return NextResponse.json({ success: true, dev: true })
    }

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Your mujAnon verification code: ${otp}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px;">💬</span>
            <h1 style="color: #18181b; font-size: 22px; margin: 8px 0 4px;">mujAnon Verification</h1>
            <p style="color: #71717a; font-size: 14px; margin: 0;">Verify your MUJ email to unlock Verified-only matching</p>
          </div>

          <div style="background: #f9f9fb; border: 1px solid #e4e4e7; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 24px;">
            <p style="color: #71717a; font-size: 13px; margin: 0 0 12px;">Your 6-digit code:</p>
            <div style="font-size: 40px; font-weight: 700; letter-spacing: 14px; color: #f59e0b; font-family: monospace;">${otp}</div>
            <p style="color: #a1a1aa; font-size: 12px; margin: 14px 0 0;">Expires in 10 minutes</p>
          </div>

          <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
            If you didn't request this, ignore this email — no action is needed.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('send-otp error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
