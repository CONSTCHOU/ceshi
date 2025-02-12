import { scrapeWebsite } from './browser-automation';
import { CONFIG } from './config';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  for (const url of CONFIG.URLS) {
    console.log(`开始处理: ${url}`);
    const results = await scrapeWebsite(url);
    console.log(`处理完成: ${url}`, results);
  }
}

main().catch(console.error); 