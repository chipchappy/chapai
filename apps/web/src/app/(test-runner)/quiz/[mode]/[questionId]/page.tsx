import type { Metadata } from "next";
import SampleExamRunner from "@/components/exam/SampleExamRunner";

export const metadata: Metadata = {
  title: "NCLEX test runner | Clarity",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function QuizItemPage({
  params,
}: {
  params: Promise<{ mode: string; questionId: string }>;
}) {
  const { questionId } = await params;
  const initialIndex = questionId.includes("highlight") ? 1 : 0;
  return <SampleExamRunner initialIndex={initialIndex} />;
}
