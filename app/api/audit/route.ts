import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    // 1. Scrape the site
    const siteData = await scrapeSite(url);

    // 2. Analyze with LLM
    const analysis = await analyzeWithLLM(url, siteData);

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Audit error:', error);
    return NextResponse.json(
      { error: error.message || 'Audit failed' },
      { status: 500 }
    );
  }
}

async function scrapeSite(url: string) {
  // Fetch the page
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TelehealthAudit/1.0)',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Extract key elements
  const data = {
    title: $('title').text().trim(),
    metaDescription: $('meta[name="description"]').attr('content') || '',
    h1s: $('h1').map((_, el) => $(el).text().trim()).get(),
    h2s: $('h2').map((_, el) => $(el).text().trim()).get().slice(0, 10),
    
    // Trust signals
    hasHIPAA: html.toLowerCase().includes('hipaa'),
    hasStateBoards: /board certified|licensed in|state license/i.test(html),
    hasTestimonials: /testimonial|review|patient stories/i.test(html),
    hasCertBadges: $('img[alt*="certified"], img[alt*="badge"], img[alt*="seal"]').length > 0,
    
    // CTAs
    ctas: $('a, button')
      .filter((_, el) => {
        const text = $(el).text().toLowerCase();
        return /get started|book|schedule|consult|sign up|try|start/i.test(text);
      })
      .map((_, el) => $(el).text().trim())
      .get()
      .slice(0, 10),
    
    // Services detection
    services: [],
    
    // Compliance flags
    makesHealthClaims: /cure|treat|guaranteed|100%|miracle/i.test(html),
    mentionsRx: /prescription|rx|medication|drug/i.test(html),
    hasPricing: /\$\d+|\d+\/month|pricing|cost/i.test(html),
    
    // Tech detection
    isShopify: html.includes('cdn.shopify.com'),
    isWordPress: html.includes('wp-content'),
    isSquarespace: html.includes('squarespace.com'),
    isWebflow: html.includes('webflow.com'),
    
    // Schema
    hasSchema: html.includes('application/ld+json'),
    schemaTypes: [],
    
    // Content sample (for LLM)
    bodyText: $('body')
      .text()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000),
  };

  // Extract services from common patterns
  const servicePatterns = [
    /weight loss|weight management/gi,
    /hair loss|hair growth/gi,
    /erectile dysfunction|ed treatment/gi,
    /mental health|anxiety|depression/gi,
    /primary care/gi,
    /urgent care/gi,
    /dermatology|skin care/gi,
    /glp-1|semaglutide|tirzepatide|ozempic|wegovy/gi,
    /testosterone|trt|hormone/gi,
    /birth control|contraception/gi,
  ];

  servicePatterns.forEach((pattern) => {
    const matches = html.match(pattern);
    if (matches) {
      data.services.push(matches[0]);
    }
  });

  // Dedupe services
  data.services = [...new Set(data.services.map((s: string) => s.toLowerCase()))];

  // Extract schema types
  const schemaMatches = html.match(/"@type"\s*:\s*"([^"]+)"/g);
  if (schemaMatches) {
    data.schemaTypes = schemaMatches
      .map((m: string) => m.match(/"([^"]+)"$/)?.[1])
      .filter(Boolean) as string[];
  }

  return data;
}

async function analyzeWithLLM(url: string, siteData: any) {
  const prompt = `You are a telehealth marketing expert analyzing a website. 

URL: ${url}

Site Data:
- Title: ${siteData.title}
- Meta Description: ${siteData.metaDescription}
- H1s: ${siteData.h1s.join(', ')}
- H2s: ${siteData.h2s.join(', ')}
- CTAs Found: ${siteData.ctas.join(', ')}
- Services Detected: ${siteData.services.join(', ')}
- Has HIPAA mention: ${siteData.hasHIPAA}
- Has state licensing: ${siteData.hasStateBoards}
- Has testimonials: ${siteData.hasTestimonials}
- Makes health claims: ${siteData.makesHealthClaims}
- Mentions prescriptions: ${siteData.mentionsRx}
- Has pricing visible: ${siteData.hasPricing}
- Has schema markup: ${siteData.hasSchema}
- Schema types: ${siteData.schemaTypes.join(', ')}
- Platform: ${siteData.isShopify ? 'Shopify' : siteData.isWordPress ? 'WordPress' : siteData.isSquarespace ? 'Squarespace' : siteData.isWebflow ? 'Webflow' : 'Custom'}

Body text sample:
${siteData.bodyText.slice(0, 2000)}

Analyze this telehealth website and return a JSON object with:

1. scores: { marketing: 0-100, compliance: 0-100, aiVisibility: 0-100 }
2. marketing: { 
   messaging: "brief analysis of their core message and positioning",
   trustSignals: ["array of trust signals found"],
   ctas: ["array of CTAs with assessment"]
}
3. compliance: {
   flags: [{ issue: "string", severity: "high|medium|low", details: "explanation" }]
}
4. competitive: {
   services: ["array of services offered"],
   techStack: ["detected technologies"],
   pricing: "visible pricing info or 'not displayed'"
}
5. recommendations: ["array of 5 specific actionable recommendations"]

Be specific and actionable. Focus on telehealth-specific insights.

Return ONLY valid JSON, no markdown.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content || '{}';
  
  // Parse JSON (handle potential markdown wrapping)
  let analysis;
  try {
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    analysis = JSON.parse(jsonStr);
  } catch {
    console.error('Failed to parse LLM response:', content);
    analysis = {
      scores: { marketing: 50, compliance: 50, aiVisibility: 50 },
      marketing: { messaging: 'Analysis failed', trustSignals: [], ctas: [] },
      compliance: { flags: [] },
      competitive: { services: siteData.services, techStack: [], pricing: 'Unknown' },
      recommendations: ['Unable to generate recommendations'],
    };
  }

  return analysis;
}
