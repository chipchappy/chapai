"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SessionSummary {
  id: string;
  exam: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  createdAt: string;
}

interface ReviewItem {
  questionId: string;
  stem: string;
  nextReviewAt: string;
  difficulty: number;
}

interface DashboardData {
  recentSessions: SessionSummary[];
  reviewQueue: ReviewItem[];
  streak: number;
  totalAnswered: number;
  totalCorrect: number;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-sage-100 text-sage-700 border-sage-300"
    : score >= 65 ? "bg-teal-50 text-teal-700 border-teal-300"
    : "bg-red-50 text-red-700 border-red-300";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-bold ${color}`}>
      {score}%
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-5 text-center">
      <p className="text-3xl font-bold text-dark">{value}</p>
      <p className="text-xs font-bold uppercase tracking-widest text-muted mt-1">{label}</p>
      {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

export default function StudyDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "review">("overview");

  useEffect(() => {
    async function load() {
      try {
        const [histRes, reviewRes] = await Promise.all([
          fetch("/api/quiz/history"),
          fetch("/api/quiz/review-queue"),
        ]);
        const history = histRes.ok ? await histRes.json() : { sessions: [] };
        const review = reviewRes.ok ? await reviewRes.json() : { items: [] };

        const sessions: SessionSummary[] = history.sessions || [];
        const totalAnswered = sessions.reduce((sum: number, s: SessionSummary) => sum + s.totalQuestions, 0);
        const totalCorrect = sessions.reduce((sum: number, s: SessionSummary) => sum + s.correctAnswers, 0);

        setData({
          recentSessions: sessions.slice(0, 10),
          reviewQueue: review.items || [],
          streak: history.streak || 0,
          totalAnswered,
          totalCorrect,
        });
      } catch {
        setData({
          recentSessions: [],
          reviewQueue: [],
          streak: 0,
          totalAnswered: 0,
          totalCorrect: 0,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <div className="inline-flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
        <p className="text-muted text-sm mt-3">Loading your dashboard…</p>
      </div>
    );
  }

  const overallPct = data && data.totalAnswered > 0
    ? Math.round((data.totalCorrect / data.totalAnswered) * 100)
    : null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Study Dashboard</h1>
          <p className="text-muted text-sm">Your performance at a glance.</p>
        </div>
        <Link href="/quiz" className="btn-primary">
          Practice now →
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Streak"
          value={data?.streak ?? 0}
          sub="days in a row"
        />
        <StatCard
          label="Answered"
          value={data?.totalAnswered ?? 0}
          sub="all time"
        />
        <StatCard
          label="Accuracy"
          value={overallPct !== null ? `${overallPct}%` : "—"}
          sub="all time"
        />
        <StatCard
          label="Due for review"
          value={data?.reviewQueue.length ?? 0}
          sub="spaced repetition"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface border border-border rounded-xl mb-4">
        {(["overview", "history", "review"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${
              activeTab === tab
                ? "bg-white shadow-sm text-dark"
                : "text-muted hover:text-dark"
            }`}
          >
            {tab === "review" ? `Review (${data?.reviewQueue.length ?? 0})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {data?.recentSessions.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-4xl mb-3">📖</p>
              <p className="font-bold text-dark mb-1">No sessions yet</p>
              <p className="text-muted text-sm mb-4">Start practicing to see your performance here.</p>
              <Link href="/quiz" className="btn-primary">
                Start first session →
              </Link>
            </div>
          ) : (
            <>
              <div className="card p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Recent Sessions</p>
                <div className="space-y-2">
                  {data?.recentSessions.slice(0, 5).map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <span className="text-xs font-bold uppercase text-teal-600 mr-2">
                          {s.exam}
                        </span>
                        <span className="text-sm text-dark">
                          {s.correctAnswers}/{s.totalQuestions} correct
                        </span>
                      </div>
                      <ScoreBadge score={s.score} />
                    </div>
                  ))}
                </div>
              </div>

              {data && data.reviewQueue.length > 0 && (
                <div className="card p-5 border-l-4 border-terra-400">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-dark text-sm">
                        {data.reviewQueue.length} question{data.reviewQueue.length !== 1 ? "s" : ""} due for review
                      </p>
                      <p className="text-xs text-muted">Spaced repetition keeps learning sticky.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab("review")}
                      className="btn-secondary text-sm"
                    >
                      Review now →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* History tab */}
      {activeTab === "history" && (
        <div className="card divide-y divide-border">
          {data?.recentSessions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted text-sm">No session history yet.</p>
            </div>
          ) : (
            data?.recentSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <span className="text-xs font-bold uppercase text-teal-600 mr-2">{s.exam}</span>
                  <span className="text-sm text-dark">
                    {s.correctAnswers} / {s.totalQuestions}
                  </span>
                  <p className="text-xs text-muted mt-0.5">
                    {new Date(s.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <ScoreBadge score={s.score} />
              </div>
            ))
          )}
        </div>
      )}

      {/* Review tab */}
      {activeTab === "review" && (
        <div>
          {data?.reviewQueue.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-4xl mb-3">✅</p>
              <p className="font-bold text-dark mb-1">All caught up!</p>
              <p className="text-muted text-sm">No questions are due for review right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted">
                {data?.reviewQueue.length} question{data?.reviewQueue.length !== 1 ? "s" : ""} scheduled by spaced repetition.
              </p>
              <Link
                href="/quiz?mode=review"
                className="btn-primary w-full text-center block"
              >
                Start review session →
              </Link>
              <div className="card divide-y divide-border">
                {data?.reviewQueue.slice(0, 8).map((item) => (
                  <div key={item.questionId} className="px-5 py-3">
                    <p className="text-sm text-dark line-clamp-2">{item.stem}</p>
                    <p className="text-xs text-muted mt-1">
                      Due: {new Date(item.nextReviewAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                ))}
                {(data?.reviewQueue.length ?? 0) > 8 && (
                  <div className="px-5 py-3 text-xs text-muted">
                    +{(data?.reviewQueue.length ?? 0) - 8} more in queue
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
