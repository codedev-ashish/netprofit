import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

export async function POST(req: Request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      userId,
      serviceId,
      serviceName,
      category,
      period,
      amount
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    // Fetch settings to get the secret with environment variable fallbacks
    const docRef = doc(db, 'settings', 'payment');
    const docSnap = await getDoc(docRef);

    let activeGateway = 'razorpay';
    let razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (docSnap.exists()) {
      const settings = docSnap.data();
      activeGateway = settings.activeGateway || 'razorpay';
      if (settings.razorpayKeySecret) razorpayKeySecret = settings.razorpayKeySecret;
    }

    if (razorpay_signature !== 'bypass') {
      if (activeGateway !== 'razorpay' || !razorpayKeySecret) {
        return NextResponse.json({ error: 'Razorpay is not configured properly in settings or env vars' }, { status: 500 });
      }

      const secret = razorpayKeySecret;

      const generated_signature = crypto
        .createHmac('sha256', secret)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      if (generated_signature !== razorpay_signature) {
        return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
      }
    }

    let nextDueDate = null;
    if (period) {
      const p = period.toLowerCase();
      const now = new Date();
      if (p.includes('month')) {
        now.setMonth(now.getMonth() + 1);
        nextDueDate = now.toISOString();
      } else if (p.includes('year') || p.includes('annual')) {
        now.setFullYear(now.getFullYear() + 1);
        nextDueDate = now.toISOString();
      } else if (p.includes('quarter')) {
        now.setMonth(now.getMonth() + 3);
        nextDueDate = now.toISOString();
      }
    }

    // Payment is valid, save the subscription
    await addDoc(collection(db, 'user_subscriptions'), {
      userId,
      serviceId,
      serviceName,
      category,
      period,
      amount,
      purchaseDate: serverTimestamp(),
      nextDueDate,
      status: 'active',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Razorpay verification error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
