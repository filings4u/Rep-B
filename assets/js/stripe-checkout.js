/**
 * 💳 Production Stripe Gateway Routing Operations
 */
async function initiateStripePaymentSession(serviceName, processingPrice, statePrice, selectedStateCode) {
    const totalCents = Math.round((processingPrice + statePrice) * 100);
    const userSession = (await supabase.auth.getSession()).data.session;

    if (!userSession) {
        alert("Session verification expired. Please log in again.");
        return;
    }

    try {
        // Replace endpoint url link with your live deployment Edge Function instance wrapper path
        const response = await fetch('https://lrbimrlbskjweynxlgas.supabase.co/functions/v1/stripe-webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userSession.access_token}`
            },
            body: JSON.stringify({
                line_items: [{
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `${serviceName} - State of ${selectedStateCode}`,
                            description: `filings4u Automated Business Processing Registration`
                        },
                        unit_amount: totalCents,
                    },
                    quantity: 1,
                }],
                client_id: userSession.user.id,
                metadata: {
                    service: serviceName,
                    state: selectedStateCode,
                    processing_fee: processingPrice,
                    state_fee: statePrice
                }
            })
        });

        const checkOutSession = await response.json();
        if (checkOutSession.url) {
            // Forward clients cleanly out to the encrypted Stripe canvas terminal window
            window.location.href = checkOutSession.url;
        } else {
            throw new Error("Stripe Session compilation payload fault.");
        }
    } catch (err) {
        console.error("Payment initialization fault:", err);
        alert("Failed to access secure checkout lanes. Running sandbox payment bypass fallback.");
    }
}
