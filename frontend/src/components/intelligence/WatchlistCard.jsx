import React, { useState, useEffect, useCallback } from "react";
import { 
  FiArrowRight, 
  FiStar, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiMinus,
  FiAlertCircle,
  FiBell,
  FiActivity,
  FiRefreshCw,
  FiExternalLink,
  FiTwitter,
  FiGithub,
  FiMessageCircle,
  FiDollarSign
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const WatchlistCard = ({ item, onRefresh, onAlert, isLive = false }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState(item);
  const [scoreChange, setScoreChange] = useState(0);
  const [trend, setTrend] = useState("stable");

  // Calculate trend and change on mount and when item updates
  useEffect(() => {
    if (item.scoreChange24h !== undefined) {
      setScoreChange(item.scoreChange24h);
      setTrend(item.scoreChange24h > 2 ? "up" : item.scoreChange24h < -2 ? "down" : "stable");
    } else if (item.previousScore && item.score) {
      const change = item.score - item.previousScore;
      setScoreChange(change);
      setTrend(change > 2 ? "up" : change < -2 ? "down" : "stable");
    }
  }, [item]);

  // Auto-hide alert after 5 seconds
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => setShowAlert(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh(item.id);
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [item.id, onRefresh]);

  // Handle alert trigger
  const handleAlert = useCallback(() => {
    setShowAlert(true);
    if (onAlert) {
      onAlert({ projectId: item.id, projectName: item.name, score: item.score });
    }
  }, [item.id, item.name, item.score, onAlert]);

  // Get trend icon and color
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <FiTrendingUp className="h-4 w-4 text-emerald-500" />;
      case "down":
        return <FiTrendingDown className="h-4 w-4 text-rose-500" />;
      default:
        return <FiMinus className="h-4 w-4 text-slate-400" />;
    }
  };

  // Get score color based on value
  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-cyan-600";
    if (score >= 40) return "text-amber-600";
    return "text-rose-600";
  };

  // Get score background color
  const getScoreBgColor = (score) => {
    if (score >= 80) return "bg-emerald-50 border-emerald-200";
    if (score >= 60) return "bg-cyan-50 border-cyan-200";
    if (score >= 40) return "bg-amber-50 border-amber-200";
    return "bg-rose-50 border-rose-200";
  };

  // Format large numbers
  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="glass-card relative overflow-hidden transition-all duration-300"
    >
      {/* Live indicator */}
      {isLive && (
        <div className="absolute right-4 top-4 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-emerald-600">LIVE</span>
        </div>
      )}

      {/* Alert notification */}
      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute left-4 right-4 top-4 z-10 rounded-lg bg-amber-50 p-3 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <FiAlertCircle className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                Score changed by {scoreChange > 0 ? "+" : ""}{scoreChange}%
              </span>
              <button
                onClick={() => setShowAlert(false)}
                className="ml-auto text-amber-600 hover:text-amber-800"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <FiStar className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Watchlist Item
              </span>
              {item.tag && (
                <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-700">
                  {item.tag}
                </span>
              )}
            </div>

            <h3 className="text-2xl font-black tracking-tight text-slate-900">
              {currentMetrics.name}
            </h3>

            {currentMetrics.description && (
              <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-2">
                {currentMetrics.description}
              </p>
            )}
          </div>

          {/* Score with trend */}
          <div className="text-right">
            <div className={`rounded-2xl border p-3 ${getScoreBgColor(currentMetrics.score)}`}>
              <div className="text-xs uppercase tracking-wide text-slate-500">Conviction</div>
              <div className={`text-3xl font-black ${getScoreColor(currentMetrics.score)}`}>
                {Math.round(currentMetrics.score || 0)}%
              </div>
              <div className="mt-1 flex items-center justify-center gap-1 text-xs">
                {getTrendIcon()}
                <span className={trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-600" : "text-slate-400"}>
                  {Math.abs(scoreChange).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">Sector</div>
            <div className="mt-1 font-semibold text-slate-900">{currentMetrics.sector || "—"}</div>
          </div>
          
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">Stage</div>
            <div className="mt-1 font-semibold text-slate-900">{currentMetrics.stage || "—"}</div>
          </div>
          
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">Momentum</div>
            <div className="mt-1 font-semibold text-slate-900">
              {currentMetrics.momentumScore ? `${Math.round(currentMetrics.momentumScore)}%` : "—"}
            </div>
          </div>
          
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">Sentiment</div>
            <div className="mt-1 font-semibold text-slate-900">
              {currentMetrics.sentimentScore ? `${Math.round(currentMetrics.sentimentScore)}%` : "—"}
            </div>
          </div>
        </div>

        {/* Social Metrics */}
        <div className="mb-5 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3">
          <div className="text-center">
            <FiTwitter className="mx-auto h-4 w-4 text-slate-400" />
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {formatNumber(currentMetrics.twitterFollowers)}
            </div>
            <div className="text-xs text-slate-400">Followers</div>
          </div>
          
          <div className="text-center">
            <FiGithub className="mx-auto h-4 w-4 text-slate-400" />
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {formatNumber(currentMetrics.githubStars)}
            </div>
            <div className="text-xs text-slate-400">Stars</div>
          </div>
          
          <div className="text-center">
            <FiMessageCircle className="mx-auto h-4 w-4 text-slate-400" />
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {formatNumber(currentMetrics.discordMembers)}
            </div>
            <div className="text-xs text-slate-400">Members</div>
          </div>
        </div>

        {/* Market Metrics (if available) */}
        {(currentMetrics.marketCap || currentMetrics.fundingPrediction) && (
          <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl bg-gradient-to-r from-cyan-50 to-slate-50 p-3">
            {currentMetrics.marketCap && (
              <div className="flex items-center gap-2">
                <FiDollarSign className="h-4 w-4 text-cyan-600" />
                <div>
                  <div className="text-xs text-slate-500">Market Cap</div>
                  <div className="font-semibold text-slate-900">
                    ${formatNumber(currentMetrics.marketCap)}
                  </div>
                </div>
              </div>
            )}
            {currentMetrics.fundingPrediction && (
              <div className="flex items-center gap-2">
                <FiActivity className="h-4 w-4 text-cyan-600" />
                <div>
                  <div className="text-xs text-slate-500">Funding Potential</div>
                  <div className="font-semibold text-slate-900">
                    {Math.round(currentMetrics.fundingPrediction)}%
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="flex items-center gap-3">
            {currentMetrics.note && (
              <span className="text-sm text-slate-500 italic">"{currentMetrics.note}"</span>
            )}
            {currentMetrics.lastUpdated && (
              <span className="text-xs text-slate-400">
                Updated {new Date(currentMetrics.lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-cyan-600"
              title="Refresh metrics"
            >
              <FiRefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>

            {/* Alert button */}
            <button
              onClick={handleAlert}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-600"
              title="Set alert"
            >
              <FiBell className="h-4 w-4" />
            </button>

            {/* View details link */}
            <Link
              to={currentMetrics.projectId ? `/projects/${currentMetrics.projectId}` : "/projects"}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-cyan-700"
            >
              Details <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Anomaly indicator */}
      {currentMetrics.anomalyDetected && (
        <div className="absolute bottom-0 left-0 right-0 bg-amber-500 py-1 text-center text-xs font-medium text-white">
          ⚠️ Anomaly Detected - Unusual activity pattern
        </div>
      )}
    </motion.div>
  );
};

export default WatchlistCard;