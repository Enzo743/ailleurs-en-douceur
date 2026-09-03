const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Articles en base de données:');
  const articles = await prisma.article.findMany({
    include: { tags: true },
    orderBy: { updatedAt: 'desc' }
  });

  articles.forEach((article, index) => {
    console.log(`${index + 1}. ID: ${article.id}`);
    console.log(`   Slug: "${article.slug}"`);
    console.log(`   Title: "${article.title}"`);
    console.log(`   Published: ${article.published}`);
    console.log(`   PublishedAt: ${article.publishedAt}`);
    console.log(`   Tags: [${article.tags.map(t => t.name).join(', ')}]`);
    console.log('---');
  });

  console.log(`\nTotal: ${articles.length} articles`);
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});