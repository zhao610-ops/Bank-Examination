import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";


export const metadata: Metadata = {
  title: "BankExam AI｜银行笔试 AI 刷题平台",
  description: "面向银行招聘笔试的 AI 智能训练、错题复盘和能力分析平台。"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}

