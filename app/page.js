"use client";

import { useEffect, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";

const NOTE_COLORS = ["#FFE98A", "#FFB6A3", "#B8D8C6", "#E6D4F2", "#A9D8F5"];
const QR_CODE_SIZE = 210;
const EMOJIS = ["😀", "😍", "🥰", "😂", "👏", "❤️", "👍", "🎉", "✨", "🙏"];

function colorForId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return NOTE_COLORS[hash % NOTE_COLORS.length];
}

function rotationForId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 17 + id.charCodeAt(i)) >>> 0;
  }
  return (hash % 9) - 4; // -4deg to 4deg
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function isToday(iso) {
  const date = new Date(iso);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export default function Page() {
  const [messages, setMessages] = useState([]);
  const [totalMessages, setTotalMessages] = useState(null);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [postOnly, setPostOnly] = useState(false);
  const todayMessages = messages.filter((message) =>
    isToday(message.createdAt)
  ).length;

  useEffect(() => {
    setSiteUrl(window.location.origin + "/?post=1");
    setPostOnly(
      new URLSearchParams(window.location.search).get("post") === "1"
    );
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/messages", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
        setTotalMessages(
          typeof data.total === "number"
            ? data.total
            : (data.messages || []).length
        );
      }
    } catch (e) {
      // silent background refresh failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 8000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!name.trim() || !text.trim()) {
      setError("ใส่ EN ก่อน จ้าาา.");
      return;
    }
    setPosting(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "That note didn't stick. Try again.");
      } else {
        setMessages((prev) => [data.message, ...prev]);
        setTotalMessages((current) =>
          typeof data.total === "number" ? data.total : (current || 0) + 1
        );
        setText("");
        setSuccess("Completed ข้อความถูกส่งไปที่หน้าจอ TV แล้วจ้าา...");
      }
    } catch (e) {
      setError("That note didn't stick. Check your connection.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className={`board${postOnly ? " board--post-only" : ""}`}>
      <header className="board__header">
        <div className="qr-panel qr-panel--front" aria-label="Front QR code">
          <div className="qr-panel__card">
            {siteUrl ? (
              <QRCodeSVG
                value={siteUrl}
                size={QR_CODE_SIZE}
                level="M"
                includeMargin
              />
            ) : (
              <div className="qr-panel__placeholder" />
            )}
          </div>
        </div>
        <div className="board__heading">
        <h1>
          <span>RESULT WRITE BOARD</span>
          <span>HSA Mini-Factory</span>
        </h1>
        <p>Scan QR-Code แล้วบอกความภูมิใจหรือความสำเร็จในหนึ่งปีที่ผ่านมา</p>
        <p>ลุ้น Lucky Draw เป็นตุ๊กตาน่ารักๆ</p>
        <div className="board__stats" aria-label="Message stats">
          <p className="board__total">
            Total messages: {totalMessages === null ? "..." : totalMessages}
          </p>
          <p className="board__total">
            Today messages: {loading ? "..." : todayMessages}
          </p>
        </div>
        </div>
        <div className="qr-panel qr-panel--back" aria-label="Back QR code">
          <div className="qr-panel__card">
            {siteUrl ? (
              <QRCodeSVG
                value={siteUrl}
                size={QR_CODE_SIZE}
                level="M"
                includeMargin
              />
            ) : (
              <div className="qr-panel__placeholder" />
            )}
          </div>
        </div>
      </header>

      <section className="cork">
        {loading && <p className="cork__status">Loading the board...</p>}
        {!loading && messages.length === 0 && (
          <p className="cork__status">
            The board is empty. Be the first to pin a note.
          </p>
        )}
        {messages.map((m) => (
          <article
            key={m.id}
            className="note"
            style={{
              backgroundColor: colorForId(m.id),
              transform: `rotate(${rotationForId(m.id)}deg)`,
            }}
          >
            <span className="note__pin" />
            <p className="note__text">{m.text}</p>
            <div className="note__meta">
              <span className="note__name">— {m.name}</span>
              <span className="note__time">{timeAgo(m.createdAt)}</span>
            </div>
          </article>
        ))}
      </section>

      <form className="composer" onSubmit={handleSubmit}>
        <h2 className="composer__title">
          เขียนบอกความภูมิใจ หรือความสำเร็จในหนึ่งปีที่ผ่านมา
          ลุ้นรับตุ๊กตาน่ารักๆ
        </h2>
        <input
          className="composer__name"
          type="text"
          placeholder="ใส่ EN ตรงนี้ด้วยจ้าาา."
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSuccess("");
          }}
          maxLength={40}
        />
        <div className="composer__emojis" aria-label="Add an emoji">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="composer__emoji-button"
              aria-label={`Add ${emoji}`}
              onClick={() => {
                setText((current) => `${current}${emoji}`.slice(0, 500));
                setSuccess("");
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
        <textarea
          className="composer__text"
          placeholder="Write your note... เขียนตรงนี้จ้าา บอกความภูมิใจ หรือความสำเร็จในหนึ่งปีที่ผ่านมา"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setSuccess("");
          }}
          maxLength={500}
          rows={3}
        />
        <div className="composer__row">
          {error && <span className="composer__error">{error}</span>}
          {success && <span className="composer__success">{success}</span>}
          <button type="submit" disabled={posting}>
            {posting ? "Pinning..." : "Post ส่งไปเลย"}
          </button>
        </div>
      </form>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          background: #1b2a2f;
          background-image: radial-gradient(
              circle at 1px 1px,
              rgba(255, 255, 255, 0.035) 1px,
              transparent 0
            ),
            radial-gradient(
              circle at 30px 30px,
              rgba(0, 0, 0, 0.12) 1px,
              transparent 0
            );
          background-size: 6px 6px, 60px 60px;
          font-family: "Space Grotesk", system-ui, sans-serif;
          color: #f3ede1;
          min-height: 100vh;
        }
      `}</style>

      <style jsx>{`
        .board {
          width: 100%;
          margin: 0 auto;
          padding: 48px 24px 80px;
        }
        .board__header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 32px;
          margin-bottom: 36px;
        }
        .board__heading {
          text-align: center;
          max-width: 920px;
        }
        .board__header h1 {
          font-family: "Space Grotesk", system-ui, sans-serif;
          font-size: 4.5rem;
          font-weight: 700;
          line-height: 1.05;
          margin: 0;
          color: #e8b84b;
          text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.25);
        }
        .board__header h1 span {
          display: block;
        }
        .board__header p {
          margin: 4px 0 0;
          color: rgba(255, 255, 255, 0.92);
          font-family: "Mali", cursive;
          font-size: 1.6rem;
          font-weight: 600;
          line-height: 1.6;
        }
        .board__stats {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 12px;
        }
        .board__header .board__total {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 6px 14px;
          border: 1px solid rgba(232, 184, 75, 0.45);
          border-radius: 999px;
          color: #e8b84b;
          background: rgba(232, 184, 75, 0.12);
          font-family: "Space Grotesk", system-ui, sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          line-height: 1.2;
        }

        .qr-panel {
          flex: 0 0 auto;
          background: #f3ede1;
          border-radius: 12px;
          padding: 8px;
          text-align: center;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
          position: relative;
        }
        .qr-panel__card {
          display: inline-flex;
          background: #fff;
          border-radius: 8px;
        }
        .qr-panel__placeholder {
          width: ${QR_CODE_SIZE}px;
          height: ${QR_CODE_SIZE}px;
          background: repeating-linear-gradient(
            45deg,
            #eee,
            #eee 10px,
            #f7f7f7 10px,
            #f7f7f7 20px
          );
          border-radius: 4px;
        }
        .composer {
          width: 100%;
          max-width: 640px;
          background: #24363c;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 20px;
          margin: 48px auto 0;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
        }
        .composer__title {
          margin: 0 0 14px;
          color: #f3ede1;
          font-family: "Mali", cursive;
          font-size: 1.35rem;
          font-weight: 700;
          line-height: 1.45;
          text-align: center;
        }
        .composer__name {
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: #1b2a2f;
          color: #f3ede1;
          font-family: inherit;
          font-size: 0.95rem;
          margin-bottom: 10px;
        }
        .composer__text {
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: #1b2a2f;
          color: #f3ede1;
          font-family: inherit;
          font-size: 1rem;
          resize: vertical;
        }
        .composer__emojis {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 10px;
        }
        .composer .composer__emoji-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          padding: 0;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          background: #1b2a2f;
          font-size: 1.2rem;
          line-height: 1;
        }
        .composer .composer__emoji-button:hover {
          background: #31474f;
          transform: translateY(-1px);
        }
        .composer__name:focus,
        .composer__text:focus {
          outline: 2px solid #e8b84b;
          outline-offset: 1px;
        }
        .composer__row {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 16px;
          margin-top: 12px;
        }
        .composer__error {
          color: #e2725b;
          font-size: 0.85rem;
          margin-right: auto;
        }
        .composer__success {
          color: #8fe2a0;
          font-size: 0.95rem;
          font-weight: 700;
          margin-right: auto;
        }
        .composer button {
          background: #e8b84b;
          color: #1b2a2f;
          border: none;
          border-radius: 8px;
          padding: 10px 22px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          font-family: inherit;
          transition: transform 0.15s ease;
        }
        .composer button:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .composer button:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .cork {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 28px;
        }
        .cork__status {
          width: 100%;
          text-align: center;
          color: rgba(243, 237, 225, 0.6);
          font-size: 0.95rem;
        }

        .note {
          flex: 1 1 180px;
          max-width: 240px;
          position: relative;
          padding: 20px 18px 16px;
          border-radius: 3px;
          box-shadow:
            0 4px 8px rgba(0, 0, 0, 0.28),
            0 14px 28px rgba(0, 0, 0, 0.38);
          min-height: 140px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .note__pin {
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #b0392a;
          box-shadow: 0 2px 3px rgba(0, 0, 0, 0.4);
        }
        .note__text {
          font-family: "Mali", "Caveat", cursive;
          font-weight: 600;
          font-size: 1.4rem;
          line-height: 1.3;
          color: #102a32;
          margin: 8px 0 14px;
          word-break: break-word;
        }
        .note__meta {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-family: "Space Grotesk", sans-serif;
        }
        .note__name {
          font-weight: 700;
          font-size: 0.8rem;
          color: #102a32;
        }
        .note__time {
          font-size: 0.7rem;
          color: rgba(16, 42, 50, 0.72);
        }

        @media (prefers-reduced-motion: reduce) {
          .composer button {
            transition: none;
          }
        }

        @media (max-width: 640px) {
          .board__header {
            flex-direction: column;
            gap: 24px;
          }
          .board__heading {
            text-align: center;
          }
          .board__header h1 {
            font-size: 3.5rem;
          }
          .board__header p {
            font-size: 1.35rem;
          }
          .board__header .board__total {
            font-size: 1rem;
          }
          .board__stats {
            gap: 8px;
          }
          .qr-panel {
            flex-basis: auto;
          }
          .board--post-only {
            width: 100vw;
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
          }
          .board--post-only .board__header,
          .board--post-only .cork {
            display: none;
          }
          .board--post-only .composer {
            width: 100%;
            max-width: none;
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            flex-direction: column;
            margin: 0;
            padding: 20px 16px;
          border: 0;
          border-radius: 0;
          box-shadow: none;
          }
          .board--post-only .composer__title {
            margin-bottom: 18px;
            color: #e8b84b;
            font-size: 1.55rem;
            line-height: 1.5;
            text-align: left;
          }
          .board--post-only .composer__name {
            min-height: 48px;
            padding: 12px 14px;
            font-size: 1.05rem;
            margin-bottom: 14px;
          }
          .board--post-only .composer__emojis {
            gap: 8px;
            margin-bottom: 14px;
          }
          .board--post-only .composer .composer__emoji-button {
            width: 42px;
            height: 42px;
            font-size: 1.35rem;
          }
          .board--post-only .composer__text {
            flex: 1;
            min-height: 180px;
            padding: 14px;
            font-size: 1.1rem;
            line-height: 1.55;
          }
          .board--post-only .composer__row {
            align-items: stretch;
            flex-direction: column;
            gap: 10px;
            margin-top: 14px;
          }
          .board--post-only .composer__error,
          .board--post-only .composer__success {
            margin-right: 0;
          }
          .board--post-only .composer button[type="submit"] {
            width: 100%;
            min-height: 48px;
          }
        }
      `}</style>
    </div>
  );
}
