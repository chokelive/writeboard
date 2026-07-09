import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = Redis.fromEnv();
const BOARD_KEY = "writeboard:messages";
const MAX_MESSAGES = 300;

export async function GET() {
  try {
    const raw = await redis.lrange(BOARD_KEY, 0, MAX_MESSAGES - 1);
    const messages = raw.map((item) =>
      typeof item === "string" ? JSON.parse(item) : item
    );
    return NextResponse.json({ messages });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Could not load the board." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = (body.name || "").toString().trim().slice(0, 40);
    const text = (body.text || "").toString().trim().slice(0, 500);

    if (!name || !text) {
      return NextResponse.json(
        { error: "Name and message are both required." },
        { status: 400 }
      );
    }

    const entry = {
      id: crypto.randomUUID(),
      name,
      text,
      createdAt: new Date().toISOString(),
    };

    await redis.lpush(BOARD_KEY, JSON.stringify(entry));

    return NextResponse.json({ message: entry }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Could not post the message." },
      { status: 500 }
    );
  }
}
