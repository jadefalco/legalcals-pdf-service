import express from "express";
import { renderBCEvictionNotice } from "./renderers/bc-eviction-10day.js";

const app = express();
const PORT = process.env.PORT || 3000;

// JSON body parsing with a reasonable size limit
app.use(express.json({ limit: "2mb" }));

// Simple logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint (useful for Render / load balancers)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// BC 10‑Day Eviction Notice PDF endpoint
app.post("/bc/eviction-10day", async (req, res) => {
  try {
    const pdfBuffer = await renderBCEvictionNotice(req.body);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=bc-eviction-10day.pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF generation failed:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

const server = app.listen(PORT, () => {
  console.log(`PDF service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

/*
================================================================================
SAMPLE TEST PAYLOAD
================================================================================

{
  "landlordName": "Jane Doe",
  "landlordAddress": "123 Main Street, Vancouver, BC V5K 0A1",
  "landlordPhone": "(604) 555-0100",
  "landlordEmail": "jane.doe@example.com",
  "tenantNames": "John Smith",
  "rentalAddress": "456 Oak Avenue, Vancouver, BC V5N 2C1",
  "rentAmount": "$1,800.00",
  "rentDueDate": "June 1, 2026",
  "rentOutstanding": "$1,800.00",
  "daysOverdue": "10",
  "deadline": "June 21, 2026",
  "serviceMethod": "by email and by registered mail",
  "effectiveServiceDate": "June 11, 2026",
  "noticeIssueDate": "June 11, 2026"
}

================================================================================
SAMPLE cURL TEST COMMAND
================================================================================

curl -X POST http://localhost:3000/bc/eviction-10day \
  -H "Content-Type: application/json" \
  -d '{
    "landlordName": "Jane Doe",
    "landlordAddress": "123 Main Street, Vancouver, BC V5K 0A1",
    "landlordPhone": "(604) 555-0100",
    "landlordEmail": "jane.doe@example.com",
    "tenantNames": "John Smith",
    "rentalAddress": "456 Oak Avenue, Vancouver, BC V5N 2C1",
    "rentAmount": "$1,800.00",
    "rentDueDate": "June 1, 2026",
    "rentOutstanding": "$1,800.00",
    "daysOverdue": "10",
    "deadline": "June 21, 2026",
    "serviceMethod": "by email and by registered mail",
    "effectiveServiceDate": "June 11, 2026",
    "noticeIssueDate": "June 11, 2026"
  }' \
  -o notice.pdf

================================================================================
NEXT.JS INTEGRATION SNIPPET
================================================================================

// 1. Client helper: generateBC10DayNotice()
// apps/web/lib/pdf-client.ts

export async function generateBC10DayNotice(payload) {
  const res = await fetch("https://your-pdf-service.onrender.com/bc/eviction-10day", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`PDF generation failed: ${res.status}`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bc-eviction-10day.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// 2. Next.js route handler (App Router)
// apps/web/app/api/bc/eviction-10day/route.ts

import { NextResponse } from "next/server";

export async function POST(request) {
  const payload = await request.json();

  const res = await fetch("https://your-pdf-service.onrender.com/bc/eviction-10day", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }

  const pdfBuffer = await res.arrayBuffer();

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=bc-eviction-10day.pdf",
    },
  });
}

// 3. React button example
// components/EvictionNoticeButton.tsx

"use client";

import { generateBC10DayNotice } from "@/lib/pdf-client";

export function EvictionNoticeButton({ payload }) {
  const handleClick = async () => {
    try {
      await generateBC10DayNotice(payload);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF");
    }
  };

  return <button onClick={handleClick}>Download 10‑Day Notice PDF</button>;
}
*/
