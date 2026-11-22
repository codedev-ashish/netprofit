import { db } from "../../../lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { User, MessageCircle } from "lucide-react";
import { Metadata, ResolvingMetadata } from "next";

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  let title = "Author Profile";
  let description = "View author profile and articles on NetProfit.";
  let imageUrl = "";
  let username = id;

  try {
    // 1. Try to find by username
    const usernameQuery = query(collection(db, "news_authors"), where("username", "==", id), limit(1));
    const usernameSnap = await getDocs(usernameQuery);
    
    let data: any = null;
    
    if (!usernameSnap.empty) {
      data = usernameSnap.docs[0].data();
    } else {
      // 2. Fallback to finding by doc ID
      const docRef = doc(db, "news_authors", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        data = docSnap.data();
      }
    }

    if (data) {
      title = `${data.name} - Author at NetProfit`;
      if (data.bio) {
        description = data.bio.substring(0, 160);
      }
      if (data.imageUrl) {
        imageUrl = data.imageUrl;
      }
      if (data.username) {
        username = data.username;
      }
    }
  } catch (error) {
    console.error("Error generating metadata for author:", error);
  }

  const fullUrl = `https://netprofit.in/author/${username}`;

  return {
    title,
    description,
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      title,
      description,
      url: fullUrl,
      type: "profile",
      siteName: "NetProfit",
      images: imageUrl ? [{ url: imageUrl, width: 800, height: 800 }] : undefined,
    }
  };
}

export default async function AuthorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (!id) return null;

  let authorData: any = null;
  let authorArticles: any[] = [];

  try {
    // 1. Try to find by username
    const usernameQuery = query(collection(db, "news_authors"), where("username", "==", id), limit(1));
    const usernameSnap = await getDocs(usernameQuery);
    
    if (!usernameSnap.empty) {
      const d = usernameSnap.docs[0];
      authorData = { id: d.id, ...d.data() };
    } else {
      // 2. Fallback to finding by doc ID
      const docRef = doc(db, "news_authors", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        authorData = { id: docSnap.id, ...docSnap.data() };
      }
    }
    
    if (authorData) {
      
      // Fetch articles by this author
      const articlesQuery = query(
        collection(db, "news"), 
        where("authorId", "==", authorData.id),
      );
      
      const articlesSnap = await getDocs(articlesQuery);
      articlesSnap.forEach(doc => {
        authorArticles.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort in memory since we might not have a composite index for authorId + createdAt
      authorArticles.sort((a, b) => {
        const dateA = a.createdAt?.seconds || (a.date ? new Date(a.date).getTime()/1000 : 0);
        const dateB = b.createdAt?.seconds || (b.date ? new Date(b.date).getTime()/1000 : 0);
        return dateB - dateA;
      });
    }
  } catch (error) {
    console.error("Error fetching author data:", error);
  }

  if (!authorData) {
    notFound();
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem', width: '100%' }}>
      <div style={{ 
        background: 'var(--card-bg)', 
        borderRadius: '16px', 
        padding: '3rem', 
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        marginBottom: '4rem'
      }}>
        {authorData.imageUrl ? (
          <Image 
            src={authorData.imageUrl} 
            alt={authorData.name} 
            width={150} 
            height={150} 
            style={{ borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--primary)', marginBottom: '1.5rem' }} 
          />
        ) : (
          <div style={{ 
            width: '150px', 
            height: '150px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--primary)', 
            background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
            color: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '3rem', 
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            border: '4px solid var(--bg-secondary)'
          }}>
            {authorData.name ? authorData.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : <User size={64} />}
          </div>
        )}
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '0.5rem' }}>
          {authorData.name}
        </h1>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '1.5rem', maxWidth: '800px', lineHeight: 1.6 }}>
          {authorData.bio || "This author hasn't added a bio yet."}
        </p>

        {/* Social Links */}
        {authorData.socials && (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            {authorData.socials.facebook && (
              <a href={authorData.socials.facebook} target="_blank" rel="noopener noreferrer" style={{ color: '#1877F2', fontWeight: 600, textDecoration: 'none' }}>
                Facebook
              </a>
            )}
            {authorData.socials.instagram && (
              <a href={authorData.socials.instagram} target="_blank" rel="noopener noreferrer" style={{ color: '#E4405F', fontWeight: 600, textDecoration: 'none' }}>
                Instagram
              </a>
            )}
            {authorData.socials.x && (
              <a href={authorData.socials.x} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-color)', fontWeight: 600, textDecoration: 'none' }}>
                X (Twitter)
              </a>
            )}
            {authorData.socials.telegram && (
              <a href={authorData.socials.telegram} target="_blank" rel="noopener noreferrer" style={{ color: '#229ED9' }}>
                <MessageCircle size={24} />
              </a>
            )}
            {/* Reddit custom icon or text if needed */}
            {authorData.socials.reddit && (
              <a href={authorData.socials.reddit} target="_blank" rel="noopener noreferrer" style={{ color: '#FF4500', fontWeight: 700, textDecoration: 'none' }}>
                Reddit
              </a>
            )}
          </div>
        )}
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--text-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          Articles by {authorData.name} ({authorArticles.length})
        </h2>

        {authorArticles.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '1.1rem', marginTop: '3rem' }}>
            No articles posted by this author yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {authorArticles.map(article => {
              const dateString = article.createdAt 
                ? (typeof article.createdAt.toDate === 'function' ? article.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown Date')
                : (article.date || 'Unknown Date');

              return (
                <div key={article.id} style={{ 
                  display: 'flex', 
                  gap: '1.5rem', 
                  padding: '1.5rem', 
                  background: 'var(--card-bg)', 
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)'
                }}>
                  {article.imageUrl && (
                    <Link href={`/news/${article.slug || article.id}`} style={{ flexShrink: 0 }}>
                      <Image 
                        src={article.imageUrl} 
                        alt={article.title} 
                        width={200} 
                        height={120} 
                        style={{ borderRadius: '8px', objectFit: 'cover' }} 
                      />
                    </Link>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                      {Array.isArray(article.categories) && article.categories.length > 0 ? article.categories.join(', ') : (article.category || 'Uncategorized')}
                    </div>
                    <Link href={`/news/${article.slug || article.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.4 }}>
                        {article.title}
                      </h3>
                    </Link>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                      {dateString}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}
