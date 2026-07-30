"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../lib/firebase";
import { auth } from "../lib/firebase-auth";
import { doc, getDoc, collection, query, where, getDocs, documentId } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import Script from "next/script";
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Home, ChevronRight, Users, Star, ShieldCheck, Wallet, MonitorPlay, FileCheck, RefreshCw, TrendingUp, Zap, Shield, UserCheck, Globe, Briefcase, Layers, IndianRupee, Award, User, Building2, HeartHandshake, ShoppingBag, FolderOpen, Settings, Download, XCircle } from "lucide-react";
import styles from "../app/services/page.module.css";
import ShareButtons from "./ShareButtons";
import ServiceContactForm from "./ServiceContactForm";
import HorizontalSlider from "./HorizontalSlider";

const getIcon = (iconName: string, size: number = 20, color: string = "#ea580c") => {
  const IconMap: { [key: string]: any } = {
    ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Home, ChevronRight, Users, Star, ShieldCheck, Wallet, MonitorPlay, FileCheck, RefreshCw, TrendingUp, Zap, Shield, UserCheck, Globe, Briefcase, Layers, IndianRupee, Award, User, Building2, HeartHandshake, ShoppingBag, FolderOpen, Settings, Download, XCircle
  };
  const IconComponent = IconMap[iconName] || CheckCircle2;
  return <IconComponent size={size} color={color} />;
};

export interface PricingPlanFeature {
  name: string;
  included: boolean;
}

export interface PricingPlan {
  id: string;
  title: string;
  price: string;
  period?: string;
  footnote?: string;
  features: PricingPlanFeature[];
  buttonText?: string;
  buttonLink?: string;
}

interface Service {
  id: string;
  name: string;
  slug?: string;
  category: string;
  description: string;
  period: string;
  isRecurring: boolean;
  documentsRequired?: string | string[];
  isCombo?: boolean;
  comboServices?: string[];
  price?: number;
  features?: string[];
  showReviews?: boolean;
  content?: string;
  visibility?: Record<string, boolean>;


  oneTimePrice?: number;
  oneTimeDiscountType?: string;
  oneTimeDiscountValue?: number;
  halfYearlyPrice?: number;
  halfYearlyDiscountType?: string;
  halfYearlyDiscountValue?: number;
  annualPrice?: number;
  annualDiscountType?: string;
  annualDiscountValue?: number;
  annualOnly?: boolean;

  multiBusinessOneTimePrice?: number;
  multiBusinessHalfYearlyPrice?: number;
  multiBusinessAnnualPrice?: number;

  customSections?: { title: string; content: string }[];
  pricingPlans?: PricingPlan[];
  faqs?: { question: string; answer: string }[];
  processSteps?: { icon: string; title: string; desc: string }[];
  processBenefits?: string[];
  benefits?: { title: string; desc: string }[];
  reviews?: { name: string; type: string; date: string; text: string; rating: string }[];
  importanceCards?: { icon: string; title: string; desc: string }[];
  heroSubtitle?: string;
  heroTrustTitle?: string;
  heroTrustBadges?: string;
}

export default function ServiceDetails({ initialService = null, initialComboDetails = [] }: { initialService?: Service | null, initialComboDetails?: Service[] }) {
  const params = useParams();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(initialService);
  const [comboDetails, setComboDetails] = useState<Service[]>(initialComboDetails);
  const [loading, setLoading] = useState(!initialService);
  const [user, setUser] = useState<any>(null);
  const [businessType, setBusinessType] = useState<'single' | 'multi'>('single');
  const [billingPeriod, setBillingPeriod] = useState<'half-yearly' | 'annual'>('annual');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'pricing' | 'details' | 'custom' | 'combo' | 'faq'>('overview');

  const overviewRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const customRef = useRef<HTMLDivElement>(null);
  const comboRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (initialService) {
      setLoading(false);
      return;
    }

    const fetchServiceDetails = async () => {
      if (!params?.slug) return;
      const slugValue = params.slug as string;

      try {
        let sData: Service | null = null;

        const q = query(collection(db, "services"), where("slug", "==", slugValue));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          if (data.isPublished !== false) {
            sData = { id: querySnapshot.docs[0].id, ...data } as Service;
          }
        } else {
          const fallbackRef = doc(db, "services", slugValue);
          const docSnap = await getDoc(fallbackRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.isPublished !== false) {
              sData = { id: docSnap.id, ...data } as Service;
            }
          }
        }

        if (sData) {
          setService(sData);
          if (sData.annualOnly) {
            setBillingPeriod('annual');
          }
          if (sData.isCombo && sData.comboServices && sData.comboServices.length > 0) {
            const comboQuery = query(collection(db, "services"), where(documentId(), "in", sData.comboServices));
            const comboSnap = await getDocs(comboQuery);
            const comboItems: Service[] = [];
            comboSnap.forEach((cDoc) => {
              comboItems.push({ id: cDoc.id, ...cDoc.data() } as Service);
            });
            setComboDetails(comboItems);
          }
        } else {
          router.push(user ? "/user/services" : "/services");
        }
      } catch (error) {
        console.error("Error fetching service:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [params?.slug, router, user, initialService]);

  // Update active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 150; // offset

      const sections = [
        { id: 'overview', ref: overviewRef },
        { id: 'pricing', ref: pricingRef },
        { id: 'details', ref: detailsRef },
        { id: 'custom', ref: customRef },
        { id: 'combo', ref: comboRef },
        { id: 'faq', ref: faqRef }
      ];

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.ref.current && section.ref.current.offsetTop <= scrollPos) {
          setActiveSection(section.id as any);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>, sectionName: string) => {
    setActiveSection(sectionName as any);
    if (ref.current) {
      const yOffset = -120;
      const y = ref.current.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleBuy = () => {
    if (!service) return;
    if (!user) {
      router.push("/auth");
      return;
    }
    router.push(`/services/${params.slug}/buy?businessType=${businessType}&billingPeriod=${billingPeriod}`);
  };

  if (loading) {
    const slugValue = params?.slug as string || "";
    const fallbackTitle = slugValue.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || "Service Details";
    return (
      <div className={styles.container} style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', paddingBottom: '4rem' }}>
        <p style={{ textAlign: 'center', padding: '4rem' }}>Loading service details...</p>
      </div>
    );
  }

  if (!service) return null;



  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

        {/* Top Breadcrumb & Hero Area */}
        {service.visibility?.hero !== false && (
          <div style={{ background: 'linear-gradient(90deg, #f1f5f9 0%, #fce7f3 100%)', padding: '2rem 1rem 4rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', textDecoration: 'none' }}><Home size={14} style={{ marginRight: '0.25rem' }} /> Home</Link>
              <ChevronRight size={14} />
              <Link href="/services" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Services</Link>
              <ChevronRight size={14} />
              <span style={{ color: 'var(--text-color)', fontWeight: 600 }}>{service.name}</span>
            </div>

            <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '4rem', alignItems: 'center' }}>
              <div className="hero-content">
                {service.heroSubtitle && (
                  <div style={{ fontSize: '1.2rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.5rem', textAlign: 'center' }}>
                    {service.heroSubtitle}
                  </div>
                )}

                <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-color)', marginBottom: '1rem', letterSpacing: '-0.02em', lineHeight: 1.2, textAlign: 'center' }}>
                  {service.name}
                </h1>

                <div style={{ fontSize: '1.2rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '2rem', textAlign: 'center' }}>
                  Affordable Pricing with Expert Support
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
                  <button style={{ backgroundColor: '#ea580c', color: 'var(--primary-text-color)', border: 'none', padding: '1rem 2.5rem', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px 0 rgba(249, 115, 22, 0.39)' }}>
                    Call Now
                  </button>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ color: '#ea580c', fontWeight: 700, margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>We Are Trusted By</h4>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>23 Lakh++ Customers Nationwide</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>A reliable partner for GST and business compliance</div>
                </div>
              </div>

              <div className="hero-form-card" style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1), 0 10px 20px -5px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 800, color: '#ea580c' }}>Expert Help</h3>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 500 }}>Expert CA & GST Support Across India</p>
                </div>
                <div style={{ padding: '0 2rem 1.5rem 2rem' }}>
                  <ServiceContactForm serviceName={service.name} />
                </div>

              </div>
            </div>
          </div>
        </div>
        )}

        {/* Second Section: Trust Stats */}
        {service.visibility?.trustStats !== false && (
          <div style={{ backgroundColor: 'var(--card-bg)', padding: '3rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'center' }}>

            {/* Stat 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', marginBottom: '1rem', width: '70px', height: '70px', backgroundColor: '#ffedd5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={32} color="#ea580c" strokeWidth={2} />
                <Star size={16} fill="#16a34a" color="#16a34a" style={{ position: 'absolute', bottom: '0px', right: '0px' }} />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '0.25rem' }}>4.8</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Google Rating</div>
            </div>

            {/* Stat 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ marginBottom: '1rem', width: '70px', height: '70px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={32} color="#16a34a" strokeWidth={2} />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '0.25rem' }}>1+ Million</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Satisfied Customers</div>
            </div>

            {/* Stat 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ marginBottom: '1rem', width: '70px', height: '70px', backgroundColor: '#dbeafe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={32} color="#2563eb" strokeWidth={2} />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '0.25rem' }}>2500 Cr.</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Saved Already!</div>
            </div>

            {/* Stat 4 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ marginBottom: '1rem', width: '70px', height: '70px', backgroundColor: '#f3e8ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MonitorPlay size={32} color="#9333ea" strokeWidth={2} />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '0.25rem' }}>10+ Years</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>of Industry Experience</div>
            </div>

          </div>
        </div>
        )}



        {/* Third Section: Benefits / Features Cards */}
        {service.visibility?.benefits !== false && (
          <div style={{ backgroundColor: 'var(--card-bg)', padding: '5rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

            <h2 style={{ textAlign: 'center', fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '3.5rem', letterSpacing: '-0.02em' }}>
              {service.name}: <span style={{ color: '#ea580c' }}>Simplify Your Business Compliance</span>
            </h2>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem' }}>

              {(service.benefits && service.benefits.length > 0 ? service.benefits : [
                { title: `Fast and Easy ${service.name}`, desc: `Complete your ${service.name} online quickly and avoid last-minute rush.` },
                { title: `Expert Guidance for ${service.name}`, desc: `Handle complex requirements with our simple online platform and expert support.` },
                { title: `Maximize Your Benefits`, desc: `Get help to claim all eligible benefits and ensure full compliance.` },
                { title: `Quick Processing`, desc: `Receive your acknowledgement immediately after successful submission.` },
                { title: `Secure and Confidential`, desc: `Your personal data is protected with strong security throughout the process.` },
                { title: `Expert Support When Needed`, desc: `Access expert guidance whether you're a startup or managing a large business.` }
              ]).map((benefit, index) => {
                const icons = [FileCheck, RefreshCw, TrendingUp, Zap, Shield, UserCheck, Globe];
                const Icon = icons[index % icons.length];
                return (
                  <div key={index} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2rem 1.5rem', width: '280px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                      <Icon size={32} color="#ea580c" strokeWidth={1.5} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: '1rem', lineHeight: 1.4 }}>{benefit.title}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{benefit.desc}</p>
                  </div>
                );
              })}

            </div>
          </div>
        </div>
        )}

        {/* Fourth Section: Why Choose Us */}
        {service.visibility?.overview !== false && (
          <div style={{ backgroundColor: 'var(--bg-color)', padding: '5rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-color)', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                Why Choose Us for {service.name}?
              </h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto', lineHeight: 1.6 }}>
                Effortlessly file your taxes with the help of our consultants and enjoy a hassle-free experience
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

              {/* Card 1 */}
              <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2.5rem 2rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.02)' }}>
                <div style={{ marginBottom: '1.5rem', width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={32} color="#2563eb" strokeWidth={2} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '1rem' }}>Expert Guidance</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>Our experienced chartered accountants and tax experts provide personalized advice and ensure your taxes are filed accurately and efficiently.</p>
              </div>

              {/* Card 2 */}
              <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2.5rem 2rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.02)' }}>
                <div style={{ marginBottom: '1.5rem', width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={32} color="#16a34a" strokeWidth={2} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '1rem' }}>Hassle-Free Convenience</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>File your taxes and seek consultation from the comfort of your home or office with our easy-to-use online platform.</p>
              </div>

              {/* Card 3 */}
              <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2.5rem 2rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.02)' }}>
                <div style={{ marginBottom: '1.5rem', width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={32} color="#9333ea" strokeWidth={2} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '1rem' }}>Comprehensive Services</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>We offer a wide range of tax-related services, including income tax, GST, Capital Gain Income, NRI taxation, and TDS filing, all in one place.</p>
              </div>

              {/* Card 4 */}
              <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2.5rem 2rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.02)' }}>
                <div style={{ marginBottom: '1.5rem', width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IndianRupee size={32} color="#ea580c" strokeWidth={2} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '1rem' }}>Transparent Pricing</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>Our clear and upfront pricing structure means you know exactly what to expect without any hidden fees.</p>
              </div>

              {/* Card 5 */}
              <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2.5rem 2rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.02)' }}>
                <div style={{ marginBottom: '1.5rem', width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={32} color="#dc2626" strokeWidth={2} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '1rem' }}>Secure and Confidential</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>Your personal and financial data is safeguarded with top-notch security measures for your peace of mind.</p>
              </div>

              {/* Card 6 */}
              <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2.5rem 2rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.02)' }}>
                <div style={{ marginBottom: '1.5rem', width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={32} color="#ca8a04" strokeWidth={2} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '1rem' }}>Proven Track Record</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>We have over 1+ million trusted users, delivering quality service and satisfying clients year after year.</p>
              </div>

            </div>
          </div>
        </div>
        )}

        {/* Fifth Section: Select Your Category */}
        {service.visibility?.category !== false && (
          <div style={{ backgroundColor: 'var(--card-bg)', padding: '5rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-color)', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                Select Your Category
              </h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto', lineHeight: 1.6 }}>
                Choose your category below, and our experts will guide you through the entire process!
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem' }}>

              {/* Category 1 */}
              <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '2.5rem 1.5rem', width: '320px', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', border: '1px solid rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <User size={36} color="#ea580c" strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '1rem', lineHeight: 1.3 }}>Individuals & Freelancers</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 2rem 0', flexGrow: 1 }}>Perfect for salaried employees, independent contractors, and sole proprietors needing personalized support.</p>
                <button style={{ backgroundColor: '#ea580c', color: 'var(--primary-text-color)', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'background-color 0.2s', width: '100%', justifyContent: 'center' }}>
                  Get Started <ChevronRight size={18} />
                </button>
              </div>

              {/* Category 2 */}
              <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '2.5rem 1.5rem', width: '320px', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', border: '1px solid rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <Building2 size={36} color="#ea580c" strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '1rem', lineHeight: 1.3 }}>Small Businesses & Startups</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 2rem 0', flexGrow: 1 }}>Tailored solutions for registered LLPs, private limited companies, and growing ventures.</p>
                <button style={{ backgroundColor: '#ea580c', color: 'var(--primary-text-color)', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'background-color 0.2s', width: '100%', justifyContent: 'center' }}>
                  Get Started <ChevronRight size={18} />
                </button>
              </div>

              {/* Category 3 */}
              <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '2.5rem 1.5rem', width: '320px', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', border: '1px solid rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <Briefcase size={36} color="#ea580c" strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '1rem', lineHeight: 1.3 }}>Corporates & Enterprises</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 2rem 0', flexGrow: 1 }}>Comprehensive tax, audit, and compliance services designed for large-scale operations.</p>
                <button style={{ backgroundColor: '#ea580c', color: 'var(--primary-text-color)', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'background-color 0.2s', width: '100%', justifyContent: 'center' }}>
                  Get Started <ChevronRight size={18} />
                </button>
              </div>

              {/* Category 4 */}
              <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '2.5rem 1.5rem', width: '320px', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', border: '1px solid rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <Globe size={36} color="#ea580c" strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '1rem', lineHeight: 1.3 }}>NRIs & Foreign Entities</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 2rem 0', flexGrow: 1 }}>If you're an NRI or have foreign income, we ensure you stay compliant with international and local laws.</p>
                <button style={{ backgroundColor: '#ea580c', color: 'var(--primary-text-color)', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'background-color 0.2s', width: '100%', justifyContent: 'center' }}>
                  Get Started <ChevronRight size={18} />
                </button>
              </div>

              {/* Category 5 */}
              <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '2.5rem 1.5rem', width: '320px', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', border: '1px solid rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#ffe4e6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <HeartHandshake size={36} color="#ea580c" strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '1rem', lineHeight: 1.3 }}>Trusts & NGOs</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 2rem 0', flexGrow: 1 }}>Specialized filing, registration, and advisory support for non-profits and charitable trusts.</p>
                <button style={{ backgroundColor: '#ea580c', color: 'var(--primary-text-color)', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'background-color 0.2s', width: '100%', justifyContent: 'center' }}>
                  Get Started <ChevronRight size={18} />
                </button>
              </div>

            </div>
          </div>
        </div>
        )}

        {/* Sixth Section: 4-Step Process */}
        {service.visibility?.process !== false && (
          <div style={{ backgroundColor: '#fafafa', padding: '5rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

            <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '4rem', letterSpacing: '-0.02em' }}>
              Simple <span style={{ color: '#ea580c' }}>4-Step Process</span>
            </h2>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', gap: '1rem' }}>

              {/* Step 1 */}
              <div style={{ width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 10px 15px -3px rgba(168, 85, 247, 0.4)' }}>
                  <ShoppingBag size={40} color="white" strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: '0.75rem' }}>Place Your Order</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>Select the required service and proceed to submit your request.</p>
              </div>

              {/* Chevron */}
              <div style={{ display: 'flex', alignItems: 'center', height: '90px', padding: '0 0.5rem' }} className="process-chevron">
                <ChevronRight size={24} color="#94a3b8" />
              </div>

              {/* Step 2 */}
              <div style={{ width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)' }}>
                  <FolderOpen size={40} color="white" strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: '0.75rem' }}>Document Collection</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>Our consultants will gather your requirements and documents.</p>
              </div>

              {/* Chevron */}
              <div style={{ display: 'flex', alignItems: 'center', height: '90px', padding: '0 0.5rem' }} className="process-chevron">
                <ChevronRight size={24} color="#94a3b8" />
              </div>

              {/* Step 3 */}
              <div style={{ width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.4)' }}>
                  <Settings size={40} color="white" strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: '0.75rem' }}>Processing Your Request</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>We'll begin work on your request based on the collected information.</p>
              </div>

              {/* Chevron */}
              <div style={{ display: 'flex', alignItems: 'center', height: '90px', padding: '0 0.5rem' }} className="process-chevron">
                <ChevronRight size={24} color="#94a3b8" />
              </div>

              {/* Step 4 */}
              <div style={{ width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)' }}>
                  <Download size={40} color="white" strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: '0.75rem' }}>Completion & Handover</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>Receive your completed documents or service output on time.</p>
              </div>

            </div>
          </div>
        </div>
        )}




        {/* Seventh Section: Multi Price Table */}
        {service.visibility?.pricing !== false && (
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '5rem 1rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '3.5rem', letterSpacing: '-0.02em' }}>
              Plans based on your Selection
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'stretch' }}>

              {(service.pricingPlans && service.pricingPlans.length > 0 ? service.pricingPlans : [
                {
                  id: 'default-1',
                  title: 'GST Registration',
                  price: '₹1,695',
                  footnote: '*Exclusive of Taxes',
                  features: [
                    { name: 'Application for GST Registration', included: true },
                    { name: 'Application for Clarification', included: true },
                    { name: 'Any modification in GST Registration Application', included: true }
                  ]
                },
                {
                  id: 'default-2',
                  title: 'GST Compliance for Composition Dealer',
                  price: '₹6,000',
                  period: '/ Year',
                  footnote: '*Exclusive of Taxes',
                  features: [
                    { name: 'CMP-08 Filing', included: true },
                    { name: 'Excludes Annual Return', included: false }
                  ]
                },
                {
                  id: 'default-3',
                  title: 'Annual Return Filing of Composite Dealer',
                  price: '₹5,000',
                  footnote: '*Exclusive of Taxes',
                  features: [
                    { name: 'GSTR-4 Filing', included: true }
                  ]
                },
                {
                  id: 'default-4',
                  title: 'GST Compliances for Freelancers',
                  price: '₹9,000',
                  period: '/ Year',
                  footnote: '*Exclusive of Taxes',
                  features: [
                    { name: 'GSTR-1 Return Filing', included: true },
                    { name: 'GSTR-3B Return Filing', included: true },
                    { name: 'Credit Reconciliation (Reconciliation of Purchase Register and GSTR-2A)', included: false },
                    { name: 'Excludes Annual Return', included: false }
                  ]
                }
              ]).map((plan) => (
                <div key={plan.id} style={{ backgroundColor: 'var(--card-bg)', borderRadius: '8px', padding: '2rem 1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ backgroundColor: '#ffedd5', width: '36px', height: '36px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                    <FileCheck size={20} color="#ea580c" />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: '1.5rem', minHeight: '3.3rem' }}>{plan.title}</h3>

                  <div style={{ display: 'flex', alignItems: 'baseline', color: '#ea580c', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>{plan.price}</span>
                    {plan.period && (
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', marginLeft: '0.25rem' }}>{plan.period}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>{plan.footnote || '*Exclusive of Taxes'}</div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flexGrow: 1 }}>
                    {plan.features.map((feat, fidx) => (
                      <li key={fidx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>
                        {feat.included ? (
                          <CheckCircle2 size={20} color="#ea580c" style={{ flexShrink: 0, marginTop: '2px' }} />
                        ) : (
                          <XCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                        )}
                        <span>{feat.name}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    style={{ width: '100%', padding: '0.875rem', border: '2px solid #ea580c', backgroundColor: 'transparent', color: '#ea580c', borderRadius: '6px', fontWeight: 600, fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#ea580c'; e.currentTarget.style.color = 'white'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ea580c'; }}
                    onClick={() => { if (plan.buttonLink) router.push(plan.buttonLink); else handleBuy(); }}
                  >
                    {plan.buttonText || 'Activate Now'} <ChevronRight size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* Eighth Section: How to File with Animated Image */}
        <div style={{ backgroundColor: '#eef5d3', padding: '5rem 1rem', position: 'relative', overflow: 'hidden' }}>
          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes floatImage {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-15px); }
              100% { transform: translateY(0px); }
            }
          `}} />

          {/* Decorative Background Blob Right */}
          <div style={{ position: 'absolute', top: '20%', right: '-5%', width: '300px', height: '300px', backgroundColor: '#e1ecc1', borderRadius: '50%', opacity: 0.7, zIndex: 0 }}></div>

          <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
              How to process <span style={{ color: '#ea580c' }}>{service.name || 'Services'}</span> Online
              <br />with NetProfit
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '4rem' }}>
              Processing with NetProfit is fast, secure, and guided by experts.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4rem' }}>

              {/* Left Side: Static Image */}
              <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                <img
                  src="/images/cartoon_pointing_v2_transparent.png"
                  alt="Professional Expert"
                  style={{
                    width: '100%',
                    maxWidth: '450px',
                    position: 'relative',
                    zIndex: 1
                  }}
                />
              </div>

              {/* Right Side: Step-by-Step and Features */}
              <div style={{ flex: '1 1 500px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: '1.5rem' }}>Step-by-Step Process</h3>

                <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                  {/* Vertical Dotted Line */}
                  <div style={{ position: 'absolute', left: '1.85rem', top: '1rem', bottom: '2rem', width: '2px', borderLeft: '2px dashed #cbd5e1', zIndex: 0 }}></div>

                  {((service.processSteps && service.processSteps.length > 0) ? service.processSteps : [
                    { icon: 'FileCheck', title: 'Select a Plan', desc: 'Choose between self-filing or expert-assisted filing' },
                    { icon: 'FolderOpen', title: 'Upload Documents', desc: 'Submit invoices and purchase data securely through your dashboard' },
                    { icon: 'Users', title: 'Expert Review', desc: 'Our professionals verify entries and reconcile data.' },
                    { icon: 'MonitorPlay', title: 'Filing & Confirmation', desc: 'Returns are filed on the portal; you receive instant acknowledgment' }
                  ]).map((step, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
                      <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--card-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                        {getIcon(step.icon, 20, "#ea580c")}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: '0.25rem' }}>{step.title}</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '3rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: '1rem' }}>Why It's Effortless with NetProfit</h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0' }}>
                    {((service.processBenefits && service.processBenefits.length > 0) ? service.processBenefits : [
                      'Automated invoice matching', 'Real-time ITC reconciliation', 'Secure data handling', 'Expert support throughout'
                    ]).map((point, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>
                        <div style={{ width: '6px', height: '6px', backgroundColor: '#ea580c', borderRadius: '50%' }}></div>
                        {point}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={handleBuy}
                    style={{ padding: '0.875rem 2rem', backgroundColor: '#ea580c', color: 'var(--primary-text-color)', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(6, 182, 212, 0.3)' }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#c2410c'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ea580c'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    Start Processing
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Ninth Section: Benefits of Filing */}
        {service.visibility?.overview !== false && (
          <div style={{ backgroundColor: '#fcfaf4', padding: '5rem 1rem' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
              Benefits of {service.name || 'Services'} with NetProfit
            </h2>
            <p style={{ color: '#4b5563', fontSize: '1.05rem', marginBottom: '2rem' }}>
              NetProfit makes compliance simple, accurate, and effortless.
            </p>

            <ul style={{ listStyleType: 'none', padding: 0, margin: '0 0 2.5rem 0', color: '#4b5563' }}>
              {((service.benefits && service.benefits.length > 0) ? service.benefits : [
                { title: 'Dedicated Expert', desc: 'A personal consultant handles your filings end to end.' },
                { title: 'Smart Alerts', desc: 'Automated reminders so you never miss a due date.' },
                { title: 'Monthly Status Reports', desc: 'Clear summaries of filed and pending returns.' },
                { title: 'Real-Time Reconciliation', desc: 'Instant matching of sales and purchases for accuracy.' },
                { title: 'Platform Access', desc: 'Track filings, receive alerts, and connect with experts anytime.' }
              ]).map((benefit, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem', lineHeight: '1.6' }}>
                  <div style={{ marginTop: '0.3rem', width: '6px', height: '6px', backgroundColor: '#ea580c', borderRadius: '50%', flexShrink: 0 }}></div>
                  <div>
                    <strong style={{ color: '#111827' }}>{benefit.title}</strong> – {benefit.desc}
                  </div>
                </li>
              ))}
            </ul>

            <p style={{ color: '#4b5563', fontSize: '1.05rem', margin: 0 }}>
              Stay compliant effortlessly while focusing on your business growth.
            </p>
          </div>
        </div>
        )}

        {/* Tenth Section: Documents Required */}
        {service.documentsRequired && service.documentsRequired.length > 0 && (
          <div style={{ backgroundColor: '#f6f5ed', padding: '5rem 1rem', overflow: 'hidden' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4rem' }}>

              {/* Left Side: Content */}
              <div style={{ flex: '1 1 500px' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827', marginBottom: '1rem', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
                  Documents Required for<br />{service.name || 'Services'}
                </h2>
                <p style={{ color: '#111827', fontSize: '1.05rem', fontWeight: 700, marginBottom: '2rem' }}>
                  Keep these documents ready for smooth processing:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '3rem' }}>
                  {(Array.isArray(service.documentsRequired) ? service.documentsRequired : [service.documentsRequired])
                    .flatMap((doc: string) => doc.split(',').map(d => d.trim()))
                    .filter((doc: string) => doc.length > 0)
                    .map((doc: string, idx: number) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--card-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span style={{ fontSize: '0.95rem', color: '#374151', fontWeight: 500 }}>{doc}</span>
                      </div>
                    ))}
                </div>

                <button
                  onClick={handleBuy}
                  style={{ padding: '0.875rem 2rem', backgroundColor: '#ea580c', color: 'var(--primary-text-color)', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(6, 182, 212, 0.3)' }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#c2410c'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ea580c'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  Start Processing Now
                </button>
              </div>

              {/* Right Side: Static Image */}
              <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                <img
                  src="/images/cartoon_thumbs_up_v2_transparent.png"
                  alt="Professional Thumbs Up"
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    position: 'relative',
                    zIndex: 1,
                    transform: 'scaleX(-1)'
                  }}
                />
              </div>

            </div>
          </div>
        )}

        {/* Eleventh Section: Client Reviews */}
        {service.showReviews !== false && service.visibility?.reviews !== false && (
          <div style={{ backgroundColor: '#e6f4e8', padding: '5rem 1rem', overflow: 'hidden', position: 'relative' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
              <h2 style={{ textAlign: 'center', fontSize: '2.25rem', fontWeight: 800, color: '#111827', marginBottom: '3rem', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
                Hear What Our Clients Say About<br />NetProfit
              </h2>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center' }}>
                {((service.reviews && service.reviews.length > 0) ? service.reviews : [
                  { name: "Niranjana Sharma", type: "Local Guide", date: "3 months ago", text: "Team NetProfit came to the rescue in crunch time. They were prompt, courteous and professional. Superlative service at a super competitive price. Strongly recommended for every taxpayer.", rating: "4.7" },
                  { name: "Rohan Baruah", type: "Local Guide", date: "2 months ago", text: "Positive: Professionalism, Responsiveness. The team was very responsive and prompt throughout the return filing process. Even though it was taking some time on the govt portal, they handled it.", rating: "5.0" },
                  { name: "Subham Saurabh", type: "Local Guide", date: "1 month ago", text: "NetProfit was a breeze to work with. It's a straightforward procedure that's easy to follow. All you have to do is fill out the form with the relevant information and submit necessary documents.", rating: "4.9" },
                ]).map((review, idx) => (
                  <div key={idx} style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', flex: '1 1 300px', maxWidth: '380px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', backgroundColor: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: '#ea580c' }}>
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#111827', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {review.name}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ea580c"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                        </h4>
                        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{review.type} • {review.date}</span>
                      </div>
                    </div>
                    <p style={{ color: '#4b5563', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                      {review.text}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#ea4335"><path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z" /></svg>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>Google Reviews</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fbbf24', marginRight: '0.25rem' }}>{review.rating}</span>
                      {[1, 2, 3, 4, 5].map(i => <svg key={i} width="14" height="14" fill="#fbbf24" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Twelfth Section: Why Timely Filing is Important */}
        {service.visibility?.importance !== false && (
          <div style={{ backgroundColor: 'var(--card-bg)', padding: '6rem 1rem', position: 'relative' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '4rem', letterSpacing: '-0.02em' }}>
              Why {service.name || 'Compliance'} is Important for Your Business
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {((service.importanceCards && service.importanceCards.length > 0) ? service.importanceCards :
                (service.name?.toLowerCase().includes('bookkeeping') || service.name?.toLowerCase().includes('accounting')
                  ? [
                    { icon: 'TrendingUp', title: "Better Financial Decisions", desc: "Accurate books provide insights to grow your business effectively." },
                    { icon: 'ShieldCheck', title: "Audit Ready", desc: "Always be prepared for tax audits with perfectly reconciled accounts." },
                    { icon: 'Briefcase', title: "Maintain Business Credibility", desc: "Clean financial records build trust with investors and lenders." },
                    { icon: 'FileCheck', title: "Hassle-Free Compliance", desc: "Ensure your annual filings and returns are accurate and on time." }
                  ]
                  : [
                    { icon: 'IndianRupee', title: "Avoid Penalties", desc: "Late filing can lead to fines of up to ₹10,000." },
                    { icon: 'Wallet', title: "Claim Input Tax Credit (ITC)", desc: "Get tax benefits on your purchases." },
                    { icon: 'Briefcase', title: "Maintain Business Credibility", desc: "Authorized by ITD and compliant with the highest data security standards." },
                    { icon: 'ShieldCheck', title: "Stay Legally Secure", desc: "Avoid notices & audits from tax authorities." }
                  ]
                )
              ).map((card, idx) => {
                const colors = [
                  { bg: '#dbeafe', icon: '#2563eb', border: '#bfdbfe' }, // blue
                  { bg: '#dcfce7', icon: '#16a34a', border: '#bbf7d0' }, // green
                  { bg: '#ffedd5', icon: '#ea580c', border: '#fed7aa' }, // orange
                  { bg: '#f3e8ff', icon: '#9333ea', border: '#e9d5ff' }  // purple
                ];
                const theme = colors[idx % colors.length];
                return (
                  <div key={idx} style={{
                    background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 35%)',
                    border: '1px solid #f1f5f9',
                    borderRadius: '12px',
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <div style={{ width: '60px', height: '60px', border: `1px solid ${theme.border}`, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', backgroundColor: theme.bg }}>
                      {getIcon(card.icon, 28, theme.icon)}
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '1rem', lineHeight: '1.4' }}>
                      {card.title}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                      {card.desc}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        )}

        {/* Main Full-Width Layout with Seamless Sections */}
        <div className="seamless-sections">



          {/* Custom Sections Block */}
          {service.customSections && service.customSections.length > 0 && service.visibility?.customSections !== false && (
            <>
              <style dangerouslySetInnerHTML={{
                __html: `
                .custom-section-content {
                  font-size: 1.15rem;
                  line-height: 1.8;
                  color: #334155;
                }
                .custom-section-content p {
                  margin-bottom: 1.75rem;
                }
                .custom-section-content h3 {
                  font-size: 1.75rem;
                  color: #0f172a;
                  margin-top: 3rem;
                  margin-bottom: 1.25rem;
                  font-weight: 800;
                  letter-spacing: -0.01em;
                }
                .custom-section-content h4 {
                  font-size: 1.35rem;
                  color: #1e293b;
                  margin-top: 2rem;
                  margin-bottom: 1rem;
                  font-weight: 700;
                }
                .custom-section-content ul {
                  margin-bottom: 2.5rem;
                  padding-left: 0;
                  list-style: none;
                }
                .custom-section-content li {
                  margin-bottom: 1rem;
                  position: relative;
                  padding-left: 2rem;
                }
                .custom-section-content li::before {
                  content: '';
                  position: absolute;
                  left: 0.5rem;
                  top: 0.65rem;
                  width: 8px;
                  height: 8px;
                  background-color: #ea580c;
                  border-radius: 50%;
                }
                .custom-section-content a {
                  color: #ea580c;
                  text-decoration: underline;
                  text-underline-offset: 4px;
                }
                .custom-section-content a:hover {
                  color: #c2410c;
                }
                .custom-section-content strong {
                  font-weight: 700;
                  color: #0f172a;
                }
              `}} />
              {service.customSections.map((section, idx) => (
                <section key={idx} ref={idx === 0 ? customRef : null} style={{ backgroundColor: idx % 2 === 0 ? 'var(--bg-color)' : 'white', padding: '5rem 0', scrollMarginTop: '60px' }}>
                  <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '2.5rem', color: 'var(--text-color)', fontWeight: 900, letterSpacing: '-0.02em', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem' }}>{section.title}</h2>
                    <div className="custom-section-content" dangerouslySetInnerHTML={{ __html: section.content }} />
                  </div>
                </section>
              ))}
            </>
          )}

          {/* Combo Slider Block */}
          {service.isCombo && comboDetails.length > 0 && service.visibility?.combo !== false && (
            <section ref={comboRef} style={{ backgroundColor: 'var(--card-bg)', padding: '5rem 0', scrollMarginTop: '60px' }}>
              <div className="section-container slider-override">
                <HorizontalSlider
                  title="Included in this Bundle"
                  items={comboDetails.map(item => ({
                    id: item.id,
                    title: item.name,
                    description: item.description ? item.description.replace(/<[^>]+>/g, '').substring(0, 100) + '...' : '',
                    link: `/services/${item.slug || item.id}`,
                    tag: item.category
                  }))}
                  viewAllLink="#"
                />
              </div>
            </section>
          )}

          {/* Detailed Information Section */}
          {service.content && service.visibility?.detailedInfo !== false && (
            <div ref={detailsRef} style={{ backgroundColor: 'var(--card-bg)', padding: '5rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '2.5rem', color: 'var(--text-color)', fontWeight: 900, letterSpacing: '-0.02em', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem' }}>Detailed Information</h2>
                <div style={{ maxWidth: '900px' }}>
                  {service.content.replace(/&nbsp;/g, ' ').replace(/<h1([^>]*)>([\s\S]*?)<\/h1>/gi, '<h2$1>$2</h2>').split(/(?=<h[23][^>]*>)/i).map((section, idx) => {
                    const textContent = section.replace(/<[^>]*>?/gm, '').trim();
                    if (!textContent) return null;
                    return (
                      <div key={idx} style={{ marginBottom: '2.5rem' }}>
                        <div
                          className="rich-text-content modern-bullets"
                          dangerouslySetInnerHTML={{ __html: section.replace(/http:\/\//gi, 'https://') }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* FAQs Block */}
          {service.visibility?.faqs !== false && (
            <section ref={faqRef} style={{ backgroundColor: 'var(--bg-color)', padding: '5rem 0', scrollMarginTop: '60px' }}>
              <div className="section-container">
                {service.faqs && service.faqs.length > 0 && (
                  <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                      __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        mainEntity: service.faqs.map(f => ({
                        "@type": "Question",
                        name: f.question,
                        acceptedAnswer: {
                          "@type": "Answer",
                          text: f.answer
                        }
                      }))
                    })
                  }}
                />
              )}
              <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem', color: 'var(--text-color)', fontWeight: 900, letterSpacing: '-0.02em', textAlign: 'center' }}>Frequently Asked Questions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
                {((service.faqs && service.faqs.length > 0) ? service.faqs : [
                  { question: `What is ${service.name} and why is it important?`, answer: `${service.name} is an essential service that streamlines operations and ensures your business remains compliant with current regulations.` },
                  { question: `Who is required to register for ${service.name}?`, answer: `Any business meeting the required criteria or turnover threshold limit must register and stay compliant.` },
                  { question: `What documents are required for ${service.name}?`, answer: `Typically, you need PAN, Aadhar, proof of business registration, identity and address proofs, and bank account details.` },
                  { question: `What happens if I don't comply with ${service.name} regulations?`, answer: `Non-compliance or late filing attracts penalties and legal consequences, which vary depending on the specific compliance requirements.` }
                ]).map((faq, idx) => (
                  <div key={idx} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                    <button
                      onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                      style={{ width: '100%', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <span style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-color)', paddingRight: '2rem' }}>{faq.question}</span>
                      {activeFaq === idx ? <ChevronUp size={24} color="#ea580c" style={{ flexShrink: 0 }} /> : <ChevronDown size={24} color="#64748b" style={{ flexShrink: 0 }} />}
                    </button>
                    {activeFaq === idx && (
                      <div style={{ padding: '0 2rem 1.5rem 2rem', color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '1.05rem' }} className="animation-fade-in">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

        <style dangerouslySetInnerHTML={{
          __html: `
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 4rem;
          align-items: center;
        }
        .hero-form-card {
          background-color: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .seamless-sections {
          width: 100%;
          display: flex;
          flex-direction: column;
        }
        .section-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 1rem;
        }
        .pricing-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }
        .pricing-amount-card {
          padding: 3rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-left: 1px solid #e2e8f0;
        }
        @media (max-width: 992px) {
          .hero-grid {
            grid-template-columns: 1fr;
            gap: 3rem;
          }
          .pricing-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .pricing-amount-card {
            padding: 2rem 0;
            border-left: none;
            border-top: 1px solid #e2e8f0;
          }
        }
        .animation-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .modern-bullets ul {
          list-style: none;
          padding-left: 0.5rem;
        }
        .modern-bullets ul li {
          position: relative;
          padding-left: 2rem;
          margin-bottom: 1rem;
          color: #334155;
          line-height: 1.7;
          font-size: 1.15rem;
        }
        .modern-bullets ul li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.6rem;
          width: 8px;
          height: 8px;
          background-color: #16a34a;
          border-radius: 50%;
        }
        .modern-bullets h2 {
          color: #0f172a;
          margin-top: 2rem;
          margin-bottom: 1.25rem;
          font-weight: 800;
          font-size: 2rem;
          letter-spacing: -0.02em;
        }
        .modern-bullets h3 {
          color: #1e293b;
          margin-top: 1.75rem;
          margin-bottom: 1rem;
          font-weight: 700;
          font-size: 1.5rem;
        }
        .modern-bullets p {
          color: #475569;
          line-height: 1.8;
          margin-bottom: 1.5rem;
          font-size: 1.15rem;
        }
        .slider-override section {
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
      `}} />
      </div>
    </>
  );
}
