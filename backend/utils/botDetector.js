/**
 * Bot & Crawler Detector Utility
 * Matches User-Agent string against common search engines, crawlers, scrapers, and headless browser user agents.
 */
const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /crawling/i,
  /googlebot/i,
  /bingbot/i,
  /yandexbot/i,
  /duckduckbot/i,
  /slurp/i,
  /baiduspider/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /rogerbot/i,
  /linkedinbot/i,
  /embedly/i,
  /quora link preview/i,
  /showyouhaven/i,
  /outbrain/i,
  /pinterest/i,
  /slackbot/i,
  /vkShare/i,
  /W3C_Validator/i,
  /ahrefsbot/i,
  /semrushbot/i,
  /mj12bot/i,
  /screaming frog/i,
  /headlesschrome/i,
  /puppeteer/i,
  /selenium/i,
  /playwright/i,
  /phantomjs/i,
  /curl/i,
  /postmanruntime/i,
  /axios/i,
  /node-fetch/i,
  /python-requests/i,
  /go-http-client/i,
  /wget/i,
];

function detectBot(userAgent) {
  if (!userAgent || typeof userAgent !== 'string') {
    return { isBot: false, botName: null };
  }

  for (const pattern of BOT_PATTERNS) {
    if (pattern.test(userAgent)) {
      // Extract clean bot name if possible
      const match = userAgent.match(pattern);
      return {
        isBot: true,
        botName: match ? match[0] : 'Bot/Crawler'
      };
    }
  }

  return { isBot: false, botName: null };
}

module.exports = { detectBot };
