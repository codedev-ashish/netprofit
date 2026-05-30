import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

export async function POST(req: Request) {
  try {
    const { amount, receipt } = await req.json();

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    // Fetch gateway settings from Firestore with environment variable fallbacks
    const docRef = doc(db, 'settings', 'payment');
    const docSnap = await getDoc(docRef);

    let activeGateway = 'razorpay';
    let razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    let razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (docSnap.exists()) {
      const settings = docSnap.data();
      activeGateway = settings.activeGateway || 'razorpay';
      if (settings.razorpayKeyId) razorpayKeyId = settings.razorpayKeyId;
      if (settings.razorpayKeySecret) razorpayKeySecret = settings.razorpayKeySecret;
    }

    if (activeGateway !== 'razorpay' || !razorpayKeyId || !razorpayKeySecret) {
      return NextResponse.json({ error: 'Razorpay is not configured properly in settings or env vars' }, { status: 500 });
    }

    const settings = { razorpayKeyId, razorpayKeySecret };

    const razorpay = new Razorpay({
      key_id: settings.razorpayKeyId,
      key_secret: settings.razorpayKeySecret,
    });

    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: receipt || `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: settings.razorpayKeyId
    });
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
