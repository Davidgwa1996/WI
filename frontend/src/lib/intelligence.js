export const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const clamp = (value, min = 0, max = 100) => {
  return Math.max(min, Math.min(max, value));
};

export const formatMoneyCompact = (value) => {
  const n = toNumber(value, 0);

  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
};

export const getConvictionData = (project) => {
  const overall = toNumber(project?.overall_score);
  const sentiment = toNumber(project?.sentiment_score);
  const momentum = toNumber(project?.momentum_score);
  const funding = toNumber(project?.funding_prediction);
  const githubStars = toNumber(project?.github_stars);
  const twitterFollowers = toNumber(project?.twitter_followers);
  const discordMembers = toNumber(project?.discord_members);
  const marketCap = toNumber(project?.market_cap);
  const tvl = toNumber(project?.tvl);
  const twitterGrowth = toNumber(project?.twitter_follower_growth_30d);
  const githubGrowth = toNumber(project?.github_star_growth_30d);
  const discordGrowth = toNumber(project?.discord_growth_30d);

  let score = 0;

  score += overall * 0.30;
  score += sentiment * 0.15;
  score += momentum * 0.20;
  score += funding * 0.15;
  score += clamp(githubGrowth, 0, 100) * 0.08;
  score += clamp(twitterGrowth, 0, 100) * 0.06;
  score += clamp(discordGrowth, 0, 100) * 0.06;

  if (githubStars > 1000) score += 4;
  if (twitterFollowers > 10000) score += 3;
  if (discordMembers > 5000) score += 2;
  if (marketCap > 0) score += 2;
  if (tvl > 0) score += 2;

  const convictionScore = clamp(Math.round(score));

  let conviction = "Low";
  if (convictionScore >= 85) conviction = "High";
  else if (convictionScore >= 65) conviction = "Medium";

  const drivers = [];
  const cautions = [];
  const riskFlags = [];

  if (githubGrowth >= 15) drivers.push("Developer activity accelerating");
  if (twitterGrowth >= 10) drivers.push("Community momentum improving");
  if (discordGrowth >= 10) drivers.push("Community retention strengthening");
  if (tvl > 0) drivers.push("Locked value supports on-chain utility");
  if (funding >= 70) drivers.push("Funding probability is favorable");
  if (sentiment >= 70) drivers.push("Market sentiment is supportive");

  if (githubGrowth < 3) {
    cautions.push("Developer activity is soft");
    riskFlags.push("Weak developer consistency");
  }

  if (twitterGrowth < 2 && twitterFollowers > 0) {
    cautions.push("Community growth is flattening");
    riskFlags.push("Low social momentum");
  }

  if (discordGrowth < 2 && discordMembers > 0) {
    cautions.push("Discord traction is subdued");
    riskFlags.push("Weak community depth");
  }

  if (tvl === 0 && (project?.sector || "").toLowerCase().includes("defi")) {
    cautions.push("No visible TVL support for DeFi positioning");
    riskFlags.push("TVL missing");
  }

  if (marketCap === 0 && project?.token_symbol) {
    cautions.push("Token exists without visible market cap");
    riskFlags.push("Sparse market data");
  }

  if (sentiment < 45) {
    cautions.push("Sentiment remains fragile");
    riskFlags.push("Negative sentiment");
  }

  if (momentum < 45) {
    cautions.push("Momentum is not yet convincing");
    riskFlags.push("Weak momentum");
  }

  const whyNow =
    drivers[0] ||
    "Signal quality is improving across multiple dimensions.";

  const whyCaution =
    cautions[0] ||
    "Further confirmation is still needed before stronger conviction.";

  return {
    conviction,
    convictionScore,
    drivers,
    cautions,
    riskFlags: [...new Set(riskFlags)].slice(0, 4),
    whyNow,
    whyCaution,
  };
};

export const getRadarBuckets = (projects = []) => {
  const emerging = [];
  const watchlist = [];
  const highConviction = [];

  for (const project of projects) {
    const result = getConvictionData(project);

    const enriched = {
      ...project,
      conviction: result.conviction,
      convictionScore: result.convictionScore,
      riskFlags: result.riskFlags,
    };

    if (result.convictionScore >= 85) {
      highConviction.push(enriched);
    } else if (result.convictionScore >= 65) {
      watchlist.push(enriched);
    } else {
      emerging.push(enriched);
    }
  }

  return {
    emerging: emerging.slice(0, 5),
    watchlist: watchlist.slice(0, 5),
    highConviction: highConviction.slice(0, 5),
  };
};

export const buildDailyBriefing = (projects = []) => {
  if (!projects.length) {
    return {
      headline: "No active briefing yet",
      summary:
        "Once project records are available, this briefing will summarise the strongest live signals, risks, and conviction movements.",
      tone: "neutral",
    };
  }

  const enriched = projects.map((p) => ({
    ...p,
    ...getConvictionData(p),
  }));

  const high = enriched.filter((p) => p.conviction === "High").length;
  const medium = enriched.filter((p) => p.conviction === "Medium").length;
  const low = enriched.filter((p) => p.conviction === "Low").length;

  const avgSentiment =
    Math.round(
      enriched.reduce((sum, p) => sum + toNumber(p.sentiment_score), 0) /
        enriched.length
    ) || 0;

  const avgMomentum =
    Math.round(
      enriched.reduce((sum, p) => sum + toNumber(p.momentum_score), 0) /
        enriched.length
    ) || 0;

  const strongest =
    [...enriched].sort((a, b) => b.convictionScore - a.convictionScore)[0] ||
    null;

  let tone = "neutral";
  if (high >= 2 || avgMomentum >= 70) tone = "positive";
  if (avgSentiment < 45 && high === 0) tone = "cautious";

  return {
    headline: "AI Market Briefing",
    summary: `${high} high-conviction, ${medium} watchlist, and ${low} emerging projects are currently tracked. Average sentiment is ${avgSentiment}% and average momentum is ${avgMomentum}%. ${
      strongest
        ? `${strongest.name || "The leading project"} currently has the clearest upside signal.`
        : ""
    }`,
    tone,
  };
};

export const buildProjectNarrative = (project) => {
  const steps = [];
  const now = new Date().toLocaleString();

  const twitterGrowth = toNumber(project?.twitter_follower_growth_30d);
  const githubGrowth = toNumber(project?.github_star_growth_30d);
  const discordGrowth = toNumber(project?.discord_growth_30d);
  const sentiment = toNumber(project?.sentiment_score);
  const momentum = toNumber(project?.momentum_score);
  const funding = toNumber(project?.funding_prediction);

  if (githubGrowth > 0) {
    steps.push({
      title: "Developer interest improved",
      body: `GitHub growth is currently ${githubGrowth.toFixed(1)}% over 30 days.`,
      timestamp: now,
      kind: "positive",
    });
  }

  if (twitterGrowth > 0) {
    steps.push({
      title: "Social discovery increased",
      body: `Twitter follower growth reached ${twitterGrowth.toFixed(1)}% over 30 days.`,
      timestamp: now,
      kind: "positive",
    });
  }

  if (discordGrowth > 0) {
    steps.push({
      title: "Community participation moved",
      body: `Discord member growth is ${discordGrowth.toFixed(1)}% over 30 days.`,
      timestamp: now,
      kind: "neutral",
    });
  }

  steps.push({
    title: "Sentiment checkpoint",
    body: `Current sentiment score stands at ${sentiment.toFixed(0)}%.`,
    timestamp: now,
    kind: sentiment >= 60 ? "positive" : "caution",
  });

  steps.push({
    title: "Momentum checkpoint",
    body: `Current momentum score stands at ${momentum.toFixed(0)}%.`,
    timestamp: now,
    kind: momentum >= 60 ? "positive" : "caution",
  });

  steps.push({
    title: "Funding outlook",
    body: `Predicted funding probability is ${funding.toFixed(0)}%.`,
    timestamp: now,
    kind: funding >= 60 ? "positive" : "neutral",
  });

  return steps;
};