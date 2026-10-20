// app/_tenant/[subdomain]/page.tsx
// @ts-nocheck - Next.js Wildcard Multi-Tenant Showcase Page
import { notFound } from 'next/navigation';
import { fetchTenantPortfolioSite } from '../../../services/portfolioApi';

export default async function TenantShowcasePage({
  params,
}: {
  params: { subdomain: string };
}) {
  try {
    const portfolio = await fetchTenantPortfolioSite(params.subdomain);
    return (
      <main className="min-h-screen bg-black text-white">
        <header className="p-8 text-center border-b border-neutral-900">
          <h1 className="text-4xl font-serif tracking-wide">{portfolio.studioName}</h1>
          <p className="text-neutral-400 mt-2">{portfolio.artistName} • {portfolio.tagline}</p>
        </header>

        {/* Featured Projects Grid */}
        <section className="max-w-7xl mx-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolio.featuredWorks?.map((work) => (
            <div key={work.id} className="group relative rounded-xl overflow-hidden bg-neutral-900">
              <img
                src={work.coverUrl}
                alt={work.title}
                className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent p-4 flex flex-col justify-end">
                <span className="text-xs uppercase tracking-widest text-amber-400">{work.category}</span>
                <h3 className="text-lg font-medium">{work.title}</h3>
              </div>
            </div>
          ))}
        </section>
      </main>
    );
  } catch (error: any) {
    notFound(); // Triggers Next.js 404 page for unpublished or non-existent portfolios
  }
}
