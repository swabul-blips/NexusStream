import AppNav from "@/components/nav/AppNav";
import PredictionsTradingPanel from "@/components/dashboard/PredictionsTradingPanel";
import PredictionDesignNotes from "@/components/dashboard/PredictionDesignNotes";
import PredictionFeed from "@/components/dashboard/PredictionFeed";
import StreamHero from "@/components/dashboard/StreamHero";
import TipsPanel from "@/components/dashboard/TipsPanel";
import MilestoneShelf from "@/components/dashboard/MilestoneShelf";
import type { ClusterChoice } from "@/lib/solana/constants";
import { readClusterFromEnv } from "@/lib/env/cluster";

export default function HomePage() {
  const cluster = readClusterFromEnv() satisfies ClusterChoice;

  return (
    <div className="relative mx-auto w-full max-w-6xl space-y-10 px-6 pb-20 pt-6">
      <AppNav cluster={cluster} />
      <StreamHero />

      <div className="grid gap-10 lg:grid-cols-2">
        <TipsPanel />
        <PredictionsTradingPanel />
      </div>

      <PredictionFeed />
      <PredictionDesignNotes />
      <MilestoneShelf />
    </div>
  );
}
