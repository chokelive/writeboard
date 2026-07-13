import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = Redis.fromEnv();
const BOARD_KEY = "writeboard:messages";
const MAX_MESSAGES = 300;
const TODAY_COUNT_BATCH_SIZE = 500;
const TIME_ZONE = "Asia/Bangkok";

const bangkokDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function dateKeyInTimeZone(value) {
  const date = value instanceof Date ? value : new Date(value);
  const parts = bangkokDateFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function parseMessage(item) {
  return typeof item === "string" ? JSON.parse(item) : item;
}

async function countTodayMessages(total) {
  const todayKey = dateKeyInTimeZone(new Date());
  const messageTotal =
    typeof total === "number" ? total : await redis.llen(BOARD_KEY);
  let todayTotal = 0;

  for (let start = 0; start < messageTotal; start += TODAY_COUNT_BATCH_SIZE) {
    const end = Math.min(start + TODAY_COUNT_BATCH_SIZE - 1, messageTotal - 1);
    const raw = await redis.lrange(BOARD_KEY, start, end);

    for (const item of raw) {
      const message = parseMessage(item);
      const messageDateKey = dateKeyInTimeZone(message.createdAt);

      if (messageDateKey === todayKey) {
        todayTotal += 1;
        continue;
      }

      if (messageDateKey < todayKey) {
        return todayTotal;
      }
    }
  }

  return todayTotal;
}

export async function GET() {
  try {
    const [raw, total] = await Promise.all([
      redis.lrange(BOARD_KEY, 0, MAX_MESSAGES - 1),
      redis.llen(BOARD_KEY),
    ]);
    const messages = raw.map(parseMessage);
    const todayTotal = await countTodayMessages(total);
    return NextResponse.json({ messages, total, todayTotal });
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
    const [total, todayTotal] = await Promise.all([
      redis.llen(BOARD_KEY),
      countTodayMessages(),
    ]);

    return NextResponse.json(
      { message: entry, total, todayTotal },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Could not post the message." },
      { status: 500 }
    );
  }
}
