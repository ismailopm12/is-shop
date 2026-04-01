import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, otp } = await req.json()

    if (!email || !otp) {
      throw new Error('Email and OTP are required')
    }

    // Initialize Resend with API key from environment
    const resend = new Resend(Deno.env.get('RESEND_API_KEY') || '')

    // Send email with OTP
    const { data, error } = await resend.emails.send({
      from: Deno.env.get('FROM_EMAIL') || 'Sweet Build <onboarding@resend.dev>',
      to: [email],
      subject: 'পাসওয়ার্ড রিসেট OTP - Sweet Build',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔐 পাসওয়ার্ড রিসেট</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              আপনার পাসওয়ার্ড রিসেট করার জন্য অনুরোধ করা হয়েছে। নিচের OTP কোডটি ব্যবহার করুন:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background-color: #667eea; color: white; font-size: 32px; font-weight: bold; padding: 20px 40px; border-radius: 10px; letter-spacing: 5px;">
                ${otp}
              </div>
            </div>
            
            <p style="font-size: 14px; color: #666; text-align: center;">
              এই OTP কোডটি <strong>৫ মিনিট</strong> পর্যন্ত কার্যকর থাকবে।
            </p>
            
            <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 5px;">
              <p style="font-size: 13px; color: #856404; margin: 0;">
                ⚠️ <strong>সতর্কতা:</strong> আপনি যদি পাসওয়ার্ড রিসেট করতে না চান, তবে এই ইমেইলটি উপেক্ষা করুন।
              </p>
            </div>
          </div>
          
          <div style="background-color: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">ধন্যবাদ,</p>
            <p style="margin: 10px 0 0 0; font-weight: bold;">Sweet Build টিম</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Error sending email:', error)
      throw new Error(error.message || 'Failed to send email')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP sent successfully',
        emailId: data?.id 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error in send-password-reset-otp function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send OTP' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
