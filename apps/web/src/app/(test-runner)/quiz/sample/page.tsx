import type { Metadata } from "next";
import SampleExamRunner from "@/components/exam/SampleExamRunner";

export const metadata: Metadata = {
  title: "Sample NCLEX question | Clarity",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SampleQuizPage() {
  return <SampleExamRunner />;
}
