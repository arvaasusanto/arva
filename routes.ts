import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.articles.list.path, async (req, res) => {
    const category = req.query.category as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const articles = await storage.getArticles(category, limit);
    res.json(articles);
  });

  app.get(api.articles.get.path, async (req, res) => {
    const article = await storage.getArticleBySlug(req.params.slug);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    res.json(article);
  });

  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  // Seed data on startup
  seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  try {
    const categoriesList = [
      { name: "Moneter & Kekuasaan", slug: "moneter-kekuasaan", description: "Fiat, CBDC, dedolarisasi, sejarah uang dari Nabi → modern" },
      { name: "ZISWAF & Negara", slug: "ziswaf-negara", description: "Zakat sebagai instrumen fiskal, Wakaf & sovereign wealth" },
      { name: "Kapitalisme & Kritik Islam", slug: "kapitalisme-kritik", description: "Eksploitasi, financialization" },
      { name: "Dunia Islam Global", slug: "dunia-islam-global", description: "OIC, BRICS, Global South" },
    ];

    for (const cat of categoriesList) {
      const existing = await storage.getCategoryBySlug(cat.slug);
      if (!existing) {
        await storage.createCategory(cat);
      }
    }

    const authorsList = [
      { name: "Arva Athallah Susanto", bio: "Economic Analyst & Writer", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80" },
      { name: "Sarah Al-Fayed", bio: "Senior Analyst at Global Islamic Finance Institute", avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80" },
    ];

    for (const auth of authorsList) {
      const existing = await storage.getAuthorByName(auth.name);
      if (!existing) {
        await storage.createAuthor(auth);
      }
    }

    // Seed Articles
    const moneterCat = await storage.getCategoryBySlug("moneter-kekuasaan");
    const ziswafCat = await storage.getCategoryBySlug("ziswaf-negara");
    const author1 = await storage.getAuthorByName("Arva Athallah Susanto");
    const author2 = await storage.getAuthorByName("Sarah Al-Fayed");

    if (moneterCat && author1) {
      const slug = "the-fall-of-fiat-and-rise-of-gold";
      const existing = await storage.getArticleBySlugSimple(slug);
      if (!existing) {
        await storage.createArticle({
          title: "The Fall of Fiat and the Rise of the Gold Dinar",
          slug: slug,
          summary: "An analysis of the impending collapse of fiat currency systems and the historical resilience of gold-based economies.",
          content: `
            <p>The modern global economy stands on the precipice of a significant transformation. For decades, fiat currency—money backed by nothing but government decree—has dominated international trade. However, cracks in this system are becoming increasingly visible.</p>
            <h3>The Historical Context</h3>
            <p>From the time of the Prophet (SAW), gold and silver served as the primary mediums of exchange. This bimetallic standard ensured intrinsic value and prevented the kind of inflationary manipulation we see today. The transition to paper money, and eventually to purely digital numbers on a screen, represents a departure from tangible assets to debt-based obligations.</p>
            <h3>The Debt Trap</h3>
            <p>Modern monetary theory relies heavily on continuous debt expansion. This system creates a perpetual cycle of inflation that disproportionately affects the poor. In contrast, an economy grounded in real assets promotes stability and justice.</p>
            <h3>A New Horizon</h3>
            <p>As nations within the OIC and BRICS blocs explore alternatives to the US dollar, the conversation inevitably returns to gold. Not merely as a commodity, but as money itself.</p>
          `,
          categoryId: moneterCat.id,
          authorId: author1.id,
          coverImageUrl: "https://images.unsplash.com/photo-1589750670744-dc963a611743?auto=format&fit=crop&w=1200&q=80",
          isFeatured: true,
          readTime: 10,
        });
      }
    }

    if (ziswafCat && author2) {
      const slug = "zakat-as-fiscal-policy";
      const existing = await storage.getArticleBySlugSimple(slug);
      if (!existing) {
        await storage.createArticle({
          title: "Reimagining Zakat as a Primary Fiscal Instrument",
          slug: slug,
          summary: "Moving beyond charity: How Zakat can function as a powerful tool for wealth redistribution and economic stability at the state level.",
          content: `
            <p>Zakat is often misunderstood as merely a private act of charity. However, in the Islamic economic framework, it is a state institution designed to address inequality at its root.</p>
            <h3>Fiscal Responsibility</h3>
            <p>Unlike modern taxation, which often burdens production and labor, Zakat targets idle wealth. This encourages capital circulation and investment, stimulating economic activity while ensuring a safety net for the vulnerable.</p>
            <h3>Sovereign Wealth & Waqf</h3>
            <p>Combined with Waqf (endowments), Zakat can form the basis of a sovereign wealth fund that operates independently of interest-based financial markets. This allows for sustainable development funded by the community, for the community.</p>
          `,
          categoryId: ziswafCat.id,
          authorId: author2.id,
          coverImageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
          isFeatured: false,
          readTime: 8,
        });
      }
    }

  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
