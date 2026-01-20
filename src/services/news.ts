import Parser from "rss-parser";
import type { NewsHeadline } from "../types/index.js";

const parser = new Parser();

const RSS_FEEDS = [
  { url: "http://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC World" },
  {
    url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    source: "NY Times",
  },
  { url: "https://feeds.npr.org/1001/rss.xml", source: "NPR" },
];

export async function fetchRandomHeadline(): Promise<NewsHeadline> {
  const feedConfig = RSS_FEEDS[Math.floor(Math.random() * RSS_FEEDS.length)];

  try {
    const feed = await parser.parseURL(feedConfig.url);
    const items = feed.items.filter((item) => item.title);

    if (items.length === 0) {
      return getDefaultHeadline();
    }

    const randomItem = items[Math.floor(Math.random() * Math.min(items.length, 10))];

    return {
      title: randomItem.title || "Today's News",
      link: randomItem.link || "",
      source: feedConfig.source,
    };
  } catch (error) {
    console.error(`Failed to fetch RSS feed from ${feedConfig.source}:`, error);
    return getDefaultHeadline();
  }
}

function getDefaultHeadline(): NewsHeadline {
  const defaultTopics = [
    "Climate change efforts continue worldwide",
    "Technology advances reshape daily life",
    "Cultural events bring communities together",
    "Health research shows promising results",
    "Economic trends affect global markets",
  ];

  return {
    title: defaultTopics[Math.floor(Math.random() * defaultTopics.length)],
    link: "",
    source: "Default",
  };
}
