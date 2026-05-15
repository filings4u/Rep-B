import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
        }
      })
    }

    const payload = await req.json()
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // MODE A: FRONTEND INITIALIZATION HANDSHAKE (Fired by wizard.html click)
    if (payload.action === 'checkout') {
      const successUrlAddress = payload.success_url || 'https://filings4u.com'
      const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || ''
      
      const stripeResponse = await fetch('https://stripe.com', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
  'payment_method_types[]': 'card',
  'customer_email': payload.email,
  'line_items[price_data][currency]': 'usd',
  'line_items[price_data][product_data][name]': `Filing Service: ${payload.service_type.toUpperCase().replace(/-/g, ' ')}`,
  'line_items[price_data][unit_amount]': payload.amount.toString(),
  'line_items[quantity]': '1',
  'mode': 'payment',
  'ui_mode': 'embedded',
  // 🚀 FIXED: Passed a clean, unmanipulated base URL to completely bypass Stripe validation errors!
  'return_url': payload.success_url, 
  'metadata[service_type]': payload.service_type,
  'metadata[company_name]': payload.company_name
})
      })

      const sessionData = await stripeResponse.json()
      if (sessionData.error) throw new Error(sessionData.error.message)

      return new Response(JSON.stringify({ clientSecret: sessionData.client_secret }), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      })
    }

    // MODE B: BACKEND WEBHOOK EVENT LISTENER (Fired by Stripe upon successful payment)
    if (payload.type === 'checkout.session.completed') {
      const session = payload.data.object
      const customerEmail = session.customer_details?.email
      const stripeInvoiceId = session.id
      
      const companyName = session.metadata?.company_name || 'New Registered Carrier'
      const rawServiceType = session.metadata?.service_type || 'llc-formation-compliance'
      const totalAmountDollars = (session.amount_total || 0) / 100

      const dashIdx = rawServiceType.lastIndexOf('-')
      const serviceKey = dashIdx !== -1 ? rawServiceType.substring(0, dashIdx) : rawServiceType
      const planTier = dashIdx !== -1 ? rawServiceType.substring(dashIdx + 1) : 'compliance'

      if (customerEmail) {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
          email: customerEmail,
          email_confirm: true,
          user_metadata: { purchase_type: rawServiceType }
        })
        
        if (!userError && userData && userData.user) {
          const targetUserId = userData.user.id

          const { data: filingRecord, error: filingError } = await supabaseAdmin
            .from('user_filings_workspace')
            .insert({
              user_id: targetUserId,
              service_key: serviceKey,
              plan_tier: planTier,
              company_name: companyName,
              amount_paid: totalAmountDollars,
              status: 'paid',
              current_step: 0
            })
            .select('id')
            .single()

          if (!filingError && filingRecord) {
            await supabaseAdmin
              .from('receipts')
              .insert({
                filing_id: filingRecord.id,
                user_id: targetUserId,
                stripe_invoice_id: stripeInvoiceId,
                customer_email: customerEmail,
                company_name: companyName,
                service_title: serviceKey.toUpperCase().replace(/-/g, ' '),
                plan_title: planTier.toUpperCase(),
                subtotal: totalAmountDollars
              })
          }

          await supabaseAdmin.auth.admin.generateLink({
            type: 'signup',
            email: customerEmail,
            options: { redirectTo: 'https://filings4u.com' }
          })
        }
      }
    }
    
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    })
  }
})
